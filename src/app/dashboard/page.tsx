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
  { key: "all", label: "Toutes",         emoji: "🌍" },
  { key: "CDM", label: "Coupe du Monde", emoji: "🏆" },
  { key: "AMI", label: "Amicaux",        emoji: "🤝" },
  { key: "LIB", label: "Copa Lib.",      emoji: "🌎" },
  { key: "SUD", label: "Copa Sud.",      emoji: "🌎" },
  { key: "JPN", label: "J-League",       emoji: "🇯🇵" },
  { key: "NOR", label: "Eliteserien",    emoji: "🇳🇴" },
  { key: "SWE", label: "Allsvenskan",    emoji: "🇸🇪" },
  { key: "BRS", label: "Brésil B",       emoji: "🇧🇷" },
  { key: "CHI", label: "Chili",          emoji: "🇨🇱" },
  { key: "CHN", label: "Chine",          emoji: "🇨🇳" },
  { key: "FIN", label: "Finlande",       emoji: "🇫🇮" },
  { key: "SWT", label: "Superettan",     emoji: "🇸🇪" },
  { key: "SP2", label: "La Liga 2",      emoji: "🇪🇸" },
]

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

          {/* ── Competition filter ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {COMPETITIONS.map(c => (
              <button
                key={c.key}
                onClick={() => setActiveComp(c.key)}
                className={cn(
                  "whitespace-nowrap px-[14px] py-[7px] rounded-full text-[13px] font-semibold",
                  "border transition-all duration-150 shrink-0",
                  activeComp === c.key
                    ? "bg-[var(--emerald-500)] border-[var(--emerald-500)] text-white"
                    : "bg-[var(--bg-1)] border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
                )}>
                {c.emoji} {c.label}
              </button>
            ))}
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
                {dayOffset !== 0 && (
                  <p className="text-[12px] text-[var(--fg-3)]">{selectedDate}</p>
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
                    <div className="text-center py-10 text-[var(--fg-3)] text-[14px]">
                      Aucun match {dayOffset === 0 ? "aujourd'hui" : "ce jour"} pour {activeComp === "all" ? "ces compétitions" : "cette compétition"}.
                    </div>
                  )
                  : filteredMatches.map(m => (
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
    </AppShell>
  )
}
