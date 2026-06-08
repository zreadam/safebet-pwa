import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY

// List of major leagues to sync (season 2024/2025)
const LEAGUES_TO_SYNC = [
  { id: 39, name: "Premier League (EN)" },
  { id: 140, name: "La Liga (ES)" },
  { id: 135, name: "Serie A (IT)" },
  { id: 78, name: "Bundesliga (DE)" },
  { id: 61, name: "Ligue 1 (FR)" },
  { id: 848, name: "Liga NOS (PT)" },
  { id: 37, name: "Eredivisie (NL)" },
  { id: 179, name: "Serie A (BR)" },
  { id: 128, name: "La Liga (AR)" },
  { id: 253, name: "Saudi Pro League (SA)" },
  { id: 207, name: "MLS (US)" },
]

const SEASON = 2024

interface ApiTeam {
  team: {
    id: number
    name: string
    code: string | null
    logo: string | null
  }
}

async function fetchTeamsFromLeague(leagueId: number): Promise<ApiTeam[]> {
  if (!FOOTBALL_API_KEY) {
    console.error("FOOTBALL_API_KEY not set")
    return []
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${SEASON}`,
      {
        headers: { "x-apisports-key": FOOTBALL_API_KEY },
      }
    )

    if (!res.ok) {
      console.error(`Failed to fetch teams for league ${leagueId}:`, res.status)
      return []
    }

    const data = await res.json()
    return data.response || []
  } catch (error) {
    console.error(`Error fetching teams for league ${leagueId}:`, error)
    return []
  }
}

// Sync a single league
export async function syncLeague(leagueId: number, supabase: any) {
  const league = LEAGUES_TO_SYNC.find((l) => l.id === leagueId)
  if (!league) return { success: false, message: "League not found" }

  console.log(`Syncing ${league.name}...`)
  const teams = await fetchTeamsFromLeague(leagueId)

  let count = 0
  for (const apiTeam of teams) {
    const { team } = apiTeam
    if (!team.id || !team.name) continue

    try {
      const { error } = await supabase.from("team_logos").upsert(
        {
          id: team.id,
          team_name: team.name,
          team_code: team.code,
          logo_url: team.logo,
          league_ids: [leagueId.toString()],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

      if (!error) count++
    } catch (err) {
      console.error(`Error upserting team ${team.name}:`, err)
    }
  }

  return { success: true, league: league.name, teams: count }
}

export async function POST(request: Request) {
  // Verify admin
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { leagueId } = await request.json().catch(() => ({}))

  const supabase = await createClient()

  try {
    if (leagueId) {
      // Sync single league (fast path - < 60s)
      const result = await syncLeague(leagueId, supabase)
      return NextResponse.json(result)
    } else {
      // Sync all leagues - return immediately with instructions
      // The sync happens in background
      for (const league of LEAGUES_TO_SYNC) {
        syncLeague(league.id, supabase).catch((err) =>
          console.error(`Background sync error for league ${league.id}:`, err)
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: "Sync started in background for all leagues",
          instructions: "Each league syncs independently to avoid timeouts",
          checkStatus: "GET /api/teams/list to see progress",
        },
        { status: 202 } // 202 Accepted
      )
    }
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync teams", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get("league")

  const supabase = await createClient()

  try {
    let query = supabase
      .from("team_logos")
      .select("id, team_name, team_code, logo_url, league_ids")

    if (leagueId) {
      query = query.contains("league_ids", [leagueId])
    }

    const { data, error, count } = await query.limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      status: "ok",
      count: data?.length || 0,
      sample: data,
      message: "Use POST to sync teams by league",
      endpoints: {
        syncAllBackground: "POST /api/teams/sync-logos (starts async sync)",
        syncSingleLeague: "POST /api/teams/sync-logos {leagueId: 39}",
        listTeams: "GET /api/teams/list",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
