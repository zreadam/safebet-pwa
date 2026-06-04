"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import AppShell from "@/components/layout/AppShell"
import { MatchCard } from "@/components/match/MatchCard"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Match, Quest, League, LeagueMember } from "@/types"

/* ─────────────────────────── types ─────────────────────────── */
interface SelectedOdds {
  match: Match
  marketKey: string
  outcomeKey: string
  odds: number
  label: string
}

/* ──────────────────────── bet slip ──────────────────────────── */
function BetSlip({
  sel,
  onClose,
  onBetPlaced,
}: {
  sel: SelectedOdds
  onClose: () => void
  onBetPlaced?: (newBalance: number) => void
}) {
  const [stake, setStake] = useState(10)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const potentialGain = +(stake * sel.odds).toFixed(2)

  async function placeBet() {
    if (stake <= 0) { toast.error("La mise doit être supérieure à 0"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: sel.match.id,
          match_label: `${sel.match.home_team} – ${sel.match.away_team}`,
          market: sel.marketKey,
          selection: sel.outcomeKey,
          odds: sel.odds,
          stake,
          potential_gain: potentialGain,
          is_live: sel.match.state === "live",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors du pari")
        return
      }
      setSuccess(true)
      toast.success(`Pari de ${stake} B placé ! Gain potentiel : ${potentialGain} B 🎉`)
      if (data.balance !== undefined) onBetPlaced?.(data.balance)
      setTimeout(() => { onClose(); setSuccess(false) }, 1600)
    } catch {
      toast.error("Erreur réseau, réessaie")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[72px] w-full max-w-[430px] z-40 px-4 animate-slide-up">
      <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[16px]
                      shadow-[var(--shadow-modal)] p-4">
        {/* header */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-[13px] [font-family:var(--font-display)] text-[var(--fg-1)]">
            Ton pari
          </span>
          <button onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-3)]">
            <i className="ti ti-x text-[15px] text-[var(--fg-2)]" />
          </button>
        </div>

        {/* match + market */}
        <div className="bg-[var(--bg-2)] rounded-[10px] p-3 mb-3">
          <p className="text-[12px] text-[var(--fg-3)] mb-[2px]">{sel.label}</p>
          <p className="text-[13px] font-semibold text-[var(--fg-1)]">
            {sel.match.home_team} – {sel.match.away_team}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-[var(--fg-2)]">Sélection :</span>
            <span className="text-[11px] font-bold text-[var(--emerald-600)]">{sel.outcomeKey}</span>
            <span className="ml-auto text-[18px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
              {sel.odds.toFixed(2)}
            </span>
          </div>
        </div>

        {/* stake row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <label className="text-[11px] text-[var(--fg-3)] block mb-1">Mise (B)</label>
            <div className="flex items-center border border-[var(--border-light)] rounded-[10px] overflow-hidden">
              <button onClick={() => setStake(s => Math.max(1, s - 5))}
                      className="w-10 h-10 flex items-center justify-center bg-[var(--bg-2)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]">
                <i className="ti ti-minus text-[14px]" />
              </button>
              <input
                type="number"
                value={stake}
                min={1}
                onChange={e => setStake(Math.max(1, Number(e.target.value)))}
                className="flex-1 text-center font-bold text-[16px] [font-family:var(--font-display)]
                           bg-transparent outline-none text-[var(--fg-1)] py-2"
              />
              <button onClick={() => setStake(s => s + 5)}
                      className="w-10 h-10 flex items-center justify-center bg-[var(--bg-2)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]">
                <i className="ti ti-plus text-[14px]" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--fg-3)]">Gain potentiel</p>
            <p className="text-[20px] font-bold [font-family:var(--font-display)] text-[var(--emerald-500)]">
              {potentialGain} B
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={placeBet}
          disabled={loading || success}
          className={cn(
            "w-full py-3 rounded-[var(--radius-btn)] font-bold text-[15px] [font-family:var(--font-display)]",
            "transition-all duration-200 active:scale-[.98]",
            success
              ? "bg-[var(--emerald-100)] text-[var(--emerald-900)]"
              : "bg-[var(--emerald-500)] text-white hover:bg-[var(--emerald-600)]",
            loading && "opacity-60"
          )}>
          {success ? (
            <span className="flex items-center justify-center gap-2">
              <i className="ti ti-circle-check" /> Pari placé !
            </span>
          ) : loading ? "Envoi…" : "Parier"}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────── quest mini-card ───────────────────────── */
function QuestMiniCard({ q }: { q: Quest }) {
  const done = q.is_done
  return (
    <div className={cn(
      "min-w-[160px] rounded-[var(--radius-card)] border border-[var(--border-light)] p-3 flex flex-col gap-2",
      "[box-shadow:var(--shadow-card)]",
      done ? "bg-[var(--emerald-50)]" : "bg-[var(--bg-1)]"
    )}>
      <div className="flex items-center justify-between">
        <span className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-[16px]",
          done ? "bg-[var(--emerald-100)]" : "bg-[var(--bg-3)]"
        )}>
          {done
            ? <i className="ti ti-circle-check text-[var(--emerald-500)]" />
            : <i className="ti ti-bolt text-[var(--fg-2)]" />}
        </span>
        <span className="text-[12px] font-bold [font-family:var(--font-display)] text-[var(--emerald-500)]">
          +{q.reward} B
        </span>
      </div>
      <p className="text-[13px] font-semibold text-[var(--fg-1)] leading-tight">{q.title}</p>
      {/* progress bar */}
      <div className="w-full h-[4px] bg-[var(--bg-3)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--emerald-500)] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, (q.progress / q.total) * 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-[var(--fg-3)]">{q.progress}/{q.total}</p>
    </div>
  )
}

/* ─────────────────── livescore card ────────────────────────── */
interface LiveMatch {
  id: number
  home: string
  away: string
  home_score: number | null
  away_score: number | null
  minute: string | null
  competition: string
}

function LiveScoreSection() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [loadingLive, setLoadingLive] = useState(true)
  const prevScores = useRef<Record<number, { h: number; a: number }>>({})

  async function fetchLive() {
    try {
      const data = await fetch("/api/livescore").then(r => r.json())
      const matches: LiveMatch[] = data.matches ?? []

      // Détecter les nouveaux buts et notifier
      for (const m of matches) {
        const prev = prevScores.current[m.id]
        if (prev) {
          const hGoals = (m.home_score ?? 0) - prev.h
          const aGoals = (m.away_score ?? 0) - prev.a
          if (hGoals > 0) {
            toast(`⚽ BUT ! ${m.home}`, {
              description: `${m.home} ${m.home_score}–${m.away_score} ${m.away} (${m.minute})`,
              duration: 6000,
            })
          }
          if (aGoals > 0) {
            toast(`⚽ BUT ! ${m.away}`, {
              description: `${m.home} ${m.home_score}–${m.away_score} ${m.away} (${m.minute})`,
              duration: 6000,
            })
          }
        }
        prevScores.current[m.id] = { h: m.home_score ?? 0, a: m.away_score ?? 0 }
      }

      setLiveMatches(matches)
      setLoadingLive(false)
    } catch {
      setLoadingLive(false)
    }
  }

  useEffect(() => {
    fetchLive()
    // Polling toutes les 3 minutes quand l'app est ouverte
    const interval = setInterval(fetchLive, 3 * 60 * 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loadingLive || liveMatches.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[var(--error)] animate-pulse" />
        <h2 className="text-[17px] font-semibold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
          En direct
        </h2>
        <span className="text-[12px] font-bold text-[var(--error)] bg-[rgba(239,68,68,0.1)] px-2 py-[2px] rounded-full">
          {liveMatches.length} match{liveMatches.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {liveMatches.map(m => (
          <div key={m.id}
               className="min-w-[180px] bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                          p-3 [box-shadow:var(--shadow-card)] shrink-0">
            <div className="flex items-center gap-[6px] mb-2">
              <span className="w-[6px] h-[6px] rounded-full bg-[var(--error)] animate-pulse shrink-0" />
              <span className="text-[10px] text-[var(--fg-3)] truncate">{m.competition}</span>
              {m.minute && (
                <span className="ml-auto text-[10px] font-bold text-[var(--error)] shrink-0">{m.minute}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[var(--fg-1)] truncate flex-1">{m.home}</span>
              <span className="text-[16px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] shrink-0 px-1">
                {m.home_score ?? 0}–{m.away_score ?? 0}
              </span>
              <span className="text-[12px] font-semibold text-[var(--fg-1)] truncate flex-1 text-right">{m.away}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────── standings bottom sheet ─────────────────── */
interface StandingRow {
  rank: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  form: string
}

const LEAGUE_MAP: Record<string, string> = {
  L1: "L1", PL: "PL", LIGA: "LIGA", BL: "BL", SA: "SA",
  ERE: "ERE", LPT: "LPT", STL: "STL", LIB: "LIB",
}

function StandingsSheet({ leagueKey, leagueLabel, onClose }: { leagueKey: string; leagueLabel: string; onClose: () => void }) {
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [leagueName, setLeagueName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/standings/${leagueKey}`)
      .then(r => r.json())
      .then(data => {
        setStandings(data.standings ?? [])
        setLeagueName(data.leagueName ?? leagueLabel)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [leagueKey, leagueLabel])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-[var(--bg-1)] rounded-t-[20px] max-h-[80vh] flex flex-col">
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--bg-3)]" />
        </div>
        {/* header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--border-light)]">
          <p className="text-[16px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
            Classement — {leagueName || leagueLabel}
          </p>
          <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-3)]">
            <i className="ti ti-x text-[14px] text-[var(--fg-2)]" />
          </button>
        </div>
        {/* table */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="py-8 text-center text-[var(--fg-3)] text-[13px]">Chargement…</div>
          ) : standings.length === 0 ? (
            <div className="py-8 text-center text-[var(--fg-3)] text-[13px]">Classement indisponible</div>
          ) : (
            <>
              {/* header row */}
              <div className="flex items-center gap-1 text-[10px] text-[var(--fg-3)] font-semibold uppercase mb-2 px-1">
                <span className="w-6 text-center shrink-0">#</span>
                <span className="flex-1">Équipe</span>
                <span className="w-7 text-center shrink-0">PJ</span>
                <span className="w-7 text-center shrink-0">V</span>
                <span className="w-7 text-center shrink-0">N</span>
                <span className="w-7 text-center shrink-0">D</span>
                <span className="w-8 text-center shrink-0">Pts</span>
                <span className="w-12 text-center shrink-0">Forme</span>
              </div>
              {standings.map(row => (
                <div key={row.rank}
                     className="flex items-center gap-1 py-2 border-b border-[var(--border-light)] last:border-0">
                  <span className="w-6 text-center text-[12px] font-bold text-[var(--fg-3)] shrink-0">{row.rank}</span>
                  <span className="flex-1 text-[13px] font-semibold text-[var(--fg-1)] truncate">{row.team}</span>
                  <span className="w-7 text-center text-[12px] text-[var(--fg-2)] shrink-0">{row.played}</span>
                  <span className="w-7 text-center text-[12px] text-[var(--fg-2)] shrink-0">{row.won}</span>
                  <span className="w-7 text-center text-[12px] text-[var(--fg-2)] shrink-0">{row.drawn}</span>
                  <span className="w-7 text-center text-[12px] text-[var(--fg-2)] shrink-0">{row.lost}</span>
                  <span className="w-8 text-center text-[13px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] shrink-0">{row.points}</span>
                  <div className="w-12 flex justify-center gap-[2px] shrink-0">
                    {row.form.slice(-5).split("").map((r, i) => (
                      <span key={i} className={cn(
                        "w-[9px] h-[9px] rounded-full",
                        r === "W" ? "bg-[var(--emerald-500)]" : r === "L" ? "bg-[var(--error)]" : "bg-[var(--fg-3)]"
                      )} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── league mini-card ──────────────────────── */
function LeagueMiniCard({ league }: { league: League }) {
  const top3 = [...league.members].sort((a, b) => a.rank - b.rank).slice(0, 3)
  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                    p-4 [box-shadow:var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px]"
               style={{ background: league.color }}>
            {league.name[0]}
          </div>
          <span className="font-semibold text-[15px] [font-family:var(--font-display)] text-[var(--fg-1)]">
            {league.name}
          </span>
        </div>
        <Link href="/ligues"
              className="text-[12px] font-semibold text-[var(--emerald-500)] hover:underline">
          Voir tout →
        </Link>
      </div>
      <div className="flex flex-col gap-[10px]">
        {top3.map((m, i) => (
          <div key={m.user_id}
               className={cn(
                 "flex items-center gap-3 rounded-[8px] px-2 py-[6px]",
                 m.is_me && "bg-[var(--emerald-50)]"
               )}>
            <span className="text-[16px] w-6 text-center">{medals[i]}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                 style={{ background: m.avatar_color }}>
              {m.username[0].toUpperCase()}
            </div>
            <span className={cn("flex-1 text-[13px]", m.is_me ? "font-bold text-[var(--fg-1)]" : "text-[var(--fg-2)]")}>
              {m.username}{m.is_me && " (toi)"}
            </span>
            <span className="text-[13px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
              {m.balance} B
            </span>
            <span className={cn(
              "text-[11px] font-semibold",
              m.balance_change >= 0 ? "text-[var(--emerald-500)]" : "text-[var(--error)]"
            )}>
              {m.balance_change >= 0 ? "+" : ""}{m.balance_change} B
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────── skeletons ────────────────────────── */
function MatchSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-light)] p-[14px] [box-shadow:var(--shadow-card)]">
      <div className="flex justify-between mb-3">
        <div className="skeleton w-28 h-4 rounded" />
        <div className="skeleton w-16 h-4 rounded" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col items-center gap-2">
          <div className="skeleton w-11 h-11 rounded-full" />
          <div className="skeleton w-16 h-3 rounded" />
        </div>
        <div className="skeleton w-12 h-7 rounded" />
        <div className="flex flex-col items-center gap-2">
          <div className="skeleton w-11 h-11 rounded-full" />
          <div className="skeleton w-16 h-3 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="skeleton flex-1 h-12 rounded-[10px]" />
        <div className="skeleton flex-1 h-12 rounded-[10px]" />
        <div className="skeleton flex-1 h-12 rounded-[10px]" />
      </div>
    </div>
  )
}

/* ─────────────────────── COMPETITIONS ──────────────────────── */
const COMPETITIONS = [
  { key: "all",  label: "Toutes",                emoji: "🌍" },
  // Ligues nationales
  { key: "L1",   label: "Ligue 1",               emoji: "🇫🇷" },
  { key: "PL",   label: "Premier League",         emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "LIGA", label: "La Liga",                emoji: "🇪🇸" },
  { key: "BL",   label: "Bundesliga",             emoji: "🇩🇪" },
  { key: "SA",   label: "Serie A",                emoji: "🇮🇹" },
  { key: "ERE",  label: "Eredivisie",             emoji: "🇳🇱" },
  { key: "LPT",  label: "Liga Portugal",          emoji: "🇵🇹" },
  { key: "STL",  label: "Süper Lig",              emoji: "🇹🇷" },
  // Coupes nationales
  { key: "CDRF", label: "Coupe de France",        emoji: "🇫🇷" },
  { key: "FAC",  label: "FA Cup",                 emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "CC",   label: "Carabao Cup",            emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "CDR",  label: "Copa del Rey",           emoji: "🇪🇸" },
  { key: "SCES", label: "Supercoupe ESP",         emoji: "🇪🇸" },
  { key: "DFBP", label: "DFB Pokal",              emoji: "🇩🇪" },
  { key: "CI",   label: "Coppa Italia",           emoji: "🇮🇹" },
  { key: "SCIT", label: "Supercoupe ITA",         emoji: "🇮🇹" },
  { key: "TRCH", label: "Trophée Champions",      emoji: "🇫🇷" },
  // UEFA
  { key: "UCL",  label: "Ligue des Champions",    emoji: "⭐" },
  { key: "EL",   label: "Europa League",          emoji: "🟠" },
  { key: "ECL",  label: "Conference League",      emoji: "🟢" },
  // Compétitions mondiales
  { key: "CDM",  label: "Coupe du Monde",         emoji: "🏆" },
  { key: "EURO", label: "Euro UEFA",              emoji: "🇪🇺" },
  { key: "NL",   label: "Ligue des Nations",      emoji: "🇪🇺" },
  { key: "CAN",  label: "CAN",                    emoji: "🌍" },
  { key: "LIB",  label: "Copa Libertadores",      emoji: "🌎" },
  { key: "CWC",  label: "Monde des clubs",        emoji: "🌐" },
  { key: "CA",   label: "Copa América",           emoji: "🌎" },
  { key: "CIC",  label: "Coupe Intercontinentale",emoji: "🌐" },
]

/* ── Normalisation pour matching équipes API-Football ↔ Odds API ── */
function normTeam(s: string) {
  return s.toLowerCase()
    .replace(/\b(fc|cf|sc|ac|afc|fk|sk)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
}
function teamsMatch(api: string, db: string) {
  const a = normTeam(api), b = normTeam(db)
  return a === b || (a.length >= 4 && (a.includes(b.slice(0, 4)) || b.includes(a.slice(0, 4))))
}

interface LiveScoreEntry {
  id: number; home: string; away: string
  home_score: number | null; away_score: number | null; minute: string | null
}

/* ─────────────────────── PAGE ───────────────────────────────── */
export default function DashboardPage() {
  const { profile, refetch: refetchProfile } = useProfile()
  const [matches, setMatches]     = useState<Match[]>([])
  const [quests, setQuests]       = useState<Quest[]>([])
  const [league, setLeague]       = useState<League | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeComp, setActiveComp] = useState("all")
  const [selectedOdds, setSelectedOdds] = useState<string | null>(null)
  const [betSlip, setBetSlip]     = useState<SelectedOdds | null>(null)
  const [dayOffset, setDayOffset] = useState(0)
  const [betCounts, setBetCounts] = useState<Record<string, number>>({})
  const [standingsKey, setStandingsKey] = useState<string | null>(null)
  const [liveScores, setLiveScores] = useState<LiveScoreEntry[]>([])
  const supabase = createClient()

  /* fetch matches + bet counts pour tri par popularité */
  useEffect(() => {
    fetch("/api/matches")
      .then(r => r.json())
      .then(data => { setMatches(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))

    // Bet counts par match (pour popularité)
    supabase
      .from("bets")
      .select("match_id")
      .then(({ data }) => {
        if (!data) return
        const counts: Record<string, number> = {}
        for (const b of data) counts[b.match_id] = (counts[b.match_id] ?? 0) + 1
        setBetCounts(counts)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* poll livescores → enrichit les cartes de matchs en temps réel */
  useEffect(() => {
    function poll() {
      fetch("/api/livescore")
        .then(r => r.json())
        .then(data => setLiveScores(data.matches ?? []))
        .catch(() => {})
    }
    poll()
    const iv = setInterval(poll, 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  /* fetch quests */
  useEffect(() => {
    async function fetchQuests() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("quest_progress")
        .select("*")
        .eq("user_id", user.id)
        .limit(3)
      setQuests((data ?? []) as Quest[])
    }
    fetchQuests()
  }, [supabase])

  /* fetch league */
  useEffect(() => {
    async function fetchLeague() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: membership } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", user.id)
        .limit(1)
        .single()
      if (!membership) return
      const { data } = await supabase
        .from("leagues")
        .select("*, members:league_members(user_id,username,avatar_color,rank,balance,balance_change), activity:league_activity(text,emoji,created_at)")
        .eq("id", membership.league_id)
        .single()
      if (data) {
        const members = (data.members ?? []).map((m: LeagueMember) => ({
          ...m,
          is_me: m.user_id === user.id,
        }))
        setLeague({ ...data, members })
      }
    }
    fetchLeague()
  }, [supabase])

  /* handle odds select */
  function handleOddsSelect(match: Match, marketKey: string, outcomeKey: string, odds: number) {
    const key = `${match.id}:${marketKey}:${outcomeKey}`
    if (selectedOdds === key) {
      setSelectedOdds(null)
      setBetSlip(null)
      return
    }
    setSelectedOdds(key)
    const marketLabels: Record<string, string> = { result: "Résultat 1N2" }
    setBetSlip({
      match,
      marketKey,
      outcomeKey,
      odds,
      label: marketLabels[marketKey] ?? marketKey,
    })
  }

  // Calcul du jour sélectionné
  const selectedDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + dayOffset)
    return d.toISOString().slice(0, 10)
  })()

  const dayLabel = (() => {
    if (dayOffset === 0) return "Aujourd'hui"
    if (dayOffset === 1) return "Demain"
    const d = new Date()
    d.setDate(d.getDate() + dayOffset)
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })
  })()

  // Dates disponibles parmi les matchs chargés
  const availableDays = [...new Set(matches.map(m => m.kickoff.slice(0, 10)))].sort()

  const matchesForDay = matches.filter(m => m.kickoff.slice(0, 10) === selectedDate)

  // Poids de popularité : paris réels + bonus compétition
  const COMP_WEIGHT: Record<string, number> = { CDM: 100, AMI: 60, LIB: 55, SUD: 45, JPN: 30, NOR: 20, SWE: 20, BRS: 25, CHI: 20, CHN: 15, FIN: 15, SWT: 10, SP2: 25 }
  const sortByPopularity = (arr: Match[]) =>
    [...arr].sort((a, b) => {
      const scoreA = (betCounts[a.id] ?? 0) * 10 + (COMP_WEIGHT[a.competition] ?? 0)
      const scoreB = (betCounts[b.id] ?? 0) * 10 + (COMP_WEIGHT[b.competition] ?? 0)
      return scoreB - scoreA
    })

  const filteredMatches = sortByPopularity(
    activeComp === "all"
      ? matchesForDay
      : matchesForDay.filter(m => m.competition === activeComp)
  )

  // Enrichir avec les scores live (API-Football) pour affichage immédiat
  const enrichedMatches = filteredMatches.map(m => {
    if (liveScores.length === 0) return m
    const lm = liveScores.find(l => teamsMatch(l.home, m.home_team) && teamsMatch(l.away, m.away_team))
    if (!lm) return m
    return {
      ...m,
      state: "live" as const,
      home_score: lm.home_score ?? undefined,
      away_score: lm.away_score ?? undefined,
      minute: lm.minute ?? m.minute,
    }
  })

  function prevDay() {
    const newDate = (() => { const d = new Date(); d.setDate(d.getDate() + dayOffset - 1); return d.toISOString().slice(0,10) })()
    if (availableDays.some(d => d <= newDate) || dayOffset > 0) setDayOffset(o => o - 1)
  }
  function nextDay() {
    setDayOffset(o => o + 1)
  }
  const hasPrev = dayOffset > 0 || availableDays.some(d => d < selectedDate)
  const hasNext = availableDays.some(d => d > selectedDate)

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto">

        {/* ── AppBar ── */}
        <header className="sticky top-0 z-30 bg-[var(--bg-1)] border-b border-[var(--border-light)]
                           px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Safebet" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-[19px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
              Safebet
            </span>
          </div>
          <div className="flex items-center gap-3">
            {profile && <BluffBadge value={profile.balance.toFixed(2)} />}
            <Link href="/notifications"
                  className="relative w-9 h-9 flex items-center justify-center
                             rounded-full bg-[var(--bg-2)] border border-[var(--border-light)]">
              <i className="ti ti-bell text-[18px] text-[var(--fg-2)]" />
            </Link>
          </div>
        </header>

        <div className="px-4 pt-5 pb-4 flex flex-col gap-6">

          {/* ── Livescore ── */}
          <LiveScoreSection />

          {/* ── Competition filter ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {COMPETITIONS.map(c => {
              const hasStandings = LEAGUE_MAP[c.key] !== undefined
              return (
                <div key={c.key} className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => setActiveComp(c.key)}
                    className={cn(
                      "whitespace-nowrap px-[14px] py-[7px] rounded-full text-[13px] font-semibold",
                      "border transition-all duration-150",
                      activeComp === c.key
                        ? "bg-[var(--emerald-500)] border-[var(--emerald-500)] text-white"
                        : "bg-[var(--bg-1)] border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
                    )}>
                    {c.emoji} {c.label}
                  </button>
                  {hasStandings && activeComp === c.key && (
                    <button
                      onClick={() => setStandingsKey(c.key)}
                      className="text-[10px] font-semibold text-[var(--emerald-500)] hover:underline whitespace-nowrap">
                      Voir le classement →
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Matchs du jour ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevDay}
                disabled={!hasPrev}
                className="w-8 h-8 flex items-center justify-center rounded-full
                           bg-[var(--bg-2)] border border-[var(--border-light)]
                           disabled:opacity-30 transition-opacity active:scale-90">
                <i className="ti ti-chevron-left text-[16px] text-[var(--fg-2)]" />
              </button>
              <div className="text-center">
                <h2 className="text-[17px] font-semibold [font-family:var(--font-display)]
                               text-[var(--fg-1)] tracking-tight leading-tight">
                  {dayLabel}
                </h2>
                {dayOffset >= 2 && (
                  <p className="text-[12px] text-[var(--fg-3)]">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                  </p>
                )}
              </div>
              <button
                onClick={nextDay}
                disabled={!hasNext}
                className="w-8 h-8 flex items-center justify-center rounded-full
                           bg-[var(--bg-2)] border border-[var(--border-light)]
                           disabled:opacity-30 transition-opacity active:scale-90">
                <i className="ti ti-chevron-right text-[16px] text-[var(--fg-2)]" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {loading
                ? [0, 1, 2].map(i => <MatchSkeleton key={i} />)
                : filteredMatches.length === 0
                  ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-3)] flex items-center justify-center">
                        <i className="ti ti-calendar-off text-[28px] text-[var(--fg-3)]" />
                      </div>
                      {dayOffset === 0 ? (
                        <>
                          <p className="text-[15px] font-semibold text-[var(--fg-2)]">Aucun match aujourd'hui</p>
                          <p className="text-[13px] text-[var(--fg-3)]">Les informations ne sont pas encore disponibles.<br />Reviens un peu plus tard.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[15px] font-semibold text-[var(--fg-2)]">Pas encore disponible</p>
                          <p className="text-[13px] text-[var(--fg-3)]">Les matchs de cette journée ne sont pas encore annoncés.<br />Les informations seront disponibles prochainement.</p>
                        </>
                      )}
                    </div>
                  )
                  : enrichedMatches.map(m => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        onOddsSelect={handleOddsSelect}
                        selectedOdds={selectedOdds}
                      />
                    ))
              }
            </div>
          </section>

          {/* ── Quêtes du jour ── */}
          {quests.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                               text-[var(--fg-1)] tracking-tight">
                  Tes quêtes du jour
                </h2>
                <Link href="/quetes"
                      className="text-[12px] font-semibold text-[var(--emerald-500)] hover:underline">
                  Tout voir →
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {quests.map(q => <QuestMiniCard key={q.id} q={q} />)}
              </div>
            </section>
          )}

          {/* ── Ta ligue ── */}
          {league && (
            <section>
              <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                             text-[var(--fg-1)] tracking-tight mb-3">
                Ta ligue
              </h2>
              <LeagueMiniCard league={league} />
            </section>
          )}

        </div>
      </div>

      {/* ── Sticky bet slip ── */}
      {betSlip && (
        <BetSlip
          sel={betSlip}
          onClose={() => { setBetSlip(null); setSelectedOdds(null) }}
          onBetPlaced={() => refetchProfile()}
        />
      )}

      {/* ── Standings bottom sheet ── */}
      {standingsKey && (
        <StandingsSheet
          leagueKey={standingsKey}
          leagueLabel={COMPETITIONS.find(c => c.key === standingsKey)?.label ?? standingsKey}
          onClose={() => setStandingsKey(null)}
        />
      )}
    </AppShell>
  )
}
