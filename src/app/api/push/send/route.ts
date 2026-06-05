import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendPushToAll } from "./push-helper"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, body: bodyText, icon, data } = body

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: "title et body sont requis" },
        { status: 400 }
      )
    }

    await sendPushToAll({
      title,
      body: bodyText,
      icon,
      data,
    })

    return NextResponse.json({ ok: true, message: "Notifications envoyées" })
  } catch (error) {
    console.error("[push/send] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications" },
      { status: 500 }
    )
  }
}

// GET pour test
export async function GET() {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Count subscribers
    const { count, error: countError } = await admin
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("[push/send] count error:", countError)
    }

    const subscriberCount = count ?? 0

    await sendPushToAll({
      title: "🎯 SafeBet - Test de notification",
      body: "Ceci est un message de test du système de notifications push !",
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%234F46E5' width='192' height='192'/><text x='50%' y='50%' font-size='120' fill='white' text-anchor='middle' dominant-baseline='middle'>⚽</text></svg>",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      subscribers: subscriberCount,
      message: `✅ Notification de test envoyée à ${subscriberCount} utilisateur${subscriberCount > 1 ? "s" : ""} abonnés`,
    })
  } catch (error) {
    console.error("[push/send test] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la notification de test" },
      { status: 500 }
    )
  }
}
