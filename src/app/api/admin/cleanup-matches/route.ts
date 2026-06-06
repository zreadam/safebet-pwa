import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * DELETE /api/admin/cleanup-matches
 *
 * Supprime tous les faux matchs et matchs de démo de la base de données.
 * Identifie les matchs avec:
 * - IDs contenant "amical-" (test matches)
 * - Équipes nulles
 * - Données incomplètes
 */

export async function DELETE() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Configuration manquante (Supabase URL ou SERVICE_ROLE_KEY)" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Récupérer tous les matchs
    const { data: allMatches, error: fetchError } = await supabase
      .from("matches")
      .select("id, home_team, away_team, competition")

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Identifier les faux matchs:
    const fakeMatches = allMatches?.filter(m =>
      // IDs de test créés manuellement
      m.id?.startsWith("amical-") ||
      // Matchs avec équipes nulles ou vides
      !m.home_team ||
      !m.away_team
    ) || []

    if (fakeMatches.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Aucun faux match trouvé",
          totalMatches: allMatches?.length || 0,
          deletedCount: 0
        },
        { status: 200 }
      )
    }

    const fakeIds = fakeMatches.map(m => m.id)

    // Supprimer les faux matchs
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .in("id", fakeIds)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: `${fakeMatches.length} faux matchs supprimés`,
        deletedCount: fakeMatches.length,
        deletedIds: fakeIds,
        totalRemaining: (allMatches?.length || 0) - fakeMatches.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[cleanup-matches] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors du nettoyage" },
      { status: 500 }
    )
  }
}
