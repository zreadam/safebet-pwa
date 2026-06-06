"use client"

import Link from "next/link"
import { BluffBadge } from "@/components/ui/bluff-badge"
import type { Profile } from "@/types"

interface ProfilDesktopProps {
  profile: Profile | null
}

export function ProfilDesktop({ profile }: ProfilDesktopProps) {
  if (!profile) {
    return <div className="text-center py-12">Chargement...</div>
  }

  const isPremium = profile.tier === "premium"

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── HEADER ── */}
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-2xl bg-[var(--emerald-500)] flex items-center justify-center text-white text-5xl font-bold flex-shrink-0">
          {profile.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-2">
            {profile.username ?? "Utilisateur"}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${isPremium ? "bg-[var(--amber-50)] text-[var(--amber-700)]" : "bg-[var(--bg-3)] text-[var(--fg-3)]"}`}>
              {isPremium ? "✨ PREMIUM" : "FREE"}
            </span>
            <BluffBadge value={profile.balance.toFixed(2)} />
          </div>
          <p className="text-sm text-[var(--fg-3)]">{profile.country}</p>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="Paris placés" value={profile.total_bets} />
        <StatBox label="Taux de réussite" value={`${Math.round((profile.win_rate ?? 0) * 100)}%`} />
        <StatBox label="Série 🔥" value={profile.streak} />
        <StatBox label="Équipe favoritie" value={profile.favorite_team ?? "—"} />
      </div>

      {/* ── PARAMETRES ── */}
      <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
        <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
          ⚙️ Paramètres
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/profil/parametres" className="p-4 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] hover:border-[var(--emerald-500)] transition-colors">
            <p className="font-bold text-[var(--fg-1)]">Général</p>
            <p className="text-xs text-[var(--fg-3)]">Profil, avatar, paramètres</p>
          </Link>
          {!isPremium && (
            <Link href="/premium" className="p-4 bg-[var(--bg-1)] rounded-lg border border-[var(--border-light)] hover:border-[var(--emerald-500)] transition-colors">
              <p className="font-bold text-[var(--fg-1)]">✨ Premium</p>
              <p className="text-xs text-[var(--fg-3)]">Passer à Premium</p>
            </Link>
          )}
        </div>
      </div>

      {/* ── INFOS ── */}
      <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-6">
        <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
          ℹ️ Infos Compte
        </h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-[var(--fg-3)]">Email :</span> <span className="font-medium text-[var(--fg-1)]">{profile.id}</span></p>
          <p><span className="text-[var(--fg-3)]">Créé le :</span> <span className="font-medium text-[var(--fg-1)]">{new Date(profile.created_at).toLocaleDateString("fr-FR")}</span></p>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-[var(--bg-2)] rounded-lg border border-[var(--border-light)] p-4 text-center">
      <p className="text-2xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-1">
        {value}
      </p>
      <p className="text-xs text-[var(--fg-3)]">{label}</p>
    </div>
  )
}
