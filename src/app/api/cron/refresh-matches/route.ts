import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * Cron job — 3h00 heure de Paris (01:00 UTC)
 * - The Odds API  : fetch toutes compétitions (retourne J à J+7 automatiquement)
 * - API-Football  : fetch aujourd'hui + J+1 + J+2 (3 appels max)
 * - Résultat stocké dans Supabase, servi toute la journée sans appel supplémentaire
 */

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const ODDS_API_KEY     = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY
const CRON_SECRET      = process.env.CRON_SECRET

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
}

function makeTeamCode(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, "").split(" ").filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase()
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
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
  const stats = { odds: 0, football: 0, days_fetched: [] as string[], errors: [] as string[] }

  console.log(`[cron 3h] refresh-matches démarré à ${now.toISOString()}`)

  // ── 1. The Odds API ──────────────────────────────────────────────
  // Retourne automatiquement J à J+7 pour chaque compétition
  if (ODDS_API_KEY) {
    const fetched: object[] = []
    await Promise.all(
      Object.entries(SPORT_KEYS).map(async ([code, sportKey]) => {
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
        } catch (e) {
          stats.errors.push(`odds-${code}: ${e}`)
        }
      })
    )
    if (fetched.length > 0) {
      await admin.from("matches").upsert(fetched, { onConflict: "id" })
      stats.odds = fetched.length
    }
  }

  // ── 2. API-Football — aujourd'hui + J+1 + J+2 (3 appels) ────────
  if (FOOTBALL_API_KEY) {
    for (let i = 0; i <= 2; i++) {
      const dateStr = addDays(now, i)
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${dateStr}`,
          { headers: { "x-apisports-key": FOOTBALL_API_KEY }, cache: "no-store" }
        )
        if (!res.ok) continue
        const data = await res.json()

        // Compte suspendu → loguer et arrêter
        if (data.errors?.access || data.errors?.token) {
          stats.errors.push(`football: compte suspendu`)
          break
        }

        // Pas de matchs pour ce jour → stocker l'info
        const responses = data.response ?? []
        const friendly: object[] = []

        for (const f of responses) {
          const leagueName: string = f.league?.name ?? ""
          const country: string   = f.league?.country ?? ""
          if (
            leagueName !== "Friendlies" || country !== "World" ||
            /U\d{2}|Women|W\b/i.test(`${f.teams?.home?.name} ${f.teams?.away?.name}`)
          ) continue

          const statusShort = f.fixture.status?.short ?? "NS"
          const state = ["FT","AET","PEN"].includes(statusShort) ? "done"
            : ["1H","2H","HT","ET"].includes(statusShort) ? "live" : "soon"

          friendly.push({
            id: `apf-${f.fixture.id}`,
            competition: "AMI",
            competition_name: "Matchs amicaux",
            competition_color: "#6B7280",
            home_team: f.teams.home.name,
            away_team: f.teams.away.name,
            home_team_code: makeTeamCode(f.teams.home.name),
            away_team_code: makeTeamCode(f.teams.away.name),
            home_score: f.goals?.home ?? null,
            away_score: f.goals?.away ?? null,
            state,
            kickoff: f.fixture.date,
            minute: f.fixture.status?.elapsed ? `${f.fixture.status.elapsed}'` : null,
            odds_1: 2.00, odds_n: 3.25, odds_2: 3.50,
            odds_updated_at: now.toISOString(),
            is_premium: false,
          })
        }

        if (friendly.length > 0) {
          await admin.from("matches").upsert(friendly, { onConflict: "id" })
          stats.football += friendly.length
          stats.days_fetched.push(dateStr)
        }
      } catch (e) {
        stats.errors.push(`football-${dateStr}: ${e}`)
      }
    }
  }


  console.log(`[cron 3h] terminé — odds:${stats.odds} football:${stats.football} jours:${stats.days_fetched.join(",")}`)

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    matches_fetched: {
      odds: stats.odds,
      football: stats.football,
      days: stats.days_fetched,
    },
    errors: stats.errors,
  })
}
