"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

interface Bet {
  id: string
  match_id: string
  match_label: string
  selection: string
  market: string
  odds: number
  stake: number
  potential_gain: number
  status: "pending" | "won" | "lost"
  placed_at: string
  bet_group_id?: string | null
}

interface BetGroup {
  groupId: string | null
  bets: Bet[]
  combinedOdds: number
  totalStake: number
  totalPotentialGain: number
  status: "pending" | "won" | "lost"
  isCombo: boolean
}

function groupBets(bets: Bet[]): BetGroup[] {
  const groups: Map<string, BetGroup> = new Map()
  const uniqueIds = new Set<string>()

  for (const bet of bets) {
    // Skip duplicates
    if (uniqueIds.has(bet.id)) continue
    uniqueIds.add(bet.id)

    const groupKey = bet.bet_group_id || `single-${bet.id}`
    const isCombo = !!bet.bet_group_id

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupId: bet.bet_group_id || null,
        bets: [],
        combinedOdds: 1,
        totalStake: 0,
        totalPotentialGain: 0,
        status: bet.status,
        isCombo,
      })
    }

    const group = groups.get(groupKey)!
    group.bets.push(bet)
    group.combinedOdds *= bet.odds
    group.totalStake += bet.stake
    group.totalPotentialGain += bet.potential_gain

    // Update status (if any bet is won/lost, the combo is won/lost)
    if (bet.status !== "pending") {
      group.status = bet.status
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const dateA = new Date(a.bets[0]?.placed_at || 0).getTime()
    const dateB = new Date(b.bets[0]?.placed_at || 0).getTime()
    return dateB - dateA
  })
}

export default function BetsPageDesktop() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])
  const [betGroups, setBetGroups] = useState<BetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all")
  const [selectedGroup, setSelectedGroup] = useState<BetGroup | null>(null)

  useEffect(() => {
    const fetchBets = async () => {
      try {
        if (!user) return

        const res = await fetch("/api/bets")
        if (res.ok) {
          const data = await res.json()
          const allBets = Array.isArray(data) ? data : data.bets || []
          setBets(allBets)
          setBetGroups(groupBets(allBets))
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paris:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBets()
  }, [user])

  const filteredGroups = betGroups.filter(group => {
    if (filter === "all") return true
    return group.status === filter
  })

  const stats = {
    total: betGroups.length,
    won: betGroups.filter(g => g.status === "won").length,
    lost: betGroups.filter(g => g.status === "lost").length,
    pending: betGroups.filter(g => g.status === "pending").length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-[var(--emerald-50)] text-[var(--emerald-700)]"
      case "lost":
        return "bg-[#FEE2E2] text-[#991B1B]"
      default:
        return "bg-[var(--bg-2)] text-[var(--fg-2)]"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "won":
        return "✓ Gagné"
      case "lost":
        return "✗ Perdu"
      default:
        return "⏳ En attente"
    }
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-1)] flex flex-row pb-0">
      {/* Left side: List of bets */}
      <div className="w-[65%] flex flex-col border-r border-[var(--border-light)]">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-[var(--border-light)]">
          <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
            Mes Paris
          </h1>
          <p className="text-[var(--fg-2)] mt-1">Historique et détails de vos paris</p>
        </div>

        {/* Filter Buttons */}
        {!loading && stats.total > 0 && (
          <div className="flex gap-2 px-8 py-4 border-b border-[var(--border-light)] overflow-x-auto">
            {(["all", "pending", "won", "lost"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all",
                  filter === f
                    ? "bg-[var(--emerald-500)] text-white"
                    : "bg-[var(--bg-1)] border border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
                )}
              >
                {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "won" ? "Gagnés" : "Perdus"}
              </button>
            ))}
          </div>
        )}

        {/* Bets List */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-[var(--fg-3)]">Chargement des paris...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-16 bg-[var(--bg-1)] rounded-[12px] border border-[var(--border-light)] [box-shadow:var(--shadow-card)]">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-[var(--fg-1)] font-semibold mb-2">Aucun pari {filter !== "all" ? `${filter}` : ""}</p>
              <p className="text-[var(--fg-3)] text-sm">Commence par placer des paris sur les matchs disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => (
                <button
                  key={group.groupId || group.bets[0].id}
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "w-full p-4 rounded-[12px] border transition-all text-left",
                    selectedGroup?.groupId === group.groupId
                      ? "bg-[var(--emerald-50)] border-[var(--emerald-500)] [box-shadow:var(--shadow-hover)]"
                      : "bg-[var(--bg-1)] border-[var(--border-light)] [box-shadow:var(--shadow-card)] hover:shadow-[var(--shadow-hover)]"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--fg-1)] text-[14px]">
                          {group.isCombo ? `Pari Combiné (${group.bets.length})` : group.bets[0].match_label}
                        </p>
                      </div>
                      <p className="text-[12px] text-[var(--fg-3)] mt-1">
                        {new Date(group.bets[0].placed_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap h-fit", getStatusColor(group.status))}>
                      {getStatusLabel(group.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-[var(--bg-2)] rounded-lg text-center">
                      <p className="text-[11px] text-[var(--fg-3)] mb-1">{group.isCombo ? "Cotes" : "Sélection"}</p>
                      <p className="font-semibold text-[var(--fg-1)] text-[13px]">
                        {group.isCombo ? group.combinedOdds.toFixed(2) : group.bets[0].selection}
                      </p>
                    </div>
                    <div className="p-2 bg-[var(--bg-2)] rounded-lg text-center">
                      <p className="text-[11px] text-[var(--fg-3)] mb-1">Mise</p>
                      <p className="font-semibold text-[var(--fg-1)] text-[13px]">{group.totalStake} B</p>
                    </div>
                    <div className="p-2 bg-[var(--bg-2)] rounded-lg text-center">
                      <p className="text-[11px] text-[var(--fg-3)] mb-1">Gain pot.</p>
                      <p className="font-semibold text-[var(--fg-1)] text-[13px]">{group.totalPotentialGain.toFixed(2)} B</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Bet details (sticky) */}
      {selectedGroup ? (
        <div className="w-[35%] sticky top-0 h-screen overflow-y-auto relative bg-gradient-to-b" style={{
          backgroundImage: selectedGroup.status === "won"
            ? "linear-gradient(to bottom, rgb(16, 185, 129), rgb(6, 78, 59))"
            : selectedGroup.status === "lost"
            ? "linear-gradient(to bottom, rgb(220, 38, 38), rgb(127, 29, 29))"
            : "linear-gradient(to bottom, rgb(16, 140, 100), rgb(10, 61, 46))"
        }}>
          {/* Close button */}
          <div className="flex justify-end px-6 pt-4">
            <button
              onClick={() => setSelectedGroup(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)]"
            >
              <i className="ti ti-x text-white text-[18px]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 space-y-3">
            {/* Header */}
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-white text-[14px] font-bold">{selectedGroup.isCombo ? "Pari Combiné" : "Pari Simple"}</p>
                {selectedGroup.isCombo && (
                  <p className="text-white text-[11px] text-opacity-70 mt-1">{selectedGroup.bets.length} sélections</p>
                )}
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <span className={cn(
                "px-4 py-2 rounded-full text-white text-[12px] font-bold",
                selectedGroup.status === "won"
                  ? "bg-[rgba(255,255,255,0.2)]"
                  : selectedGroup.status === "lost"
                  ? "bg-[rgba(0,0,0,0.2)]"
                  : "bg-[rgba(255,255,255,0.15)]"
              )}>
                {getStatusLabel(selectedGroup.status)}
              </span>
            </div>

            {/* Combined Odds */}
            <div className="text-center">
              <p className="text-white text-[11px] text-opacity-70 mb-1">Cote combinée</p>
              <p className="text-white text-[28px] font-bold [font-family:var(--font-display)]">
                {selectedGroup.combinedOdds.toFixed(2)}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[rgba(255,255,255,0.08)] rounded-[8px] p-2.5 border border-[rgba(255,255,255,0.1)]">
                <p className="text-[10px] text-[rgba(255,255,255,0.7)] mb-1">Mise totale</p>
                <p className="text-[12px] font-semibold text-white">{selectedGroup.totalStake} B</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.08)] rounded-[8px] p-2.5 border border-[rgba(255,255,255,0.1)]">
                <p className="text-[10px] text-[rgba(255,255,255,0.7)] mb-1">Gain potentiel</p>
                <p className="text-[12px] font-semibold text-white">
                  {selectedGroup.totalPotentialGain.toFixed(2)} B
                </p>
              </div>
            </div>

            {/* Selections list */}
            {selectedGroup.isCombo && (
              <div className="space-y-2">
                <p className="text-[10px] text-[rgba(255,255,255,0.7)]">SÉLECTIONS</p>
                {selectedGroup.bets.map((bet, idx) => (
                  <div key={bet.id} className="bg-[rgba(255,255,255,0.08)] rounded-[8px] p-2.5 border border-[rgba(255,255,255,0.1)]">
                    <p className="text-[9px] text-[rgba(255,255,255,0.6)] mb-1">Match {idx + 1}</p>
                    <p className="text-[11px] font-semibold text-white mb-1">{bet.match_label}</p>
                    <div className="grid grid-cols-3 gap-1 text-[9px]">
                      <div>
                        <p className="text-[rgba(255,255,255,0.6)]">Sélection</p>
                        <p className="text-white font-semibold">{bet.selection}</p>
                      </div>
                      <div>
                        <p className="text-[rgba(255,255,255,0.6)]">Cote</p>
                        <p className="text-white font-semibold">{bet.odds.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[rgba(255,255,255,0.6)]">Marché</p>
                        <p className="text-white font-semibold">{bet.market}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reward display */}
            {selectedGroup.status !== "pending" && (
              <div className="bg-[rgba(255,255,255,0.1)] rounded-[8px] p-3 border border-[rgba(255,255,255,0.2)]">
                <p className="text-[11px] text-[rgba(255,255,255,0.8)] mb-2 text-center">Résultat final</p>
                {selectedGroup.status === "won" ? (
                  <p className="text-[24px] font-bold [font-family:var(--font-display)] text-white text-center">
                    +{(selectedGroup.totalPotentialGain - selectedGroup.totalStake).toFixed(2)} B
                  </p>
                ) : (
                  <p className="text-[24px] font-bold [font-family:var(--font-display)] text-white text-center">
                    -{selectedGroup.totalStake} B
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-[35%] sticky top-0 h-screen bg-gradient-to-b from-[var(--emerald-900)] to-[#0a3d2e] flex items-center justify-center">
          <div className="text-center">
            <div className="text-[48px] mb-3">👈</div>
            <p className="text-white text-[14px] font-semibold">Sélectionne un pari</p>
            <p className="text-[rgba(255,255,255,0.7)] text-[12px] mt-1">pour voir les détails</p>
          </div>
        </div>
      )}
    </div>
  )
}
