"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Bet {
  id: string
  match_id: string
  home_team: string
  away_team: string
  prediction: string
  odds: number
  amount: number
  status: "pending" | "won" | "lost"
  created_at: string
  match_date: string
}

export default function BetsPageMobile() {
  const router = useRouter()
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all")
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)

  useEffect(() => {
    const fetchBets = async () => {
      try {
        if (!user) return

        const res = await fetch("/api/bets")
        if (res.ok) {
          const data = await res.json()
          setBets(Array.isArray(data) ? data : data.bets || [])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paris:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBets()
  }, [user])

  const filteredBets = bets.filter(bet => {
    if (filter === "all") return true
    return bet.status === filter
  })

  const stats = {
    total: bets.length,
    won: bets.filter(b => b.status === "won").length,
    lost: bets.filter(b => b.status === "lost").length,
    pending: bets.filter(b => b.status === "pending").length,
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

  if (selectedBet) {
    return (
      <div className="min-h-screen bg-gradient-to-b px-4 pt-4 pb-6" style={{
        backgroundImage: selectedBet.status === "won"
          ? "linear-gradient(to bottom, rgb(16, 185, 129), rgb(6, 78, 59))"
          : selectedBet.status === "lost"
          ? "linear-gradient(to bottom, rgb(220, 38, 38), rgb(127, 29, 29))"
          : "linear-gradient(to bottom, rgb(16, 140, 100), rgb(10, 61, 46))"
      }}>
        {/* Back button */}
        <button
          onClick={() => setSelectedBet(null)}
          className="mb-4 w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)]"
        >
          <i className="ti ti-chevron-left text-white text-[20px]" />
        </button>

        {/* Teams + Odds */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 text-center">
              <p className="text-white text-[12px] mb-2">{selectedBet.home_team}</p>
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center mx-auto">
                <span className="text-white text-[11px] font-bold">HOM</span>
              </div>
            </div>
            <div className="text-center px-2">
              <p className="text-white text-[10px] font-semibold mb-1">Cote</p>
              <p className="text-white text-[24px] font-bold [font-family:var(--font-display)]">
                {selectedBet.odds.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-white text-[12px] mb-2">{selectedBet.away_team}</p>
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.15)] flex items-center justify-center mx-auto">
                <span className="text-white text-[11px] font-bold">EXT</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center">
            <span className={cn(
              "px-4 py-2 rounded-full text-white text-[12px] font-bold",
              selectedBet.status === "won"
                ? "bg-[rgba(255,255,255,0.2)]"
                : selectedBet.status === "lost"
                ? "bg-[rgba(0,0,0,0.2)]"
                : "bg-[rgba(255,255,255,0.15)]"
            )}>
              {getStatusLabel(selectedBet.status)}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="bg-[rgba(255,255,255,0.08)] rounded-[8px] p-3 border border-[rgba(255,255,255,0.1)]">
              <p className="text-[10px] text-[rgba(255,255,255,0.7)] mb-1">Prédiction</p>
              <p className="text-[13px] font-semibold text-white">{selectedBet.prediction}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[rgba(255,255,255,0.08)] rounded-[8px] p-3 border border-[rgba(255,255,255,0.1)]">
                <p className="text-[10px] text-[rgba(255,255,255,0.7)] mb-1">Mise</p>
                <p className="text-[13px] font-semibold text-white">{selectedBet.amount} B</p>
              </div>
              <div className="bg-[rgba(255,255,255,0.08)] rounded-[8px] p-3 border border-[rgba(255,255,255,0.1)]">
                <p className="text-[10px] text-[rgba(255,255,255,0.7)] mb-1">Gain pot.</p>
                <p className="text-[13px] font-semibold text-white">
                  {(selectedBet.amount * selectedBet.odds).toFixed(2)} B
                </p>
              </div>
            </div>
          </div>

          {/* Reward */}
          {selectedBet.status !== "pending" && (
            <div className="bg-[rgba(255,255,255,0.1)] rounded-[8px] p-4 border border-[rgba(255,255,255,0.2)]">
              <p className="text-[11px] text-[rgba(255,255,255,0.8)] mb-2 text-center">Résultat final</p>
              {selectedBet.status === "won" ? (
                <p className="text-[28px] font-bold [font-family:var(--font-display)] text-white text-center">
                  +{(selectedBet.amount * selectedBet.odds - selectedBet.amount).toFixed(2)} B
                </p>
              ) : (
                <p className="text-[28px] font-bold [font-family:var(--font-display)] text-white text-center">
                  -{selectedBet.amount} B
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 pt-6 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Mes Paris
        </h1>
        <p className="text-[var(--fg-2)] mt-1">Historique de vos paris</p>
      </div>

      {/* Filter Buttons */}
      {!loading && stats.total > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
      {loading ? (
        <div className="text-center py-12">
          <p className="text-[var(--fg-3)]">Chargement des paris...</p>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-1)] rounded-[12px] border border-[var(--border-light)]">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-[var(--fg-1)] font-semibold mb-2">Aucun pari</p>
          <p className="text-[var(--fg-3)] text-sm">Place tes premiers paris!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBets.map((bet) => (
            <button
              key={bet.id}
              onClick={() => setSelectedBet(bet)}
              className="w-full p-4 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-1)] [box-shadow:var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all text-left active:scale-95"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[var(--fg-1)] text-[14px] mb-1">
                    {bet.home_team} vs {bet.away_team}
                  </p>
                  <p className="text-[12px] text-[var(--fg-3)]">
                    {new Date(bet.match_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className={cn("px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap h-fit", getStatusColor(bet.status))}>
                  {getStatusLabel(bet.status)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-[var(--bg-2)] rounded-lg text-center">
                  <p className="text-[11px] text-[var(--fg-3)] mb-1">Prédiction</p>
                  <p className="font-semibold text-[var(--fg-1)] text-[13px]">{bet.prediction}</p>
                </div>
                <div className="p-2 bg-[var(--bg-2)] rounded-lg text-center">
                  <p className="text-[11px] text-[var(--fg-3)] mb-1">Cote</p>
                  <p className="font-semibold text-[var(--fg-1)] text-[13px]">{bet.odds.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-[var(--bg-2)] rounded-lg text-center">
                  <p className="text-[11px] text-[var(--fg-3)] mb-1">Mise</p>
                  <p className="font-semibold text-[var(--fg-1)] text-[13px]">{bet.amount}B</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
