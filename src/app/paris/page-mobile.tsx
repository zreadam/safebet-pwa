"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import AppShell from "@/components/layout/AppShell"
import { PremiumLock } from "@/components/ui/premium-lock"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import type { Bet, BetStatus } from "@/types"

/* ──────────────────────── balance chart (premium) ──────────── */
function BalanceChart({ bets, startBalance }: { bets: Bet[]; startBalance: number }) {
  // Construire la courbe : solde après chaque pari résolu (won/lost)
  const resolved = [...bets]
    .filter(b => b.status === "won" || b.status === "lost")
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())

  const points: { date: string; balance: number }[] = [{ date: "", balance: startBalance }]
  let running = startBalance
  for (const b of resolved) {
    if (b.status === "won")  running += b.potential_gain - b.stake
    if (b.status === "lost") running -= b.stake
    points.push({ date: new Date(b.placed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), balance: Math.max(0, running) })
  }

  if (points.length < 2) return (
    <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                    p-6 h-[160px] flex flex-col items-center justify-center gap-2">
      <i className="ti ti-chart-line text-[32px] text-[var(--fg-3)]" />
      <p className="text-[13px] text-[var(--fg-3)]">Résous des paris pour voir ton évolution</p>
    </div>
  )

  const W = 340, H = 120, PAD = 12
  const values = points.map(p => p.balance)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1

  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - minV) / range) * (H - PAD * 2)

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.balance).toFixed(1)}`).join(" ")
  const areaD = `${pathD} L ${x(points.length - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`

  const isUp = points[points.length - 1].balance >= startBalance
  const color = isUp ? "var(--emerald-500)" : "var(--error)"

  return (
    <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                    [box-shadow:var(--shadow-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-[var(--fg-3)]">{points.length - 1} paris résolus</span>
        <span className={cn("text-[15px] font-bold [font-family:var(--font-display)]",
          isUp ? "text-[var(--emerald-500)]" : "text-[var(--error)]")}>
          {isUp ? "+" : ""}{(points[points.length - 1].balance - startBalance).toFixed(2)} B
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Ligne de départ */}
        <line x1={PAD} y1={y(startBalance)} x2={W - PAD} y2={y(startBalance)}
              stroke="var(--border-light)" strokeWidth="1" strokeDasharray="4 3" />
        {/* Zone remplie */}
        <path d={areaD} fill="url(#chartGrad)" />
        {/* Ligne principale */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Point final */}
        <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].balance)} r="4"
                fill={color} stroke="white" strokeWidth="2" />
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--fg-3)]">Début</span>
        <span className="text-[10px] text-[var(--fg-3)]">{points[points.length - 1].date}</span>
      </div>
    </div>
  )
}

/* ──────────────────────── filter types ─────────────────────── */
type Filter = "all" | "pending" | "won" | "lost"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",     label: "Tous" },
  { key: "pending", label: "En cours" },
  { key: "won",     label: "Gagnés" },
  { key: "lost",    label: "Perdus" },
]

/* ──────────────────────── status helpers ───────────────────── */
function statusColor(s: BetStatus): string {
  if (s === "won")     return "bg-[var(--emerald-500)]"
  if (s === "lost")    return "bg-[var(--error)]"
  if (s === "pending") return "bg-[var(--info,#3B82F6)]"
  return "bg-[var(--fg-3)]"
}

function statusBadge(s: BetStatus) {
  const configs: Record<BetStatus, { label: string; classes: string }> = {
    won:     { label: "Gagné",    classes: "bg-[var(--emerald-50)] text-[var(--emerald-900)]" },
    lost:    { label: "Perdu",    classes: "bg-[#FEF2F2] text-[#991B1B]" },
    pending: { label: "En cours", classes: "bg-[#EFF6FF] text-[#1E3A5F]" },
    void:    { label: "Annulé",   classes: "bg-[var(--bg-3)] text-[var(--fg-3)]" },
  }
  const c = configs[s]
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-[3px] rounded-full", c.classes)}>
      {c.label}
    </span>
  )
}

/* ──────────────────────── bet card ─────────────────────────── */
function BetCard({ bet }: { bet: Bet }) {
  const gain = bet.status === "won"
    ? bet.potential_gain - bet.stake
    : bet.status === "lost"
    ? -bet.stake
    : null

  return (
    <div className={cn(
      "bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]",
      "[box-shadow:var(--shadow-card)] overflow-hidden flex animate-card-in"
    )}>
      {/* left accent */}
      <div className={cn("w-1 shrink-0", statusColor(bet.status))} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[14px] font-semibold text-[var(--fg-1)] leading-tight">{bet.match_label}</p>
            <p className="text-[12px] text-[var(--fg-3)] mt-[3px]">{bet.market} · {bet.selection}</p>
          </div>
          {statusBadge(bet.status)}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--fg-3)]">Cote</span>
            <span className="text-[15px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
              {bet.odds.toFixed(2)}
            </span>
          </div>
          <div className="w-px h-7 bg-[var(--border-light)]" />
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--fg-3)]">Mise</span>
            <span className="text-[15px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
              {bet.stake} B
            </span>
          </div>
          <div className="w-px h-7 bg-[var(--border-light)]" />
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--fg-3)]">
              {bet.status === "won" ? "Gain" : bet.status === "lost" ? "Perte" : "Gain pot."}
            </span>
            <span className={cn(
              "text-[15px] font-bold [font-family:var(--font-display)]",
              bet.status === "won" ? "text-[var(--emerald-500)]" :
              bet.status === "lost" ? "text-[var(--error)]" :
              "text-[var(--fg-2)]"
            )}>
              {bet.status === "won" && gain !== null && `+${gain.toFixed(2)} B`}
              {bet.status === "lost" && gain !== null && `${gain.toFixed(2)} B`}
              {bet.status === "pending" && `${bet.potential_gain.toFixed(2)} B`}
              {bet.status === "void" && "–"}
            </span>
          </div>
          <div className="ml-auto">
            {bet.is_live && (
              <span className="text-[10px] font-bold text-[var(--error)] bg-[#FEF2F2]
                               px-[7px] py-1 rounded-full animate-pulse-live">
                LIVE
              </span>
            )}
          </div>
        </div>

        <p className="text-[10px] text-[var(--fg-3)] mt-2">
          {new Date(bet.placed_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          })}
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────── skeleton ─────────────────────────── */
function BetSkeleton() {
  return (
    <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)] overflow-hidden flex">
      <div className="w-1 bg-[var(--bg-3)]" />
      <div className="flex-1 p-4 space-y-2">
        <div className="skeleton w-44 h-4 rounded" />
        <div className="skeleton w-28 h-3 rounded" />
        <div className="flex gap-4 mt-2">
          <div className="skeleton w-12 h-8 rounded" />
          <div className="skeleton w-12 h-8 rounded" />
          <div className="skeleton w-16 h-8 rounded" />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────── metric card ──────────────────────── */
function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-[var(--bg-1)] border border-[var(--border-light)]
                    rounded-[var(--radius-card)] [box-shadow:var(--shadow-card)] p-4 text-center">
      <p className="text-[11px] text-[var(--fg-3)] mb-1">{label}</p>
      {children}
    </div>
  )
}

/* ───────────────────────── PAGE ────────────────────────────── */
export default function ParisPage() {
  const { profile } = useProfile()
  const [bets, setBets]       = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>("all")

  useEffect(() => {
    fetch("/api/bets", { cache: "no-store" })
      .then(r => r.json())
      .then(data => { setBets(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const realBets  = bets.filter(b => b.stake > 0)          // exclut le bonus de départ (stake=0)
  const wonBets   = realBets.filter(b => b.status === "won")
  const lostBets  = realBets.filter(b => b.status === "lost")
  const totalGain = wonBets.reduce((s, b) => s + b.potential_gain - b.stake, 0)
  const settledBets = realBets.filter(b => b.status !== "pending" && b.status !== "void")
  const successRate = settledBets.length > 0
    ? Math.round((wonBets.length / settledBets.length) * 100)
    : 0

  // Group bets by bet_group_id (for combo bets)
  const groupedBets: (Bet | { id: string; bets: Bet[]; isCombo: true })[] = []
  const processedIds = new Set<string>()

  for (const bet of realBets) {
    if (processedIds.has(bet.id)) continue

    if (bet.bet_group_id) {
      const groupBets = realBets.filter(b => b.bet_group_id === bet.bet_group_id)
      groupedBets.push({
        id: bet.bet_group_id,
        bets: groupBets,
        isCombo: true,
      })
      groupBets.forEach(b => processedIds.add(b.id))
    } else {
      groupedBets.push(bet)
      processedIds.add(bet.id)
    }
  }

  const filtered = filter === "all"
    ? groupedBets
    : groupedBets.filter(item => {
      if ('isCombo' in item && item.isCombo) {
        return item.bets.some(b => b.status === filter)
      } else {
        return (item as Bet).status === filter
      }
    })

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto">

        {/* ── header ── */}
        <header className="sticky top-0 z-30 bg-[var(--bg-1)] border-b border-[var(--border-light)] px-4 py-3">
          <h1 className="text-[21px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
            Mes paris
          </h1>
        </header>

        <div className="px-4 pt-5 pb-4 flex flex-col gap-5">

          {/* ── metrics ── */}
          <div className="flex gap-3">
            <MetricCard label="Solde">
              {profile
                ? <span className="text-[18px] font-bold [font-family:var(--font-display)] text-[var(--emerald-600)] whitespace-nowrap">
                    {profile.balance.toFixed(2)} B
                  </span>
                : <div className="skeleton w-20 h-7 rounded mx-auto" />}
            </MetricCard>
            <MetricCard label="Gain total">
              <span className={cn(
                "text-[18px] font-bold [font-family:var(--font-display)]",
                totalGain >= 0 ? "text-[var(--emerald-500)]" : "text-[var(--error)]"
              )}>
                {totalGain >= 0 ? "+" : ""}{totalGain.toFixed(2)} B
              </span>
            </MetricCard>
            <MetricCard label="Réussite">
              <span className="text-[18px] font-bold [font-family:var(--font-display)] text-[var(--emerald-500)]">
                {successRate}%
              </span>
            </MetricCard>
          </div>

          {/* ── filter pills ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "whitespace-nowrap px-[14px] py-[7px] rounded-full text-[13px] font-semibold shrink-0",
                  "border transition-all duration-150",
                  filter === f.key
                    ? "bg-[var(--emerald-500)] border-[var(--emerald-500)] text-white"
                    : "bg-[var(--bg-1)] border-[var(--border-light)] text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
                )}>
                {f.label}
              </button>
            ))}
          </div>

          {/* ── bets list ── */}
          <div className="flex flex-col gap-3">
            {loading
              ? [0, 1, 2].map(i => <BetSkeleton key={i} />)
              : filtered.length === 0
                ? (
                  <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-3)] flex items-center justify-center">
                      <i className="ti ti-ticket text-[32px] text-[var(--fg-3)]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[var(--fg-2)]">
                      {filter === "all" ? "Pas encore de paris." : "Aucun pari dans cette catégorie."}
                    </p>
                    {filter === "all" && (
                      <p className="text-[13px] text-[var(--fg-3)]">Lance-toi !</p>
                    )}
                    {filter === "all" && (
                      <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-[var(--emerald-500)] text-white rounded-[var(--radius-btn)]
                                   font-semibold text-[14px] hover:bg-[var(--emerald-600)] transition-colors">
                        Voir les matchs
                      </Link>
                    )}
                  </div>
                )
                : filtered.map(item => {
                  if ('isCombo' in item && item.isCombo) {
                    // Combo bet
                    const allWon = item.bets.every(b => b.status === "won")
                    const allLost = item.bets.every(b => b.status === "lost")
                    const isPending = item.bets.some(b => b.status === "pending")
                    const status = allWon ? "won" : allLost ? "lost" : isPending ? "pending" : "unknown"
                    const totalOdds = item.bets.reduce((acc, b) => acc * b.odds, 1)

                    return (
                      <div key={item.id} className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)] [box-shadow:var(--shadow-card)] overflow-hidden">
                        {/* Header combo */}
                        <div className="bg-[var(--bg-2)] px-4 py-3 border-b border-[var(--border-light)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-bold text-[var(--emerald-500)]">🎯 PARI COMBINÉ ({item.bets.length})</span>
                            <span className={cn(
                              "text-[11px] font-semibold px-2 py-1 rounded-full",
                              statusColor(status as any)
                            )}>
                              {status === "won" ? "✓ Gagné" : status === "lost" ? "✗ Perdu" : "En cours"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-[var(--fg-3)]">
                            <span>Cote totale: {totalOdds.toFixed(2)}</span>
                            <span>Mise: {item.bets[0]?.stake} B</span>
                          </div>
                        </div>

                        {/* Bets inside */}
                        <div className="divide-y divide-[var(--border-light)]">
                          {item.bets.map((bet, idx) => (
                            <div key={bet.id} className="p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-[var(--fg-3)]">#{idx + 1}</span>
                                <span className="font-semibold text-[var(--fg-1)] flex-1">{bet.match_label}</span>
                                <span className={cn("text-xs font-bold", statusColor(bet.status as any))}>{bet.selection}</span>
                              </div>
                              <div className="flex justify-between text-xs text-[var(--fg-3)]">
                                <span>{bet.market}</span>
                                <span>Cote: {bet.odds.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  } else {
                    return <BetCard key={(item as Bet).id} bet={item as Bet} />
                  }
                })
            }
          </div>

          {/* ── Évolution du solde ── */}
          {realBets.length > 0 && (
            <section>
              <h2 className="text-[17px] font-semibold [font-family:var(--font-display)]
                             text-[var(--fg-1)] tracking-tight mb-3">
                Évolution du solde
              </h2>
              {profile?.tier === "premium" ? (
                <BalanceChart bets={realBets} startBalance={50} />
              ) : (
                <PremiumLock label="Graphique Premium">
                  <div className="bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                                  p-6 h-[160px] flex flex-col items-center justify-center gap-2">
                    <i className="ti ti-chart-line text-[40px] text-[var(--fg-3)]" />
                    <p className="text-[13px] text-[var(--fg-3)]">Graphique d&apos;évolution</p>
                  </div>
                </PremiumLock>
              )}
            </section>
          )}

        </div>
      </div>
    </AppShell>
  )
}
