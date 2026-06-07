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
    const { match_id, home_score, away_score } = body

    if (!match_id || home_score === undefined || away_score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the match
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .single()

    if (matchError || !matchData) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Determine result
    let result: "1" | "N" | "2"
    if (home_score > away_score) {
      result = "1"
    } else if (away_score > home_score) {
      result = "2"
    } else {
      result = "N"
    }

    // Update match to done
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        state: "done",
        home_score,
        away_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Get all bets for this match
    const { data: bets } = await supabase
      .from("bets")
      .select("*, profiles(balance)")
      .eq("match_id", match_id)
      .neq("status", "settled")

    // Calculate winnings and settle bets
    if (bets && bets.length > 0) {
      for (const bet of bets) {
        let isWon = false

        // Check if bet is winning
        if (bet.selection === result) {
          isWon = true
        }

        // Calculate amount to credit/debit
        let amountToCredit = 0
        if (isWon) {
          amountToCredit = bet.stake * bet.odds
        } else {
          amountToCredit = 0 // Already deducted when bet was placed
        }

        // Update bet status
        await supabase
          .from("bets")
          .update({
            status: isWon ? "won" : "lost",
            settled_at: new Date().toISOString(),
          })
          .eq("id", bet.id)

        // Credit balance if won
        if (isWon && bet.user_id) {
          const currentBalance = bet.profiles?.balance ?? 0
          const newBalance = currentBalance + amountToCredit

          await supabase
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", bet.user_id)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      result,
      home_score,
      away_score,
      settled_bets: bets?.length ?? 0,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
