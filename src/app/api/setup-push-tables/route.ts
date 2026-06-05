import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Execute SQL directly using admin API
    const { data, error } = await admin.rpc("exec_sql", {
      sql: `
        DROP TABLE IF EXISTS push_subscriptions CASCADE;

        CREATE TABLE push_subscriptions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          subscription JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
        ON push_subscriptions(user_id);
      `,
    })

    console.log("[setup-push-tables] rpc result:", { data, error })

    if (error) {
      // If exec_sql RPC doesn't exist, try using SQL directly
      console.log("[setup-push-tables] exec_sql not available, trying direct SQL")

      // Use the management API instead
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("[setup-push-tables] alternative method response:", response.status)

      return NextResponse.json({
        ok: false,
        message: "Table setup attempted",
        error: error?.message,
      })
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Tables push_subscriptions créées avec succès !",
      data,
    })
  } catch (err) {
    console.error("[setup-push-tables] Error:", err)
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erreur création tables"
      },
      { status: 500 }
    )
  }
}
