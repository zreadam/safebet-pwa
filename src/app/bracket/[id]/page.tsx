"use client"

export const dynamic = "force-dynamic"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* ─────────────── static bracket data ─────────────── */
interface BracketMatch {
  id: string
  home: string
  away: string
  homeScore?: number
  awayScore?: number
  winner?: "home" | "away"
  kickoff?: string
}

const ROUNDS: { label: string; matches: BracketMatch[] }[] = [
  {
    label: "1/8 de finale",
    matches: [
      { id: "r16-1", home: "France", away: "Pologne", homeScore: 3, awayScore: 1, winner: "home" },
      { id: "r16-2", home: "Angleterre", away: "Sénégal", homeScore: 3, awayScore: 0, winner: "home" },
      { id: "r16-3", home: "Argentine", away: "Australie", homeScore: 2, awayScore: 1, winner: "home" },
      { id: "r16-4", home: "Pays-Bas", away: "États-Unis", homeScore: 3, awayScore: 1, winner: "home" },
      { id: "r16-5", home: "Croatie", away: "Japon", homeScore: 1, awayScore: 1, winner: "home" },
      { id: "r16-6", home: "Brésil", away: "Corée du Sud", homeScore: 4, awayScore: 1, winner: "home" },
      { id: "r16-7", home: "Maroc", away: "Espagne", homeScore: 0, awayScore: 0, winner: "home" },
      { id: "r16-8", home: "Portugal", away: "Suisse", homeScore: 6, awayScore: 1, winner: "home" },
    ],
  },
  {
    label: "1/4 de finale",
    matches: [
      { id: "qf-1", home: "France", away: "Angleterre", homeScore: 2, awayScore: 1, winner: "home" },
      { id: "qf-2", home: "Argentine", away: "Pays-Bas", homeScore: 2, awayScore: 2, winner: "home" },
      { id: "qf-3", home: "Croatie", away: "Brésil", homeScore: 1, awayScore: 1, winner: "home" },
      { id: "qf-4", home: "Maroc", away: "Portugal", homeScore: 1, awayScore: 0, winner: "home" },
    ],
  },
  {
    label: "Demi-finales",
    matches: [
      { id: "sf-1", home: "France", away: "Maroc", homeScore: 2, awayScore: 0, winner: "home" },
      { id: "sf-2", home: "Argentine", away: "Croatie", homeScore: 3, awayScore: 0, winner: "home" },
    ],
  },
  {
    label: "Finale",
    matches: [
      {
        id: "final",
        home: "Argentine",
        away: "France",
        kickoff: "18 déc. · 18h00",
      },
    ],
  },
]

/* ─────────────── MatchupCard ─────────────── */
function MatchupCard({ match }: { match: BracketMatch }) {
  const isPlayed = match.winner !== undefined
  const notPlayed = !isPlayed && !!match.kickoff

  return (
    <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] w-[160px] shrink-0">
      {/* Home team */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b border-[var(--border-light)]",
          isPlayed && match.winner === "home" && "bg-[var(--emerald-50)]"
        )}
      >
        <span
          className={cn(
            "text-[13px] font-medium truncate flex-1",
            isPlayed && match.winner === "away"
              ? "text-[var(--fg-3)] line-through"
              : "text-[var(--fg-1)]",
            isPlayed && match.winner === "home" && "font-bold text-[var(--emerald-600)]"
          )}
        >
          {match.home}
        </span>
        {isPlayed && (
          <span
            className={cn(
              "text-[13px] font-bold ml-2 [font-family:var(--font-display)]",
              match.winner === "home"
                ? "text-[var(--emerald-500)]"
                : "text-[var(--fg-3)]"
            )}
          >
            {match.homeScore}
          </span>
        )}
      </div>

      {/* Away team */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2",
          isPlayed && match.winner === "away" && "bg-[var(--emerald-50)]"
        )}
      >
        <span
          className={cn(
            "text-[13px] font-medium truncate flex-1",
            isPlayed && match.winner === "home"
              ? "text-[var(--fg-3)] line-through"
              : "text-[var(--fg-1)]",
            isPlayed && match.winner === "away" && "font-bold text-[var(--emerald-600)]"
          )}
        >
          {match.away}
        </span>
        {isPlayed && (
          <span
            className={cn(
              "text-[13px] font-bold ml-2 [font-family:var(--font-display)]",
              match.winner === "away"
                ? "text-[var(--emerald-500)]"
                : "text-[var(--fg-3)]"
            )}
          >
            {match.awayScore}
          </span>
        )}
      </div>

      {/* Kickoff label */}
      {notPlayed && (
        <div className="px-3 py-1.5 border-t border-[var(--border-light)] bg-[var(--bg-2)] rounded-b-[10px]">
          <span className="text-[11px] text-[var(--fg-3)] font-medium">
            À venir · {match.kickoff}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─────────────── Page ─────────────── */
export default function BracketPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--bg-2)]">
      <div className="max-w-[430px] mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-1)] border-b border-[var(--border-light)] px-4 pt-safe-top">
          <div className="flex items-center gap-3 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[var(--bg-2)] transition-colors"
            >
              <i className="ti ti-chevron-left text-[20px] text-[var(--fg-1)]" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-[var(--emerald-500)] flex items-center justify-center shrink-0">
                <span className="text-[16px]">🏆</span>
              </div>
              <div>
                <h1 className="text-[16px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)] leading-none">
                  Coupe du Monde 2022
                </h1>
                <p className="text-[12px] text-[var(--fg-3)] mt-0.5">Phase finale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bracket horizontal scroll */}
        <div className="overflow-x-auto pb-4 px-4 pt-4">
          <div className="flex gap-4 min-w-max">
            {ROUNDS.map((round) => (
              <div key={round.label} className="flex flex-col gap-0">
                {/* Round label */}
                <div className="mb-3 px-1">
                  <span className="text-[12px] font-bold text-[var(--fg-3)] uppercase tracking-wide [font-family:var(--font-display)]">
                    {round.label}
                  </span>
                </div>
                {/* Matches */}
                <div className="flex flex-col gap-3">
                  {round.matches.map(match => (
                    <MatchupCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time note */}
        <div className="mx-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[10px]">
            <i className="ti ti-refresh text-[14px] text-[var(--emerald-500)]" />
            <span className="text-[12px] text-[var(--fg-3)]">
              Mise à jour en temps réel · Données API-Football
            </span>
          </div>
        </div>

        {/* Sticky bet CTA */}
        <div className="sticky bottom-0 px-4 pb-6 pt-2 bg-gradient-to-t from-[var(--bg-2)] to-transparent">
          <Link
            href="/match/bracket-final"
            className="flex items-center justify-center gap-2 bg-[var(--emerald-500)] text-white rounded-[10px] h-12 w-full font-semibold text-[15px] shadow-[0_4px_16px_rgba(16,185,129,0.35)]"
          >
            <i className="ti ti-trophy text-[16px]" />
            Parie sur le vainqueur
          </Link>
        </div>
      </div>
    </div>
  )
}
