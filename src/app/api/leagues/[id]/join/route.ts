import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { code } = body // optional invite code for private leagues

  const { data: league } = await supabase.from("leagues").select("*").eq("id", id).single()
  if (!league) return NextResponse.json({ error: "Ligue introuvable" }, { status: 404 })

  if (league.is_private) {
    const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single()
    if (profile?.tier !== "premium") {
      return NextResponse.json({ error: "Premium requis pour rejoindre une ligue privée" }, { status: 403 })
    }
    if (code && league.invite_code !== code) {
      return NextResponse.json({ error: "Code d'invitation invalide" }, { status: 403 })
    }
  }

  const admin = getAdmin()
  const { error } = await admin.from("league_members")
    .insert({ league_id: id, user_id: user.id })

  if (error?.code === "23505") return NextResponse.json({ error: "Déjà membre" }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Activity log (admin bypass RLS)
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()
  await admin.from("league_activity").insert({
    league_id: id,
    text: `${profile?.username ?? "Un joueur"} a rejoint la ligue`,
    emoji: "👋",
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdmin()
  await admin.from("league_members").delete().eq("league_id", id).eq("user_id", user.id)
  return NextResponse.json({ ok: true })
}
