import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/teams/logo?name=PSG&code=PSG
 * Returns logo URL for a team by name or code
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamName = searchParams.get("name")
  const teamCode = searchParams.get("code")

  if (!teamName && !teamCode) {
    return NextResponse.json(
      { error: "Missing query: name or code" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    let query = supabase
      .from("team_logos")
      .select("id, team_name, team_code, logo_url")
      .limit(1)

    if (teamName) {
      // Case-insensitive search
      query = query.ilike("team_name", `%${teamName}%`)
    } else if (teamCode) {
      query = query.ilike("team_code", `%${teamCode}%`)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      // Return default team icon if not found
      return NextResponse.json(
        {
          found: false,
          teamName: teamName || teamCode,
          logo_url: null,
          message: "Team not found in database",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      found: true,
      id: data.id,
      team_name: data.team_name,
      team_code: data.team_code,
      logo_url: data.logo_url,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
