"use client"

import Link from "next/link"
import type { League } from "@/types"

interface LiguesDesktopProps {
  leagues: League[]
}

export function LiguesDesktop({ leagues }: LiguesDesktopProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Mes Ligues
        </h1>
        <Link href="/ligues/creer" className="px-4 py-2 rounded-lg bg-[var(--emerald-500)] text-white font-bold">
          + Créer une ligue
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {leagues.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-[var(--fg-3)] mb-4">Pas encore dans une ligue</p>
            <Link href="/ligues/creer" className="text-[var(--emerald-500)] hover:underline">
              En créer une →
            </Link>
          </div>
        ) : (
          leagues.map(league => (
            <Link key={league.id} href={`/ligues/${league.id}`}>
              <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-4 hover:border-[var(--emerald-500)] transition-colors">
                <div
                  className="w-full h-20 rounded-lg mb-3 flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: league.color }}
                >
                  {league.name[0]}
                </div>
                <h3 className="font-bold text-[var(--fg-1)] mb-2">{league.name}</h3>
                <p className="text-xs text-[var(--fg-3)]">{league.member_count} membre{league.member_count > 1 ? "s" : ""}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
          🔍 Découvrir
        </h2>
        <Link href="/ligues/rejoindre" className="block p-6 bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] hover:border-[var(--emerald-500)] transition-colors">
          <p className="font-bold text-[var(--fg-1)]">Rejoindre une ligue publique</p>
          <p className="text-sm text-[var(--fg-3)] mt-1">Trouver et rejoindre des ligues d'autres joueurs</p>
        </Link>
      </div>
    </div>
  )
}
