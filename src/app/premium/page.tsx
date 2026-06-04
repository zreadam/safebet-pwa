"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useProfile } from "@/hooks/useProfile"

/* ──────────────── feature comparison ───────────────────────── */
interface Feature {
  label: string
  free: boolean
  premium: boolean
}

const FEATURES: Feature[] = [
  { label: "Accès aux matchs du jour",           free: true,  premium: true  },
  { label: "Paris en monnaie fictive",            free: true,  premium: true  },
  { label: "1 ligue publique",                    free: true,  premium: true  },
  { label: "Quêtes quotidiennes de base",         free: true,  premium: true  },
  { label: "Matchs et cotes premium",             free: false, premium: true  },
  { label: "Création de ligues privées",          free: false, premium: true  },
  { label: "Quêtes premium (+50% de récompenses)", free: false, premium: true },
  { label: "Graphique d'évolution du solde",      free: false, premium: true  },
  { label: "Statistiques avancées des matchs",    free: false, premium: true  },
  { label: "Cotes boostées exclusives",           free: false, premium: true  },
]

/* ──────────────── plan card ─────────────────────────────────── */
interface PlanCardProps {
  title: string
  price: string
  period: string
  cta: string
  variant: "green" | "amber"
  badge?: string
  loading: boolean
  onClick: () => void
}

function PlanCard({ title, price, period, cta, variant, badge, loading, onClick }: PlanCardProps) {
  const isAmber = variant === "amber"
  return (
    <div className={cn(
      "flex-1 relative border rounded-[var(--radius-card)] p-5 flex flex-col gap-4",
      "[box-shadow:var(--shadow-card)]",
      isAmber
        ? "border-[var(--amber-500)] bg-gradient-to-b from-[var(--amber-50)] to-[var(--bg-1)]"
        : "border-[var(--emerald-500)] bg-gradient-to-b from-[var(--emerald-50)] to-[var(--bg-1)]"
    )}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[var(--amber-500)] text-white text-[11px] font-bold
                           px-[10px] py-[4px] rounded-full whitespace-nowrap shadow">
            {badge}
          </span>
        </div>
      )}

      <div>
        <p className="text-[13px] font-semibold text-[var(--fg-3)] mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
            {price}
          </span>
          <span className="text-[13px] text-[var(--fg-3)]">{period}</span>
        </div>
      </div>

      <button
        onClick={onClick}
        disabled={loading}
        className={cn(
          "w-full py-[13px] rounded-[var(--radius-btn)] font-bold text-[15px] [font-family:var(--font-display)]",
          "transition-all duration-150 active:scale-[.98]",
          isAmber
            ? "bg-[var(--amber-500)] text-white hover:opacity-90"
            : "bg-[var(--emerald-500)] text-white hover:bg-[var(--emerald-600)]",
          loading && "opacity-60 cursor-not-allowed"
        )}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <i className="ti ti-loader-2 animate-spin" /> Chargement…
          </span>
        ) : cta}
      </button>
    </div>
  )
}

/* ────────────────────────── PAGE ───────────────────────────── */
export default function PremiumPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "season" | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoSuccess, setPromoSuccess] = useState(false)

  async function handlePromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPromoSuccess(true)
      toast.success("🎉 Premium activé à vie !")
      setTimeout(() => router.push("/dashboard"), 1800)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Code invalide")
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleManageStripe() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Impossible d'accéder au portail Stripe")
    }
  }

  async function handleSubscribe(plan: "monthly" | "season") {
    setLoadingPlan(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  // ── Déjà Premium : page minimaliste ──
  if (!profileLoading && profile?.tier === "premium") {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[var(--bg-1)] flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-20 h-20 rounded-full bg-[var(--amber-400)] flex items-center justify-center shadow-lg">
          <i className="ti ti-crown text-white text-[38px]" />
        </div>
        <div className="text-center">
          <p className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
            Tu es déjà Premium 👑
          </p>
          <p className="text-[14px] text-[var(--fg-3)] mt-2 leading-snug">
            Toutes les fonctionnalités sont débloquées.
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleManageStripe}
            className="w-full py-4 rounded-[var(--radius-btn)]
                       bg-gradient-to-r from-[var(--amber-400)] to-[var(--amber-500)]
                       text-white font-bold text-[16px] [font-family:var(--font-display)]
                       flex items-center justify-center gap-2 active:scale-[.98] transition-all">
            <i className="ti ti-credit-card text-[18px]" />
            Gérer mon abonnement
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 rounded-[var(--radius-btn)] bg-[var(--emerald-500)]
                       text-white font-bold text-[16px] [font-family:var(--font-display)]
                       hover:bg-[var(--emerald-600)] active:scale-[.98] transition-all">
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[var(--bg-1)] flex flex-col">

      {/* ── Header ── */}
      <div className="relative px-4 pt-4 pb-8 bg-gradient-to-b from-[var(--emerald-900)] to-[#0a3d2e]">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full
                     bg-[rgba(255,255,255,0.12)] mb-6">
          <i className="ti ti-chevron-left text-white text-[20px]" />
        </button>

        <div className="flex flex-col items-center text-center gap-3 px-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--amber-500)] flex items-center justify-center
                          shadow-lg mb-1">
            <i className="ti ti-crown text-white text-[32px]" />
          </div>
          <h1 className="text-[26px] font-bold [font-family:var(--font-display)] text-white leading-tight">
            Passe au niveau<br />supérieur
          </h1>
          <p className="text-[14px] text-[rgba(255,255,255,0.7)] leading-snug">
            Débloque les cotes premium, crée tes ligues privées<br />et maximise tes Bluffs.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-6 flex flex-col gap-6">

        {/* ── Pricing cards ── */}
        <div className="flex gap-4 pt-3">
          <PlanCard
            title="Mensuel"
            price="4,99€"
            period="/mois"
            cta="S'abonner"
            variant="green"
            loading={loadingPlan === "monthly"}
            onClick={() => handleSubscribe("monthly")}
          />
          <PlanCard
            title="Saison"
            price="17,99€"
            period="/ saison"
            cta="Acheter la saison"
            variant="amber"
            badge="Meilleur rapport"
            loading={loadingPlan === "season"}
            onClick={() => handleSubscribe("season")}
          />
        </div>

        {/* ── Feature comparison ── */}
        <section>
          <h2 className="text-[17px] font-semibold [font-family:var(--font-display)]
                         text-[var(--fg-1)] tracking-tight mb-3">
            Comparaison des formules
          </h2>
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                          [box-shadow:var(--shadow-card)] overflow-hidden">
            {/* header row */}
            <div className="flex items-center border-b border-[var(--border-light)] bg-[var(--bg-2)] px-4 py-3">
              <div className="flex-1" />
              <div className="w-14 text-center text-[11px] font-bold text-[var(--fg-3)] uppercase tracking-wide">
                Free
              </div>
              <div className="w-16 text-center text-[11px] font-bold text-[var(--amber-700)] uppercase tracking-wide">
                ✨ Premium
              </div>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center px-4 py-3 border-b border-[var(--border-light)] last:border-0">
                <span className="flex-1 text-[13px] text-[var(--fg-1)] leading-snug pr-2">{f.label}</span>
                <div className="w-14 flex justify-center">
                  {f.free ? (
                    <i className="ti ti-check text-[18px] text-[var(--emerald-500)]" />
                  ) : (
                    <i className="ti ti-lock text-[16px] text-[var(--fg-3)]" />
                  )}
                </div>
                <div className="w-16 flex justify-center">
                  {f.premium ? (
                    <i className="ti ti-check text-[18px] text-[var(--amber-500)]" />
                  ) : (
                    <i className="ti ti-minus text-[16px] text-[var(--fg-3)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Code promo ── */}
        <section>
          <h2 className="text-[17px] font-semibold [font-family:var(--font-display)]
                         text-[var(--fg-1)] tracking-tight mb-3">
            Code promotionnel
          </h2>
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                          [box-shadow:var(--shadow-card)] p-4">
            {promoSuccess ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-12 h-12 rounded-full bg-[var(--emerald-50)] flex items-center justify-center">
                  <i className="ti ti-crown text-[var(--amber-500)] text-[24px]" />
                </div>
                <p className="font-bold text-[var(--fg-1)] text-[15px]">Premium activé ! 🎉</p>
                <p className="text-[13px] text-[var(--fg-3)]">Redirection…</p>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-[var(--fg-2)] mb-3">
                  Tu as un code promo ? Entre-le ci-dessous pour activer le Premium.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="TON-CODE-PROMO"
                    maxLength={20}
                    className="flex-1 bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-btn)]
                               px-4 py-3 text-[14px] font-bold [font-family:var(--font-display)] tracking-widest
                               text-[var(--fg-1)] placeholder:text-[var(--fg-3)] outline-none
                               focus:border-[var(--emerald-500)] transition-colors"
                  />
                  <button
                    onClick={handlePromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className={cn(
                      "px-5 py-3 rounded-[var(--radius-btn)] font-bold text-[14px] text-white",
                      "bg-[var(--amber-500)] hover:opacity-90 transition-opacity",
                      (promoLoading || !promoCode.trim()) && "opacity-50 cursor-not-allowed"
                    )}>
                    {promoLoading ? <i className="ti ti-loader-2 animate-spin" /> : "Appliquer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── FAQ teaser ── */}
        <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)] p-4">
          <h3 className="text-[14px] font-semibold text-[var(--fg-1)] mb-2 flex items-center gap-2">
            <i className="ti ti-help-circle text-[var(--fg-3)] text-[18px]" />
            Des questions ?
          </h3>
          <p className="text-[13px] text-[var(--fg-2)] leading-relaxed">
            L&apos;abonnement se renouvelle automatiquement. Tu peux annuler à tout moment
            depuis les paramètres de l&apos;app.
          </p>
        </div>

        {/* ── Responsible gaming ── */}
        <div className="flex items-center gap-3 px-4 py-4 bg-[var(--bg-2)] border border-[var(--border-light)]
                        rounded-[var(--radius-card)]">
          <i className="ti ti-shield-check text-[var(--emerald-500)] text-[22px] shrink-0" />
          <p className="text-[12px] text-[var(--fg-3)] leading-snug">
            <strong className="text-[var(--fg-2)]">Safebet utilise de la monnaie fictive uniquement.</strong>
            {" "}Aucun argent réel n&apos;est impliqué. L&apos;abonnement couvre l&apos;accès aux fonctionnalités
            de l&apos;application uniquement.
          </p>
        </div>

      </div>
    </div>
  )
}
