"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface OddsPreference {
  market: "result" | "dnb" | "dc" | "btts" | "ou25"
  label: string
  description: string
}

const AVAILABLE_MARKETS: OddsPreference[] = [
  {
    market: "result",
    label: "Résultat final (1X2)",
    description: "Victoire domicile, Nul, Victoire extérieur"
  },
  {
    market: "dnb",
    label: "Nul remboursé",
    description: "Domicile ou Extérieur (nul = remboursement)"
  },
  {
    market: "dc",
    label: "Double chance",
    description: "Domicile/Nul, L'une ou l'autre, Nul/Extérieur"
  },
  {
    market: "btts",
    label: "Les deux marquent",
    description: "Oui ou Non"
  },
  {
    market: "ou25",
    label: "Plus/Moins 2,5 buts",
    description: "Plus de 2,5 ou Moins de 2,5"
  },
]

interface OddsPreferenceSelectorProps {
  onClose: () => void
}

export function OddsPreferenceSelector({ onClose }: OddsPreferenceSelectorProps) {
  const [selectedMarket, setSelectedMarket] = useState<OddsPreference["market"]>("result")

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-odds-preference")
    if (saved) {
      setSelectedMarket(saved as OddsPreference["market"])
    }
  }, [])

  const handleSelect = (market: OddsPreference["market"]) => {
    setSelectedMarket(market)
    localStorage.setItem("dashboard-odds-preference", market)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-1)] rounded-[16px] p-6 max-w-[450px] w-full border border-[var(--border-light)] shadow-[var(--shadow-modal)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
            Personnaliser les cotes
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-2)] hover:bg-[var(--bg-3)] transition-colors"
          >
            <i className="ti ti-x text-[16px] text-[var(--fg-2)]" />
          </button>
        </div>

        <p className="text-[13px] text-[var(--fg-3)] mb-5">
          Sélectionnez le marché à afficher sur la page d'accueil:
        </p>

        <div className="space-y-3">
          {AVAILABLE_MARKETS.map((market) => (
            <button
              key={market.market}
              onClick={() => handleSelect(market.market)}
              className={cn(
                "w-full p-4 rounded-[12px] border-2 transition-all text-left",
                selectedMarket === market.market
                  ? "bg-[var(--emerald-50)] border-[var(--emerald-500)]"
                  : "bg-[var(--bg-1)] border-[var(--border-light)] hover:border-[var(--emerald-300)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedMarket === market.market
                    ? "border-[var(--emerald-500)] bg-[var(--emerald-500)]"
                    : "border-[var(--border-light)]"
                )}>
                  {selectedMarket === market.market && (
                    <i className="ti ti-check text-white text-[12px]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[var(--fg-1)]">{market.label}</p>
                  <p className="text-[12px] text-[var(--fg-3)] mt-1">{market.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 mt-6 rounded-lg bg-[var(--emerald-500)] text-white font-semibold hover:bg-[var(--emerald-600)] transition-colors"
        >
          Confirmer
        </button>
      </div>
    </div>
  )
}
