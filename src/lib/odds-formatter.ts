import type { Match } from "@/types"

export interface DisplayOdds {
  label: string
  value: number | null
  key: string
}

export function getDisplayOdds(match: Match, market: string): DisplayOdds[] {
  switch (market) {
    case "result":
      return [
        { label: "1", value: match.odds_1 || 1.95, key: "1" },
        { label: "X", value: match.odds_n || 3.50, key: "N" },
        { label: "2", value: match.odds_2 || 2.10, key: "2" },
      ]

    case "dnb":
      // Draw No Bet - approximation based on main odds
      const dnb_home = match.odds_1 ? +(match.odds_1 * 0.72).toFixed(2) : 1.40
      const dnb_away = match.odds_2 ? +(match.odds_2 * 0.72).toFixed(2) : 1.51
      return [
        { label: "Dom.", value: dnb_home, key: "dnb_home" },
        { label: "Ext.", value: dnb_away, key: "dnb_away" },
      ]

    case "dc":
      // Double Chance
      const dc_1n = match.odds_1 ? +(match.odds_1 * 0.60).toFixed(2) : 1.26
      const dc_12 = +(Math.min(match.odds_1 || 1.95, match.odds_2 || 2.10) * 0.55).toFixed(2)
      const dc_n2 = match.odds_2 ? +(match.odds_2 * 0.60).toFixed(2) : 1.26
      return [
        { label: "1/X", value: dc_1n, key: "dc_1n" },
        { label: "1/2", value: dc_12, key: "dc_12" },
        { label: "X/2", value: dc_n2, key: "dc_n2" },
      ]

    case "btts":
      // Both Teams To Score
      return [
        { label: "Oui", value: 1.65, key: "btts_yes" },
        { label: "Non", value: 2.25, key: "btts_no" },
      ]

    case "ou25":
      // Over/Under 2.5
      return [
        { label: "+2,5", value: 1.90, key: "ou25_over" },
        { label: "-2,5", value: 1.95, key: "ou25_under" },
      ]

    default:
      return [
        { label: "1", value: match.odds_1 || 1.95, key: "1" },
        { label: "X", value: match.odds_n || 3.50, key: "N" },
        { label: "2", value: match.odds_2 || 2.10, key: "2" },
      ]
  }
}

export function getMarketLabel(market: string): string {
  const labels: Record<string, string> = {
    result: "Résultat final (1X2)",
    dnb: "Nul remboursé",
    dc: "Double chance",
    btts: "Les deux marquent",
    ou25: "Plus/Moins 2,5",
  }
  return labels[market] || "Résultat final"
}
