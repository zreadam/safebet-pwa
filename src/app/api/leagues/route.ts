import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdmin()

  // 1. Récupérer les IDs des ligues dont l'user est membre
  const { data: memberships } = await admin
    .from("league_members")
    .select("league_id")
    .eq("user_id", user.id)

  const joinedIds = (memberships ?? []).map((m: { league_id: string }) => m.league_id)

  // 2. Récupérer les détails de ces ligues + membres + activité
  let myLeagues: unknown[] = []
  if (joinedIds.length > 0) {
    const { data: leaguesData } = await admin
      .from("leagues")
      .select("*")
      .in("id", joinedIds)
      .order("created_at", { ascending: false })

    myLeagues = await Promise.all(
      (leaguesData ?? []).map(async (league: Record<string, unknown>) => {
        // Membres avec profil
        const { data: membersData } = await admin
          .from("league_members")
          .select("user_id, profiles(username, balance, avatar_color)")
          .eq("league_id", league.id as string)

        const members = (membersData ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any, i: number) => ({
            user_id: m.user_id,
            username: m.profiles?.username ?? "?",
            avatar_color: m.profiles?.avatar_color ?? "#10B981",
            balance: m.profiles?.balance ?? 0,
            balance_change: 0,
            rank: i + 1,
            is_me: m.user_id === user.id,
          }))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .sort((a: any, b: any) => b.balance - a.balance)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any, i: number) => ({ ...m, rank: i + 1 }))

        // Activité récente
        const { data: activityData } = await admin
          .from("league_activity")
          .select("text, emoji, created_at")
          .eq("league_id", league.id as string)
          .order("created_at", { ascending: false })
          .limit(5)

        return {
          ...league,
          member_count: members.length,
          members,
          activity: activityData ?? [],
        }
      })
    )
  }

  // 3. Ligues publiques non rejointes
  const { data: publicLeagues } = await admin
    .from("leagues")
    .select("*")
    .eq("is_private", false)
    .not("id", "in", joinedIds.length ? `(${joinedIds.join(",")})` : "(00000000-0000-0000-0000-000000000000)")
    .order("created_at", { ascending: false })
    .limit(20)

  return NextResponse.json({ myLeagues, publicLeagues: publicLeagues ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check premium for private leagues
  const body = await request.json()
  if (body.is_private) {
    const { data: profile } = await supabase
      .from("profiles").select("tier").eq("id", user.id).single()
    if (profile?.tier !== "premium") {
      return NextResponse.json({ error: "Premium requis pour les ligues privées" }, { status: 403 })
    }
  }

  const admin = getAdmin()

  // Créer la ligue (invite_code auto-généré par la DB)
  const { data: league, error } = await admin
    .from("leagues")
    .insert({
      name: body.name,
      color: body.color ?? "#10B981",
      emoji: body.emoji ?? "⚽",
      is_private: body.is_private ?? false,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Auto-join créateur + log activité (via admin pour bypass RLS)
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()
  await admin.from("league_members").insert({ league_id: league.id, user_id: user.id })
  await admin.from("league_activity").insert({
    league_id: league.id,
    text: `${profile?.username ?? "Un joueur"} a créé la ligue`,
    emoji: "🏆",
  })

  return NextResponse.json(league)
}
