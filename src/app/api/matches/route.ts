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

const DEMO_MATCHES = [
  {
    id: "demo-1", competition: "CDM", competition_name: "Coupe du Monde", competition_color: "#C9A227",
    home_team: "France", away_team: "Brésil", home_team_code: "FRA", away_team_code: "BRA",
    home_score: null, away_score: null, state: "soon",
    kickoff: new Date(Date.now() + 2 * 3600_000).toISOString(),
    odds_1: 2.10, odds_n: 3.40, odds_2: 3.50,
    odds_updated_at: new Date().toISOString(), is_premium: false,
  },
  {
    id: "demo-2", competition: "LIB", competition_name: "Copa Libertadores", competition_color: "#1a3a5e",
    home_team: "River Plate", away_team: "Boca Juniors", home_team_code: "RIV", away_team_code: "BOC",
    home_score: null, away_score: null, state: "soon",
    kickoff: new Date(Date.now() + 5 * 3600_000).toISOString(),
    odds_1: 2.05, odds_n: 3.55, odds_2: 3.40,
    odds_updated_at: new Date().toISOString(), is_premium: false,
  },
]

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
    .order("kickoff", { ascending: true })

  if (!matches || matches.length === 0) {
    return NextResponse.json(DEMO_MATCHES)
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

  return NextResponse.json(result)
}
