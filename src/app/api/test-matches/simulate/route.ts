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
      // Get all matches to check combo bet results
      const { data: allMatches } = await supabase
        .from("matches")
        .select("id, home_score, away_score")

      const matchResults: Record<string, string> = {}
      if (allMatches) {
        for (const m of allMatches) {
          const res = m.home_score! > m.away_score! ? "1" : m.home_score! < m.away_score! ? "2" : "N"
          matchResults[m.id] = res
        }
      }

      // Track balance updates per user
      const balanceUpdates: Record<string, number> = {}

      for (const bet of bets) {
        let isWon = false

        if (bet.bet_group_id) {
          // COMBO BET: Check if ALL bets in group are winning
          const { data: groupBets } = await supabase
            .from("bets")
            .select("id, match_id, selection")
            .eq("bet_group_id", bet.bet_group_id)

          isWon = (groupBets ?? []).every(gb => {
            const matchResult = matchResults[gb.match_id] || "N"
            return gb.selection === matchResult
          })

          console.log(`[Combo Bet ${bet.id}] Group: All selections matched = ${isWon}`)
        } else {
          // SIMPLE BET: Check if selection matches result
          isWon = bet.selection === result
          console.log(`[Simple Bet ${bet.id}] Selection: ${bet.selection}, Result: ${result}, Won: ${isWon}`)
        }

        // Calculate amount
        let amountToCredit = isWon ? bet.potential_gain : 0

        // Update bet status
        await supabase
          .from("bets")
          .update({
            status: isWon ? "won" : "lost",
            settled_at: new Date().toISOString(),
          })
          .eq("id", bet.id)

        // Track balance update
        if (bet.user_id) {
          if (!balanceUpdates[bet.user_id]) {
            balanceUpdates[bet.user_id] = bet.profiles?.balance ?? 0
          }
          if (isWon) {
            balanceUpdates[bet.user_id] += amountToCredit
          }
        }
      }

      // Apply all balance updates
      for (const [userId, newBalance] of Object.entries(balanceUpdates)) {
        await supabase
          .from("profiles")
          .update({ balance: Math.max(0, newBalance) })
          .eq("id", userId)
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
