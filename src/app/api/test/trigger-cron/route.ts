/**
 * Test endpoint — déclenche le cron refresh-matches
 * À SUPPRIMER après test !
 *
 * Usage: curl https://safebet-pwa.vercel.app/api/test/trigger-cron?mode=normal
 * Modes:
 *   - normal: appel le cron normalement
 *   - force-fallback: force le fallback Football-Data en ignorant The Odds API
 */

import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const ODDS_API_KEY = process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY

const ALLOWED_COMPETITIONS = new Set([
  "L1", "PL", "LIGA", "BL", "SA", "ERE", "LPT", "STL",
  "CDRF", "FAC", "CC", "CDR", "DFBP", "CI",
  "UCL", "EL", "ECL",
  "CDM", "EURO", "NL", "CAN", "LIB", "CA",
])

const COMP_META: Record<string, { name: string; color: string }> = {
  L1: { name: "Ligue 1", color: "#1C2951" },
  PL: { name: "Premier League", color: "#3d195b" },
  LIGA: { name: "La Liga", color: "#e01a22" },
  BL: { name: "Bundesliga", color: "#e01a22" },
  SA: { name: "Serie A", color: "#0067b1" },
  ERE: { name: "Eredivisie", color: "#FF6900" },
  LPT: { name: "Liga Portugal", color: "#006600" },
  STL: { name: "Süper Lig", color: "#E30A17" },
  CDRF: { name: "Coupe de France", color: "#003399" },
  FAC: { name: "FA Cup", color: "#C8102E" },
  CC: { name: "Carabao Cup", color: "#004D26" },
  CDR: { name: "Copa del Rey", color: "#AA151B" },
  DFBP: { name: "DFB Pokal", color: "#000000" },
  CI: { name: "Coppa Italia", color: "#009246" },
  UCL: { name: "Ligue des Champions", color: "#0a1a5e" },
  EL: { name: "Europa League", color: "#F97316" },
  ECL: { name: "Conference League", color: "#006400" },
  CDM: { name: "Coupe du Monde", color: "#C9A227" },
  EURO: { name: "Euro UEFA", color: "#003399" },
  NL: { name: "Ligue des Nations", color: "#003399" },
  CAN: { name: "CAN", color: "#008751" },
  LIB: { name: "Copa Libertadores", color: "#1a3a5e" },
  CA: { name: "Copa América", color: "#C8102E" },
}

function makeTeamCode(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, "").split(" ").filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase()
}

function makeMatchId(homeTeam: string, awayTeam: string, kickoff: string): string {
  const date = kickoff.split("T")[0]
  const home = homeTeam.replace(/[^a-z0-9]/gi, "").slice(0, 5).toLowerCase()
  const away = awayTeam.replace(/[^a-z0-9]/gi, "").slice(0, 5).toLowerCase()
  return `${date}-${home}-${away}`
}

async function fetchFootballDataMatches(now: Date) {
  if (!FOOTBALL_DATA_KEY) return []

  const matches: object[] = []
  const FD_COMP_MAP: Record<string, string> = {
    PL: "PL", BL1: "BL", SA: "SA", FL1: "L1", PPDA: "LPT", PD: "LIGA",
    ED: "ERE", "TR1": "STL", CL: "UCL", EL: "EL", ECL: "ECL",
    WC: "CDM", EC: "EURO", "UNL": "NL", CAN: "CAN",
    Copa: "CA", LIB: "LIB",
  }

  try {
    const dateStr = now.toISOString().split("T")[0]
    const tomorrow = new Date(now.getTime() + 86400_000).toISOString().split("T")[0]

    const res = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${dateStr}&dateTo=${tomorrow}`,
      {
        headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
        cache: "no-store",
      }
    )

    if (!res.ok) return []

    const data = await res.json()
    const allMatches = data.matches ?? []

    for (const m of allMatches) {
      const compCode = FD_COMP_MAP[m.competition?.code]
      if (!compCode || !ALLOWED_COMPETITIONS.has(compCode)) continue

      const meta = COMP_META[compCode]
      const kickoff = new Date(m.utcDate)
      const state = kickoff <= now ? "live" : "soon"

      matches.push({
        id: makeMatchId(m.homeTeam.name, m.awayTeam.name, m.utcDate),
        competition: compCode,
        competition_name: meta.name,
        competition_color: meta.color,
        home_team: m.homeTeam.name,
        away_team: m.awayTeam.name,
        home_team_code: makeTeamCode(m.homeTeam.name),
        away_team_code: makeTeamCode(m.awayTeam.name),
        home_score: m.score?.fullTime?.home ?? null,
        away_score: m.score?.fullTime?.away ?? null,
        state,
        kickoff: m.utcDate,
        minute: m.status === "IN_PLAY" ? m.currentMatchDay ?? null : null,
        odds_1: 2.00,
        odds_n: 3.25,
        odds_2: 3.50,
        odds_updated_at: now.toISOString(),
        is_premium: false,
      })
    }

    return matches
  } catch (e) {
    console.error("[test] Football-Data.org error:", e)
    return []
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("mode") || "normal"

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const result = { ok: false, message: "", matches: 0 }

  try {
    console.log(`[test cron] Mode: ${mode}`)

    let fdMatches: object[] = []

    if (mode === "force-fallback") {
      // Force fallback Football-Data
      console.log("[test cron] Force fallback Football-Data.org")
      fdMatches = await fetchFootballDataMatches(now)
      if (fdMatches.length > 0) {
        await admin.from("matches").upsert(fdMatches, { onConflict: "id" })
        result.ok = true
        result.message = `Fallback Football-Data: ${fdMatches.length} matchs insérés`
        result.matches = fdMatches.length
      } else {
        result.message = "Football-Data.org: aucun match trouvé"
      }
    } else {
      // Mode normal: juste tester si Football-Data.org peut être appelé
      fdMatches = await fetchFootballDataMatches(now)
      result.ok = true
      result.message = `Test Football-Data.org: ${fdMatches.length} matchs disponibles`
      result.matches = fdMatches.length

      // Afficher les premiers matchs
      if (fdMatches.length > 0) {
        console.log("[test cron] Premiers matchs Football-Data:", fdMatches.slice(0, 3))
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[test cron] Error:", error)
    result.message = `Erreur: ${error}`
    return NextResponse.json(result, { status: 500 })
  }
}
