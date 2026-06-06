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
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-2)] rounded-[12px] border border-[var(--border-light)]">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-[var(--fg-1)] font-semibold mb-1">Aucun match disponible</p>
          <p className="text-[var(--fg-3)] text-sm">Les matchs seront bientôt disponibles. Reviens plus tard!</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-2)] rounded-[12px] border border-[var(--border-light)]">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[var(--fg-1)] font-semibold mb-1">Aucun match ce jour</p>
          <p className="text-[var(--fg-3)] text-sm">Sélectionne une autre date ou reviens demain</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => {
            const cc = getCompetitionColor(match)
            const live = match.state === "live"
            const done = match.state === "done"

            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className={cn(
                  "rounded-[12px] border border-[var(--border-light)]",
                  "bg-[var(--bg-1)] p-4 cursor-pointer transition-all duration-200",
                  "hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] active:scale-95",
                  "animate-card-in",
                  live && "border-t-2 border-t-[var(--emerald-500)]",
                  "[box-shadow:var(--shadow-card)]"
                )}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-[7px] text-xs font-semibold text-[var(--fg-2)]">
                    <span
                      className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: cc }}
                    >
                      {match.competition[0]}
                    </span>
                    {match.competition_name || match.competition}
                  </span>
                  {live && (
                    <span className="flex items-center gap-[5px] text-[10px] font-semibold bg-[var(--error)] text-white px-2 py-1 rounded-full animate-pulse">
                      <span className="w-[5px] h-[5px] rounded-full bg-white" />
                      LIVE {match.minute}
                    </span>
                  )}
                  {done && <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full bg-[var(--emerald-50)] text-[var(--emerald-900)]">Terminé</span>}
                  {!live && !done && (
                    <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full bg-[#EFF6FF] text-[#1E3A5F]">
                      {new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                    </span>
                  )}
                </div>

                {/* Teams - Same as mobile design */}
                <div className="flex items-center justify-between mb-[14px]">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="rounded-full flex items-center justify-center font-bold w-8 h-8 text-xs [font-family:var(--font-display)]"
                      style={{
                        background: `${cc}22`,
                        color: cc,
                      }}
                    >
                      {match.home_team_code?.slice(0, 3)}
                    </div>
                    <span className="text-xs font-medium text-[var(--fg-2)] text-center">{match.home_team}</span>
                  </div>

                  {/* Score */}
                  <div className="text-center px-2">
                    <div className="font-bold text-xl leading-none [font-family:var(--font-display)] text-[var(--fg-1)] whitespace-nowrap">
                      {(live || done) && match.home_score !== null && match.away_score !== null
                        ? `${match.home_score} – ${match.away_score}`
                        : "–"}
                    </div>
                    {live && <div className="text-xs text-[var(--fg-3)] mt-1">{match.minute}</div>}
                    {!live && !done && (
                      <div className="text-xs text-[var(--fg-3)] mt-1">
                        {new Date(match.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className="rounded-full flex items-center justify-center font-bold w-8 h-8 text-xs [font-family:var(--font-display)]"
                      style={{
                        background: `${cc}22`,
                        color: cc,
                      }}
                    >
                      {match.away_team_code?.slice(0, 3)}
                    </div>
                    <span className="text-xs font-medium text-[var(--fg-2)] text-center">{match.away_team}</span>
                  </div>
                </div>

                {/* Odds - Bottom */}
                <div className="flex gap-2">
                  {(["1", "N", "2"] as const).map((key, i) => {
                    const oddsVal = [match.odds_1, match.odds_n, match.odds_2][i]
                    const hasOdds = oddsVal !== null && oddsVal !== undefined
                    const oddsDisplay = hasOdds ? oddsVal.toFixed(2) : "–"

                    return (
                      <div
                        key={key}
                        className="flex-1 border rounded-lg py-2 text-center bg-[var(--bg-2)]"
                        style={{ opacity: hasOdds ? 1 : 0.6 }}
                      >
                        <span className="block text-[10px] text-[var(--fg-3)] mb-1">{key}</span>
                        <span className="block font-bold text-sm [font-family:var(--font-display)] text-[var(--fg-1)]">{oddsDisplay}</span>
                      </div>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
