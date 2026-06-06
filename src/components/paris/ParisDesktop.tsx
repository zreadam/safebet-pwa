"use client"

import Link from "next/link"
import { MatchCard } from "@/components/match/MatchCard"
import { cn } from "@/lib/utils"
import type { Match } from "@/types"

interface ParisDesktopProps {
  matches: Match[]
}

export function ParisDesktop({ matches }: ParisDesktopProps) {
  const liveMatches = matches.filter(m => m.state === "live")
  const soonMatches = matches.filter(m => m.state === "soon")
  const doneMatches = matches.filter(m => m.state === "done")

  return (
    <div className="space-y-8">
      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="En direct" value={liveMatches.length} color="emerald" icon="ti-ball-football" />
        <StatCard title="À venir" value={soonMatches.length} color="blue" icon="ti-clock" />
        <StatCard title="Terminés" value={doneMatches.length} color="gray" icon="ti-check" />
      </div>

      {/* ── MATCHS EN DIRECT ── */}
      {liveMatches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            ⚽ En Direct ({liveMatches.length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}

      {/* ── MATCHS À VENIR ── */}
      {soonMatches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            ⏰ À Venir ({soonMatches.length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {soonMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}

      {/* ── MATCHS TERMINÉS ── */}
      {doneMatches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            ✅ Terminés ({doneMatches.length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {doneMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[var(--fg-3)] mb-4">Aucun match disponible</p>
          <Link href="/dashboard" className="text-[var(--emerald-500)] hover:underline">
            Retour au tableau de bord
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  const bgMap = { emerald: "bg-[var(--emerald-50)]", blue: "bg-blue-50", gray: "bg-gray-50" }
  const colorMap = { emerald: "text-[var(--emerald-600)]", blue: "text-blue-600", gray: "text-gray-600" }

  return (
    <div className={cn("p-4 rounded-lg border border-[var(--border-light)]", bgMap[color as keyof typeof bgMap])}>
      <p className="text-sm text-[var(--fg-3)] mb-2">{title}</p>
      <div className="flex items-center justify-between">
        <p className={cn("text-3xl font-bold [font-family:var(--font-display)]", colorMap[color as keyof typeof colorMap])}>{value}</p>
        <i className={cn("ti text-2xl", icon, colorMap[color as keyof typeof colorMap])} />
      </div>
    </div>
  )
}
