"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/* ── Simple confetti burst ───────────────────────────────────── */
function Confetti() {
  const [pieces, setPieces] = useState<{ x: number; color: string; delay: number; size: number }[]>([])

  useEffect(() => {
    const colors = ["#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6", "#FFFFFF"]
    setPieces(Array.from({ length: 60 }, (_, i) => ({
      x: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 1.5,
      size: 6 + Math.random() * 8,
    })))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 animate-[fall_3s_ease-in_forwards]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function PremiumSuccessContent() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<{ username: string; balance: number; tier: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from("profiles")
        .select("username, balance, tier")
        .eq("id", user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const isAnnual = searchParams.get("plan") === "annual"

  return (
    <>
      <Confetti />
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-[430px] mx-auto text-center">

          {/* Trophy animation */}
          <div className="relative flex items-center justify-center mb-8">
            <div className="w-28 h-28 rounded-full bg-[var(--amber-400)]/20 flex items-center justify-center animate-[ob-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
              <div className="w-20 h-20 rounded-full bg-[var(--amber-400)]/30 flex items-center justify-center">
                <i className="ti ti-crown text-[var(--amber-400)] text-5xl" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold [font-family:var(--font-display)] text-[var(--color-text-primary)] mb-2">
            Bienvenue Premium ! 🎉
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base mb-8">
            {loading ? "Chargement..." : profile
              ? `Félicitations ${profile.username} ! Tu as désormais accès à toutes les fonctionnalités Safebet.`
              : "Ton abonnement Premium est activé."}
          </p>

          {/* Balance card */}
          {profile && (
            <div className="bg-gradient-to-br from-[var(--amber-400)] to-[var(--amber-500)] rounded-2xl p-6 mb-6 text-left relative overflow-hidden">
              <div className="absolute right-4 top-4 opacity-20">
                <i className="ti ti-diamond text-7xl text-white" />
              </div>
              <p className="text-white/70 text-sm font-medium mb-1">Ton solde Premium</p>
              <p className="text-white text-4xl font-bold [font-family:var(--font-display)]">
                {profile.balance.toFixed(2)} <span className="text-2xl">B</span>
              </p>
              <p className="text-white/80 text-sm mt-2">
                +150B offerts à l'activation ✓
              </p>
            </div>
          )}

          {/* What's unlocked */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 mb-8 text-left space-y-3">
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
              Tu as maintenant accès à
            </p>
            {[
              { icon: "ti-bolt", label: "100% des matchs débloqués" },
              { icon: "ti-live-photo", label: "Paris live (in-play)" },
              { icon: "ti-users", label: "Ligues privées avec tes amis" },
              { icon: "ti-chart-line", label: "Graphique d'évolution du solde" },
              { icon: "ti-target-arrow", label: "Marchés avancés (buteurs, corners…)" },
              { icon: "ti-flame", label: "Quêtes Premium à récompenses boostées" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--amber-400)]/10 flex items-center justify-center flex-shrink-0">
                  <i className={`ti ${item.icon} text-[var(--amber-400)]`} />
                </div>
                <span className="text-sm text-[var(--color-text-primary)]">{item.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="block w-full py-4 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-lg text-center"
          >
            Commencer à parier →
          </Link>

          <Link
            href="/profil/parametres"
            className="block text-center text-sm text-[var(--color-text-secondary)] mt-4 hover:text-[var(--color-text-primary)]"
          >
            Gérer mon abonnement
          </Link>
        </div>
      </div>
    </>
  )
}

export default function PremiumSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center"><i className="ti ti-loader-2 animate-spin text-2xl text-[var(--color-brand-primary)]" /></div>}>
      <PremiumSuccessContent />
    </Suspense>
  )
}
