import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// Auto-create tables if they don't exist
async function ensureTables() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        subscription JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS live_events_sent (
        key TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `,
  }).then(() => {
    // silently ignore if rpc not available — tables may already exist
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { subscription: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  if (!body.subscription) {
    return NextResponse.json({ error: "Subscription manquante" }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Try to create tables (will silently fail if exec_sql rpc doesn't exist)
  try {
    await ensureTables()
  } catch {
    // tables likely already exist
  }

  // Delete any existing subscription for this user and upsert new one
  try {
    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)

    const { error } = await admin
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        subscription: body.subscription,
      })

    if (error) {
      console.error("[push/subscribe] insert error:", error)
      return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 })
    }
  } catch (err) {
    console.error("[push/subscribe] error:", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { subscription?: unknown }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const query = admin.from("push_subscriptions").delete().eq("user_id", user.id)

    // If subscription object provided, match on endpoint within JSONB
    if (body.subscription && typeof body.subscription === "object") {
      const sub = body.subscription as Record<string, unknown>
      if (sub.endpoint) {
        query.filter("subscription->>'endpoint'", "eq", sub.endpoint as string)
      }
    }

    const { error } = await query
    if (error) {
      console.error("[push/subscribe DELETE] error:", error)
      return NextResponse.json({ error: "Erreur suppression" }, { status: 500 })
    }
  } catch (err) {
    console.error("[push/subscribe DELETE] error:", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
