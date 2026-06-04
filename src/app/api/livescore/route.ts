import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface LiveMatch {
  id: number
  home: string
  away: string
  home_score: number | null
  away_score: number | null
  minute: string | null
  competition: string
  competition_id: number
}

export async function GET() {
  const supabase = await createClient()
  const now = new Date()

  /* ── 1. Porte d'entrée : y a-t-il des matchs en cours ou sur le point de démarrer ?
     Si non → retourne vide sans consommer aucun appel API.
  ──────────────────────────────────────────────────────────────────────────────── */
  const soonThreshold = new Date(now.getTime() + 30 * 60_000).toISOString()
  const { data: activeCheck } = await supabase
    .from("matches")
    .select("id")
    .or(`state.eq.live,and(state.eq.soon,kickoff.lte.${soonThreshold})`)
    .limit(1)

  if (!activeCheck || activeCheck.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  /* ── 2. Cache Supabase (5 min) ─────────────────────────────────────────────── */
  const { data: cached } = await supabase
    .from("match_cache")
    .select("data, updated_at")
    .eq("key", "livescore")
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }
  }

  /* ── 3. Appel API-Football (uniquement si matchs actifs + cache expiré) ─────── */
  if (!FOOTBALL_API_KEY) {
    return NextResponse.json({ matches: [], error: "API key not configured" })
  }

  try {
    const res = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: { "x-apisports-key": FOOTBALL_API_KEY },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json({ matches: [] })
    }

    const json = await res.json()
    const fixtures = json.response ?? []

    const matches: LiveMatch[] = fixtures.map((f: {
      fixture: { id: number; status: { elapsed: number | null } }
      teams: { home: { name: string }; away: { name: string } }
      goals: { home: number | null; away: number | null }
      league: { name: string; id: number }
    }) => ({
      id: f.fixture.id,
      home: f.teams.home.name,
      away: f.teams.away.name,
      home_score: f.goals.home,
      away_score: f.goals.away,
      minute: f.fixture.status.elapsed ? `${f.fixture.status.elapsed}'` : null,
      competition: f.league.name,
      competition_id: f.league.id,
    }))

    const result = { matches }

    // Store in cache
    await supabase.from("match_cache").upsert({
      key: "livescore",
      data: result,
      updated_at: new Date().toISOString(),
    })

    // Persist live scores into the matches table so they survive quota exhaustion
    if (matches.length > 0) {
      try {
        const now = new Date()
        const { data: dbMatches } = await supabase
          .from("matches")
          .select("id, home_team, away_team, state, kickoff")
          .gte("kickoff", new Date(now.getTime() - 4 * 3600_000).toISOString())
          .lte("kickoff", now.toISOString())

        const norm = (s: string) =>
          s.toLowerCase()
            .replace(/\b(fc|cf|sc|ac|afc|fk|sk)\b/g, "")
            .replace(/[^a-z0-9]/g, "")

        const fits = (api: string, db: string) => {
          const a = norm(api), b = norm(db)
          return a === b || (a.length >= 4 && (a.includes(b.slice(0, 4)) || b.includes(a.slice(0, 4))))
        }

        const updates: PromiseLike<unknown>[] = []

        for (const lm of matches) {
          const found = (dbMatches ?? []).find(
            m => fits(lm.home, m.home_team) && fits(lm.away, m.away_team)
          )
          if (found) {
            updates.push(
              supabase.from("matches").update({
                state: "live",
                home_score: lm.home_score,
                away_score: lm.away_score,
                minute: lm.minute,
                odds_updated_at: now.toISOString(),
              }).eq("id", found.id).then(() => {})
            )
          }
        }

        // Mark matches not in live feed as done if kickoff > 100 min ago
        const cutoff = new Date(now.getTime() - 100 * 60 * 1000).toISOString()
        for (const m of (dbMatches ?? [])) {
          if (m.state !== "live") continue
          const stillLive = matches.some(lm => fits(lm.home, m.home_team) && fits(lm.away, m.away_team))
          if (!stillLive && m.kickoff < cutoff) {
            updates.push(supabase.from("matches").update({ state: "done" }).eq("id", m.id).then(() => {}))
          }
        }

        await Promise.all(updates)
      } catch { /* ne pas bloquer la réponse */ }
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ matches: [] })
  }
}
