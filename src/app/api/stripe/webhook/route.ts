import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set")
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" })
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const sig  = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.user_id
    const plan    = session.metadata?.plan
    if (!userId) return NextResponse.json({ ok: true })

    const premiumUntil = plan === "season"
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from("profiles").update({
      tier: "premium",
      premium_until: premiumUntil,
    }).eq("id", userId)

    // Credit 150B premium bonus
    const { data: prof } = await supabase.from("profiles").select("balance").eq("id", userId).single()
    if (prof) {
      await supabase.from("profiles").update({ balance: prof.balance + 150 }).eq("id", userId)
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription
    const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
    const userId = customer.metadata?.user_id
    if (userId) {
      await supabase.from("profiles").update({ tier: "free", premium_until: null }).eq("id", userId)
    }
  }

  return NextResponse.json({ ok: true })
}
