import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// Code promo → tier premium à vie (pas d'expiration)
const PROMO_CODES: Record<string, { tier: "premium" }> = {
  "SAFEBET2026": { tier: "premium" },
  "FOUNDER100":  { tier: "premium" },
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: "Code manquant" }, { status: 400 })

  const promo = PROMO_CODES[String(code).trim().toUpperCase()]
  if (!promo) return NextResponse.json({ error: "Code invalide" }, { status: 404 })

  // Mettre à jour le tier via service role (contourne RLS)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from("profiles")
    .update({ tier: promo.tier })
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, tier: promo.tier })
}
