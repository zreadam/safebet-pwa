import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { match_id, match_label, market, selection, odds, stake, is_live } = body

  if (!stake || stake <= 0) {
    return NextResponse.json({ error: "Mise invalide" }, { status: 400 })
  }

  // Vérifier que le match n'est pas terminé
  const { data: matchRow } = await supabase
    .from("matches")
    .select("state")
    .eq("id", match_id)
    .single()
  if (matchRow?.state === "done") {
    return NextResponse.json({ error: "Ce match est déjà terminé" }, { status: 400 })
  }

  const { data, error } = await supabase.rpc("place_bet", {
    p_user_id: user.id,
    p_match_id: match_id,
    p_match_label: match_label,
    p_market: market,
    p_selection: selection,
    p_odds: odds,
    p_stake: stake,
    p_is_live: is_live ?? false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Récupérer le nouveau solde
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single()

  // Best-effort quest progress update
  try {
    await supabase.rpc("increment_quest", {
      p_user_id: user.id,
      p_quest_key: "daily_bets",
      p_period: new Date().toISOString().slice(0, 10),
    })
  } catch { /* ignore */ }

  return NextResponse.json({ ...data, balance: profile?.balance ?? null })
}
