import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/teams/list?limit=100&offset=0
 * List all team logos with pagination
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "100")
  const offset = parseInt(searchParams.get("offset") || "0")
  const leagueId = searchParams.get("league")

  const supabase = await createClient()

  try {
    let query = supabase
      .from("team_logos")
      .select("id, team_name, team_code, logo_url, league_ids, updated_at")
      .order("team_name", { ascending: true })
      .range(offset, offset + limit - 1)

    if (leagueId) {
      query = query.contains("league_ids", [leagueId])
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      teams: data || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
