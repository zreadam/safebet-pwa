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

  // Support both old format (single bet) and new format (bet slip with multiple selections)
  const isNewFormat = body.selections && Array.isArray(body.selections)

  if (isNewFormat) {
    // New format: BetSlip with multiple selections
    const { type, selections, stake, total_odds } = body

    if (!stake || stake <= 0) {
      return NextResponse.json({ error: "Mise invalide" }, { status: 400 })
    }

    if (!selections || selections.length === 0) {
      return NextResponse.json({ error: "Aucune sélection" }, { status: 400 })
    }

    // Verify all matches are not done
    const matchIds = selections.map((s: any) => s.matchId)
    const { data: matches } = await supabase
      .from("matches")
      .select("id, state")
      .in("id", matchIds)

    const doneMatches = (matches ?? []).filter((m: any) => m.state === "done")
    if (doneMatches.length > 0) {
      return NextResponse.json({ error: "Un ou plusieurs matchs sont déjà terminés" }, { status: 400 })
    }

    // Place all bets (simple or combo)
    const betGroupId = `${user.id}-${Date.now()}`
    const betsToInsert = selections.map((sel: any) => ({
      user_id: user.id,
      match_id: sel.matchId,
      prediction: sel.selectionLabel,
      market: sel.market,
      market_label: sel.marketLabel,
      odds: sel.odds,
      amount: type === "simple" ? stake : stake, // For combo, stake is per bet
      status: "pending",
      placed_at: new Date().toISOString(),
      bet_group_id: type === "combo" ? betGroupId : null,
      is_combo: type === "combo",
      total_combo_odds: type === "combo" ? total_odds : null,
    }))

    const { data: insertedBets, error: insertError } = await supabase
      .from("bets")
      .insert(betsToInsert)
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Deduct stake from balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single()

    const newBalance = (profile?.balance ?? 0) - stake
    await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id)

    // Update quest
    try {
      await supabase.rpc("increment_quest", {
        p_user_id: user.id,
        p_quest_key: "daily_bets",
        p_period: new Date().toISOString().slice(0, 10),
      })
    } catch { /* ignore */ }

    return NextResponse.json({
      bets: insertedBets,
      balance: newBalance,
      bet_group_id: type === "combo" ? betGroupId : null
    })
  } else {
    // Old format: single bet
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
}
