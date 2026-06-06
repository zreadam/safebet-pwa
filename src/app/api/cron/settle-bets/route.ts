import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendPushToAll } from "@/app/api/push/send/push-helper"

const CRON_SECRET = process.env.CRON_SECRET

interface Bet {
  id: string
  user_id: string
  match_id: string
  match_label: string
  market: string
  selection: string
  odds: number
  stake: number
  potential_gain: number
  status: "pending" | "won" | "lost" | "void"
  placed_at: string
}

interface Match {
  id: string
  state: "live" | "soon" | "done"
  home_score?: number
  away_score?: number
  home_team: string
  away_team: string
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const stats = { notifs_sent: 0, bets_updated: 0, errors: [] as string[] }

  try {
    // ── 1. Get all pending bets ────────────────────────────────────
    const { data: pendingBets, error: betsError } = await admin
      .from("bets")
      .select("*")
      .eq("status", "pending")

    if (betsError) throw new Error(`Failed to fetch bets: ${betsError.message}`)

    if (!pendingBets || pendingBets.length === 0) {
      return NextResponse.json({ ok: true, stats })
    }

    // ── 2. For each bet, check if the match is finished ─────────────
    for (const bet of pendingBets as Bet[]) {
      try {
        // Fetch match data
        const { data: matchData, error: matchError } = await admin
          .from("matches")
          .select("*")
          .eq("id", bet.match_id)
          .single()

        if (matchError || !matchData) {
          stats.errors.push(`match-not-found: ${bet.match_id}`)
          continue
        }

        const match = matchData as Match

        // Skip if match is not finished
        if (match.state !== "done") continue

        // ── 3. Simulate bet evaluation (simplified) ────────────────
        // In a real scenario, you'd have complex logic to evaluate bets
        // For now, we'll just mark bets as won/lost randomly for demo

        const homeScore = match.home_score ?? 0
        const awayScore = match.away_score ?? 0
        const finalScore = `${homeScore}-${awayScore}`

        // Simplified: check if selection matches any simple outcome
        let newStatus: "won" | "lost" | "void" = "lost"
        let notifTitle = "😔 Pari perdu"
        let notifBody = `${bet.match_label} — ${finalScore} • ${bet.selection}`

        // Example logic: if bet selection is "1" and home team won
        if (bet.selection === "1" && homeScore > awayScore) {
          newStatus = "won"
          notifTitle = "🎉 Pari gagné !"
          notifBody = `${bet.match_label} — ${finalScore} • +${bet.potential_gain.toFixed(0)} B`
        }
        // If bet selection is "2" and away team won
        else if (bet.selection === "2" && awayScore > homeScore) {
          newStatus = "won"
          notifTitle = "🎉 Pari gagné !"
          notifBody = `${bet.match_label} — ${finalScore} • +${bet.potential_gain.toFixed(0)} B`
        }
        // If bet selection is "X" and it's a draw
        else if (bet.selection === "X" && homeScore === awayScore) {
          newStatus = "won"
          notifTitle = "🎉 Pari gagné !"
          notifBody = `${bet.match_label} — ${finalScore} • +${bet.potential_gain.toFixed(0)} B`
        }

        // ── 4. Update bet status ───────────────────────────────────
        const { error: updateError } = await admin
          .from("bets")
          .update({
            status: newStatus,
            settled_at: now.toISOString(),
          })
          .eq("id", bet.id)

        if (updateError) {
          stats.errors.push(`update-bet-${bet.id}: ${updateError.message}`)
          continue
        }

        stats.bets_updated++

        // ── 5. Send notification to user ────────────────────────────
        try {
          await sendPushToAll({
            title: notifTitle,
            body: notifBody,
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%234F46E5' width='192' height='192'/><text x='50%' y='50%' font-size='120' fill='white' text-anchor='middle' dominant-baseline='middle'>⚽</text></svg>",
            data: {
              type: "bet_result",
              betId: bet.id,
              matchId: bet.match_id,
              status: newStatus,
              timestamp: now.toISOString(),
            },
          })
          stats.notifs_sent++
        } catch (notifErr) {
          stats.errors.push(`notif-${bet.id}: ${notifErr}`)
        }
      } catch (err) {
        stats.errors.push(`bet-process-${bet.id}: ${err}`)
      }
    }
  } catch (err) {
    console.error("[cron settle-bets] Error:", err)
    stats.errors.push(`general: ${err}`)
  }

  console.log(
    `[cron settle-bets] bets_updated:${stats.bets_updated} notifs_sent:${stats.notifs_sent} errors:${stats.errors.length}`
  )

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    bets_updated: stats.bets_updated,
    notifs_sent: stats.notifs_sent,
    errors: stats.errors,
  })
}
