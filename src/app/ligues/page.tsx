"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import type { League, LeagueMember, ActivityItem } from "@/types"

/* ──────────────── rank medal helper ────────────────────────── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[18px]">🥇</span>
  if (rank === 2) return <span className="text-[18px]">🥈</span>
  if (rank === 3) return <span className="text-[18px]">🥉</span>
  return (
    <span className="w-6 h-6 flex items-center justify-center text-[12px]
                     font-bold text-[var(--fg-3)] [font-family:var(--font-display)]">
      {rank}
    </span>
  )
}

/* ──────────────── leaderboard row ─────────────────────────── */
function LeaderRow({ m }: { m: LeagueMember }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-[10px] rounded-[10px] transition-colors",
      m.is_me && "bg-[var(--emerald-50)]"
    )}>
      <RankBadge rank={m.rank} />
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white
                      text-[13px] font-bold shrink-0"
           style={{ background: m.avatar_color }}>
        {m.username[0].toUpperCase()}
      </div>
      <span className={cn(
        "flex-1 text-[14px]",
        m.is_me ? "font-bold text-[var(--fg-1)]" : "text-[var(--fg-2)]"
      )}>
        {m.username}{m.is_me ? " (toi)" : ""}
      </span>
      <span className="text-[14px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
        {m.balance} B
      </span>
      <span className={cn(
        "text-[12px] font-semibold min-w-[50px] text-right [font-family:var(--font-display)]",
        m.balance_change >= 0 ? "text-[var(--emerald-500)]" : "text-[var(--error)]"
      )}>
        {m.balance_change >= 0 ? "+" : ""}{m.balance_change} B
      </span>
    </div>
  )
}

/* ──────────────── activity feed ────────────────────────────── */
function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-col gap-[8px]">
      {items.slice(0, 5).map((item, i) => (
        <div key={i} className="flex items-center gap-3 py-[6px]
                                border-b border-[var(--border-light)] last:border-0">
          <span className="text-[18px]">{item.emoji}</span>
          <span className="flex-1 text-[13px] text-[var(--fg-2)]">{item.text}</span>
          <span className="text-[11px] text-[var(--fg-3)] whitespace-nowrap">
            {new Date(item.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ──────────────── league card (compact) ───────────────────── */
function LeagueCard({ league, onClick, active }: { league: League; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-[var(--bg-1)] border rounded-[var(--radius-card)]",
        "p-4 [box-shadow:var(--shadow-card)] transition-all duration-150",
        "hover:shadow-[var(--shadow-hover)] active:scale-[.99]",
        active ? "border-[var(--emerald-500)]" : "border-[var(--border-light)]"
      )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center
                        text-white font-bold text-[16px] shrink-0"
             style={{ background: league.color }}>
          {league.emoji ?? league.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-[var(--fg-1)] truncate">{league.name}</p>
          <p className="text-[12px] text-[var(--fg-3)]">{league.member_count} membres</p>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-[8px] py-[3px] rounded-full shrink-0",
          league.is_private
            ? "bg-[#FEF3C7] text-[var(--amber-900)]"
            : "bg-[var(--emerald-50)] text-[var(--emerald-900)]"
        )}>
          {league.is_private ? "PRIVÉE" : "PUBLIQUE"}
        </span>
      </div>
    </button>
  )
}


/* ────────────────────────── PAGE ───────────────────────────── */
export default function LiguesPage() {
  const { profile } = useProfile()
  const router = useRouter()

  const [leagues, setLeagues]     = useState<League[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [joinCode, setJoinCode]   = useState("")
  const [joining, setJoining]     = useState(false)
  const [joinError, setJoinError] = useState("")

  async function fetchLeagues() {
    setLoading(true)
    try {
      const res = await fetch("/api/leagues")
      if (!res.ok) return
      const data = await res.json()
      // L'API retourne { myLeagues, publicLeagues }
      // On enrichit chaque ligue avec members/activity via l'API de détail si besoin
      setLeagues(data.myLeagues ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeagues() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError("")
    try {
      // Chercher la ligue par code via l'API
      const res = await fetch(`/api/leagues/by-code?code=${encodeURIComponent(joinCode.trim().toUpperCase())}`)
      if (!res.ok) { setJoinError("Code invalide. Vérifie et réessaie."); return }
      const league = await res.json()

      // Rejoindre via la route join
      const joinRes = await fetch(`/api/leagues/${league.id}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      if (!joinRes.ok) {
        const err = await joinRes.json()
        setJoinError(err.error ?? "Tu es peut-être déjà dans cette ligue.")
        return
      }

      setJoinCode("")
      await fetchLeagues()
    } finally {
      setJoining(false)
    }
  }

  const activeLeague = leagues[activeIdx]
  const sortedMembers = activeLeague?.members
    ? [...activeLeague.members].sort((a, b) => a.rank - b.rank)
    : []

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto">

        {/* ── header ── */}
        <header className="sticky top-0 z-30 bg-[var(--bg-1)] border-b border-[var(--border-light)] px-4 py-3">
          <h1 className="text-[21px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
            Ligues
          </h1>
        </header>

        <div className="px-4 pt-5 pb-4 flex flex-col gap-6">

          {/* ── My leagues ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                             text-[var(--fg-1)] tracking-tight">
                Mes ligues
              </h2>

              {/* Create private league – premium only */}
              {profile?.tier === "premium" ? (
                <button
                  onClick={() => router.push("/ligues/creer")}
                  className="flex items-center gap-[6px] text-[12px] font-bold
                                   bg-white border-2 border-[var(--emerald-500)] text-[var(--emerald-600)]
                                   px-3 py-[6px] rounded-[8px] shadow-sm
                                   hover:bg-[var(--emerald-50)] active:scale-95 transition-all shrink-0">
                  <i className="ti ti-plus text-[13px]" /> Créer une ligue
                </button>
              ) : (
                <Link href="/premium"
                      className="flex items-center gap-[6px] text-[12px] font-bold
                                 bg-white border-2 border-[var(--amber-500)] text-[var(--amber-600)]
                                 px-3 py-[6px] rounded-[8px] shadow-sm
                                 hover:bg-[var(--amber-50)] active:scale-95 transition-all shrink-0">
                  <i className="ti ti-crown text-[13px]" /> Créer une ligue
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1].map(i => (
                  <div key={i} className="skeleton h-[72px] rounded-[var(--radius-card)]" />
                ))}
              </div>
            ) : leagues.length === 0 ? (
              <div className="text-center py-8 text-[var(--fg-3)] text-[14px] bg-[var(--bg-2)]
                              rounded-[var(--radius-card)] border border-[var(--border-light)]">
                Tu n&apos;es dans aucune ligue pour l&apos;instant.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {leagues.map((l, i) => (
                  <LeagueCard
                    key={l.id}
                    league={l}
                    active={activeIdx === i}
                    onClick={() => setActiveIdx(i)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Leaderboard of active league ── */}
          {activeLeague && (
            <section>
              <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                             text-[var(--fg-1)] tracking-tight mb-3">
                Classement — {activeLeague.name}
              </h2>
              <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                              [box-shadow:var(--shadow-card)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3
                                border-b border-[var(--border-light)] bg-[var(--bg-2)]">
                  <span className="text-[11px] text-[var(--fg-3)] font-semibold">JOUEUR</span>
                  <span className="text-[11px] text-[var(--fg-3)] font-semibold">SOLDE · ÉVOL.</span>
                </div>
                <div className="px-2 py-2 flex flex-col">
                  {sortedMembers.map(m => <LeaderRow key={m.user_id} m={m} />)}
                </div>
              </div>
            </section>
          )}

          {/* ── Activity feed ── */}
          {activeLeague?.activity?.length > 0 && (
            <section>
              <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                             text-[var(--fg-1)] tracking-tight mb-3">
                Activité récente
              </h2>
              <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                              [box-shadow:var(--shadow-card)] px-4 py-3">
                <ActivityFeed items={activeLeague.activity} />
              </div>
            </section>
          )}

          {/* ── Join by code ── */}
          <section>
            <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                           text-[var(--fg-1)] tracking-tight mb-3">
              Rejoindre par code
            </h2>
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                            [box-shadow:var(--shadow-card)] p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError("") }}
                  placeholder="CODE INVITE"
                  maxLength={8}
                  className="flex-1 bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-btn)]
                             px-4 py-3 text-[14px] font-bold [font-family:var(--font-display)] tracking-widest
                             text-[var(--fg-1)] placeholder:text-[var(--fg-3)] outline-none
                             focus:border-[var(--emerald-500)] transition-colors"
                />
                <button
                  onClick={handleJoin}
                  disabled={joining || !joinCode.trim()}
                  className={cn(
                    "px-5 py-3 rounded-[var(--radius-btn)] font-bold text-[14px] text-white",
                    "bg-[var(--emerald-500)] hover:bg-[var(--emerald-600)] transition-colors",
                    (joining || !joinCode.trim()) && "opacity-50"
                  )}>
                  {joining ? "…" : "Rejoindre"}
                </button>
              </div>
              {joinError && (
                <p className="text-[12px] text-[var(--error)] mt-2">{joinError}</p>
              )}
            </div>
          </section>


        </div>
      </div>
    </AppShell>
  )
}
