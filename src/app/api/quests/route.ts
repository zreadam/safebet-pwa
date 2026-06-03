import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { QUEST_DEFINITIONS } from "@/lib/quests"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const weekKey = getWeekKey()

  const { data: profile } = await supabase
    .from("profiles").select("tier, total_bets, won_bets, streak").eq("id", user.id).single()

  const { data: progress } = await supabase
    .from("quest_progress")
    .select("*")
    .eq("user_id", user.id)

  const progressMap: Record<string, { progress: number; is_done: boolean }> = {}
  for (const p of progress ?? []) {
    const key = `${p.quest_key}:${p.period_key ?? "once"}`
    progressMap[key] = { progress: p.progress, is_done: p.is_done }
  }

  const quests = QUEST_DEFINITIONS.map(q => {
    const periodKey = q.type === "daily" ? today : q.type === "weekly" ? weekKey : "once"
    const pKey = `${q.key}:${periodKey}`
    const p = progressMap[pKey]
    const isPremiumTier = profile?.tier === "premium"
    const condTotal = isPremiumTier ? q.total_premium : q.total_free

    // Auto-complete profile quest
    if (q.key === "profile_complete") {
      return { ...q, total: condTotal, progress: condTotal, is_done: !!(p?.is_done), reset_in: undefined }
    }

    return {
      ...q,
      total: condTotal,
      progress: p?.progress ?? 0,
      is_done: p?.is_done ?? false,
      reset_in: q.type === "daily" ? getResetIn("day") : q.type === "weekly" ? getResetIn("week") : undefined,
    }
  })

  return NextResponse.json(quests)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { quest_key } = await request.json()
  const quest = QUEST_DEFINITIONS.find(q => q.key === quest_key)
  if (!quest) return NextResponse.json({ error: "Quête inconnue" }, { status: 404 })

  const today = new Date().toISOString().slice(0, 10)
  const periodKey = quest.type === "daily" ? today : quest.type === "weekly" ? getWeekKey() : "once"

  const { data: existing } = await supabase
    .from("quest_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("quest_key", quest_key)
    .eq("period_key", periodKey)
    .single()

  if (existing?.is_done) return NextResponse.json({ error: "Déjà complétée" }, { status: 409 })

  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single()
  const total = profile?.tier === "premium" ? quest.total_premium : quest.total_free

  await supabase.from("quest_progress").upsert({
    user_id: user.id,
    quest_key,
    period_key: periodKey,
    progress: total,
    is_done: true,
    rewarded_at: new Date().toISOString(),
  }, { onConflict: "user_id,quest_key,period_key" })

  // Credit reward — fallback to manual update if RPC not available
  try {
    await supabase.rpc("add_balance" as never, { p_user_id: user.id, p_amount: quest.reward })
  } catch {
    const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).single()
    if (data) {
      await supabase.from("profiles").update({ balance: (data.balance ?? 0) + quest.reward }).eq("id", user.id)
    }
  }

  return NextResponse.json({ reward: quest.reward })
}

function getWeekKey(): string {
  const d = new Date()
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`
}

function getResetIn(unit: "day" | "week"): string {
  const now = new Date()
  if (unit === "day") {
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000)
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    return `${h}h ${m}min`
  }
  // week: next Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7))
  monday.setHours(0, 0, 0, 0)
  const days = Math.ceil((monday.getTime() - now.getTime()) / 86400000)
  return `${days}j`
}
