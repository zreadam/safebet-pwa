import { NextResponse } from "next/server"
import { createClient as createAnonClient } from "@supabase/supabase-js"

const ODDSPAPI_KEY = process.env.ODDSPAPI_KEY

async function fetchOddsPapiMatches() {
  if (!ODDSPAPI_KEY) return []

  const matches: object[] = []
  const ODDSPAPI_COMP_MAP: Record<string, string> = {
    "premier-league": "PL",
    "la-liga": "LIGA",
    "serie-a": "SA",
    "ligue-1": "L1",
    "bundesliga": "BL",
    "liga-portugal": "LPT",
    "eredivisie": "ERE",
    "super-lig": "STL",
  }

  const COMP_META: Record<string, { name: string; color: string }> = {
    AMICAL: { name: "Match Amical", color: "#8B5CF6" },
  }

  try {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    const tomorrow = new Date(now.getTime() + 86400_000).toISOString().split("T")[0]

    const res = await fetch(
      `https://api.oddspapi.io/v1/matches?dateFrom=${dateStr}&dateTo=${tomorrow}`,
      {
        headers: { "X-API-Key": ODDSPAPI_KEY },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      console.log("[load-amical] OddsPapi API returned non-OK status")
      return []
    }

    const data = await res.json()
    const allMatches = data.matches ?? []

    console.log(`[load-amical] Found ${allMatches.length} matches from OddsPapi`)

    for (const m of allMatches) {
      const compId = m.competition?.id?.toLowerCase() || ""
      let compCode = ODDSPAPI_COMP_MAP[compId]

      // Si pas de compétition officielle, c'est un match amical
      if (!compCode) {
        compCode = "AMICAL"
      }

      if (compCode !== "AMICAL") {
        continue
      }

      const meta = COMP_META[compCode]
      const kickoff = new Date(m.kickoff)
      const state = kickoff <= now ? (m.status === "ended" ? "done" : "live") : "soon"

      let homeScore: number | null = null
      let awayScore: number | null = null

      if (m.score) {
        if (typeof m.score.home === "number") homeScore = m.score.home
        if (typeof m.score.away === "number") awayScore = m.score.away
      }

      matches.push({
        id: `oddspapi-${m.id}`,
        competition: compCode,
        competition_name: meta.name,
        competition_color: meta.color,
        home_team: m.homeTeam?.name || "?",
        away_team: m.awayTeam?.name || "?",
        home_team_code: m.homeTeam?.name
          ?.replace(/[^a-zA-Z ]/g, "")
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase() || "?",
        away_team_code: m.awayTeam?.name
          ?.replace(/[^a-zA-Z ]/g, "")
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase() || "?",
        home_score: homeScore,
        away_score: awayScore,
        state,
        kickoff: m.kickoff,
        minute: state === "live" && m.minute ? `${m.minute}'` : null,
        odds_1: null,
        odds_n: null,
        odds_2: null,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      })
    }

    console.log(`[load-amical] Filtered to ${matches.length} AMICAL matches`)
    return matches
  } catch (e) {
    console.error("[load-amical] Error fetching OddsPapi:", e)
    return []
  }
}

export async function POST(req: Request) {
  try {
    // Récupérer les matchs amicaux
    const matches = await fetchOddsPapiMatches()

    if (matches.length === 0) {
      return NextResponse.json(
        { ok: true, inserted: 0, message: "Aucun match amical trouvé pour aujourd'hui" },
        { status: 200 }
      )
    }

    // Utiliser la clé anon + fonction RPC pour insérer
    const anonClient = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    )

    const { data, error } = await anonClient.rpc("load_amical_matches", {
      p_matches: matches,
    })

    if (error) {
      console.error("[load-amical] RPC error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const insertedCount = data?.[0]?.inserted_count || 0

    return NextResponse.json(
      {
        ok: true,
        inserted: insertedCount,
        matches_fetched: matches.length,
        message: `✅ ${insertedCount} matchs amicaux chargés avec succès`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[load-amical] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des matchs" },
      { status: 500 }
    )
  }
}
