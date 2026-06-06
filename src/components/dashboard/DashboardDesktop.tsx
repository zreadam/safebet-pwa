"use client"

import { useState } from "react"
import Link from "next/link"
import { MatchCard } from "@/components/match/MatchCard"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { cn } from "@/lib/utils"
import type { Match, Quest, League, LeagueMember } from "@/types"

interface DashboardDesktopProps {
  matches: Match[]
  quests: Quest[]
  leagues: League[]
  balance: number
  onMatchCardClick?: (match: Match) => void
}

export function DashboardDesktop({
  matches,
  quests,
  leagues,
  balance,
  onMatchCardClick,
}: DashboardDesktopProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "live" | "soon" | "done">("all")

  const filteredMatches =
    selectedFilter === "all"
      ? matches
      : matches.filter((m) => m.state === selectedFilter)

  const liveMatches = matches.filter((m) => m.state === "live")
  const soonMatches = matches.filter((m) => m.state === "soon")
  const doneMatches = matches.filter((m) => m.state === "done")

  return (
    <div className="space-y-8">
      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Matchs en direct"
          value={liveMatches.length}
          icon="ti-ball-football"
          color="emerald"
        />
        <StatCard
          title="À venir"
          value={soonMatches.length}
          icon="ti-clock"
          color="blue"
        />
        <StatCard
          title="Terminés"
          value={doneMatches.length}
          icon="ti-check"
          color="gray"
        />
        <StatCard
          title="Solde"
          value={balance.toFixed(0)}
          icon="ti-coins"
          color="amber"
          badge="B"
        />
      </div>

      {/* ── FILTERS ── */}
      <div className="flex gap-2">
        {(["all", "live", "soon", "done"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              selectedFilter === filter
                ? "bg-[var(--emerald-500)] text-white"
                : "bg-[var(--bg-2)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
            )}
          >
            {filter === "all" && "Tous"}
            {filter === "live" && "En direct"}
            {filter === "soon" && "À venir"}
            {filter === "done" && "Terminés"}
          </button>
        ))}
      </div>

      {/* ── MATCHES GRID ── */}
      <div>
        <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
          Matchs ({filteredMatches.length})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-[var(--fg-3)]">Aucun match pour ce filtre</p>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div key={match.id} onClick={() => onMatchCardClick?.(match)}>
                <MatchCard match={match} interactive />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── SIDE BY SIDE: QUÊTES + LIGUES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QUÊTES */}
        <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
          <h3 className="text-lg font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            ⭐ Quêtes
          </h3>
          <div className="space-y-2">
            {quests.length === 0 ? (
              <p className="text-sm text-[var(--fg-3)]">Aucune quête disponible</p>
            ) : (
              quests.map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center justify-between p-3 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)]"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--fg-1)]">{quest.title}</p>
                    <p className="text-xs text-[var(--fg-3)] mt-1">{quest.description}</p>
                    <div className="mt-2 w-full bg-[var(--bg-2)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[var(--emerald-500)] h-full transition-all"
                        style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--fg-3)] mt-1">
                      {quest.progress} / {quest.total}
                    </p>
                  </div>
                  {quest.is_done && (
                    <div className="ml-3 px-2 py-1 rounded bg-[var(--emerald-500)] text-white text-xs font-semibold">
                      +{quest.reward} B
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <Link
            href="/quetes"
            className="mt-4 w-full py-2 px-4 rounded-lg text-center text-sm font-medium bg-[var(--emerald-500)] text-white hover:opacity-90 transition-opacity"
          >
            Voir toutes les quêtes
          </Link>
        </div>

        {/* LIGUES */}
        <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
          <h3 className="text-lg font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            👥 Mes Ligues
          </h3>
          <div className="space-y-2">
            {leagues.length === 0 ? (
              <p className="text-sm text-[var(--fg-3)]">Pas encore dans une ligue</p>
            ) : (
              leagues.map((league) => (
                <div
                  key={league.id}
                  className="p-3 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] hover:border-[var(--emerald-500)] transition-colors cursor-pointer"
                >
                  <Link href={`/ligues/${league.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--fg-1)]">{league.name}</p>
                        <p className="text-xs text-[var(--fg-3)]">{league.member_count} membre{league.member_count > 1 ? "s" : ""}</p>
                      </div>
                      <i className="ti ti-chevron-right text-[var(--fg-3)]" />
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
          <Link
            href="/ligues"
            className="mt-4 w-full py-2 px-4 rounded-lg text-center text-sm font-medium bg-[var(--emerald-500)] text-white hover:opacity-90 transition-opacity"
          >
            Gérer les ligues
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── STAT CARD COMPONENT ── */
interface StatCardProps {
  title: string
  value: number | string
  icon: string
  color: "emerald" | "blue" | "gray" | "amber"
  badge?: string
}

function StatCard({ title, value, icon, color, badge }: StatCardProps) {
  const bgMap = {
    emerald: "bg-[var(--emerald-50)]",
    blue: "bg-blue-50",
    gray: "bg-gray-50",
    amber: "bg-amber-50",
  }

  const colorMap = {
    emerald: "text-[var(--emerald-600)]",
    blue: "text-blue-600",
    gray: "text-gray-600",
    amber: "text-amber-600",
  }

  return (
    <div className={cn("p-4 rounded-lg border border-[var(--border-light)]", bgMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--fg-3)] mb-2">{title}</p>
          <p className={cn("text-3xl font-bold [font-family:var(--font-display)]", colorMap[color])}>
            {value}
            {badge && <span className="text-lg ml-1">{badge}</span>}
          </p>
        </div>
        <i className={cn("ti text-2xl", icon, colorMap[color])} />
      </div>
    </div>
  )
}
