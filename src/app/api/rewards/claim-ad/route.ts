import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MAX_CLAIMS_PER_DAY = 10 // Limite pour éviter l'abus
const CLAIM_RESET_HOUR = 0 // Réinitialisation à minuit

export async function POST(req: Request) {
  try {
    const { bluffs } = await req.json()

    // Validation
    if (!Number.isInteger(bluffs) || bluffs < 5 || bluffs > 15) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur n'est pas premium
    if (profile.tier === "premium") {
      return NextResponse.json({ error: "Les utilisateurs premium ne peuvent pas voir les pubs" }, { status: 403 })
    }

    // Vérifier les limites quotidiennes via une table de rate-limiting
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CLAIM_RESET_HOUR, 0, 0)
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const { data: claims } = await supabase
      .from("ad_claims")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", todayEnd.toISOString())

    if ((claims?.length ?? 0) >= MAX_CLAIMS_PER_DAY) {
      return NextResponse.json(
        { error: `Limite quotidienne atteinte (${MAX_CLAIMS_PER_DAY} pubs/jour)` },
        { status: 429 }
      )
    }

    // Ajouter les bluffs
    const newBalance = profile.balance + bluffs
    const { data: updated } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id)
      .select()
      .single()

    // Enregistrer le claim
    await supabase
      .from("ad_claims")
      .insert({
        user_id: user.id,
        bluffs,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({
      ok: true,
      newBalance,
      message: `+${bluffs} bluffs gagnés !`,
    })

  } catch (error) {
    console.error("Error claiming ad reward:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
