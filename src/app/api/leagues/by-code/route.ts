import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: "Code manquant" }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: league } = await admin
    .from("leagues")
    .select("id, name, emoji, color, is_private")
    .eq("invite_code", code)
    .single()

  if (!league) return NextResponse.json({ error: "Code invalide" }, { status: 404 })
  return NextResponse.json(league)
}
