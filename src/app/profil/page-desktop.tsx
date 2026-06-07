"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { getFlagPath, getCountryName } from "@/lib/flags"

export default function ProfilDesktop() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.email === "aziregue633@gmail.com")
    }
    checkAdmin()
  }, [])

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-6">
        Réglages
      </h1>

      {/* Profile Card */}
      <div className="bg-[var(--bg-1)] rounded-[12px] border border-[var(--border-light)] p-8 mb-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--emerald-500)] flex items-center justify-center text-white font-bold [font-family:var(--font-display)] text-[40px] mx-auto mb-4">
          {profile?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          {profile?.country && (
            <img
              src={getFlagPath(profile.country)}
              alt={getCountryName(profile.country)}
              title={getCountryName(profile.country)}
              className="w-8 h-8 rounded-sm object-cover"
            />
          )}
          <h2 className="text-[24px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
            {profile?.username || "Utilisateur"}
          </h2>
        </div>
        <p className="text-[14px] text-[var(--fg-3)]">{user?.email}</p>
        <div className="flex justify-center gap-4 mt-6">
          <div className="text-center">
            <p className="text-[13px] text-[var(--fg-3)] uppercase tracking-wide">Solde</p>
            <BluffBadge value={profile?.balance.toFixed(2) || "0.00"} />
          </div>
          <div className="text-center">
            <p className="text-[13px] text-[var(--fg-3)] uppercase tracking-wide">Statut</p>
            <p className="text-[15px] font-semibold text-[var(--fg-1)] mt-1">
              {profile?.tier === "premium" ? "Premium" : "Gratuit"}
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-[var(--bg-1)] rounded-[12px] border border-[var(--border-light)] overflow-hidden mb-6">
        {[
          { icon: "bell", label: "Notifications", description: "Gérer tes préférences de notifications" },
          { icon: "lock", label: "Sécurité", description: "Changer ton mot de passe" },
          { icon: "help", label: "Aide", description: "FAQ et support" },
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 border-b border-[var(--border-light)] last:border-0 flex items-center justify-between hover:bg-[var(--bg-2)] cursor-pointer"
          >
            <div>
              <p className="font-semibold text-[var(--fg-1)]">{item.label}</p>
              <p className="text-[13px] text-[var(--fg-3)]">{item.description}</p>
            </div>
            <i className="ti ti-chevron-right text-[var(--fg-3)]" />
          </div>
        ))}
      </div>

      {/* Premium Section */}
      {profile?.tier !== "premium" && (
        <div className="p-6 rounded-[12px] bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] mb-6">
          <div className="flex items-start gap-4">
            <span className="text-[32px]">👑</span>
            <div>
              <h3 className="font-bold text-[#78350F] mb-1">Accède au Premium</h3>
              <p className="text-[13px] text-[#92400E] mb-4">
                Débloquez ligues privées, live stats avancées et quêtes exclusives.
              </p>
              <button className="px-6 py-2 rounded-[10px] bg-[var(--amber-500)] text-white font-semibold hover:bg-[var(--amber-700)] transition-colors">
                4,99€ / mois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <Link
          href="/test-matches"
          className="w-full px-6 py-3 rounded-[10px] bg-[var(--emerald-500)] text-white font-semibold hover:bg-[var(--emerald-600)] transition-colors text-center block mb-4"
        >
          ⚽ Test Matches Admin 🎮
        </Link>
      )}

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full px-6 py-3 rounded-[10px] bg-[var(--error)] text-white font-semibold hover:bg-[#dc2626] transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
