import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/matches/create-demo
 *
 * Crée des matchs de démonstration pour tester l'application
 * avec des données réalistes et des cotes variées.
 */

export async function POST() {
  try {
    const supabase = await createClient()
    const now = new Date()

    // Créer des matchs amicaux réalistes sur les prochains jours
    const demoMatches = [
      {
        id: `demo-${Date.now()}-1`,
        competition: "CDM",
        competition_name: "Coupe du Monde",
        home_team: "France",
        away_team: "Espagne",
        home_team_code: "FRA",
        away_team_code: "ESP",
        home_score: null,
        away_score: null,
        state: "soon",
        kickoff: new Date(now.getTime() + 2 * 3600_000).toISOString(),
        minute: null,
        odds_1: 2.10,
        odds_n: 3.25,
        odds_2: 3.50,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      },
      {
        id: `demo-${Date.now()}-2`,
        competition: "UCL",
        competition_name: "Ligue des Champions",
        home_team: "Manchester City",
        away_team: "Real Madrid",
        home_team_code: "MCI",
        away_team_code: "RMA",
        home_score: null,
        away_score: null,
        state: "soon",
        kickoff: new Date(now.getTime() + 5 * 3600_000).toISOString(),
        minute: null,
        odds_1: 1.95,
        odds_n: 3.40,
        odds_2: 3.80,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      },
      {
        id: `demo-${Date.now()}-3`,
        competition: "EL",
        competition_name: "Europa League",
        home_team: "AS Roma",
        away_team: "Olympique Lyonnais",
        home_team_code: "ASR",
        away_team_code: "OL",
        home_score: null,
        away_score: null,
        state: "soon",
        kickoff: new Date(now.getTime() + 8 * 3600_000).toISOString(),
        minute: null,
        odds_1: 2.30,
        odds_n: 3.10,
        odds_2: 3.20,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      },
      {
        id: `demo-${Date.now()}-4`,
        competition: "ECL",
        competition_name: "Conference League",
        home_team: "Fiorentina",
        away_team: "Genoa",
        home_team_code: "FIO",
        away_team_code: "GEN",
        home_score: null,
        away_score: null,
        state: "soon",
        kickoff: new Date(now.getTime() + 24 * 3600_000).toISOString(),
        minute: null,
        odds_1: 1.88,
        odds_n: 3.50,
        odds_2: 4.00,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      },
      {
        id: `demo-${Date.now()}-5`,
        competition: "Bundesliga",
        competition_name: "Bundesliga",
        home_team: "Bayern Munich",
        away_team: "Borussia Dortmund",
        home_team_code: "FCB",
        away_team_code: "BVB",
        home_score: null,
        away_score: null,
        state: "soon",
        kickoff: new Date(now.getTime() + 30 * 3600_000).toISOString(),
        minute: null,
        odds_1: 1.85,
        odds_n: 3.60,
        odds_2: 4.20,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      },
    ]

    // Insérer les matchs
    const { data: inserted, error } = await supabase
      .from("matches")
      .insert(demoMatches)
      .select()

    if (error) {
      console.error("[create-demo] Insert error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      inserted: inserted?.length || 0,
      matches: inserted,
      message: `✅ ${inserted?.length || 0} matchs de démo créés avec succès!`,
    })
  } catch (error) {
    console.error("[create-demo] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création des matchs" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/matches/create-demo
 *
 * Affiche les instructions d'utilisation
 */
export async function GET() {
  return NextResponse.json({
    message: "POST /api/matches/create-demo pour créer des matchs de démo",
    instructions: [
      "1. Appelez POST /api/matches/create-demo",
      "2. Les matchs apparaîtront sur la page /paris après quelques secondes",
      "3. Testez les paris avec les matchs de démo",
    ],
    curl: `curl -X POST https://safebet-pwa.vercel.app/api/matches/create-demo`,
  })
}
