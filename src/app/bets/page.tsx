"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
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

export default function BetsPage() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all")

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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Mes Paris
        </h1>
        <p className="text-[var(--fg-2)] mt-1">Historique de vos paris placés</p>
      </div>

      {/* Stats Cards */}
      {!loading && stats.total > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)]">
            <p className="text-[var(--fg-3)] text-sm mb-1">Total</p>
            <p className="text-[24px] font-bold [font-family:var(--font-display)]">{stats.total}</p>
          </div>
          <div className="p-4 bg-[var(--emerald-50)] rounded-lg border border-[var(--emerald-200)]">
            <p className="text-[var(--emerald-700)] text-sm mb-1">Gagnés</p>
            <p className="text-[24px] font-bold [font-family:var(--font-display)] text-[var(--emerald-700)]">{stats.won}</p>
          </div>
          <div className="p-4 bg-[#FEE2E2] rounded-lg border border-[#FECACA]">
            <p className="text-[#991B1B] text-sm mb-1">Perdus</p>
            <p className="text-[24px] font-bold [font-family:var(--font-display)] text-[#991B1B]">{stats.lost}</p>
          </div>
          <div className="p-4 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)]">
            <p className="text-[var(--fg-3)] text-sm mb-1">En attente</p>
            <p className="text-[24px] font-bold [font-family:var(--font-display)]">{stats.pending}</p>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      {!loading && stats.total > 0 && (
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "won", "lost"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full font-semibold text-sm transition-all",
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
        <div className="text-center py-12 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)]">
          <p className="text-[var(--fg-2)] mb-1">Aucun pari {filter !== "all" ? `${filter}` : ""}</p>
          <p className="text-[var(--fg-3)] text-sm">Commence par placer des paris sur les matchs disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBets.map((bet) => (
            <div
              key={bet.id}
              className="p-4 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] hover:shadow-[var(--shadow-hover)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-[var(--fg-1)] mb-1">
                    {bet.home_team} vs {bet.away_team}
                  </p>
                  <p className="text-[13px] text-[var(--fg-3)]">
                    {new Date(bet.match_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[13px] text-[var(--fg-3)] mb-1">Prédiction</p>
                    <p className="font-semibold text-[var(--fg-1)]">{bet.prediction}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[13px] text-[var(--fg-3)] mb-1">Cote</p>
                    <p className="font-semibold text-[var(--fg-1)]">{bet.odds.toFixed(2)}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[13px] text-[var(--fg-3)] mb-1">Montant</p>
                    <p className="font-semibold text-[var(--fg-1)]">{bet.amount} B</p>
                  </div>
                  
                  <div className={cn("px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap", getStatusColor(bet.status))}>
                    {getStatusLabel(bet.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
