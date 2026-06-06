"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Bet } from "@/types"

export default function ParisDesktop() {
  const { profile } = useProfile()
  const [bets, setBets] = useState<Bet[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("bets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        setBets((data as Bet[]) || [])
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBets()
  }, [])

  const filteredBets = filter === "all"
    ? bets
    : bets.filter(b => b.status === filter)

  const stats = {
    total: bets.length,
    won: bets.filter(b => b.status === "won").length,
    lost: bets.filter(b => b.status === "lost").length,
    pending: bets.filter(b => b.status === "pending").length,
  }

  const statusBg: Record<string, string> = {
    won: "bg-[var(--emerald-50)]",
    lost: "bg-[#FEF2F2]",
    pending: "bg-[#EFF6FF]",
    void: "bg-[var(--bg-3)]",
  }

  const statusText: Record<string, string> = {
    won: "text-[var(--emerald-900)]",
    lost: "text-[#991B1B]",
    pending: "text-[#1E3A5F]",
    void: "text-[var(--fg-3)]",
  }

  const statusLabel: Record<string, string> = {
    won: "Gagné",
    lost: "Perdu",
    pending: "En cours",
    void: "Annulé",
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Mes Paris
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "var(--fg-1)" },
          { label: "Gagnés", value: stats.won, color: "var(--emerald-600)" },
          { label: "Perdus", value: stats.lost, color: "var(--error)" },
          { label: "En cours", value: stats.pending, color: "var(--info)" },
        ].map((m) => (
          <div
            key={m.label}
            className="p-4 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-1)]"
          >
            <p className="text-[11px] text-[var(--fg-3)] uppercase tracking-wide">{m.label}</p>
            <p
              className="text-[26px] font-bold [font-family:var(--font-display)] mt-2"
              style={{ color: m.color }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {[
          { key: "all" as const, label: "Tous" },
          { key: "pending" as const, label: "En cours" },
          { key: "won" as const, label: "Gagnés" },
          { key: "lost" as const, label: "Perdus" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-full text-[14px] font-semibold transition-all",
              filter === f.key
                ? "bg-[var(--emerald-500)] text-white"
                : "bg-[var(--bg-1)] border border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bets List */}
      {loading ? (
        <p className="text-center py-8 text-[var(--fg-3)]">Chargement...</p>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-1)] rounded-[12px]">
          <p className="text-[var(--fg-3)]">Aucun pari trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBets.map((bet) => {
            const gain =
              bet.status === "won"
                ? bet.potential_gain - bet.stake
                : bet.status === "lost"
                ? -bet.stake
                : null

            return (
              <div
                key={bet.id}
                className="p-4 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-1)] flex items-start justify-between"
                style={{
                  borderLeft: `4px solid ${
                    bet.status === "won"
                      ? "var(--emerald-500)"
                      : bet.status === "lost"
                      ? "var(--error)"
                      : "var(--info)"
                  }`,
                }}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--fg-1)]">
                        {bet.match_label}
                      </p>
                      <p className="text-[13px] text-[var(--fg-3)] mt-1">
                        {bet.market} · {bet.selection}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-3 py-1 rounded-full",
                        statusBg[bet.status],
                        statusText[bet.status]
                      )}
                    >
                      {statusLabel[bet.status]}
                    </span>
                  </div>
                  <div className="flex gap-6 text-[13px] mt-3">
                    <div>
                      <p className="text-[var(--fg-3)]">Mise</p>
                      <p className="font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                        {bet.stake} B
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--fg-3)]">Cote</p>
                      <p className="font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                        {bet.odds.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--fg-3)]">Gain potentiel</p>
                      <p className="font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                        {bet.potential_gain} B
                      </p>
                    </div>
                    {gain !== null && (
                      <div>
                        <p className="text-[var(--fg-3)]">Résultat</p>
                        <p
                          className="font-bold [font-family:var(--font-display)]"
                          style={{
                            color:
                              gain >= 0 ? "var(--emerald-600)" : "var(--error)",
                          }}
                        >
                          {gain >= 0 ? "+" : ""}{gain} B
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
