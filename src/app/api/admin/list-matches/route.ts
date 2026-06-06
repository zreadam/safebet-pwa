import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * GET /api/admin/list-matches
 *
 * Liste tous les matchs dans la base de données
 */

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Configuration manquante" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: matches, error } = await supabase
      .from("matches")
      .select("id, home_team, away_team, competition, kickoff, state")
      .order("kickoff", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        total: matches?.length || 0,
        matches: matches || []
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[list-matches] Error:", error)
    return NextResponse.json(
      { error: "Erreur" },
      { status: 500 }
    )
  }
}
