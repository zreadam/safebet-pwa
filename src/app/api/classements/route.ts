import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") ?? "balance" // "balance" | "pronostic"
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (type === "pronostic") {
    // Rank by win rate (won_bets / total_bets)
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_color, total_bets, won_bets, balance, tier")
      .gt("total_bets", 0)
      .order("won_bets", { ascending: false })
      .limit(limit)

    const ranked = (data ?? []).map((p: {
      id: string; username: string; avatar_color: string;
      total_bets: number; won_bets: number; balance: number; tier: string
    }, i: number) => ({
      ...p,
      rank: i + 1,
      win_rate: p.total_bets > 0 ? Math.round((p.won_bets / p.total_bets) * 100) : 0,
      score: p.won_bets,
      is_me: p.id === user.id,
    }))

    // Find current user's position if not in top
    const myRank = ranked.find(p => p.is_me)
    if (!myRank) {
      const { data: myProfile } = await supabase
        .from("profiles").select("id, username, avatar_color, total_bets, won_bets, balance, tier").eq("id", user.id).single()
      if (myProfile) ranked.push({ ...myProfile, rank: limit + 1, win_rate: 0, score: 0, is_me: true })
    }

    return NextResponse.json(ranked)
  }

  // Default: rank by balance
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_color, balance, tier, total_bets, won_bets")
    .order("balance", { ascending: false })
    .limit(limit)

  const ranked = (data ?? []).map((p: {
    id: string; username: string; avatar_color: string; balance: number; tier: string; total_bets: number; won_bets: number
  }, i: number) => ({
    ...p,
    rank: i + 1,
    win_rate: p.total_bets > 0 ? Math.round((p.won_bets / p.total_bets) * 100) : 0,
    is_me: p.id === user.id,
  }))

  return NextResponse.json(ranked)
}
