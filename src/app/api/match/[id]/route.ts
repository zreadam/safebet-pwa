import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY

// Même liste que dans /api/matches/route.ts — fallback si Supabase ne l'a pas encore
const STATIC_FRIENDLIES: Record<string, { home_team: string; away_team: string; home_team_code: string; away_team_code: string; kickoff: string; odds_1: number; odds_n: number; odds_2: number }> = {
  "ami-ned-alg": { home_team:"Pays-Bas",    away_team:"Algérie",      home_team_code:"NED", away_team_code:"ALG", kickoff:"2026-06-03T18:00:00Z", odds_1:1.70, odds_n:3.80, odds_2:4.50 },
  "ami-pol-nig": { home_team:"Pologne",      away_team:"Nigeria",      home_team_code:"POL", away_team_code:"NGA", kickoff:"2026-06-03T18:00:00Z", odds_1:1.85, odds_n:3.50, odds_2:4.20 },
  "ami-con-den": { home_team:"Congo DR",     away_team:"Danemark",     home_team_code:"COD", away_team_code:"DEN", kickoff:"2026-06-03T19:00:00Z", odds_1:4.50, odds_n:3.40, odds_2:1.80 },
  "ami-bur-aus": { home_team:"Burkina Faso", away_team:"Australie",    home_team_code:"BFA", away_team_code:"AUS", kickoff:"2026-06-03T14:00:00Z", odds_1:3.20, odds_n:3.20, odds_2:2.20 },
  "ami-gha-sco": { home_team:"Ghana",        away_team:"Écosse",       home_team_code:"GHA", away_team_code:"SCO", kickoff:"2026-06-03T19:00:00Z", odds_1:2.80, odds_n:3.20, odds_2:2.50 },
  "ami-mar-ita": { home_team:"Maroc",        away_team:"Italie",       home_team_code:"MAR", away_team_code:"ITA", kickoff:"2026-06-04T19:00:00Z", odds_1:3.20, odds_n:3.10, odds_2:2.25 },
  "ami-tun-mex": { home_team:"Tunisie",      away_team:"Mexique",      home_team_code:"TUN", away_team_code:"MEX", kickoff:"2026-06-04T18:00:00Z", odds_1:3.50, odds_n:3.20, odds_2:2.10 },
  "ami-cam-rou": { home_team:"Cameroun",     away_team:"Roumanie",     home_team_code:"CMR", away_team_code:"ROU", kickoff:"2026-06-04T18:00:00Z", odds_1:2.60, odds_n:3.20, odds_2:2.70 },
  "ami-fra-bel": { home_team:"France",       away_team:"Belgique",     home_team_code:"FRA", away_team_code:"BEL", kickoff:"2026-06-05T19:00:00Z", odds_1:1.90, odds_n:3.50, odds_2:4.00 },
  "ami-esp-bra": { home_team:"Espagne",      away_team:"Brésil",       home_team_code:"ESP", away_team_code:"BRA", kickoff:"2026-06-05T20:00:00Z", odds_1:2.30, odds_n:3.20, odds_2:3.10 },
  "ami-por-and": { home_team:"Portugal",     away_team:"Andorre",      home_team_code:"POR", away_team_code:"AND", kickoff:"2026-06-05T18:00:00Z", odds_1:1.08, odds_n:8.00, odds_2:20.0 },
  "ami-bel-isl": { home_team:"Belgique",     away_team:"Islande",      home_team_code:"BEL", away_team_code:"ISL", kickoff:"2026-06-05T19:00:00Z", odds_1:1.45, odds_n:4.20, odds_2:7.00 },
  "ami-arg-ecu": { home_team:"Argentine",    away_team:"Équateur",     home_team_code:"ARG", away_team_code:"ECU", kickoff:"2026-06-06T23:00:00Z", odds_1:1.60, odds_n:3.80, odds_2:5.50 },
  "ami-all-slo": { home_team:"Allemagne",    away_team:"Slovaquie",    home_team_code:"GER", away_team_code:"SVK", kickoff:"2026-06-06T17:00:00Z", odds_1:1.45, odds_n:4.20, odds_2:7.50 },
  "ami-eng-fin": { home_team:"Angleterre",   away_team:"Finlande",     home_team_code:"ENG", away_team_code:"FIN", kickoff:"2026-06-06T19:00:00Z", odds_1:1.35, odds_n:5.00, odds_2:8.00 },
  "ami-ita-nor": { home_team:"Italie",       away_team:"Norvège",      home_team_code:"ITA", away_team_code:"NOR", kickoff:"2026-06-07T19:00:00Z", odds_1:2.00, odds_n:3.30, odds_2:3.80 },
  "ami-esp-and": { home_team:"Espagne",      away_team:"Andorre",      home_team_code:"ESP", away_team_code:"AND", kickoff:"2026-06-07T20:00:00Z", odds_1:1.06, odds_n:9.00, odds_2:25.0 },
  "ami-bra-col": { home_team:"Brésil",       away_team:"Colombie",     home_team_code:"BRA", away_team_code:"COL", kickoff:"2026-06-07T23:00:00Z", odds_1:1.70, odds_n:3.60, odds_2:5.00 },
  "ami-usa-uru": { home_team:"États-Unis",   away_team:"Uruguay",      home_team_code:"USA", away_team_code:"URU", kickoff:"2026-06-08T22:00:00Z", odds_1:2.50, odds_n:3.20, odds_2:2.80 },
  "ami-fra-lux": { home_team:"France",       away_team:"Luxembourg",   home_team_code:"FRA", away_team_code:"LUX", kickoff:"2026-06-08T19:00:00Z", odds_1:1.15, odds_n:7.00, odds_2:15.0 },
  "ami-jpn-par": { home_team:"Japon",        away_team:"Paraguay",     home_team_code:"JPN", away_team_code:"PAR", kickoff:"2026-06-09T11:00:00Z", odds_1:1.90, odds_n:3.40, odds_2:4.00 },
  "ami-sen-col": { home_team:"Sénégal",      away_team:"Colombie",     home_team_code:"SEN", away_team_code:"COL", kickoff:"2026-06-09T19:00:00Z", odds_1:2.80, odds_n:3.20, odds_2:2.50 },
  "ami-mex-cos": { home_team:"Mexique",      away_team:"Costa Rica",   home_team_code:"MEX", away_team_code:"CRC", kickoff:"2026-06-09T23:00:00Z", odds_1:1.75, odds_n:3.40, odds_2:4.50 },
  "ami-cro-gre": { home_team:"Croatie",      away_team:"Grèce",        home_team_code:"CRO", away_team_code:"GRE", kickoff:"2026-06-10T18:00:00Z", odds_1:1.90, odds_n:3.40, odds_2:4.00 },
  "ami-all-bos": { home_team:"Allemagne",    away_team:"Bosnie",       home_team_code:"GER", away_team_code:"BIH", kickoff:"2026-06-10T17:00:00Z", odds_1:1.50, odds_n:4.00, odds_2:6.50 },
  "ami-kor-mal": { home_team:"Corée du Sud", away_team:"Mali",         home_team_code:"KOR", away_team_code:"MLI", kickoff:"2026-06-10T12:00:00Z", odds_1:1.95, odds_n:3.30, odds_2:4.00 },
}

async function apfFetch(path: string) {
  if (!FOOTBALL_API_KEY) return null
  const res = await fetch(`https://v3.football.api-sports.io/${path}`, {
    headers: { "x-apisports-key": FOOTBALL_API_KEY },
    next: { revalidate: 60 },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.response ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Chercher dans le cache Supabase
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single()

  // ID API-Football : "apf-1536930" → fixtureId = 1536930
  const fixtureId = id.startsWith("apf-") ? id.slice(4) : null

  // 2. Si pas en Supabase : matchs amicaux statiques d'abord, puis API-Football
  let matchData = match
  if (!matchData && id.startsWith("ami-") && STATIC_FRIENDLIES[id]) {
    const sf = STATIC_FRIENDLIES[id]
    const now = new Date()
    matchData = {
      id,
      competition: "AMI",
      competition_name: "Matchs amicaux",
      competition_color: "#6B7280",
      ...sf,
      home_score: null,
      away_score: null,
      minute: null,
      state: new Date(sf.kickoff) <= now ? "done" : "soon",
      is_premium: false,
    }
  }
  if (!matchData && fixtureId) {
    const fixtures = await apfFetch(`fixtures?id=${fixtureId}`)
    const f = fixtures?.[0]
    if (f) {
      const statusShort: string = f.fixture.status?.short ?? "NS"
      const state = ["FT","AET","PEN"].includes(statusShort) ? "done"
        : ["1H","2H","HT","ET"].includes(statusShort) ? "live" : "soon"
      matchData = {
        id,
        competition: "AMI", competition_name: "Matchs amicaux", competition_color: "#6B7280",
        home_team: f.teams.home.name, away_team: f.teams.away.name,
        home_team_code: f.teams.home.name.slice(0, 3).toUpperCase(),
        away_team_code: f.teams.away.name.slice(0, 3).toUpperCase(),
        home_score: f.goals?.home ?? null, away_score: f.goals?.away ?? null,
        state, kickoff: f.fixture.date,
        minute: f.fixture.status?.elapsed ? `${f.fixture.status.elapsed}'` : null,
        odds_1: 2.00, odds_n: 3.25, odds_2: 3.50, is_premium: false,
        // IDs internes pour fetcher la forme (préfixés _ pour ne pas polluer le client)
        _homeTeamId: f.teams.home.id,
        _awayTeamId: f.teams.away.id,
      }
    }
  }

  if (!matchData) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 })
  }

  // 3. Stats + odds depuis API-Football (si disponibles)
  let stats = null
  let events = null
  let lineups = null
  let detailedOdds = null
  let allBets: { id: number; name: string; values: { value: string; odd: string }[] }[] = []
  let formHome: { result: "W"|"D"|"L"; score: string; opponent: string; date: string; competition: string }[] | null = null
  let formAway: { result: "W"|"D"|"L"; score: string; opponent: string; date: string; competition: string }[] | null = null
  let h2h: { home: string; away: string; score: string; date: string; competition: string; winner: "home"|"draw"|"away" }[] | null = null

  // Récupérer les IDs d'équipes depuis matchData (injecté lors du parsing fixture)
  const homeTeamId: number | null = (matchData as Record<string, unknown>)._homeTeamId as number | null ?? null
  const awayTeamId: number | null = (matchData as Record<string, unknown>)._awayTeamId as number | null ?? null

  if (fixtureId) {
    const [statsRes, eventsRes, lineupsRes, oddsRes, formHomeRes, formAwayRes, h2hRes] = await Promise.all([
      apfFetch(`fixtures/statistics?fixture=${fixtureId}`),
      apfFetch(`fixtures/events?fixture=${fixtureId}`),
      apfFetch(`fixtures/lineups?fixture=${fixtureId}`),
      // Pas de filtre bookmaker : on prend le premier disponible (gratuit)
      apfFetch(`odds?fixture=${fixtureId}`),
      homeTeamId ? apfFetch(`fixtures?team=${homeTeamId}&last=5`) : Promise.resolve(null),
      awayTeamId ? apfFetch(`fixtures?team=${awayTeamId}&last=5`) : Promise.resolve(null),
      (homeTeamId && awayTeamId) ? apfFetch(`fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=5`) : Promise.resolve(null),
    ])

    // Parser les cotes — chercher le bookmaker avec le plus de marchés
    let allBets: { id: number; name: string; values: { value: string; odd: string }[] }[] = []
    if (oddsRes && oddsRes.length > 0) {
      type Bet = { id: number; name: string; values: { value: string; odd: string }[] }
      type Bookmaker = { id: number; name: string; bets: Bet[] }
      const allBkms: Bookmaker[] = oddsRes[0]?.bookmakers ?? []
      const bkm = allBkms.sort((a, b) => b.bets.length - a.bets.length)[0]

      if (bkm) {
        // Retourner TOUS les marchés bruts
        allBets = bkm.bets

        const getMarket = (marketId: number) => bkm.bets.find((b) => b.id === marketId)
        const getVal = (bet: Bet | undefined, val: string) =>
          parseFloat(bet?.values.find((v) => v.value === val)?.odd ?? "0") || null

        const mw   = getMarket(1)
        const dnb  = getMarket(2)
        const ht   = getMarket(3)
        const ou   = getMarket(5)
        const ouHT = getMarket(7)
        const btts = getMarket(8)
        const dc   = getMarket(10)
        const cs   = getMarket(11)
        const tsf  = getMarket(14)
        const exact = getMarket(12)
        const eh   = getMarket(22)

        detailedOdds = {
          home: getVal(mw, "Home"), draw: getVal(mw, "Draw"), away: getVal(mw, "Away"),
          dnb_home: getVal(dnb, "Home"), dnb_away: getVal(dnb, "Away"),
          dc_1n: getVal(dc, "Home/Draw"), dc_12: getVal(dc, "Home/Away"), dc_n2: getVal(dc, "Draw/Away"),
          ou15_over: getVal(ou, "Over 1.5"),   ou15_under: getVal(ou, "Under 1.5"),
          ou25_over: getVal(ou, "Over 2.5"),   ou25_under: getVal(ou, "Under 2.5"),
          ou35_over: getVal(ou, "Over 3.5"),   ou35_under: getVal(ou, "Under 3.5"),
          ou45_over: getVal(ou, "Over 4.5"),   ou45_under: getVal(ou, "Under 4.5"),
          btts_yes: getVal(btts, "Yes"), btts_no: getVal(btts, "No"),
          ht_home: getVal(ht, "Home"), ht_draw: getVal(ht, "Draw"), ht_away: getVal(ht, "Away"),
          ouHT_over05: getVal(ouHT, "Over 0.5"),  ouHT_under05: getVal(ouHT, "Under 0.5"),
          ouHT_over15: getVal(ouHT, "Over 1.5"),  ouHT_under15: getVal(ouHT, "Under 1.5"),
          eh_home_m1: getVal(eh, "Home -1"), eh_draw_0: getVal(eh, "Draw 0"), eh_away_p1: getVal(eh, "Away +1"),
          cs_home_yes: getVal(cs, "Yes"), cs_home_no: getVal(cs, "No"),
          tsf_home: getVal(tsf, "Home"), tsf_none: getVal(tsf, "No Goal"), tsf_away: getVal(tsf, "Away"),
          es_1_0: getVal(exact, "1:0"), es_2_0: getVal(exact, "2:0"), es_2_1: getVal(exact, "2:1"),
          es_0_0: getVal(exact, "0:0"), es_1_1: getVal(exact, "1:1"),
          es_0_1: getVal(exact, "0:1"), es_0_2: getVal(exact, "0:2"), es_1_2: getVal(exact, "1:2"),
          es_3_0: getVal(exact, "3:0"), es_3_1: getVal(exact, "3:1"), es_3_2: getVal(exact, "3:2"),
        }
      }
    }

    if (statsRes && statsRes.length === 2) {
      const getVal = (team: { statistics: { type: string; value: number | string | null }[] }, type: string) => {
        const s = team.statistics.find((x: { type: string }) => x.type === type)
        return s?.value ?? 0
      }
      const home = statsRes[0]
      const away = statsRes[1]
      stats = {
        possession_home: Number(String(getVal(home, "Ball Possession")).replace("%", "")) || 50,
        possession_away: Number(String(getVal(away, "Ball Possession")).replace("%", "")) || 50,
        shots_home: Number(getVal(home, "Total Shots")) || 0,
        shots_away: Number(getVal(away, "Total Shots")) || 0,
        shots_on_home: Number(getVal(home, "Shots on Goal")) || 0,
        shots_on_away: Number(getVal(away, "Shots on Goal")) || 0,
        corners_home: Number(getVal(home, "Corner Kicks")) || 0,
        corners_away: Number(getVal(away, "Corner Kicks")) || 0,
        fouls_home: Number(getVal(home, "Fouls")) || 0,
        fouls_away: Number(getVal(away, "Fouls")) || 0,
        yellow_home: Number(getVal(home, "Yellow Cards")) || 0,
        yellow_away: Number(getVal(away, "Yellow Cards")) || 0,
        red_home: Number(getVal(home, "Red Cards")) || 0,
        red_away: Number(getVal(away, "Red Cards")) || 0,
        passes_home: Number(getVal(home, "Total passes")) || 0,
        passes_away: Number(getVal(away, "Total passes")) || 0,
      }
    }

    if (eventsRes) {
      events = eventsRes.map((e: {
        time: { elapsed: number }
        team: { name: string }
        player: { name: string }
        assist: { name: string } | null
        type: string
        detail: string
      }) => ({
        minute: e.time.elapsed,
        team: e.team.name,
        player: e.player?.name,
        assist: e.assist?.name,
        type: e.type,
        detail: e.detail,
      }))
    }

    if (lineupsRes && lineupsRes.length > 0) {
      lineups = lineupsRes.map((l: {
        team: { name: string }
        formation: string
        startXI: { player: { name: string; number: number; pos: string } }[]
        substitutes: { player: { name: string; number: number } }[]
        coach: { name: string }
      }) => ({
        team: l.team.name,
        formation: l.formation,
        startXI: l.startXI.map((p) => ({
          name: p.player.name,
          number: p.player.number,
          pos: p.player.pos,
        })),
        substitutes: l.substitutes.map((p) => ({
          name: p.player.name,
          number: p.player.number,
        })),
        coach: l.coach?.name,
      }))
    }

    // ── Forme récente ──
    function parseForm(
      fixtures: Record<string, unknown>[] | null,
      teamId: number
    ) {
      if (!fixtures?.length) return null
      return fixtures.map((f: Record<string, unknown>) => {
        const teams   = f.teams   as { home: { id: number; name: string }; away: { id: number; name: string } }
        const goals   = f.goals   as { home: number | null; away: number | null }
        const fixture = f.fixture as { date: string }
        const league  = f.league  as { name: string }
        const isHome  = teams.home.id === teamId
        const myGoals = isHome ? goals.home : goals.away
        const opGoals = isHome ? goals.away : goals.home
        const opponent = isHome ? teams.away.name : teams.home.name
        let result: "W"|"D"|"L" = "D"
        if (myGoals !== null && opGoals !== null) {
          if (myGoals > opGoals) result = "W"
          else if (myGoals < opGoals) result = "L"
          else result = "D"
        }
        return {
          result,
          score: `${goals.home ?? "?"}–${goals.away ?? "?"}`,
          opponent,
          date: fixture.date,
          competition: league.name,
        }
      })
    }

    if (formHomeRes && homeTeamId) formHome = parseForm(formHomeRes, homeTeamId)
    if (formAwayRes && awayTeamId) formAway = parseForm(formAwayRes, awayTeamId)

    // ── Face-à-face ──
    if (h2hRes?.length) {
      h2h = h2hRes.map((f: Record<string, unknown>) => {
        const teams   = f.teams   as { home: { name: string }; away: { name: string } }
        const goals   = f.goals   as { home: number | null; away: number | null }
        const fixture = f.fixture as { date: string }
        const league  = f.league  as { name: string }
        const gh = goals.home ?? 0
        const ga = goals.away ?? 0
        return {
          home: teams.home.name,
          away: teams.away.name,
          score: `${gh}–${ga}`,
          date: fixture.date,
          competition: league.name,
          winner: gh > ga ? "home" : gh < ga ? "away" : "draw",
        }
      })
    }
  }

  // Nettoyer les champs internes avant d'envoyer au client
  if (matchData) {
    const { _homeTeamId: _h, _awayTeamId: _a, ...cleanMatch } = matchData as Record<string, unknown>
    void _h; void _a
    matchData = cleanMatch
  }

  return NextResponse.json({ match: matchData, stats, events, lineups, detailedOdds, allBets, formHome, formAway, h2h })
}
