import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdmin()

  const { data: league } = await admin
    .from("leagues").select("*").eq("id", id).single()
  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: members } = await admin
    .from("league_members")
    .select("user_id, joined_at, profiles(username, balance, avatar_color)")
    .eq("league_id", id)

  const { data: activity } = await admin
    .from("league_activity")
    .select("*")
    .eq("league_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Build ranked member list
  const ranked = (members ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => ({
      user_id: m.user_id,
      username: m.profiles?.username ?? "?",
      balance: m.profiles?.balance ?? 0,
      avatar_color: m.profiles?.avatar_color ?? "#10B981",
      is_me: m.user_id === user.id,
      balance_change: 0,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => b.balance - a.balance)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any, i: number) => ({ ...m, rank: i + 1 }))

  // Formater l'activité avec time_ago
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedActivity = (activity ?? []).map((a: any) => {
    const diff = Date.now() - new Date(a.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    const time_ago = days > 0 ? `Il y a ${days}j` : hours > 0 ? `Il y a ${hours}h` : mins > 0 ? `Il y a ${mins}min` : "À l'instant"
    return { id: a.id, emoji: a.emoji ?? "📌", text: a.text, time_ago }
  })

  return NextResponse.json({
    ...league,
    members: ranked,
    member_count: ranked.length,
    is_creator: league.created_by === user.id,
    activity: formattedActivity,
  })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdmin()
  const { data: league } = await admin.from("leagues").select("created_by").eq("id", id).single()
  if (league?.created_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await admin.from("leagues").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
