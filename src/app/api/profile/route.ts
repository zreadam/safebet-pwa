import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const allowed = ["username", "avatar_color", "avatar_url", "country", "favorite_team", "favorite_competitions"]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (!Object.keys(updates).length) return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })

  // Username uniqueness check
  if (updates.username) {
    const { data: existing } = await supabase
      .from("profiles").select("id").eq("username", updates.username as string).neq("id", user.id).single()
    if (existing) return NextResponse.json({ error: "Ce pseudo est déjà pris" }, { status: 409 })
  }

  const { data, error } = await supabase
    .from("profiles").update(updates).eq("id", user.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
