"use client"

import Link from "next/link"

interface ClassementsDesktopProps {
  standings?: Record<string, any>[]
}

export function ClassementsDesktop({ standings = [] }: ClassementsDesktopProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
        Classements Globaux
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
          <h2 className="text-lg font-bold text-[var(--fg-1)] mb-4">👥 Meilleurs Joueurs</h2>
          <p className="text-sm text-[var(--fg-3)]">Classements globaux en construction...</p>
          <Link href="/classements" className="mt-4 inline-block text-[var(--emerald-500)] hover:underline">
            Voir plus →
          </Link>
        </div>

        <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
          <h2 className="text-lg font-bold text-[var(--fg-1)] mb-4">⭐ Meilleurs Taux</h2>
          <p className="text-sm text-[var(--fg-3)]">Classements en construction...</p>
          <Link href="/classements" className="mt-4 inline-block text-[var(--emerald-500)] hover:underline">
            Voir plus →
          </Link>
        </div>
      </div>
    </div>
  )
}
