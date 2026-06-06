"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export interface BetSelection {
  matchId: string
  matchLabel: string
  market: string
  marketLabel: string
  selection: string
  selectionLabel: string
  odds: number
}

export interface BetSlip {
  type: "simple" | "combo"
  selections: BetSelection[]
  stake: number
}

interface BetSlipContextType {
  betSlip: BetSlip
  addSelection: (selection: BetSelection) => void
  removeSelection: (matchId: string) => void
  setType: (type: "simple" | "combo") => void
  setStake: (stake: number) => void
  clear: () => void
  getTotalOdds: () => number
  getPotentialGain: () => number
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined)

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [betSlip, setBetSlip] = useState<BetSlip>({
    type: "simple",
    selections: [],
    stake: 10,
  })

  const addSelection = useCallback((selection: BetSelection) => {
    setBetSlip(prev => {
      // Pour un pari simple, remplacer la sélection
      if (prev.type === "simple") {
        return {
          ...prev,
          selections: [selection],
        }
      }

      // Pour un combiné, ajouter ou remplacer si même match
      const filtered = prev.selections.filter(s => s.matchId !== selection.matchId)
      return {
        ...prev,
        selections: [...filtered, selection],
      }
    })
  }, [])

  const removeSelection = useCallback((matchId: string) => {
    setBetSlip(prev => ({
      ...prev,
      selections: prev.selections.filter(s => s.matchId !== matchId),
    }))
  }, [])

  const setType = useCallback((type: "simple" | "combo") => {
    setBetSlip(prev => ({
      ...prev,
      type,
      // Pour passer à simple, garder juste la première sélection
      selections: type === "simple" ? prev.selections.slice(0, 1) : prev.selections,
    }))
  }, [])

  const setStake = useCallback((stake: number) => {
    setBetSlip(prev => ({
      ...prev,
      stake: Math.max(1, stake),
    }))
  }, [])

  const clear = useCallback(() => {
    setBetSlip({
      type: "simple",
      selections: [],
      stake: 10,
    })
  }, [])

  const getTotalOdds = useCallback(() => {
    if (betSlip.selections.length === 0) return 0
    return betSlip.selections.reduce((acc, sel) => acc * sel.odds, 1)
  }, [betSlip.selections])

  const getPotentialGain = useCallback(() => {
    return +(betSlip.stake * getTotalOdds()).toFixed(2)
  }, [betSlip.stake, getTotalOdds])

  return (
    <BetSlipContext.Provider
      value={{
        betSlip,
        addSelection,
        removeSelection,
        setType,
        setStake,
        clear,
        getTotalOdds,
        getPotentialGain,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  )
}

export function useBetSlip() {
  const context = useContext(BetSlipContext)
  if (!context) {
    throw new Error("useBetSlip doit être utilisé dans BetSlipProvider")
  }
  return context
}
