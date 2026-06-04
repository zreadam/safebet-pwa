import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendPushToAll } from "@/app/api/push/send/push-helper"

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY
const CRON_SECRET = process.env.CRON_SECRET

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

  // ── 1. Fetch live fixtures ───────────────────────────────────────
  let liveFixtures: Fixture[] = []
  try {
    const liveData = await fetchFootball("/fixtures?live=all") as { response: Fixture[] }
    liveFixtures = (liveData.response ?? []).slice(0, 5)
  } catch (err) {
    stats.errors.push(`live-fetch: ${err}`)
    return NextResponse.json({ ok: false, stats })
  }

  // ── 2. Check for fixtures starting in ~15 minutes ────────────────
  try {
    const in15min = new Date(now.getTime() + 15 * 60 * 1000)
    const in20min = new Date(now.getTime() + 20 * 60 * 1000)
    const todayStr = now.toISOString().slice(0, 10)

    const soonData = await fetchFootball(`/fixtures?date=${todayStr}&status=NS`) as { response: Fixture[] }
    const soonFixtures = soonData.response ?? []

    for (const f of soonFixtures) {
      const kickoff = new Date(f.fixture.date)
      if (kickoff >= in15min && kickoff <= in20min) {
        const key = `soon_${f.fixture.id}_15min`
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
              title: `⏰ Match dans 15 minutes`,
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

  // ── 3. Process live fixture events ──────────────────────────────
  for (const fixture of liveFixtures) {
    const fixtureId = fixture.fixture.id
    const homeTeam = fixture.teams.home.name
    const awayTeam = fixture.teams.away.name
    const score = `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`

    // Check FT notification
    const statusShort = fixture.fixture.status.short
    if (DONE_STATUSES.includes(statusShort)) {
      const ftKey = `ft_${fixtureId}`
      try {
        const { data: existing } = await admin
          .from("live_events_sent")
          .select("key")
          .eq("key", ftKey)
          .maybeSingle()

        if (!existing) {
          await sendPushToAll({
            title: `🏁 Match terminé`,
            body: `${homeTeam} ${fixture.goals.home ?? 0} – ${fixture.goals.away ?? 0} ${awayTeam}`,
            icon: "/logo.png",
            data: { matchId: String(fixtureId) },
          })
          stats.notifs_sent++
          await admin.from("live_events_sent").insert({ key: ftKey, created_at: now.toISOString() })
        }
      } catch (err) {
        stats.errors.push(`ft-${fixtureId}: ${err}`)
      }
      continue
    }

    if (!LIVE_STATUSES.includes(statusShort)) continue

    // Fetch events for this fixture
    let events: FixtureEvent[] = []
    try {
      const eventsData = await fetchFootball(`/fixtures/events?fixture=${fixtureId}`) as { response: FixtureEvent[] }
      events = eventsData.response ?? []
    } catch (err) {
      stats.errors.push(`events-${fixtureId}: ${err}`)
      continue
    }

    for (const event of events) {
      const eventType = event.type
      const minute = event.time.elapsed
      const team = event.team.name
      const player = event.player.name
      const assist = event.assist?.name ?? null

      const key = `event_${fixtureId}_${minute}_${eventType}_${team}`

      try {
        const { data: existing } = await admin
          .from("live_events_sent")
          .select("key")
          .eq("key", key)
          .maybeSingle()

        if (existing) continue

        const msg = buildEventMessage(eventType, player, team, minute, assist, score)
        if (!msg) continue

        await sendPushToAll({
          ...msg,
          icon: "/logo.png",
          data: {
            matchId: String(fixtureId),
            matchUrl: `/match/${fixtureId}`,
          },
        })
        stats.notifs_sent++
        await admin.from("live_events_sent").insert({ key, created_at: now.toISOString() })
      } catch (err) {
        stats.errors.push(`event-${key}: ${err}`)
      }
    }

    // Check lineups available (fixture is live but check if lineup key was sent)
    const lineupKey = `lineup_${fixtureId}`
    try {
      const { data: lineupSent } = await admin
        .from("live_events_sent")
        .select("key")
        .eq("key", lineupKey)
        .maybeSingle()

      if (!lineupSent) {
        const lineupsData = await fetchFootball(`/fixtures/lineups?fixture=${fixtureId}`) as { response: unknown[] }
        if ((lineupsData.response ?? []).length > 0) {
          await sendPushToAll({
            title: `📋 Compositions disponibles`,
            body: `${homeTeam} – ${awayTeam} : les compositions sont publiées`,
            icon: "/logo.png",
            data: { matchId: String(fixtureId), matchUrl: `/match/${fixtureId}` },
          })
          stats.notifs_sent++
          await admin.from("live_events_sent").insert({ key: lineupKey, created_at: now.toISOString() })
        }
      }
    } catch (err) {
      stats.errors.push(`lineup-${fixtureId}: ${err}`)
    }
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
