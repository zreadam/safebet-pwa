"use client"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PremiumLock } from "@/components/ui/premium-lock"
import type { Match } from "@/types"

const COMP_COLORS: Record<string, string> = {
  L1:  "#10B981", UCL: "#0a1a5e", PL:  "#3d195b",
  LIGA:"#e01a22",  SA:  "#0067b1", BL:  "#e01a22",
  CDM: "#f59e0b",  EL:  "#f97316",
}

function Crest({ code, color, size = 44 }: { code: string; color?: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold [font-family:var(--font-display)]"
         style={{
           width: size, height: size,
           background: color ? `${color}22` : "var(--bg-3)",
           color: color ?? "var(--fg-2)",
           fontSize: size * 0.34,
         }}>
      {code.slice(0, 3)}
    </div>
  )
}

interface Props {
  match: Match
  onOddsSelect?: (match: Match, marketKey: string, outcomeKey: string, odds: number) => void
  selectedOdds?: string | null // "matchId:marketKey:outcomeKey"
}

export function MatchCard({ match: m, onOddsSelect, selectedOdds }: Props) {
  const live = m.state === "live"
  const done = m.state === "done"
  const cc   = COMP_COLORS[m.competition] ?? "#10B981"

  // Déterminer le résultat pour afficher la cote gagnante en vert
  const winner: "1" | "N" | "2" | null = done
    ? (m.home_score != null && m.away_score != null)
      ? (m.home_score > m.away_score ? "1"
        : m.away_score > m.home_score ? "2"
        : "N")
      : null
    : null

  const inner = (
    <Link href={`/match/${m.id}`}
          className={cn(
            "block rounded-[var(--radius-card)] border border-[var(--border-light)]",
            "bg-[var(--bg-1)] p-[14px] cursor-pointer transition-all duration-200",
            "hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] active:scale-[.99]",
            "animate-card-in",
            live && "border-t-2 border-t-[var(--emerald-500)]",
            "[box-shadow:var(--shadow-card)]"
          )}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-[7px] text-xs font-semibold text-[var(--fg-2)]">
          <span className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center
                           text-[9px] font-bold text-white"
                style={{ background: cc }}>
            {m.competition[0]}
          </span>
          {m.competition_name}
        </span>
        {live && (
          <span className="flex items-center gap-[5px] text-[10px] font-semibold
                           bg-[var(--error)] text-white px-2 py-1 rounded-full animate-pulse-live">
            <span className="w-[5px] h-[5px] rounded-full bg-white" />
            LIVE {m.minute}
          </span>
        )}
        {done && <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full bg-[var(--emerald-50)] text-[var(--emerald-900)]">Terminé</span>}
        {!live && !done && (
          <span className="text-[11px] font-semibold px-[10px] py-1 rounded-full bg-[#EFF6FF] text-[#1E3A5F]">
            {new Date(m.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-[14px]">
        <div className="flex flex-col items-center gap-[7px] w-24">
          <Crest code={m.home_team_code} color={cc} />
          <span className="text-xs font-medium text-[var(--fg-2)] text-center">{m.home_team}</span>
        </div>
        <div className="text-center">
          <div className="font-bold text-[26px] leading-none [font-family:var(--font-display)] text-[var(--fg-1)] whitespace-nowrap">
            {(live || done) && m.home_score !== null && m.away_score !== null
            ? `${m.home_score} – ${m.away_score}`
            : "–"}
          </div>
          {live && <div className="text-xs text-[var(--fg-3)] mt-1">{m.minute}</div>}
          {!live && !done && (
            <div className="text-xs text-[var(--fg-3)] mt-1">
              {new Date(m.kickoff).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-[7px] w-24">
          <Crest code={m.away_team_code} color={cc} />
          <span className="text-xs font-medium text-[var(--fg-2)] text-center">{m.away_team}</span>
        </div>
      </div>

      {/* Odds */}
      <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
        {(["1","N","2"] as const).map((key, i) => {
          const oddsVal  = [m.odds_1, m.odds_n, m.odds_2][i]
          const selKey   = `${m.id}:result:${key}`
          const isSelected = selectedOdds === selKey
          const isWinner = winner === key
          const isLoser  = done && winner !== null && winner !== key
          const hasOdds = oddsVal !== null && oddsVal !== undefined
          const oddsDisplay = hasOdds ? oddsVal.toFixed(2) : "–"

          if (done) {
            // Matchs terminés : pas cliquables, affichage résultat
            return (
              <div key={key}
                   className={cn(
                     "flex-1 border rounded-[var(--radius-btn)] py-2 text-center",
                     isWinner
                       ? "bg-[var(--emerald-500)] border-[var(--emerald-500)]"
                       : "border-[var(--border-light)] bg-[var(--bg-2)] opacity-50"
                   )}>
                <span className={cn("block text-[10px] mb-[3px]",
                  isWinner ? "text-white" : "text-[var(--fg-3)]")}>{key}</span>
                <span className={cn("block font-bold text-[16px] [font-family:var(--font-display)]",
                  isWinner ? "text-white" : "text-[var(--fg-2)]")}>{oddsDisplay}</span>
                {isWinner && <span className="block text-[9px] text-white/80 mt-[2px]">✓ Résultat</span>}
              </div>
            )
          }

          return (
            <button key={key}
                    onClick={() => hasOdds && onOddsSelect?.(m, "result", key, oddsVal!)}
                    disabled={done || !hasOdds}
                    className={cn(
                      "flex-1 border rounded-[var(--radius-btn)] py-2 text-center",
                      "transition-all duration-150 active:scale-95",
                      !hasOdds && "opacity-50 cursor-not-allowed",
                      isSelected && hasOdds
                        ? "bg-[var(--emerald-500)] border-[var(--emerald-500)]"
                        : "border-[var(--border-light)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)]"
                    )}>
              <span className={cn("block text-[10px] mb-[3px]",
                isSelected ? "text-white" : "text-[var(--fg-3)]")}>{key}</span>
              <span className={cn("block font-bold text-[16px] [font-family:var(--font-display)]",
                isSelected ? "text-white" : "text-[var(--fg-1)]")}>{oddsDisplay}</span>
            </button>
          )
        })}
      </div>
    </Link>
  )

  if (m.is_premium) {
    return (
      <PremiumLock label="Match Premium">
        {inner}
      </PremiumLock>
    )
  }
  return inner
}
