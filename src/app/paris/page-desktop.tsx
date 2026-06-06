"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import type { Match } from "@/types"

export default function ParisDesktop() {
  const { profile } = useProfile()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>("")

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/matches")
        if (res.ok) {
          const data = await res.json()
          setMatches(data.matches || data)
          
          // Set default date to today
          const today = new Date().toISOString().split("T")[0]
          setSelectedDate(today)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des matchs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  // Filter matches by selected date
  const filteredMatches = matches.filter(m => {
    const matchDate = new Date(m.kickoff).toISOString().split("T")[0]
    return matchDate === selectedDate
  })

  // Get unique dates from matches
  const uniqueDates = Array.from(
    new Set(matches.map(m => new Date(m.kickoff).toISOString().split("T")[0]))
  ).sort()

  const getCompetitionColor = (match: Match) => {
    const colors: Record<string, string> = {
      L1: "#1C2951",
      PL: "#3d195b",
      LIGA: "#e01a22",
      BL: "#e01a22",
      SA: "#0067b1",
      UCL: "#0a1a5e",
      CDM: "#C9A227",
      AMICAL: "#8B5CF6",
    }
    return colors[match.competition] || "#6B7280"
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Matchs Disponibles
        </h1>
        <p className="text-[var(--fg-2)] mt-1">Sélectionne un match et place ton pari</p>
      </div>

      {/* Date Selector */}
      {!loading && uniqueDates.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {uniqueDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all",
                selectedDate === date
                  ? "bg-[var(--emerald-500)] text-white"
                  : "bg-[var(--bg-1)] border border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
              )}
            >
              {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </button>
          ))}
        </div>
      )}

      {/* Matches Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-[var(--fg-3)]">Chargement des matchs...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-1)] rounded-[12px]">
          <p className="text-[var(--fg-3)]">Aucun match ce jour</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <Link
              key={match.id}
              href={`/paris?match=${match.id}`}
              className={cn(
                "p-5 rounded-[12px] border-2 bg-[var(--bg-1)] hover:shadow-[var(--shadow-hover)] hover:border-[var(--emerald-500)] transition-all cursor-pointer",
                match.state === "live" && "border-t-4 border-t-[var(--emerald-500)]"
              )}
              style={{
                borderColor:
                  match.state === "live"
                    ? getCompetitionColor(match)
                    : "var(--border-light)",
              }}
            >
              {/* Competition Badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[11px] font-semibold text-white px-2 py-1 rounded-full"
                  style={{ backgroundColor: getCompetitionColor(match) }}
                >
                  {match.competition}
                </span>
                {match.state === "live" && (
                  <span className="text-[11px] font-semibold bg-[var(--error)] text-white px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    EN DIRECT
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="space-y-3 mb-4">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[var(--fg-1)]">
                      {match.home_team}
                    </p>
                  </div>
                  <p className="text-[24px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] ml-2">
                    {match.home_score ?? "—"}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-[var(--border-light)]" />
                  {match.minute && match.state === "live" && (
                    <span className="text-[11px] text-[var(--fg-3)]">{match.minute}</span>
                  )}
                  <div className="flex-1 h-px bg-[var(--border-light)]" />
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[var(--fg-1)]">
                      {match.away_team}
                    </p>
                  </div>
                  <p className="text-[24px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] ml-2">
                    {match.away_score ?? "—"}
                  </p>
                </div>
              </div>

              {/* Odds */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border-light)]">
                <div className="text-center p-2 bg-[var(--bg-2)] rounded-lg hover:bg-[var(--emerald-50)] transition-colors">
                  <p className="text-[11px] text-[var(--fg-3)] mb-1">1</p>
                  <p className="text-[15px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                    {match.odds_1?.toFixed(2) ?? "—"}
                  </p>
                </div>
                <div className="text-center p-2 bg-[var(--bg-2)] rounded-lg hover:bg-[var(--emerald-50)] transition-colors">
                  <p className="text-[11px] text-[var(--fg-3)] mb-1">N</p>
                  <p className="text-[15px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                    {match.odds_n?.toFixed(2) ?? "—"}
                  </p>
                </div>
                <div className="text-center p-2 bg-[var(--bg-2)] rounded-lg hover:bg-[var(--emerald-50)] transition-colors">
                  <p className="text-[11px] text-[var(--fg-3)] mb-1">2</p>
                  <p className="text-[15px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                    {match.odds_2?.toFixed(2) ?? "—"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
