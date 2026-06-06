"use client"

import { useState } from "react"
import { useBetSlip } from "@/contexts/BetSlipContext"
import { cn } from "@/lib/utils"

export function BetSlipModal() {
  const { betSlip, setType, setStake, removeSelection, getTotalOdds, getPotentialGain, clear } = useBetSlip()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (betSlip.selections.length === 0) return null

  const totalOdds = getTotalOdds()
  const potentialGain = getPotentialGain()
  const isCombo = betSlip.type === "combo" && betSlip.selections.length > 1

  async function placeBet() {
    setLoading(true)
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: betSlip.type,
          selections: betSlip.selections,
          stake: betSlip.stake,
          total_odds: totalOdds,
          potential_gain: potentialGain,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          clear()
          setSuccess(false)
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 md:bottom-4 md:right-4 md:left-auto md:top-auto md:w-[300px] z-50">
      {/* Mobile: bottom sheet */}
      <div className="md:hidden animate-slide-up">
        <div className="max-h-[65vh] overflow-y-auto bg-[var(--bg-1)] border-t border-[var(--border-light)] rounded-t-[20px] shadow-[var(--shadow-modal)] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[15px] [font-family:var(--font-display)] text-[var(--fg-1)]">
              {isCombo ? "Pari Combiné" : "Pari Simple"}
            </span>
            <button
              onClick={clear}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-3)]"
            >
              <i className="ti ti-x text-[15px] text-[var(--fg-2)]" />
            </button>
          </div>

          <BetSlipContent
            betSlip={betSlip}
            totalOdds={totalOdds}
            potentialGain={potentialGain}
            isCombo={isCombo}
            setType={setType}
            setStake={setStake}
            removeSelection={removeSelection}
            loading={loading}
            success={success}
            placeBet={placeBet}
          />
        </div>
      </div>

      {/* Desktop: sticky bottom-right popup */}
      <div className="hidden md:flex md:flex-col md:fixed md:bottom-4 md:right-4 md:w-[300px] md:bg-[var(--bg-1)] md:border md:border-[var(--border-light)] md:rounded-[16px] md:p-4 md:shadow-[var(--shadow-modal)] md:max-h-[80vh] md:overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-[15px] [font-family:var(--font-display)] text-[var(--fg-1)]">
            {isCombo ? "Pari Combiné" : "Pari Simple"}
          </span>
          <button
            onClick={clear}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-2)] hover:bg-[var(--bg-3)] transition-colors"
          >
            <i className="ti ti-x text-[15px] text-[var(--fg-2)]" />
          </button>
        </div>

        <BetSlipContent
          betSlip={betSlip}
          totalOdds={totalOdds}
          potentialGain={potentialGain}
          isCombo={isCombo}
          setType={setType}
          setStake={setStake}
          removeSelection={removeSelection}
          loading={loading}
          success={success}
          placeBet={placeBet}
        />
      </div>
    </div>
  )
}

interface BetSlipContentProps {
  betSlip: any
  totalOdds: number
  potentialGain: number
  isCombo: boolean
  setType: (type: "simple" | "combo") => void
  setStake: (stake: number) => void
  removeSelection: (matchId: string) => void
  loading: boolean
  success: boolean
  placeBet: () => void
}

function BetSlipContent({
  betSlip,
  totalOdds,
  potentialGain,
  isCombo,
  setType,
  setStake,
  removeSelection,
  loading,
  success,
  placeBet,
}: BetSlipContentProps) {
  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setType("simple")}
          className={cn(
            "flex-1 py-2 rounded-lg font-semibold text-sm transition-all",
            betSlip.type === "simple"
              ? "bg-[var(--emerald-500)] text-white"
              : "bg-[var(--bg-1)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
          )}
        >
          Simple
        </button>
        <button
          onClick={() => setType("combo")}
          className={cn(
            "flex-1 py-2 rounded-lg font-semibold text-sm transition-all",
            betSlip.type === "combo"
              ? "bg-[var(--emerald-500)] text-white"
              : "bg-[var(--bg-1)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
          )}
        >
          Combiné
        </button>
      </div>

      {/* Selections */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {betSlip.selections.map((sel: any, i: number) => (
          <div
            key={`${sel.matchId}-${i}`}
            className="bg-[var(--bg-1)] rounded-lg p-3 border border-[var(--border-light)]"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[var(--fg-3)] mb-1">{sel.matchLabel}</p>
                <p className="text-[12px] font-semibold text-[var(--fg-1)] line-clamp-2">
                  {sel.marketLabel}
                </p>
                <p className="text-[11px] text-[var(--emerald-600)] font-bold mt-1">
                  {sel.selectionLabel}
                </p>
              </div>
              <button
                onClick={() => removeSelection(sel.matchId)}
                className="p-1 rounded hover:bg-[var(--bg-2)] text-[var(--fg-3)] hover:text-[var(--fg-2)]"
              >
                <i className="ti ti-trash text-[14px]" />
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)]">
              <span className="text-[12px] text-[var(--fg-3)]">Cote</span>
              <span className="text-[16px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                {sel.odds.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Odds summary */}
      <div className="bg-[var(--bg-1)] rounded-lg p-3 border border-[var(--border-light)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--fg-3)]">Cote totale</span>
          <span className="text-[18px] font-bold [font-family:var(--font-display)] text-[var(--emerald-500)]">
            {totalOdds.toFixed(2)}
          </span>
        </div>
        {betSlip.selections.length > 0 && isCombo && (
          <p className="text-[11px] text-[var(--fg-3)]">
            {betSlip.selections.map((s: any) => s.odds.toFixed(2)).join(" × ")} = {totalOdds.toFixed(2)}
          </p>
        )}
      </div>

      {/* Stake */}
      <div>
        <label className="text-[12px] text-[var(--fg-3)] block mb-2">Mise (B)</label>
        <div className="flex items-center border border-[var(--border-light)] rounded-lg overflow-hidden bg-[var(--bg-1)]">
          <button
            onClick={() => setStake(betSlip.stake - 5)}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-2)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
          >
            <i className="ti ti-minus text-[14px]" />
          </button>
          <input
            type="number"
            value={betSlip.stake}
            onChange={(e) => setStake(parseInt(e.target.value) || 1)}
            className="flex-1 h-10 text-center bg-[var(--bg-1)] border-0 outline-0 font-semibold text-[var(--fg-1)]"
          />
          <button
            onClick={() => setStake(betSlip.stake + 5)}
            className="w-10 h-10 flex items-center justify-center bg-[var(--bg-2)] text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
          >
            <i className="ti ti-plus text-[14px]" />
          </button>
        </div>
      </div>

      {/* Potential gain */}
      <div className="bg-[var(--emerald-50)] rounded-lg p-3 border border-[var(--emerald-200)]">
        <p className="text-[12px] text-[var(--emerald-700)] mb-1">Gain potentiel</p>
        <p className="text-[24px] font-bold [font-family:var(--font-display)] text-[var(--emerald-700)]">
          {potentialGain} B
        </p>
      </div>

      {/* Place bet button */}
      <button
        onClick={placeBet}
        disabled={loading || success}
        className={cn(
          "w-full h-12 rounded-lg font-bold text-white transition-all active:scale-95",
          success
            ? "bg-[var(--emerald-500)]"
            : loading
            ? "bg-[var(--fg-3)] cursor-wait"
            : "bg-[var(--emerald-500)] hover:bg-[var(--emerald-600)]"
        )}
      >
        {success ? (
          <span className="flex items-center justify-center gap-2">
            <i className="ti ti-check" /> Pari placé!
          </span>
        ) : loading ? (
          <span className="flex items-center justify-center gap-2">
            <i className="ti ti-loader animate-spin" /> Placement en cours...
          </span>
        ) : (
          "Placer mon pari"
        )}
      </button>
    </div>
  )
}
