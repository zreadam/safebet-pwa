import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY
const ODDSPAPI_KEY = process.env.ODDSPAPI_KEY

// Cache TTLs
const TTL_LIVE_MS   = 5 * 60 * 1000       // 5 min for events/lineups
const TTL_STATIC_MS = 24 * 60 * 60 * 1000 // 24h  for predictions/h2h/injuries/stats/odds

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function getCached(supabase: SupabaseClient, key: string, ttlMs: number) {
  const { data } = await supabase
    .from("match_cache")
    .select("data, updated_at")
    .eq("key", key)
    .single()
  if (!data) return null
  const age = Date.now() - new Date(data.updated_at).getTime()
  if (age > ttlMs) return null
  return data.data
}

async function setCache(supabase: SupabaseClient, key: string, value: unknown) {
  await supabase.from("match_cache").upsert({
    key,
    data: value,
    updated_at: new Date().toISOString(),
  })
}

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

// Football-Data.org API
async function footballDataFetch(path: string) {
  if (!FOOTBALL_DATA_KEY) return null
  try {
    const res = await fetch(`https://api.football-data.org/v4/${path}`, {
      headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch (error) {
    console.error("Football-Data.org fetch error:", error)
    return null
  }
}

// Normalize team names for matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ")    // Normalize spaces
    .trim()
}

// Search match on Football-Data.org by team names and date
async function findFootballDataMatch(
  homeTeam: string,
  awayTeam: string,
  kickoff: string
) {
  try {
    // Parse date to get the date only (YYYY-MM-DD)
    const matchDate = new Date(kickoff).toISOString().split("T")[0]

    // Fetch matches for the day
    const data = await footballDataFetch(`matches?dateFrom=${matchDate}&dateTo=${matchDate}`)
    if (!data?.matches) return null

    const homeNorm = normalizeTeamName(homeTeam)
    const awayNorm = normalizeTeamName(awayTeam)

    // Find exact match by team names
    const match = data.matches.find((m: any) => {
      const mHomeNorm = normalizeTeamName(m.homeTeam.name)
      const mAwayNorm = normalizeTeamName(m.awayTeam.name)
      return (mHomeNorm === homeNorm && mAwayNorm === awayNorm)
    })

    return match ?? null
  } catch (error) {
    console.error("Find Football-Data match error:", error)
    return null
  }
}

// Parse events from Football-Data match
interface FdEvent {
  minute?: { minute: number }
  team: { name: string }
  player?: { name: string }
  assist?: { name: string }
  type: string
  detail?: string
}

function parseFootballDataEvents(
  fdMatch: any,
  homeTeamName: string,
  awayTeamName: string
) {
  if (!fdMatch) return null

  const events = []

  // Goals
  if (fdMatch.goals) {
    for (const goal of fdMatch.goals) {
      if (goal) {
        events.push({
          minute: goal.minute,
          team: goal.team.name,
          player: goal.scorer?.name || "?",
          assist: goal.assist?.name || null,
          type: "goal",
          detail: "Goal",
        })
      }
    }
  }

  // Bookings (Yellow/Red Cards)
  if (fdMatch.bookings) {
    for (const booking of fdMatch.bookings) {
      if (booking) {
        events.push({
          minute: booking.minute,
          team: booking.team.name,
          player: booking.player?.name || "?",
          type: booking.cardType === "YELLOW_CARD" ? "yellow_card" : "red_card",
          detail: booking.cardType === "YELLOW_CARD" ? "Yellow Card" : "Red Card",
        })
      }
    }
  }

  // Substitutions
  if (fdMatch.substitutions) {
    for (const sub of fdMatch.substitutions) {
      if (sub) {
        events.push({
          minute: sub.minute,
          team: sub.team.name,
          player: sub.playerOut?.name || "?",
          assist: sub.playerIn?.name || null,
          type: "substitution",
          detail: `${sub.playerOut?.name || "?"} → ${sub.playerIn?.name || "?"}`,
        })
      }
    }
  }

  // Sort by minute
  return events.sort((a, b) => (a.minute || 0) - (b.minute || 0))
}

// Get live score from Football-Data.org
function getFootballDataScore(fdMatch: any) {
  if (!fdMatch) return null
  return {
    home: fdMatch.score?.fullTime?.home ?? null,
    away: fdMatch.score?.fullTime?.away ?? null,
    minute: fdMatch.status === "IN_PLAY" ? fdMatch.utcDate : null,
  }
}

// ── OddsPapi Fallback ──────────────────────────────────────────────────────
async function oddsPapiFetch(endpoint: string) {
  if (!ODDSPAPI_KEY) return null
  try {
    const res = await fetch(`https://api.oddspapi.io/v1${endpoint}`, {
      headers: { "X-API-Key": ODDSPAPI_KEY },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch (error) {
    console.error("OddsPapi fetch error:", error)
    return null
  }
}

// Fetch match odds from OddsPapi as fallback
async function getOddsPapiOdds(homeTeam: string, awayTeam: string, kickoff: string) {
  try {
    // Search for match by teams and date
    const matchDate = new Date(kickoff).toISOString().split("T")[0]
    const data = await oddsPapiFetch(
      `/matches?dateFrom=${matchDate}&dateTo=${matchDate}&limit=100`
    )

    if (!data?.matches || !Array.isArray(data.matches)) return null

    // Find matching game
    const homeNorm = homeTeam.toLowerCase().replace(/[^\w\s]/g, "")
    const awayNorm = awayTeam.toLowerCase().replace(/[^\w\s]/g, "")

    const match = data.matches.find((m: any) => {
      const mHomeNorm = m.homeTeam?.name?.toLowerCase().replace(/[^\w\s]/g, "") ?? ""
      const mAwayNorm = m.awayTeam?.name?.toLowerCase().replace(/[^\w\s]/g, "") ?? ""
      return mHomeNorm === homeNorm && mAwayNorm === awayNorm
    })

    if (!match?.id) return null

    // Get detailed odds for this match
    const oddsData = await oddsPapiFetch(`/matches/${match.id}/odds`)
    if (!oddsData?.odds) return null

    // Parse odds based on bookmaker availability
    const bookmakers = oddsData.odds.bookmakers || []
    const bkm = bookmakers[0] // Use first available bookmaker

    if (!bkm?.markets) return null

    // Extract main odds (1X2)
    const markets = bkm.markets
    const winMarket = markets.find((m: any) => m.type === "WIN" || m.type === "1X2")

    if (!winMarket?.outcomes) return null

    const odds = {
      home: null as number | null,
      draw: null as number | null,
      away: null as number | null,
      // Additional markets
      dnb_home: null as number | null,
      dnb_away: null as number | null,
      dc_1n: null as number | null,
      dc_12: null as number | null,
      dc_n2: null as number | null,
      ou15_over: null as number | null,
      ou15_under: null as number | null,
      ou25_over: null as number | null,
      ou25_under: null as number | null,
      ou35_over: null as number | null,
      ou35_under: null as number | null,
      ou45_over: null as number | null,
      ou45_under: null as number | null,
      btts_yes: null as number | null,
      btts_no: null as number | null,
      ht_home: null as number | null,
      ht_draw: null as number | null,
      ht_away: null as number | null,
      ouHT_over05: null as number | null,
      ouHT_under05: null as number | null,
      ouHT_over15: null as number | null,
      ouHT_under15: null as number | null,
      eh_home_m1: null as number | null,
      eh_draw_0: null as number | null,
      eh_away_p1: null as number | null,
      cs_home_yes: null as number | null,
      cs_home_no: null as number | null,
      tsf_home: null as number | null,
      tsf_none: null as number | null,
      tsf_away: null as number | null,
      es_1_0: null as number | null,
      es_2_0: null as number | null,
      es_2_1: null as number | null,
      es_0_0: null as number | null,
      es_1_1: null as number | null,
      es_0_1: null as number | null,
      es_0_2: null as number | null,
      es_1_2: null as number | null,
      es_3_0: null as number | null,
      es_3_1: null as number | null,
      es_3_2: null as number | null,
    }

    // Extract main odds
    for (const outcome of winMarket.outcomes) {
      if (outcome.name === "1" || outcome.name === "Home") {
        odds.home = parseFloat(outcome.odds) || null
      } else if (outcome.name === "X" || outcome.name === "Draw") {
        odds.draw = parseFloat(outcome.odds) || null
      } else if (outcome.name === "2" || outcome.name === "Away") {
        odds.away = parseFloat(outcome.odds) || null
      }
    }

    // Extract other markets
    const marketMap: Record<string, string> = {
      "DOUBLE_CHANCE": "DC",
      "OVER_UNDER": "OU",
      "BTTS": "BTTS",
      "CORRECT_SCORE": "CS",
      "FIRST_GOAL": "FG",
    }

    for (const market of markets) {
      if (!market.outcomes) continue

      // Over/Under goals
      if (market.type === "OVER_UNDER") {
        for (const outcome of market.outcomes) {
          if (outcome.name?.includes("Over 1.5")) odds.ou15_over = parseFloat(outcome.odds)
          if (outcome.name?.includes("Under 1.5")) odds.ou15_under = parseFloat(outcome.odds)
          if (outcome.name?.includes("Over 2.5")) odds.ou25_over = parseFloat(outcome.odds)
          if (outcome.name?.includes("Under 2.5")) odds.ou25_under = parseFloat(outcome.odds)
          if (outcome.name?.includes("Over 3.5")) odds.ou35_over = parseFloat(outcome.odds)
          if (outcome.name?.includes("Under 3.5")) odds.ou35_under = parseFloat(outcome.odds)
        }
      }

      // BTTS
      if (market.type === "BTTS") {
        for (const outcome of market.outcomes) {
          if (outcome.name?.includes("Yes")) odds.btts_yes = parseFloat(outcome.odds)
          if (outcome.name?.includes("No")) odds.btts_no = parseFloat(outcome.odds)
        }
      }

      // Correct Score
      if (market.type === "CORRECT_SCORE") {
        for (const outcome of market.outcomes) {
          const score = outcome.name || ""
          if (score === "1-0") odds.es_1_0 = parseFloat(outcome.odds)
          if (score === "2-0") odds.es_2_0 = parseFloat(outcome.odds)
          if (score === "2-1") odds.es_2_1 = parseFloat(outcome.odds)
          if (score === "0-0") odds.es_0_0 = parseFloat(outcome.odds)
          if (score === "1-1") odds.es_1_1 = parseFloat(outcome.odds)
          if (score === "0-1") odds.es_0_1 = parseFloat(outcome.odds)
          if (score === "0-2") odds.es_0_2 = parseFloat(outcome.odds)
          if (score === "1-2") odds.es_1_2 = parseFloat(outcome.odds)
        }
      }
    }

    return odds
  } catch (error) {
    console.error("[OddsPapi] Error getting odds:", error)
    return null
  }
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
  let predictions: { winner: { name: string | null; comment: string | null }; percent: { home: string; draw: string; away: string }; advice: string } | null = null
  let injuries: { home: { player: string; reason: string; type: string }[]; away: { player: string; reason: string; type: string }[] } | null = null

  // Récupérer les IDs d'équipes depuis matchData (injecté lors du parsing fixture)
  const homeTeamId: number | null = (matchData as Record<string, unknown>)._homeTeamId as number | null ?? null
  const awayTeamId: number | null = (matchData as Record<string, unknown>)._awayTeamId as number | null ?? null

  if (fixtureId) {
    // Helper: fetch with Supabase cache
    async function fetchCached(path: string, cacheKey: string, ttlMs: number) {
      const cached = await getCached(supabase, cacheKey, ttlMs)
      if (cached !== null) return cached
      const data = await apfFetch(path)
      if (data !== null) await setCache(supabase, cacheKey, data)
      return data
    }

    // Try to get Football-Data.org match for live events
    const fdMatchPromise = findFootballDataMatch(matchData.home_team, matchData.away_team, matchData.kickoff)

    const [statsRes, eventsRes, lineupsRes, oddsRes, formHomeRes, formAwayRes, h2hRes, predictionsRes, injuriesRes, fdMatch] = await Promise.all([
      fetchCached(`fixtures/statistics?fixture=${fixtureId}`, `match_${fixtureId}_stats`, TTL_LIVE_MS),
      fetchCached(`fixtures/events?fixture=${fixtureId}`, `match_${fixtureId}_events`, TTL_LIVE_MS),
      fetchCached(`fixtures/lineups?fixture=${fixtureId}`, `match_${fixtureId}_lineups`, TTL_LIVE_MS),
      // Pas de filtre bookmaker : on prend le premier disponible (gratuit)
      fetchCached(`odds?fixture=${fixtureId}`, `match_${fixtureId}_odds`, TTL_STATIC_MS),
      homeTeamId ? fetchCached(`fixtures?team=${homeTeamId}&last=5`, `match_${fixtureId}_form_home`, TTL_STATIC_MS) : Promise.resolve(null),
      awayTeamId ? fetchCached(`fixtures?team=${awayTeamId}&last=5`, `match_${fixtureId}_form_away`, TTL_STATIC_MS) : Promise.resolve(null),
      (homeTeamId && awayTeamId) ? fetchCached(`fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=5`, `match_${fixtureId}_h2h`, TTL_STATIC_MS) : Promise.resolve(null),
      fetchCached(`predictions?fixture=${fixtureId}`, `match_${fixtureId}_predictions`, TTL_STATIC_MS),
      fetchCached(`injuries?fixture=${fixtureId}`, `match_${fixtureId}_injuries`, TTL_STATIC_MS),
      fdMatchPromise,
    ])

    // Parser les cotes — chercher le bookmaker avec le plus de marchés
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

    // ── Fallback OddsPapi si API-Football n'a pas les cotes ──
    if (!detailedOdds || (!detailedOdds.home && !detailedOdds.draw && !detailedOdds.away)) {
      console.log(`[OddsPapi fallback] Fetching odds for ${matchData.home_team} vs ${matchData.away_team}`)
      const oddsPapiOdds = await getOddsPapiOdds(matchData.home_team, matchData.away_team, matchData.kickoff)
      if (oddsPapiOdds) {
        detailedOdds = oddsPapiOdds
        console.log(`[OddsPapi] Successfully retrieved odds`)
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

    // Use Football-Data.org events if available (live score + events), otherwise API-Football
    if (fdMatch) {
      events = parseFootballDataEvents(fdMatch, matchData.home_team, matchData.away_team)

      // Update score from Football-Data if match is live/done
      if (fdMatch.score) {
        const fdScore = getFootballDataScore(fdMatch)
        if (fdScore && fdScore.home !== null) {
          matchData.home_score = fdScore.home
        }
        if (fdScore && fdScore.away !== null) {
          matchData.away_score = fdScore.away
        }
      }
    } else if (eventsRes) {
      // Fallback to API-Football events
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

    // ── Pronostics ──
    if (predictionsRes && predictionsRes.length > 0) {
      const p = predictionsRes[0]
      predictions = {
        winner: {
          name: p.predictions?.winner?.name ?? null,
          comment: p.predictions?.winner?.comment ?? null,
        },
        percent: {
          home: p.predictions?.percent?.home ?? "0%",
          draw: p.predictions?.percent?.draw ?? "0%",
          away: p.predictions?.percent?.away ?? "0%",
        },
        advice: p.predictions?.advice ?? "",
      }
    }

    // ── Blessés/Suspendus ──
    if (injuriesRes && injuriesRes.length > 0) {
      const homeInjuries: { player: string; reason: string; type: string }[] = []
      const awayInjuries: { player: string; reason: string; type: string }[] = []
      for (const inj of injuriesRes as {
        player: { name: string }
        reason: string
        type: string
        team: { id: number }
      }[]) {
        const entry = {
          player: inj.player.name,
          reason: inj.reason ?? "",
          type: inj.type ?? "",
        }
        if (inj.team.id === homeTeamId) homeInjuries.push(entry)
        else awayInjuries.push(entry)
      }
      injuries = { home: homeInjuries, away: awayInjuries }
    }
  }

  // Mettre à jour les vraies cotes 1X2 dans la table matches (pour le dashboard)
  if (fixtureId && detailedOdds && detailedOdds.home && detailedOdds.draw && detailedOdds.away) {
    const matchId = `apf-${fixtureId}`
    supabase.from("matches").update({
      odds_1: detailedOdds.home,
      odds_n: detailedOdds.draw,
      odds_2: detailedOdds.away,
    }).eq("id", matchId).then(() => {})
  }

  // Nettoyer les champs internes avant d'envoyer au client
  if (matchData) {
    const { _homeTeamId: _h, _awayTeamId: _a, ...cleanMatch } = matchData as Record<string, unknown>
    void _h; void _a
    matchData = cleanMatch
  }

  return NextResponse.json({ match: matchData, stats, events, lineups, detailedOdds, allBets, formHome, formAway, h2h, predictions, injuries })
}
