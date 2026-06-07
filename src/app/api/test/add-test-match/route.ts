import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const TEAMS = [
  { name: "PSG", code: "PSG" },
  { name: "Olympique Lyonnais", code: "OL" },
  { name: "Marseille", code: "OM" },
  { name: "Monaco", code: "ASM" },
  { name: "Lille", code: "LOSC" },
  { name: "Manchester United", code: "MU" },
  { name: "Manchester City", code: "MC" },
  { name: "Liverpool", code: "LFC" },
  { name: "Real Madrid", code: "RM" },
  { name: "Barcelona", code: "FCB" },
  { name: "Bayern Munich", code: "FCB" },
  { name: "Borussia Dortmund", code: "BVB" },
  { name: "Juventus", code: "JUV" },
  { name: "Inter Milan", code: "INT" },
]

const COMPETITIONS = [
  { key: "L1", name: "Ligue 1", color: "#4F46E5" },
  { key: "PL", name: "Premier League", color: "#3B82F6" },
  { key: "LIGA", name: "La Liga", color: "#EF4444" },
  { key: "BL", name: "Bundesliga", color: "#F59E0B" },
  { key: "SA", name: "Serie A", color: "#8B5CF6" },
]

export async function POST() {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Pick random teams
    const homeTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    let awayTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    while (awayTeam.code === homeTeam.code) {
      awayTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    }

    // Pick random competition
    const competition = COMPETITIONS[Math.floor(Math.random() * COMPETITIONS.length)]

    // Generate random odds (realistic range)
    const odds1 = parseFloat((Math.random() * 2 + 1.5).toFixed(2)) // 1.5 - 3.5
    const oddsN = parseFloat((Math.random() * 1 + 2.5).toFixed(2)) // 2.5 - 3.5
    const odds2 = parseFloat((Math.random() * 2 + 1.5).toFixed(2)) // 1.5 - 3.5

    // Set kickoff for today at a random time (between 15:00 and 21:00)
    const kickoff = new Date()
    kickoff.setHours(15 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0)

    // Generate unique ID
    const matchId = `test_${Date.now()}`

    // Insert match
    const { data, error } = await admin
      .from("matches")
      .insert({
        id: matchId,
        competition: competition.key,
        competition_name: competition.name,
        competition_color: competition.color,
        home_team: homeTeam.name,
        away_team: awayTeam.name,
        home_team_code: homeTeam.code,
        away_team_code: awayTeam.code,
        state: "soon",
        kickoff: kickoff.toISOString(),
        odds_1: odds1,
        odds_n: oddsN,
        odds_2: odds2,
      })
      .select()

    if (error) {
      console.error("Error inserting test match:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      match: data?.[0] ?? {
        id: matchId,
        competition: competition.key,
        home_team: homeTeam.name,
        away_team: awayTeam.name,
        kickoff: kickoff.toISOString(),
        odds_1: odds1,
        odds_n: oddsN,
        odds_2: odds2,
      },
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
