"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { toast } from "sonner"

interface AdReward {
  bluffs: number
  label: string
}

const REWARDS: AdReward[] = [
  { bluffs: 5, label: "5 bluffs" },
  { bluffs: 10, label: "10 bluffs" },
  { bluffs: 15, label: "15 bluffs" },
]

export default function RewardedAdPanel() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [loading, setLoading] = useState(false)

  // Ne pas afficher pour les utilisateurs non connectés ou premium
  if (!user || !profile || profile.tier === "premium") return null

  const handleWatchAd = async (bluffs: number) => {
    if (loading) return

    try {
      setLoading(true)

      // Simuler le chargement d'une publicité
      // En production, tu utiliserais Google AdSense Rewarded Ads API
      await new Promise(resolve => setTimeout(resolve, 2000))

      const res = await fetch("/api/rewards/claim-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bluffs }),
      })

      if (!res.ok) throw new Error("Erreur lors de la réclamation de la récompense")

      const data = await res.json()
      toast.success(`+${bluffs} bluffs gagnés ! 🎉`)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📺</div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">Gagne des bluffs avec des pubs !</h3>
          <p className="text-sm text-amber-800 mb-3">
            Regarde une courte publicité pour obtenir des bluffs supplémentaires
          </p>
          <div className="grid grid-cols-3 gap-2">
            {REWARDS.map(reward => (
              <button
                key={reward.bluffs}
                onClick={() => handleWatchAd(reward.bluffs)}
                disabled={loading}
                className="py-2 px-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                {loading ? "..." : reward.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
