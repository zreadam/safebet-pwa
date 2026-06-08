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

export async function POST(request: Request) {
  // Verify admin (basic check - in production, use proper auth)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  let totalTeams = 0
  let errors = 0

  try {
    for (const league of LEAGUES_TO_SYNC) {
      console.log(`Fetching teams from ${league.name}...`)
      const teams = await fetchTeamsFromLeague(league.id)

      for (const apiTeam of teams) {
        const { team } = apiTeam
        if (!team.id || !team.name) continue

        try {
          // Upsert team into database
          const { error } = await supabase.from("team_logos").upsert(
            {
              id: team.id,
              team_name: team.name,
              team_code: team.code,
              logo_url: team.logo,
              league_ids: [league.id.toString()],
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )

          if (error) {
            console.error(`Error upserting team ${team.name}:`, error)
            errors++
          } else {
            totalTeams++
          }
        } catch (err) {
          console.error(`Exception upserting team ${team.name}:`, err)
          errors++
        }
      }

      // Rate limit: wait 1 second between league requests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return NextResponse.json(
      {
        success: true,
        message: `Synced ${totalTeams} teams`,
        errors,
        totalTeams,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync teams", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("team_logos")
      .select("id, team_name, team_code, logo_url, league_ids")
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      status: "ok",
      count: data?.length || 0,
      sample: data,
      message: "Use POST with admin token to sync all teams",
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
