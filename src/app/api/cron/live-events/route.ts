import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendPushToAll } from "@/app/api/push/send/push-helper"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const CRON_SECRET = process.env.CRON_SECRET

// 28 authorized competitions (must match refresh-matches.ts)
const ALLOWED_COMPETITIONS = new Set([
  "L1", "PL", "LIGA", "BL", "SA", "ERE", "LPT", "STL",
  "CDRF", "FAC", "CC", "CDR", "SCES", "DFBP", "CI", "SCIT", "TRCH",
  "UCL", "EL", "ECL",
  "CDM", "EURO", "NL", "CAN", "LIB", "CWC", "CA", "CIC", "AMICAL",
])

// Map API-Football league IDs to our internal competition codes
const LEAGUE_TO_COMP: Record<number, string> = {
  39: "PL",    // Premier League
  61: "LIGA",  // La Liga
  78: "BL",    // Bundesliga
  135: "SA",   // Serie A
  37: "L1",    // Ligue 1
  88: "ERE",   // Eredivisie
  64: "LPT",   // Liga Portugal
  203: "STL",  // Süper Lig
  2: "CDM",    // World Cup
  4: "EURO",   // Euro
  3: "NL",     // Nations League
  33: "CAN",   // African Cup
  71: "LIB",   // Copa Libertadores
  72: "CA",    // Copa America
  // Add more as needed
}

interface FixtureTeam {
  id: number
  name: string
  logo: string
}

interface FixtureGoals {
  home: number | null
  away: number | null
}

interface FixtureStatus {
  short: string
  elapsed: number | null
}

interface FixtureInfo {
  id: number
  date: string
  status: FixtureStatus
}

interface FixtureTeams {
  home: FixtureTeam
  away: FixtureTeam
}

interface Fixture {
  fixture: FixtureInfo
  teams: FixtureTeams
  goals: FixtureGoals
  league: { name: string }
}

interface FixtureEvent {
  time: { elapsed: number }
  team: { name: string }
  player: { name: string }
  assist: { name: string | null }
  type: string
  detail: string
}

const LIVE_STATUSES = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]
const DONE_STATUSES = ["FT", "AET", "PEN"]

function buildEventMessage(
  type: string,
  player: string,
  team: string,
  minute: number,
  assist?: string | null,
  score?: string
): { title: string; body: string } | null {
  if (type === "Goal") {
    return {
      title: `⚽ BUT ! ${team}`,
      body: `${player} marque à la ${minute}' — Score: ${score ?? ""}`,
    }
  }
  if (type === "Yellow Card") {
    return {
      title: `🟨 Carton jaune`,
      body: `${player} (${team}) à la ${minute}'`,
    }
  }
  if (type === "Red Card") {
    return {
      title: `🟥 Carton rouge !`,
      body: `${player} (${team}) expulsé à la ${minute}'`,
    }
  }
  if (type === "subst") {
    return {
      title: `🔄 Remplacement — ${team}`,
      body: `↑ ${assist ?? "?"} remplace ${player} (${minute}')`,
    }
  }
  return null
}

async function fetchFootball(path: string): Promise<unknown> {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { "x-apisports-key": FOOTBALL_API_KEY! },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API-Football ${path} → ${res.status}`)
  return res.json()
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!FOOTBALL_API_KEY) {
    return NextResponse.json({ error: "FOOTBALL_API_KEY manquante" }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const stats = { notifs_sent: 0, errors: [] as string[] }

  // ── 1. REMOVED: Live fixture events (buts, cartons, etc.) are no longer sent
  // We now only send notifications for:
  // - 15 minutes before match starts
  // - When match ends (with final result)
  // - Bet settlement notifications (from settle-bets cron)

  // ── 2. Check for fixtures starting in 3-30 minutes ────────────────
  // Send notification with the ACTUAL number of minutes until kickoff
  try {
    const in3min = new Date(now.getTime() + 3 * 60 * 1000)
    const in30min = new Date(now.getTime() + 30 * 60 * 1000)
    const todayStr = now.toISOString().slice(0, 10)

    const soonData = await fetchFootball(`/fixtures?date=${todayStr}&status=NS`) as { response: Fixture[] }
    const soonFixtures = soonData.response ?? []

    for (const f of soonFixtures) {
      const kickoff = new Date(f.fixture.date)
      if (kickoff >= in3min && kickoff <= in30min) {
        // Calculate actual minutes until kickoff
        const minutesUntilKickoff = Math.round((kickoff.getTime() - now.getTime()) / (60 * 1000))
        const key = `soon_${f.fixture.id}_${minutesUntilKickoff}min`
        const { data: existing } = await admin
          .from("live_events_sent")
          .select("key")
          .eq("key", key)
          .maybeSingle()

        if (!existing) {
          const homeTeam = f.teams.home.name
          const awayTeam = f.teams.away.name
          const kickoffTime = kickoff.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })

          try {
            await sendPushToAll({
              title: `⏰ Match dans ${minutesUntilKickoff} minute${minutesUntilKickoff > 1 ? 's' : ''}`,
              body: `${homeTeam} – ${awayTeam} à ${kickoffTime}`,
              icon: "/logo.png",
              data: { matchId: String(f.fixture.id) },
            })
            stats.notifs_sent++
            await admin.from("live_events_sent").insert({ key, created_at: now.toISOString() })
          } catch (err) {
            stats.errors.push(`soon-notif-${f.fixture.id}: ${err}`)
          }
        }
      }
    }
  } catch (err) {
    stats.errors.push(`soon-check: ${err}`)
  }

  // ── 2b. Check for fixtures starting in < 1 minute ──────────────────
  // Send urgent notification when match is about to start
  try {
    const in1min = new Date(now.getTime() + 1 * 60 * 1000)
    const todayStr = now.toISOString().slice(0, 10)

    const urgentData = await fetchFootball(`/fixtures?date=${todayStr}&status=NS`) as { response: Fixture[] }
    const urgentFixtures = urgentData.response ?? []

    for (const f of urgentFixtures) {
      const kickoff = new Date(f.fixture.date)
      if (kickoff >= now && kickoff < in1min) {
        const key = `urgent_${f.fixture.id}_kickoff`
        const { data: existing } = await admin
          .from("live_events_sent")
          .select("key")
          .eq("key", key)
          .maybeSingle()

        if (!existing) {
          const homeTeam = f.teams.home.name
          const awayTeam = f.teams.away.name
          const kickoffTime = kickoff.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })

          try {
            await sendPushToAll({
              title: `🏁 Match commence maintenant !`,
              body: `${homeTeam} – ${awayTeam} à ${kickoffTime}`,
              icon: "/logo.png",
              data: { matchId: String(f.fixture.id) },
            })
            stats.notifs_sent++
            await admin.from("live_events_sent").insert({ key, created_at: now.toISOString() })
          } catch (err) {
            stats.errors.push(`urgent-notif-${f.fixture.id}: ${err}`)
          }
        }
      }
    }
  } catch (err) {
    stats.errors.push(`urgent-check: ${err}`)
  }

  // ── 3. Check for finished matches ────────────────────────────────
  // We now only send notifications when matches end (not during the match)
  try {
    const { data: matches } = await admin
      .from("matches")
      .select("id, home_team, away_team, home_score, away_score, state")
      .eq("state", "done")
      .is("notif_sent", null) // Only for matches we haven't notified yet

    if (matches && matches.length > 0) {
      for (const match of matches) {
        const ftKey = `ft_${match.id}`
        try {
          const { data: existing } = await admin
            .from("live_events_sent")
            .select("key")
            .eq("key", ftKey)
            .maybeSingle()

          if (!existing) {
            await sendPushToAll({
              title: `🏁 Match terminé`,
              body: `${match.home_team} ${match.home_score ?? 0} – ${match.away_score ?? 0} ${match.away_team}`,
              icon: "/logo.png",
              data: { matchId: String(match.id) },
            })
            stats.notifs_sent++
            await admin.from("live_events_sent").insert({ key: ftKey, created_at: now.toISOString() })
          }
        } catch (err) {
          stats.errors.push(`ft-${match.id}: ${err}`)
        }
      }
    }
  } catch (err) {
    stats.errors.push(`finished-matches: ${err}`)
  }

  // ── 4. Cleanup old live_events_sent (> 24h) ─────────────────────
  try {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    await admin.from("live_events_sent").delete().lt("created_at", cutoff)
  } catch (err) {
    stats.errors.push(`cleanup: ${err}`)
  }

  console.log(`[cron live-events] notifs:${stats.notifs_sent} errors:${stats.errors.length}`)

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    notifs_sent: stats.notifs_sent,
    errors: stats.errors,
  })
}
