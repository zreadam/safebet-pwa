"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import type { Bet, BetStatus } from "@/types"

type Filter = "all" | "pending" | "won" | "lost"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "pending", label: "En cours" },
  { key: "won", label: "Gagnés" },
  { key: "lost", label: "Perdus" },
]

function statusColor(s: BetStatus): string {
  if (s === "won") return "bg-[var(--emerald-500)]"
  if (s === "lost") return "bg-[var(--error)]"
  if (s === "pending") return "bg-[var(--info,#3B82F6)]"
  return "bg-[var(--fg-3)]"
}

function statusBadge(s: BetStatus) {
  const configs: Record<BetStatus, { label: string; classes: string }> = {
    won: { label: "Gagné", classes: "bg-[var(--emerald-50)] text-[var(--emerald-900)]" },
    lost: { label: "Perdu", classes: "bg-[#FEF2F2] text-[#991B1B]" },
    pending: { label: "En cours", classes: "bg-[#EFF6FF] text-[#1E3A5F]" },
    void: { label: "Annulé", classes: "bg-[var(--bg-3)] text-[var(--fg-3)]" },
  }
  const c = configs[s]
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-[3px] rounded-full", c.classes)}>
      {c.label}
    </span>
  )
}

function BetCard({ bet }: { bet: Bet }) {
  const gain = bet.status === "won"
    ? bet.potential_gain - bet.stake
    : bet.status === "lost"
    ? -bet.stake
    : null

  return (
    <div className={cn(
      "bg-[var(--bg-1)] border border-[var(--border-light)] rounded-lg p-4 animate-card-in"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold text-[var(--fg-1)]">{bet.match_label}</p>
          <p className="text-[12px] text-[var(--fg-3)] mt-1">{bet.market} · {bet.selection}</p>
        </div>
        {statusBadge(bet.status)}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <span className="text-[10px] text-[var(--fg-3)]">Cote</span>
          <span className="text-[14px] font-bold text-[var(--fg-1)] block">
            {bet.odds.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--fg-3)]">Mise</span>
          <span className="text-[14px] font-bold text-[var(--fg-1)] block">
            {bet.stake} B
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--fg-3)]">
            {bet.status === "won" ? "Gain" : bet.status === "lost" ? "Perte" : "Pot."}
          </span>
          <span className={cn(
            "text-[14px] font-bold block",
            bet.status === "won" ? "text-[var(--emerald-500)]" :
            bet.status === "lost" ? "text-[var(--error)]" :
            "text-[var(--fg-2)]"
          )}>
            {bet.status === "won" && gain !== null && `+${gain.toFixed(2)} B`}
            {bet.status === "lost" && gain !== null && `${gain.toFixed(2)} B`}
            {bet.status === "pending" && `${bet.potential_gain.toFixed(2)} B`}
            {bet.status === "void" && "–"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--fg-3)]">Date</span>
          <span className="text-[11px] font-semibold text-[var(--fg-1)] block">
            {new Date(bet.placed_at).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short"
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ParisDesktop() {
  const { profile } = useProfile()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    fetch("/api/bets", { cache: "no-store" })
      .then(r => r.json())
      .then(data => { setBets(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const realBets = bets.filter(b => b.stake > 0)
  const wonBets = realBets.filter(b => b.status === "won")
  const lostBets = realBets.filter(b => b.status === "lost")
  const totalGain = wonBets.reduce((s, b) => s + b.potential_gain - b.stake, 0)
  const settledBets = realBets.filter(b => b.status !== "pending" && b.status !== "void")
  const successRate = settledBets.length > 0
    ? Math.round((wonBets.length / settledBets.length) * 100)
    : 0

  // Group bets by bet_group_id (for combo bets)
  const groupedBets: (Bet | { id: string; bets: Bet[]; isCombo: true })[] = []
  const processedIds = new Set<string>()

  for (const bet of realBets) {
    if (processedIds.has(bet.id)) continue

    if (bet.bet_group_id) {
      const groupBets = realBets.filter(b => b.bet_group_id === bet.bet_group_id)
      groupedBets.push({
        id: bet.bet_group_id,
        bets: groupBets,
        isCombo: true,
      })
      groupBets.forEach(b => processedIds.add(b.id))
    } else {
      groupedBets.push(bet)
      processedIds.add(bet.id)
    }
  }

  const filtered = filter === "all"
    ? groupedBets
    : groupedBets.filter(item => {
      if ('isCombo' in item && item.isCombo) {
        return item.bets.some(b => b.status === filter)
      } else {
        return (item as Bet).status === filter
      }
    })

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-1">
          Mes paris
        </h1>
        <p className="text-[var(--fg-2)]">Historique et statistiques de tes paris</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-lg p-4">
          <p className="text-[11px] text-[var(--fg-3)] mb-1">Solde</p>
          <p className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--emerald-600)]">
            {profile ? `${profile.balance.toFixed(2)} B` : "–"}
          </p>
        </div>
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-lg p-4">
          <p className="text-[11px] text-[var(--fg-3)] mb-1">Gain total</p>
          <p className={cn(
            "text-[22px] font-bold [font-family:var(--font-display)]",
            totalGain >= 0 ? "text-[var(--emerald-500)]" : "text-[var(--error)]"
          )}>
            {totalGain >= 0 ? "+" : ""}{totalGain.toFixed(2)} B
          </p>
        </div>
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-lg p-4">
          <p className="text-[11px] text-[var(--fg-3)] mb-1">Réussite</p>
          <p className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--emerald-500)]">
            {successRate}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all",
              "border",
              filter === f.key
                ? "bg-[var(--emerald-500)] border-[var(--emerald-500)] text-white"
                : "bg-[var(--bg-1)] border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Bets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[var(--fg-3)]">Chargement des paris...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)]">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-[var(--fg-1)] font-semibold mb-1">Pas encore de paris</p>
            <p className="text-[var(--fg-3)] text-sm">Lance-toi et place tes premiers paris !</p>
          </div>
        ) : (
          filtered.map(item => {
            if ('isCombo' in item && item.isCombo) {
              // Combo bet
              const allWon = item.bets.every(b => b.status === "won")
              const allLost = item.bets.every(b => b.status === "lost")
              const isPending = item.bets.some(b => b.status === "pending")
              const status = allWon ? "won" : allLost ? "lost" : isPending ? "pending" : "unknown"
              const totalOdds = item.bets.reduce((acc, b) => acc * b.odds, 1)

              return (
                <div key={item.id} className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-[var(--bg-2)] px-4 py-3 border-b border-[var(--border-light)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[var(--emerald-500)]">🎯 PARI COMBINÉ ({item.bets.length})</span>
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-1 rounded-full",
                        statusColor(status as any)
                      )}>
                        {status === "won" ? "✓ Gagné" : status === "lost" ? "✗ Perdu" : "En cours"}
                      </span>
                    </div>
                    <div className="flex gap-6 text-xs text-[var(--fg-3)]">
                      <span>Cote totale: <span className="font-bold text-[var(--fg-1)]">{totalOdds.toFixed(2)}</span></span>
                      <span>Mise: <span className="font-bold text-[var(--fg-1)]">{item.bets[0]?.stake} B</span></span>
                    </div>
                  </div>

                  {/* Bets */}
                  <div className="divide-y divide-[var(--border-light)] p-4 space-y-3">
                    {item.bets.map((bet, idx) => (
                      <div key={bet.id} className={idx > 0 ? "pt-3" : ""}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[11px] font-bold bg-[var(--bg-2)] px-2 py-1 rounded text-[var(--fg-3)]">#{idx + 1}</span>
                          <span className="font-semibold text-[var(--fg-1)] flex-1">{bet.match_label}</span>
                          <span className={cn("text-[11px] font-bold px-2 py-1 rounded", statusColor(bet.status as any))}>{bet.selection}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[var(--fg-3)]">
                          <span>{bet.market}</span>
                          <span>Cote: {bet.odds.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            } else {
              return <BetCard key={(item as Bet).id} bet={item as Bet} />
            }
          })
        )}
      </div>
    </div>
  )
}
