import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Endpoint one-shot pour créer les tables manquantes
// Appeler une fois : GET /api/setup-tables?secret=CRON_SECRET
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: Record<string, string> = {}

  // Test si push_subscriptions existe déjà
  const { error: psError } = await admin.from("push_subscriptions").select("id").limit(1)
  results.push_subscriptions = psError ? `missing (${psError.message})` : "ok"

  // Test si live_events_sent existe déjà
  const { error: leError } = await admin.from("live_events_sent").select("key").limit(1)
  results.live_events_sent = leError ? `missing (${leError.message})` : "ok"

  // Test si match_cache existe déjà
  const { error: mcError } = await admin.from("match_cache").select("key").limit(1)
  results.match_cache = mcError ? `missing (${mcError.message})` : "ok"

  return NextResponse.json({
    ok: true,
    results,
    sql_to_run: `
-- Colle ce SQL dans ton dashboard Supabase si les tables manquent :

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

CREATE TABLE IF NOT EXISTS match_cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
    `.trim()
  })
}
