"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { getDisplayOdds, getMarketLabel } from "@/lib/odds-formatter"
import type { Match } from "@/types"

export default function DashboardDesktop() {
  const { profile } = useProfile()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const selectedMarket = "result" // Force "result" market

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setMatches(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des matchs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Accueil
        </h1>
        <p className="text-[var(--fg-2)] mt-1">Bienvenue dans ton espace de paris sportifs</p>
      </div>

      {/* Welcome Strip */}
      <div className="mb-6 p-6 rounded-[12px] bg-gradient-to-r from-[var(--emerald-500)] to-[var(--emerald-600)] text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-16 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative">
          <h2 className="text-[24px] font-bold [font-family:var(--font-display)]">
            Bienvenue {profile?.username ? `${profile.username}` : "!"}
          </h2>
          <p className="text-white/90 mt-1">Fais tes pronostics et remporte des récompenses</p>
          <div className="ml-auto text-right mt-4">
            <p className="text-white/80 text-xs uppercase tracking-wide">Solde</p>
            <p className="text-[32px] font-bold [font-family:var(--font-display)] mt-1">
              {profile?.balance.toFixed(2)} B
            </p>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[20px] font-semibold [font-family:var(--font-display)] text-[var(--fg-1)]">
              Matchs Disponibles
            </h2>
            <p className="text-[12px] text-[var(--fg-3)] mt-1">
              Cotes affichées: {getMarketLabel(selectedMarket)}
            </p>
          </div>
          <Link href="/paris" className="text-[var(--emerald-600)] font-semibold hover:underline">
            Voir tous →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[var(--fg-3)]">Chargement des matchs...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-1)] rounded-[12px]">
            <p className="text-[var(--fg-3)]">Aucun match disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {matches.slice(0, 4).map((match) => (
              <Link
                key={match.id}
                href={`/paris?match=${match.id}`}
                className={cn(
                  "p-5 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-1)] hover:shadow-[var(--shadow-hover)] transition-all cursor-pointer",
                  match.state === "live" && "border-t-4 border-t-[var(--emerald-500)]"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-[var(--fg-2)]">
                      {match.competition || "Match"}
                    </span>
                    {match.state !== "live" && match.state !== "done" && (
                      <span className="text-[11px] text-[var(--fg-3)]">
                        {(() => {
                          const kickoffDate = new Date(match.kickoff)
                          const today = new Date()
                          const tomorrow = new Date(today)
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          const isToday = kickoffDate.toDateString() === today.toDateString()
                          const isTomorrow = kickoffDate.toDateString() === tomorrow.toDateString()
                          const dateLabel = isToday
                            ? "Aujourd'hui"
                            : isTomorrow
                            ? "Demain"
                            : kickoffDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" })
                          const timeLabel = kickoffDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
                          return `${dateLabel} à ${timeLabel}`
                        })()}
                      </span>
                    )}
                  </div>
                  {match.state === "live" && (
                    <span className="text-[11px] font-semibold bg-[var(--error)] text-white px-2 py-1 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      EN DIRECT
                    </span>
                  )}
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--emerald-100)] flex items-center justify-center mx-auto mb-2">
                      <span className="text-[16px]">⚽</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--fg-1)]">
                      {match.home_team}
                    </p>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="text-[28px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                      {match.home_score ?? "—"} — {match.away_score ?? "—"}
                    </p>
                    {match.minute && (
                      <p className="text-[11px] text-[var(--fg-3)]">{match.minute}′</p>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--emerald-100)] flex items-center justify-center mx-auto mb-2">
                      <span className="text-[16px]">⚽</span>
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--fg-1)]">
                      {match.away_team}
                    </p>
                  </div>
                </div>

                {/* Odds */}
                <div className={cn(
                  "gap-2",
                  getDisplayOdds(match, selectedMarket).length === 3 ? "grid grid-cols-3" : "grid grid-cols-2"
                )}>
                  {getDisplayOdds(match, selectedMarket).map((odd) => (
                    <button
                      key={odd.key}
                      className="py-2 px-2 rounded-[10px] border border-[var(--border-light)] bg-[var(--bg-2)] hover:border-[var(--emerald-300)] hover:bg-[var(--emerald-50)] transition-colors text-center"
                    >
                      <p className="text-[11px] text-[var(--fg-3)]">{odd.label}</p>
                      <p className="text-[16px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                        {(odd.value || 0).toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
