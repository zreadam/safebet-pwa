import { NextResponse } from "next/server"

/**
 * Test API-Football connection
 * GET /api/teams/test
 */
export async function GET() {
  const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY

  if (!FOOTBALL_API_KEY) {
    return NextResponse.json({ error: "FOOTBALL_API_KEY not set" }, { status: 400 })
  }

  try {
    console.log("Testing API-Football with key:", FOOTBALL_API_KEY.substring(0, 10) + "...")

    // Test with Premier League (league 39)
    const res = await fetch(
      `https://v3.football.api-sports.io/teams?league=39&season=2024`,
      {
        headers: { "x-apisports-key": FOOTBALL_API_KEY },
      }
    )

    const data = await res.json()

    return NextResponse.json({
      statusCode: res.status,
      statusOk: res.ok,
      response: {
        count: data.response?.length || 0,
        sample: data.response?.slice(0, 3) || [],
      },
      errors: data.errors || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
