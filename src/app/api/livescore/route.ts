import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

interface LiveMatch {
  id: number
  home: string
  away: string
  home_score: number | null
  away_score: number | null
  minute: string | null
  competition: string
  competition_id: number
}

export async function GET() {
  const supabase = await createClient()

  // Check Supabase cache first
  const { data: cached } = await supabase
    .from("match_cache")
    .select("data, updated_at")
    .eq("key", "livescore")
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }
  }

  // Fetch live matches from API-Football
  if (!FOOTBALL_API_KEY) {
    return NextResponse.json({ matches: [], error: "API key not configured" })
  }

  try {
    const res = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: { "x-apisports-key": FOOTBALL_API_KEY },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json({ matches: [] })
    }

    const json = await res.json()
    const fixtures = json.response ?? []

    const matches: LiveMatch[] = fixtures.map((f: {
      fixture: { id: number; status: { elapsed: number | null } }
      teams: { home: { name: string }; away: { name: string } }
      goals: { home: number | null; away: number | null }
      league: { name: string; id: number }
    }) => ({
      id: f.fixture.id,
      home: f.teams.home.name,
      away: f.teams.away.name,
      home_score: f.goals.home,
      away_score: f.goals.away,
      minute: f.fixture.status.elapsed ? `${f.fixture.status.elapsed}'` : null,
      competition: f.league.name,
      competition_id: f.league.id,
    }))

    const result = { matches }

    // Store in cache
    await supabase.from("match_cache").upsert({
      key: "livescore",
      data: result,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ matches: [] })
  }
}
