import webpush from "web-push"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, unknown>
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  // Initialize VAPID details at call time so env vars are available
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, subscription")

  if (error) {
    console.error("[sendPushToAll] fetch error:", error)
    return
  }

  if (!rows || rows.length === 0) return

  const message = JSON.stringify(payload)
  const staleIds: string[] = []

  await Promise.all(
    rows.map(async (row: { id: string; subscription: webpush.PushSubscription }) => {
      try {
        await webpush.sendNotification(row.subscription, message)
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        // 410 Gone or 404 Not Found = subscription expired
        if (statusCode === 410 || statusCode === 404) {
          staleIds.push(row.id)
        } else {
          console.error("[sendPushToAll] send error:", err)
        }
      }
    })
  )

  // Clean up stale subscriptions
  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds)
  }
}
