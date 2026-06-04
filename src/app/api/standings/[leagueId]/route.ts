import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Mapping leagueId keys → API-Football league IDs
// Seules les compétitions avec un classement tabulaire sont listées ici.
const LEAGUE_MAP: Record<string, number> = {
  L1:   61,   // Ligue 1
  PL:   39,   // Premier League
  LIGA: 140,  // La Liga
  BL:   78,   // Bundesliga
  SA:   135,  // Serie A
  ERE:  88,   // Eredivisie
  LPT:  94,   // Liga Portugal
  STL:  203,  // Süper Lig
  UCL:  2,    // Ligue des Champions (phase de groupes)
  EL:   3,    // Europa League
  ECL:  848,  // Conference League
  LIB:  13,   // Copa Libertadores
  CA:   9,    // Copa América
}

interface StandingRow {
  rank: number
  team: string
  team_id: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  form: string
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params
  const apiLeagueId = LEAGUE_MAP[leagueId]

  if (!apiLeagueId) {
    return NextResponse.json({ error: "Ligue non supportée" }, { status: 400 })
  }

  const supabase = await createClient()
  const cacheKey = `standings_${leagueId}`

  // Check cache
  const { data: cached } = await supabase
    .from("match_cache")
    .select("data, updated_at")
    .eq("key", cacheKey)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }
  }

  if (!FOOTBALL_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/standings?league=${apiLeagueId}&season=2025`,
      {
        headers: { "x-apisports-key": FOOTBALL_API_KEY },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: "API indisponible" }, { status: 502 })
    }

    const json = await res.json()
    const league = json.response?.[0]?.league
    if (!league) {
      return NextResponse.json({ standings: [], leagueName: "" })
    }

    const rawStandings = league.standings?.[0] ?? []

    const standings: StandingRow[] = rawStandings.map((s: {
      rank: number
      team: { id: number; name: string }
      all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
      goalsDiff: number
      points: number
      form: string
    }) => ({
      rank: s.rank,
      team: s.team.name,
      team_id: s.team.id,
      played: s.all.played,
      won: s.all.win,
      drawn: s.all.draw,
      lost: s.all.lose,
      goals_for: s.all.goals.for,
      goals_against: s.all.goals.against,
      goal_diff: s.goalsDiff,
      points: s.points,
      form: s.form ?? "",
    }))

    const result = { standings, leagueName: league.name }

    // Store in cache
    await supabase.from("match_cache").upsert({
      key: cacheKey,
      data: result,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
