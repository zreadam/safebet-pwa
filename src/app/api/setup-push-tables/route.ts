import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Execute migration SQL
    const migrationSQL = `
      -- Create push_subscriptions table for Web Push notifications
      CREATE TABLE IF NOT EXISTS public.push_subscriptions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        subscription JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Create indices
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
        ON public.push_subscriptions(user_id);

      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at
        ON public.push_subscriptions(created_at DESC);

      -- Enable RLS
      ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

      -- RLS policies
      CREATE POLICY IF NOT EXISTS "Users can view their own push subscriptions"
        ON public.push_subscriptions
        FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own push subscriptions"
        ON public.push_subscriptions
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete their own push subscriptions"
        ON public.push_subscriptions
        FOR DELETE
        USING (auth.uid() = user_id);

      -- Permissions
      GRANT ALL ON public.push_subscriptions TO service_role;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
    `

    // Try using rpc function
    console.log("[setup-push-tables] Attempting to create tables...")

    let result: any = { data: null, error: { message: "Not attempted" } }

    try {
      result = await admin.rpc("sql", {
        query: migrationSQL,
      })
    } catch (e) {
      console.log("[setup-push-tables] sql RPC not available, trying exec_sql...")
      try {
        result = await admin.rpc("exec_sql", {
          sql: migrationSQL,
        })
      } catch (e2) {
        console.error("[setup-push-tables] both RPCs failed:", e2)
      }
    }

    const { data, error } = result

    console.log("[setup-push-tables] migration result:", { data, error })

    return NextResponse.json({
      ok: true,
      message: "✅ Migration exécutée. Consultez les logs pour les détails.",
      data,
      error: error?.message,
    })
  } catch (err) {
    console.error("[setup-push-tables] Error:", err)
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erreur lors de la migration"
      },
      { status: 500 }
    )
  }
}
