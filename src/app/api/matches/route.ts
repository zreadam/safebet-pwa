import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/matches
 *
 * Sert UNIQUEMENT depuis le cache Supabase — aucun appel externe.
 * Tous les appels API (The Odds API + API-Football) se font dans
 * le cron /api/cron/refresh-matches à 3h du matin.
 *
 * Effectue des transitions d'état basées sur l'heure :
 *   soon → live  : dès que le coup d'envoi est passé
 *   live → done  : 130 min après le coup d'envoi (corrigé par /api/livescore si match en cours)
 */

// ⚠️ REMOVED: DEMO_MATCHES avec cotes par défaut
// Les matchs doivent provenir UNIQUEMENT de la BDD (Supabase)

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const now = new Date()

  const windowStart = new Date(now.getTime() - 3 * 3600_000).toISOString()
  const windowEnd   = new Date(now.getTime() + 8 * 86400_000).toISOString()

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .gte("kickoff", windowStart)
    .lte("kickoff", windowEnd)
    .not("id", "like", "test_%")  // Exclude test matches from homepage
    .order("kickoff", { ascending: true })

  if (!matches || matches.length === 0) {
    return NextResponse.json([])
  }

  /* ── Transitions d'état basées sur l'heure (0 appel API externe) ── */
  const stateUpdates: { id: string; state: "live" | "done" }[] = []

  const result = matches.map(m => {
    const kickoffTime = new Date(m.kickoff).getTime()
    const ageMin = (now.getTime() - kickoffTime) / 60_000
    let { state } = m

    if (state === "soon" && kickoffTime <= now.getTime()) {
      state = "live"
      stateUpdates.push({ id: m.id, state: "live" })
    } else if (state === "live" && ageMin > 130) {
      // 130 min après coup d'envoi → probablement terminé
      // /api/livescore corrige si le match est encore en cours (prolongations, etc.)
      state = "done"
      stateUpdates.push({ id: m.id, state: "done" })
    }

    return { ...m, state }
  })

  /* ── Mise à jour silencieuse des états (fire-and-forget) ── */
  if (stateUpdates.length > 0) {
    Promise.all(
      stateUpdates.map(u =>
        supabase.from("matches").update({ state: u.state }).eq("id", u.id).then(() => {})
      )
    ).catch(() => {})
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  })
}
