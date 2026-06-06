import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * Cron job — 3h00 heure de Paris (01:00 UTC)
 *
 * Étapes :
 *   0. Purge des matchs hors des 28 compétitions autorisées
 *   1. The Odds API → 23 compétitions avec clé sport connue
 *   2. Résultat stocké dans Supabase — servi toute la journée sans appel supplémentaire
 *
 * Budget API :
 *   The Odds API  : 23 appels/jour × 30 = 690/mois
 *                   (plan 1 000 req/mois recommandé — free = 500/mois)
 *                   En pratique, ~10 compétitions actives simultanément
 *   API-Football  : 0 appel ici — uniquement via /api/livescore quand matchs en cours
 */

const ODDS_API_KEY      = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
const ODDSPAPI_KEY      = process.env.ODDSPAPI_KEY
const CRON_SECRET       = process.env.CRON_SECRET

/* ── 28 compétitions autorisées (liste de référence) ────────────────────── */
const ALLOWED_COMPETITIONS = new Set([
  // Ligues nationales
  "L1", "PL", "LIGA", "BL", "SA", "ERE", "LPT", "STL",
  // Coupes nationales
  "CDRF", "FAC", "CC", "CDR", "SCES", "DFBP", "CI", "SCIT", "TRCH",
  // UEFA
  "UCL", "EL", "ECL",
  // Compétitions mondiales
  "CDM", "EURO", "NL", "CAN", "LIB", "CWC", "CA", "CIC", "AMICAL",
])

/* ── Clés The Odds API — 23 des 28 compétitions ─────────────────────────
   Les 5 sans clé connue (SCES, SCIT, TRCH, CWC, CIC) sont des
   compétitions ponctuelles (supercoupes, Mondial des clubs…) qui
   apparaîtront via /api/livescore lorsque leurs matchs seront en cours.
─────────────────────────────────────────────────────────────────────── */
const SPORT_KEYS: Record<string, string> = {
  // Ligues nationales
  L1:   "soccer_france_ligue_one",
  PL:   "soccer_england_premier_league",
  LIGA: "soccer_spain_la_liga",
  BL:   "soccer_germany_bundesliga1",
  SA:   "soccer_italy_serie_a",
  ERE:  "soccer_netherlands_eredivisie",
  LPT:  "soccer_portugal_primeira_liga",
  STL:  "soccer_turkey_super_lig",
  // Coupes nationales (actives sept–mai)
  CDRF: "soccer_france_coupe_de_france",
  FAC:  "soccer_england_fa_cup",
  CC:   "soccer_england_efl_cup",
  CDR:  "soccer_spain_copa_del_rey",
  DFBP: "soccer_germany_dfb_pokal",
  CI:   "soccer_italy_coppa_italia",
  // UEFA
  UCL:  "soccer_uefa_champs_league",
  EL:   "soccer_uefa_europa_league",
  ECL:  "soccer_uefa_conference_league",
  // Compétitions mondiales
  CDM:  "soccer_fifa_world_cup",
  EURO: "soccer_uefa_european_championship",
  NL:   "soccer_uefa_nations_league",
  CAN:  "soccer_africa_cup_of_nations",
  LIB:  "soccer_conmebol_copa_libertadores",
  CA:   "soccer_copa_america",
}

/* ── Métadonnées des 28 compétitions autorisées ─────────────────────────── */
const COMP_META: Record<string, { name: string; color: string }> = {
  L1:   { name: "Ligue 1",                  color: "#1C2951" },
  PL:   { name: "Premier League",           color: "#3d195b" },
  LIGA: { name: "La Liga",                  color: "#e01a22" },
  BL:   { name: "Bundesliga",               color: "#e01a22" },
  SA:   { name: "Serie A",                  color: "#0067b1" },
  ERE:  { name: "Eredivisie",               color: "#FF6900" },
  LPT:  { name: "Liga Portugal",            color: "#006600" },
  STL:  { name: "Süper Lig",                color: "#E30A17" },
  CDRF: { name: "Coupe de France",          color: "#003399" },
  FAC:  { name: "FA Cup",                   color: "#C8102E" },
  CC:   { name: "Carabao Cup",              color: "#004D26" },
  CDR:  { name: "Copa del Rey",             color: "#AA151B" },
  SCES: { name: "Supercoupe d'Espagne",     color: "#AA151B" },
  DFBP: { name: "DFB Pokal",                color: "#000000" },
  CI:   { name: "Coppa Italia",             color: "#009246" },
  SCIT: { name: "Supercoupe d'Italie",      color: "#009246" },
  TRCH: { name: "Trophée des Champions",    color: "#1C2951" },
  UCL:  { name: "Ligue des Champions",      color: "#0a1a5e" },
  EL:   { name: "Europa League",            color: "#F97316" },
  ECL:  { name: "Conference League",        color: "#006400" },
  CDM:  { name: "Coupe du Monde",           color: "#C9A227" },
  EURO: { name: "Euro UEFA",                color: "#003399" },
  NL:   { name: "Ligue des Nations",        color: "#003399" },
  CAN:  { name: "CAN",                      color: "#008751" },
  LIB:  { name: "Copa Libertadores",        color: "#1a3a5e" },
  CWC:  { name: "Coupe du Monde des clubs", color: "#C9A227" },
  CA:   { name: "Copa América",             color: "#C8102E" },
  CIC:  { name: "Coupe Intercontinentale",  color: "#C9A227" },
  AMICAL: { name: "Match Amical",             color: "#8B5CF6" },
}

function makeTeamCode(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, "").split(" ").filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase()
}

// Create synthetic match ID from teams + date (prevents duplicates across APIs)
function makeMatchId(homeTeam: string, awayTeam: string, kickoff: string): string {
  const date = kickoff.split("T")[0] // YYYY-MM-DD
  const home = homeTeam.replace(/[^a-z0-9]/gi, "").slice(0, 5).toLowerCase()
  const away = awayTeam.replace(/[^a-z0-9]/gi, "").slice(0, 5).toLowerCase()
  return `${date}-${home}-${away}`
}

/* ── Football-Data.org Fallback ────────────────────────────────────────── */
async function fetchFootballDataMatches(now: Date) {
  if (!FOOTBALL_DATA_KEY) return []

  const matches: object[] = []

  // Map Football-Data.org competition codes to our internal codes
  const FD_COMP_MAP: Record<string, string> = {
    // Ligues nationales
    PL: "PL",      // Premier League
    BL1: "BL",     // Bundesliga
    SA: "SA",      // Serie A
    FL1: "L1",     // Ligue 1
    PPL: "LPT",    // Liga Portugal
    PPDA: "LPT",   // Liga Portugal (alternative)
    PD: "LIGA",    // La Liga
    DED: "ERE",    // Eredivisie
    TR1: "STL",    // Süper Lig
    // Coupes Européennes
    CL: "UCL",     // Champions League
    EL: "EL",      // Europa League
    ECL: "ECL",    // Conference League
    // Compétitions Mondiales
    WC: "CDM",     // World Cup
    EC: "EURO",    // Euro
    UNL: "NL",     // Nations League
    CAN: "CAN",    // African Cup of Nations
    Copa: "CA",    // Copa América
    CLI: "LIB",    // Copa Libertadores
  }

  try {
    // Fetch matches for today + tomorrow
    const dateStr = now.toISOString().split("T")[0]
    const tomorrow = new Date(now.getTime() + 86400_000).toISOString().split("T")[0]

    const res = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateStr}&dateTo=${tomorrow}`,
      {
        headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
        cache: "no-store",
      }
    )

    if (!res.ok) return []

    const data = await res.json()
    const allMatches = data.matches ?? []

    for (const m of allMatches) {
      const compCode = FD_COMP_MAP[m.competition?.code]
      if (!compCode || !ALLOWED_COMPETITIONS.has(compCode)) continue

      const meta = COMP_META[compCode]
      const kickoff = new Date(m.utcDate)
      const state = kickoff <= now ? "live" : "soon"

      matches.push({
        id: makeMatchId(m.homeTeam.name, m.awayTeam.name, m.utcDate),
        competition: compCode,
        competition_name: meta.name,
        competition_color: meta.color,
        home_team: m.homeTeam.name,
        away_team: m.awayTeam.name,
        home_team_code: makeTeamCode(m.homeTeam.name),
        away_team_code: makeTeamCode(m.awayTeam.name),
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
        state,
        kickoff: m.utcDate,
        minute: m.status === "IN_PLAY" ? m.currentMatchDay ?? null : null,
        // Cotes par défaut (Football-Data n'en a pas)
        odds_1: 2.00,
        odds_n: 3.25,
        odds_2: 3.50,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      })
    }

    console.log(`[cron 3h] Football-Data fallback: ${matches.length} matchs`)
    return matches
  } catch (e) {
    console.error("[cron 3h] Football-Data.org error:", e)
    return []
  }
}

/* ── OddsPapi Fallback — Récupère les matchs de base ─────────────────────── */
async function fetchOddsPapiMatches(now: Date) {
  if (!ODDSPAPI_KEY) return []

  const matches: object[] = []

  // Map OddsPapi competition codes to our internal codes
  const ODDSPAPI_COMP_MAP: Record<string, string> = {
    // Ligues nationales
    "premier-league": "PL",
    "la-liga": "LIGA",
    "serie-a": "SA",
    "ligue-1": "L1",
    "bundesliga": "BL",
    "liga-portugal": "LPT",
    "eredivisie": "ERE",
    "super-lig": "STL",
    // Compétitions Mondiales
    "world-cup": "CDM",
    "euro": "EURO",
    "copa-america": "CA",
    "copa-libertadores": "LIB",
    "africa-cup-of-nations": "CAN",
    "nations-league": "NL",
    // Coupes Européennes
    "champions-league": "UCL",
    "europa-league": "EL",
    "conference-league": "ECL",
  }

  try {
    const dateStr = now.toISOString().split("T")[0]
    const tomorrow = new Date(now.getTime() + 86400_000).toISOString().split("T")[0]

    const res = await fetch(
      `https://api.oddspapi.io/v1/matches?dateFrom=${dateStr}&dateTo=${tomorrow}`,
      {
        headers: { "X-API-Key": ODDSPAPI_KEY },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      console.log("[OddsPapi] API returned non-OK status")
      return []
    }

    const data = await res.json()
    const allMatches = data.matches ?? []

    console.log(`[OddsPapi] Found ${allMatches.length} matches for ${dateStr}`)

    for (const m of allMatches) {
      const compId = m.competition?.id?.toLowerCase() || ""
      let compCode = ODDSPAPI_COMP_MAP[compId]

      // Si pas de compétition officielle, c'est un match amical
      if (!compCode) {
        compCode = "AMICAL"
      }

      if (!ALLOWED_COMPETITIONS.has(compCode)) {
        continue
      }

      const meta = COMP_META[compCode]
      const kickoff = new Date(m.kickoff)
      const state = kickoff <= now ? (m.status === "ended" ? "done" : "live") : "soon"

      // Parse score
      let homeScore: number | null = null
      let awayScore: number | null = null

      if (m.score) {
        if (typeof m.score.home === "number") homeScore = m.score.home
        if (typeof m.score.away === "number") awayScore = m.score.away
      }

      matches.push({
        id: `oddspapi-${m.id}`, // Unique ID from OddsPapi
        competition: compCode,
        competition_name: meta.name,
        competition_color: meta.color,
        home_team: m.homeTeam?.name || "?",
        away_team: m.awayTeam?.name || "?",
        home_team_code: makeTeamCode(m.homeTeam?.name || "?"),
        away_team_code: makeTeamCode(m.awayTeam?.name || "?"),
        home_score: homeScore,
        away_score: awayScore,
        state,
        kickoff: m.kickoff,
        minute: state === "live" && m.minute ? `${m.minute}'` : null,
        // Cotes par défaut (OddsPapi n'a pas les cotes en endpoint match basique)
        odds_1: 2.00,
        odds_n: 3.25,
        odds_2: 3.50,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      })
    }

    console.log(`[OddsPapi] Inserted ${matches.length} matches`)
    return matches
  } catch (e) {
    console.error("[OddsPapi] Error fetching matches:", e)
    return []
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const stats = { purged: 0, odds: 0, errors: [] as string[] }

  console.log(`[cron 3h] démarré à ${now.toISOString()}`)

  /* ── 0. Purge des matchs hors compétitions autorisées ─────────────────── */
  try {
    const allowedArray = [...ALLOWED_COMPETITIONS]
    // Supabase .not().in() avec tableau
    const { data: purgedRows } = await admin
      .from("matches")
      .select("id")
      .not("competition", "in", `(${allowedArray.map(c => `"${c}"`).join(",")})`)

    if (purgedRows && purgedRows.length > 0) {
      const ids = purgedRows.map(r => r.id)
      await admin.from("matches").delete().in("id", ids)
      stats.purged = ids.length
      console.log(`[cron 3h] Purgé ${stats.purged} matchs hors liste autorisée`)
    }
  } catch (e) {
    stats.errors.push(`purge: ${e}`)
  }

  /* ── 1. The Odds API — 23 compétitions autorisées ─────────────────────── */
  if (!ODDS_API_KEY) {
    console.log("[cron 3h] Pas de clé Odds API — skip")
  } else {
    const fetched: object[] = []
    await Promise.all(
      Object.entries(SPORT_KEYS).map(async ([code, sportKey]) => {
        if (!ALLOWED_COMPETITIONS.has(code)) return
        try {
          const res = await fetch(
            `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?` +
            `apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso`,
            { cache: "no-store" }
          )
          if (!res.ok) return
          const data = await res.json()
          if (!Array.isArray(data)) return
          const meta = COMP_META[code]

          for (const event of data.slice(0, 20)) {
            const bkm      = event.bookmakers?.[0]
            const h2h      = bkm?.markets?.find((m: { key: string }) => m.key === "h2h")
            const outcomes = h2h?.outcomes ?? []
            const homeOdds = outcomes.find((o: { name: string }) => o.name === event.home_team)?.price ?? 2.00
            const awayOdds = outcomes.find((o: { name: string }) => o.name === event.away_team)?.price ?? 3.50
            const drawOdds = outcomes.find((o: { name: string }) => o.name === "Draw")?.price ?? 3.25
            const state    = new Date(event.commence_time) <= now ? "live" : "soon"

            fetched.push({
              id: event.id,
              competition: code,
              competition_name: meta.name,
              competition_color: meta.color,
              home_team: event.home_team,
              away_team: event.away_team,
              home_team_code: makeTeamCode(event.home_team),
              away_team_code: makeTeamCode(event.away_team),
              home_score: null, away_score: null,
              state, kickoff: event.commence_time, minute: null,
              odds_1: homeOdds, odds_n: drawOdds, odds_2: awayOdds,
              odds_updated_at: now.toISOString(),
              is_premium: false,
            })
          }
        } catch (e) {
          stats.errors.push(`odds-${code}: ${e}`)
        }
      })
    )

    if (fetched.length > 0) {
      await admin.from("matches").upsert(fetched, { onConflict: "id" })
      stats.odds = fetched.length
    } else {
      // ── FALLBACK 1: Try Football-Data.org ──
      console.log("[cron 3h] The Odds API returned 0 matches — trying Football-Data.org fallback")
      const fdMatches = await fetchFootballDataMatches(now)

      if (fdMatches.length > 0) {
        await admin.from("matches").upsert(fdMatches, { onConflict: "id" })
        stats.odds = fdMatches.length
        console.log(`[cron 3h] Football-Data fallback: inserted ${fdMatches.length} matches`)
      } else {
        // ── FALLBACK 2: Try OddsPapi ──
        console.log("[cron 3h] Football-Data returned 0 matches — trying OddsPapi fallback")
        const oddsPapiMatches = await fetchOddsPapiMatches(now)

        if (oddsPapiMatches.length > 0) {
          await admin.from("matches").upsert(oddsPapiMatches, { onConflict: "id" })
          stats.odds = oddsPapiMatches.length
          console.log(`[cron 3h] OddsPapi fallback: inserted ${oddsPapiMatches.length} matches`)
        }
      }
    }
  }

  console.log(`[cron 3h] terminé — purgé:${stats.purged} odds:${stats.odds} erreurs:${stats.errors.length}`)

  return NextResponse.json({ ok: true, timestamp: now.toISOString(), stats })
}
