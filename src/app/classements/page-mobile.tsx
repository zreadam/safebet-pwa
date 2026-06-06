"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type LeaderboardType = "balance" | "pronostic"

interface LeaderEntry {
  rank: number
  user_id: string
  username: string
  avatar_color: string
  tier: "free" | "premium"
  balance?: number
  win_rate?: number
  delta?: number
  is_me?: boolean
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[20px]">🥇</span>
  if (rank === 2) return <span className="text-[20px]">🥈</span>
  if (rank === 3) return <span className="text-[20px]">🥉</span>
  return (
    <span className="w-7 h-7 flex items-center justify-center text-[12px] font-bold text-[var(--fg-3)] [font-family:var(--font-display)]">
      {rank}
    </span>
  )
}

function LeaderRow({
  entry,
  type,
}: {
  entry: LeaderEntry
  type: LeaderboardType
}) {
  const score =
    type === "balance"
      ? `${entry.balance ?? 0} B`
      : `${entry.win_rate ?? 0}%`

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-[10px] rounded-[10px] transition-colors",
        entry.is_me &&
          "bg-[var(--emerald-50)] border-l-2 border-[var(--emerald-500)]"
      )}
    >
      <RankBadge rank={entry.rank} />
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
        style={{ background: entry.avatar_color || "#10B981" }}
      >
        {(entry.username?.[0] ?? "?").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[14px] truncate",
              entry.is_me
                ? "font-bold text-[var(--fg-1)]"
                : "text-[var(--fg-2)]"
            )}
          >
            {entry.username}
            {entry.is_me ? " (toi)" : ""}
          </span>
          {entry.tier === "premium" && (
            <span className="shrink-0 text-[10px] font-bold bg-[var(--amber-500)] text-white rounded-full px-1.5 py-0.5 leading-none">
              P
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[14px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          {score}
        </span>
        {entry.delta !== undefined && entry.delta !== 0 && (
          <span
            className={cn(
              "text-[11px] font-semibold [font-family:var(--font-display)]",
              entry.delta > 0
                ? "text-[var(--emerald-500)]"
                : "text-[var(--error)]"
            )}
          >
            {entry.delta > 0 ? "+" : ""}
            {type === "balance" ? `${entry.delta} B` : `${entry.delta}%`}
          </span>
        )}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-[10px]">
      <div className="skeleton w-7 h-7 rounded-full" />
      <div className="skeleton w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3.5 rounded w-28" />
        <div className="skeleton h-2.5 rounded w-16" />
      </div>
      <div className="skeleton h-4 w-14 rounded" />
    </div>
  )
}

export default function ClassementsPage() {
  const { profile } = useProfile()
  const [type, setType] = useState<LeaderboardType>("balance")
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [myEntry, setMyEntry] = useState<LeaderEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setEntries([])
    setMyEntry(null)
    fetch(`/api/classements?type=${type}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries ?? [])
        setMyEntry(data.my_entry ?? null)
      })
      .catch(() => toast.error("Erreur lors du chargement du classement"))
      .finally(() => setLoading(false))
  }, [type])

  const myEntryInTop = entries.some(e => e.is_me)

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto px-4 pt-5 pb-24">
        {/* AppBar */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[22px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)]">
            Classements
          </h1>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 mb-5 p-1 bg-[var(--bg-2)] rounded-[12px]">
          <button
            onClick={() => setType("balance")}
            className={cn(
              "flex-1 h-9 rounded-[10px] text-[14px] font-semibold transition-all",
              type === "balance"
                ? "bg-white text-[var(--fg-1)] shadow-[0_1px_3px_rgba(0,0,0,0.10)]"
                : "text-[var(--fg-3)]"
            )}
          >
            Solde 🏦
          </button>
          <button
            onClick={() => setType("pronostic")}
            className={cn(
              "flex-1 h-9 rounded-[10px] text-[14px] font-semibold transition-all",
              type === "pronostic"
                ? "bg-white text-[var(--fg-1)] shadow-[0_1px_3px_rgba(0,0,0,0.10)]"
                : "text-[var(--fg-3)]"
            )}
          >
            Pronostics 🎯
          </button>
        </div>

        {/* Content */}
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[var(--border-light)]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-4">
              <i className="ti ti-trophy text-[40px] text-[var(--fg-3)] mb-3" />
              <p className="text-[15px] font-semibold text-[var(--fg-2)]">
                Aucun joueur pour l'instant
              </p>
              <p className="text-[13px] text-[var(--fg-3)] mt-1">
                Sois le premier à te classer !
              </p>
            </div>
          ) : (
            entries.map(entry => (
              <LeaderRow key={entry.user_id} entry={entry} type={type} />
            ))
          )}
        </div>

        {/* My position if not in top */}
        {!loading && myEntry && !myEntryInTop && (
          <div className="mt-4">
            <p className="text-[12px] font-semibold text-[var(--fg-3)] uppercase tracking-wide mb-2 px-1">
              Ta position
            </p>
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <LeaderRow entry={{ ...myEntry, is_me: true }} type={type} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
