import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Authorize only admin
    if (user?.email !== "aziregue633@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      home_team,
      away_team,
      competition,
      competition_name,
      competition_color,
      odds_1,
      odds_n,
      odds_2,
      kickoff,
    } = body

    // Validate input
    if (!home_team || !away_team || !competition || !odds_1 || !odds_n || !odds_2 || !kickoff) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique ID
    const matchId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert match
    const { data, error } = await supabase
      .from("matches")
      .insert({
        id: matchId,
        competition,
        competition_name,
        competition_color: competition_color || "#10B981",
        home_team,
        away_team,
        home_team_code: home_team.slice(0, 3).toUpperCase(),
        away_team_code: away_team.slice(0, 3).toUpperCase(),
        state: "soon",
        kickoff,
        odds_1: parseFloat(odds_1),
        odds_n: parseFloat(odds_n),
        odds_2: parseFloat(odds_2),
      })
      .select()

    if (error) {
      console.error("Error creating match:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      match: data?.[0],
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
