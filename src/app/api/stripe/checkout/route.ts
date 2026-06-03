import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set")
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" })
}

export async function POST(request: Request) {
  const stripe = getStripe()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await request.json() // "monthly" | "season"
  const origin = new URL(request.url).origin

  const prices: Record<string, string> = {
    monthly: process.env.STRIPE_PRICE_MONTHLY!,
    season:  process.env.STRIPE_PRICE_SEASON!,
  }
  const priceId = prices[plan]
  if (!priceId) return NextResponse.json({ error: "Plan invalide" }, { status: 400 })

  // Fetch or create Stripe customer
  const { data: profile } = await supabase
    .from("profiles").select("stripe_customer_id, username").eq("id", user.id).single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: profile?.username,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: plan === "season" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/premium`,
    metadata: { user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
