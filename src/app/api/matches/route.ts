import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ODDS_API_KEY     = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY

/* ── Quotas ─────────────────────────────────────────────────────
   The Odds API   : ~500 req/mois → max 15/jour → refresh toutes les 20h
                    12 sports × 1 refresh/20h = 14.4 req/jour ✓
   API-Football   : 100 req/jour → refresh toutes les 1h, 3 jours seulement
                    3 req × 12 refreshes/jour = 36 req/jour ✓
──────────────────────────────────────────────────────────────── */
const ODDS_REFRESH_MS     = 20 * 60 * 60 * 1000   // 20 heures
const FOOTBALL_REFRESH_MS =  1 * 60 * 60 * 1000   //  1 heure

// Clés confirmées actives dans The Odds API (juin 2026)
const SPORT_KEYS: Record<string, string> = {
  CDM: "soccer_fifa_world_cup",
  LIB: "soccer_conmebol_copa_libertadores",
  SUD: "soccer_conmebol_copa_sudamericana",
  JPN: "soccer_japan_j_league",
  NOR: "soccer_norway_eliteserien",
  SWE: "soccer_sweden_allsvenskan",
  BRS: "soccer_brazil_serie_b",
  CHI: "soccer_chile_campeonato",
  CHN: "soccer_china_superleague",
  FIN: "soccer_finland_veikkausliiga",
  SWT: "soccer_sweden_superettan",
  SP2: "soccer_spain_segunda_division",
}

const COMP_META: Record<string, { name: string; color: string }> = {
  CDM: { name: "Coupe du Monde",     color: "#C9A227" },
  LIB: { name: "Copa Libertadores",  color: "#1a3a5e" },
  SUD: { name: "Copa Sudamericana",  color: "#2e7d32" },
  JPN: { name: "J-League",           color: "#c62828" },
  NOR: { name: "Eliteserien",        color: "#0d47a1" },
  SWE: { name: "Allsvenskan",        color: "#f9a825" },
  BRS: { name: "Brésil Série B",     color: "#009c3b" },
  CHI: { name: "Chili Liga",         color: "#d52b1e" },
  CHN: { name: "Super League Chine", color: "#de2910" },
  FIN: { name: "Veikkausliiga",      color: "#003580" },
  SWT: { name: "Superettan",         color: "#006AA7" },
  SP2: { name: "La Liga 2",          color: "#e01a22" },
  AMI: { name: "Matchs amicaux",     color: "#6B7280" },
  // backward compat
  L1:   { name: "Ligue 1",           color: "#10B981" },
  UCL:  { name: "Champions League",  color: "#0a1a5e" },
  PL:   { name: "Premier League",    color: "#3d195b" },
  LIGA: { name: "La Liga",           color: "#e01a22" },
  MLS:  { name: "MLS",               color: "#1a73e8" },
  BRA:  { name: "Brasileirão",       color: "#009c3b" },
  ARG:  { name: "Liga Argentina",    color: "#74acdf" },
  MEX:  { name: "Liga MX",           color: "#006847" },
}

function makeTeamCode(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, "").split(" ").filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase()
}

/* ── Matchs amicaux statiques (fallback si API-Football indisponible) ── */
function getFriendlyMatches() {
  const now = new Date()
  const k = (date: string, utcH: number) =>
    new Date(`${date}T${utcH < 10 ? "0" : ""}${utcH}:00:00Z`).toISOString()
  const st = (iso: string): "soon" | "done" => new Date(iso) <= now ? "done" : "soon"
  const ami = {
    competition: "AMI", competition_name: "Matchs amicaux",
    competition_color: "#6B7280", is_premium: false,
    home_score: null, away_score: null, minute: null,
    odds_updated_at: now.toISOString(),
  }
  const matches = [
    { id:"ami-ned-alg", home_team:"Pays-Bas",    away_team:"Algérie",       home_team_code:"NED", away_team_code:"ALG", kickoff:k("2026-06-03",18), odds_1:1.70, odds_n:3.80, odds_2:4.50 },
    { id:"ami-pol-nig", home_team:"Pologne",      away_team:"Nigeria",       home_team_code:"POL", away_team_code:"NGA", kickoff:k("2026-06-03",18), odds_1:1.85, odds_n:3.50, odds_2:4.20 },
    { id:"ami-con-den", home_team:"Congo DR",     away_team:"Danemark",      home_team_code:"COD", away_team_code:"DEN", kickoff:k("2026-06-03",19), odds_1:4.50, odds_n:3.40, odds_2:1.80 },
    { id:"ami-bur-aus", home_team:"Burkina Faso", away_team:"Australie",     home_team_code:"BFA", away_team_code:"AUS", kickoff:k("2026-06-03",14), odds_1:3.20, odds_n:3.20, odds_2:2.20 },
    { id:"ami-gha-sco", home_team:"Ghana",        away_team:"Écosse",        home_team_code:"GHA", away_team_code:"SCO", kickoff:k("2026-06-03",19), odds_1:2.80, odds_n:3.20, odds_2:2.50 },
    { id:"ami-mar-ita", home_team:"Maroc",        away_team:"Italie",        home_team_code:"MAR", away_team_code:"ITA", kickoff:k("2026-06-04",19), odds_1:3.20, odds_n:3.10, odds_2:2.25 },
    { id:"ami-tun-mex", home_team:"Tunisie",      away_team:"Mexique",       home_team_code:"TUN", away_team_code:"MEX", kickoff:k("2026-06-04",18), odds_1:3.50, odds_n:3.20, odds_2:2.10 },
    { id:"ami-cam-rou", home_team:"Cameroun",     away_team:"Roumanie",      home_team_code:"CMR", away_team_code:"ROU", kickoff:k("2026-06-04",18), odds_1:2.60, odds_n:3.20, odds_2:2.70 },
    { id:"ami-fra-bel", home_team:"France",       away_team:"Belgique",      home_team_code:"FRA", away_team_code:"BEL", kickoff:k("2026-06-05",19), odds_1:1.90, odds_n:3.50, odds_2:4.00 },
    { id:"ami-esp-bra", home_team:"Espagne",      away_team:"Brésil",        home_team_code:"ESP", away_team_code:"BRA", kickoff:k("2026-06-05",20), odds_1:2.30, odds_n:3.20, odds_2:3.10 },
    { id:"ami-por-and", home_team:"Portugal",     away_team:"Andorre",       home_team_code:"POR", away_team_code:"AND", kickoff:k("2026-06-05",18), odds_1:1.08, odds_n:8.00, odds_2:20.0 },
    { id:"ami-bel-isl", home_team:"Belgique",     away_team:"Islande",       home_team_code:"BEL", away_team_code:"ISL", kickoff:k("2026-06-05",19), odds_1:1.45, odds_n:4.20, odds_2:7.00 },
    { id:"ami-arg-ecu", home_team:"Argentine",    away_team:"Équateur",      home_team_code:"ARG", away_team_code:"ECU", kickoff:k("2026-06-06",23), odds_1:1.60, odds_n:3.80, odds_2:5.50 },
    { id:"ami-all-slo", home_team:"Allemagne",    away_team:"Slovaquie",     home_team_code:"GER", away_team_code:"SVK", kickoff:k("2026-06-06",17), odds_1:1.45, odds_n:4.20, odds_2:7.50 },
    { id:"ami-eng-fin", home_team:"Angleterre",   away_team:"Finlande",      home_team_code:"ENG", away_team_code:"FIN", kickoff:k("2026-06-06",19), odds_1:1.35, odds_n:5.00, odds_2:8.00 },
    { id:"ami-ita-nor", home_team:"Italie",       away_team:"Norvège",       home_team_code:"ITA", away_team_code:"NOR", kickoff:k("2026-06-07",19), odds_1:2.00, odds_n:3.30, odds_2:3.80 },
    { id:"ami-esp-and", home_team:"Espagne",      away_team:"Andorre",       home_team_code:"ESP", away_team_code:"AND", kickoff:k("2026-06-07",20), odds_1:1.06, odds_n:9.00, odds_2:25.0 },
    { id:"ami-bra-col", home_team:"Brésil",       away_team:"Colombie",      home_team_code:"BRA", away_team_code:"COL", kickoff:k("2026-06-07",23), odds_1:1.70, odds_n:3.60, odds_2:5.00 },
    { id:"ami-usa-uru", home_team:"États-Unis",   away_team:"Uruguay",       home_team_code:"USA", away_team_code:"URU", kickoff:k("2026-06-08",22), odds_1:2.50, odds_n:3.20, odds_2:2.80 },
    { id:"ami-fra-lux", home_team:"France",       away_team:"Luxembourg",    home_team_code:"FRA", away_team_code:"LUX", kickoff:k("2026-06-08",19), odds_1:1.15, odds_n:7.00, odds_2:15.0 },
    { id:"ami-jpn-par", home_team:"Japon",        away_team:"Paraguay",      home_team_code:"JPN", away_team_code:"PAR", kickoff:k("2026-06-09",11), odds_1:1.90, odds_n:3.40, odds_2:4.00 },
    { id:"ami-sen-col", home_team:"Sénégal",      away_team:"Colombie",      home_team_code:"SEN", away_team_code:"COL", kickoff:k("2026-06-09",19), odds_1:2.80, odds_n:3.20, odds_2:2.50 },
    { id:"ami-mex-cos", home_team:"Mexique",      away_team:"Costa Rica",    home_team_code:"MEX", away_team_code:"CRC", kickoff:k("2026-06-09",23), odds_1:1.75, odds_n:3.40, odds_2:4.50 },
    { id:"ami-cro-gre", home_team:"Croatie",      away_team:"Grèce",         home_team_code:"CRO", away_team_code:"GRE", kickoff:k("2026-06-10",18), odds_1:1.90, odds_n:3.40, odds_2:4.00 },
    { id:"ami-all-bos", home_team:"Allemagne",    away_team:"Bosnie",        home_team_code:"GER", away_team_code:"BIH", kickoff:k("2026-06-10",17), odds_1:1.50, odds_n:4.00, odds_2:6.50 },
    { id:"ami-kor-mal", home_team:"Corée du Sud", away_team:"Mali",          home_team_code:"KOR", away_team_code:"MLI", kickoff:k("2026-06-10",12), odds_1:1.95, odds_n:3.30, odds_2:4.00 },
  ]
  return matches.map(m => ({ ...ami, ...m, state: st(m.kickoff) }))
}

/* ── Matchs de démo (aucune clé API) ──────────────────────────── */
const DEMO_MATCHES = [
  { id:"demo-1", competition:"LIB", competition_name:"Copa Libertadores", competition_color:"#1a3a5e",
    home_team:"River Plate", away_team:"Boca Juniors", home_team_code:"RIV", away_team_code:"BOC",
    home_score:null, away_score:null, state:"soon", kickoff:new Date(Date.now()+2*3600_000).toISOString(),
    odds_1:2.05, odds_n:3.55, odds_2:3.40, odds_updated_at:new Date().toISOString(), is_premium:false },
  { id:"demo-2", competition:"AMI", competition_name:"Matchs amicaux", competition_color:"#6B7280",
    home_team:"France", away_team:"Belgique", home_team_code:"FRA", away_team_code:"BEL",
    home_score:null, away_score:null, state:"soon", kickoff:new Date(Date.now()+5*3600_000).toISOString(),
    odds_1:1.90, odds_n:3.50, odds_2:4.00, odds_updated_at:new Date().toISOString(), is_premium:false },
]

/* ── Fetch API-Football (économique) ──────────────────────────── */
async function fetchFriendliesFromAPIFootball(): Promise<object[]> {
  const key = FOOTBALL_API_KEY
  if (!key) return []

  const meta  = COMP_META["AMI"]
  const now   = new Date()
  const results: object[] = []

  // Seulement aujourd'hui + 2 prochains jours = 3 requêtes max
  for (let i = 0; i <= 2; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)

    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${dateStr}`,
        { headers: { "x-apisports-key": key }, cache: "no-store" }
      )
      if (!res.ok) continue
      const data = await res.json()
      if (data.errors?.access) return [] // compte suspendu

      for (const f of data.response ?? []) {
        const leagueName: string = f.league?.name ?? ""
        const country: string   = f.league?.country ?? ""
        if (
          leagueName !== "Friendlies" || country !== "World" ||
          /U\d{2}|Women|W\b/i.test(`${f.teams?.home?.name} ${f.teams?.away?.name}`)
        ) continue

        const statusShort = f.fixture.status?.short ?? "NS"
        const state = ["FT","AET","PEN"].includes(statusShort) ? "done"
          : ["1H","2H","HT","ET"].includes(statusShort) ? "live" : "soon"

        results.push({
          id: `apf-${f.fixture.id}`,
          competition: "AMI",
          competition_name: meta.name,
          competition_color: meta.color,
          home_team: f.teams.home.name,
          away_team: f.teams.away.name,
          home_team_code: makeTeamCode(f.teams.home.name),
          away_team_code: makeTeamCode(f.teams.away.name),
          home_score: f.goals?.home ?? null,
          away_score: f.goals?.away ?? null,
          state,
          kickoff: f.fixture.date,
          minute: f.fixture.status?.elapsed ? `${f.fixture.status.elapsed}'` : null,
          odds_1: 2.00, odds_n: 3.25, odds_2: 3.50, // cotes par défaut (pas d'appel odds)
          odds_updated_at: now.toISOString(),
          is_premium: false,
        })
      }
    } catch { continue }
  }

  return results
}

/* ── Route principale ─────────────────────────────────────────── */
export async function GET() {
  const supabase = await createClient()
  const now      = new Date()

  if (!ODDS_API_KEY) return NextResponse.json(DEMO_MATCHES)

  try {
    /* ── 1. Lire le cache Supabase + vérifier fraîcheur ───────── */
    const windowStart = new Date(now.getTime() - 3 * 3600_000).toISOString()
    const windowEnd   = new Date(now.getTime() + 8 * 86400_000).toISOString()

    const { data: cached } = await supabase
      .from("matches")
      .select("*")
      .gte("kickoff", windowStart)
      .lte("kickoff", windowEnd)
      .order("kickoff", { ascending: true })

    // Dernier timestamp de mise à jour pour chaque source
    const oddsMatches     = (cached ?? []).filter((m: { id: string }) => !m.id.startsWith("ami-") && !m.id.startsWith("apf-"))
    const friendlyMatches = (cached ?? []).filter((m: { id: string }) => m.id.startsWith("ami-") || m.id.startsWith("apf-"))

    const lastOddsUpdate     = oddsMatches.length > 0
      ? Math.max(...oddsMatches.map((m: { odds_updated_at: string }) => new Date(m.odds_updated_at).getTime()))
      : 0
    const lastFootballUpdate = friendlyMatches.length > 0
      ? Math.max(...friendlyMatches.map((m: { odds_updated_at: string }) => new Date(m.odds_updated_at).getTime()))
      : 0

    const oddsStale     = now.getTime() - lastOddsUpdate     > ODDS_REFRESH_MS
    const footballStale = now.getTime() - lastFootballUpdate > FOOTBALL_REFRESH_MS

    /* ── 2. Re-fetch The Odds API si nécessaire ───────────────── */
    let freshOddsMatches: object[] = oddsMatches
    if (oddsStale) {
      console.log(`[matches] The Odds API refresh (dernier: ${lastOddsUpdate ? new Date(lastOddsUpdate).toISOString() : "jamais"})`)
      const fetched: object[] = []
      await Promise.all(
        Object.entries(SPORT_KEYS).map(async ([code, sportKey]) => {
          try {
            const res = await fetch(
              `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?` +
              `apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso`,
              // Pas de cache Next.js ici — le contrôle est fait via Supabase timestamp
              { cache: "no-store" }
            )
            if (!res.ok) return
            const data = await res.json()
            if (!Array.isArray(data)) return
            const meta = COMP_META[code]

            for (const event of data.slice(0, 15)) {
              const bkm      = event.bookmakers?.[0]
              const h2h      = bkm?.markets?.find((m: { key: string }) => m.key === "h2h")
              const outcomes = h2h?.outcomes ?? []
              const homeOdds = outcomes.find((o: { name: string }) => o.name === event.home_team)?.price ?? 2.00
              const awayOdds = outcomes.find((o: { name: string }) => o.name === event.away_team)?.price ?? 3.50
              const drawOdds = outcomes.find((o: { name: string }) => o.name === "Draw")?.price ?? 3.25
              const state    = new Date(event.commence_time) <= now ? "live" : "soon"

              fetched.push({
                id: event.id,
                competition: code, competition_name: meta.name, competition_color: meta.color,
                home_team: event.home_team, away_team: event.away_team,
                home_team_code: makeTeamCode(event.home_team),
                away_team_code: makeTeamCode(event.away_team),
                home_score: null, away_score: null, state,
                kickoff: event.commence_time,
                odds_1: homeOdds, odds_n: drawOdds, odds_2: awayOdds,
                odds_updated_at: now.toISOString(),
                is_premium: false,
              })
            }
          } catch { /* ignore par sport */ }
        })
      )
      if (fetched.length > 0) {
        freshOddsMatches = fetched
        supabase.from("matches").upsert(fetched, { onConflict: "id" }).then(() => {})
      }
    }

    /* ── 3. Re-fetch API-Football si nécessaire ───────────────── */
    let freshFriendlies: object[] = friendlyMatches.length > 0 ? friendlyMatches : getFriendlyMatches()
    if (footballStale) {
      console.log(`[matches] API-Football refresh (dernier: ${lastFootballUpdate ? new Date(lastFootballUpdate).toISOString() : "jamais"})`)
      const apfMatches = await fetchFriendliesFromAPIFootball()
      if (apfMatches.length > 0) {
        freshFriendlies = apfMatches
        supabase.from("matches").upsert(apfMatches, { onConflict: "id" }).then(() => {})
      } else {
        // API-Football indisponible → garder les matchs statiques
        freshFriendlies = getFriendlyMatches()
      }
    }

    /* ── 4. Assembler et retourner ────────────────────────────── */
    const allMatches = [...freshOddsMatches, ...freshFriendlies]
    if (allMatches.length === 0) return NextResponse.json(DEMO_MATCHES)
    return NextResponse.json(allMatches)

  } catch (err) {
    console.error("[matches] Erreur:", err)
    // Fallback : cache Supabase brut ou démo
    const { data } = await supabase
      .from("matches").select("*")
      .gte("kickoff", new Date(Date.now() - 3 * 3600_000).toISOString())
      .order("kickoff")
    return NextResponse.json(data?.length ? data : DEMO_MATCHES)
  }
}
