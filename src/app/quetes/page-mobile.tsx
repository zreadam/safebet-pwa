"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import AppShell from "@/components/layout/AppShell"
import { PremiumLock } from "@/components/ui/premium-lock"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Quest } from "@/types"

/* ──────────────────── static definitions ────────────────────── */
interface QuestDef {
  key: string
  title: string
  description: string
  reward: number
  type: Quest["type"]
  total: number
  is_premium: boolean
  icon: string
  reset_in?: string
}

const QUEST_DEFINITIONS: QuestDef[] = [
  // Daily
  {
    key: "daily_bets",
    title: "Paris du jour",
    description: "Place 5 paris aujourd'hui",
    reward: 10,
    type: "daily",
    total: 5,
    is_premium: false,
    icon: "ti-ticket",
    reset_in: "demain",
  },
  {
    key: "daily_first_bet",
    title: "Premier pari du jour",
    description: "Place ton premier pari aujourd'hui",
    reward: 5,
    type: "daily",
    total: 1,
    is_premium: false,
    icon: "ti-ticket",
    reset_in: "demain",
  },
  {
    key: "daily_streak",
    title: "Connecté 3 jours",
    description: "Connecte-toi 3 jours de suite",
    reward: 10,
    type: "daily",
    total: 3,
    is_premium: false,
    icon: "ti-flame",
    reset_in: "demain",
  },
  {
    key: "daily_live_bet",
    title: "Parieur live",
    description: "Place un pari sur un match en direct",
    reward: 8,
    type: "daily",
    total: 1,
    is_premium: false,
    icon: "ti-live-photo",
    reset_in: "demain",
  },
  {
    key: "daily_premium_bet",
    title: "Cote boost",
    description: "Joue une cote boostée (cote ≥ 3.0)",
    reward: 15,
    type: "daily",
    total: 1,
    is_premium: true,
    icon: "ti-rocket",
    reset_in: "demain",
  },
  // Weekly
  {
    key: "weekly_5_bets",
    title: "5 paris cette semaine",
    description: "Place 5 paris dans la semaine",
    reward: 20,
    type: "weekly",
    total: 5,
    is_premium: false,
    icon: "ti-calendar-week",
    reset_in: "lundi prochain",
  },
  {
    key: "weekly_win_3",
    title: "3 paris gagnants",
    description: "Remporte 3 paris cette semaine",
    reward: 30,
    type: "weekly",
    total: 3,
    is_premium: false,
    icon: "ti-trophy",
    reset_in: "lundi prochain",
  },
  {
    key: "weekly_premium_combo",
    title: "Combo premium",
    description: "Place 2 paris combinés premium",
    reward: 50,
    type: "weekly",
    total: 2,
    is_premium: true,
    icon: "ti-stars",
    reset_in: "lundi prochain",
  },
  // Progression
  {
    key: "prog_10_bets",
    title: "Débutant confirmé",
    description: "Place 10 paris au total",
    reward: 25,
    type: "progression",
    total: 10,
    is_premium: false,
    icon: "ti-medal",
  },
  {
    key: "prog_50_bets",
    title: "Parieur chevronné",
    description: "Place 50 paris au total",
    reward: 100,
    type: "progression",
    total: 50,
    is_premium: false,
    icon: "ti-award",
  },
  {
    key: "prog_league",
    title: "Esprit d'équipe",
    description: "Rejoins une ligue et termine dans le top 3",
    reward: 75,
    type: "progression",
    total: 1,
    is_premium: true,
    icon: "ti-users-group",
  },
]

/* ─────────────────────── quest card ────────────────────────── */
function QuestCard({ quest, isPremium }: { quest: Quest; isPremium: boolean }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.total) * 100))
  const def = QUEST_DEFINITIONS.find(d => d.key === quest.key)
  const icon = def?.icon ?? "ti-bolt"

  const inner = (
    <div className={cn(
      "bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]",
      "[box-shadow:var(--shadow-card)] p-4 transition-all duration-200",
      quest.is_done && "border-[var(--emerald-300)] bg-[var(--emerald-50)]"
    )}>
      <div className="flex items-start gap-3 mb-3">
        {/* icon */}
        <div className={cn(
          "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-[20px]",
          quest.is_done
            ? "bg-[var(--emerald-100)]"
            : quest.is_premium
            ? "bg-[var(--amber-50)]"
            : "bg-[var(--bg-3)]"
        )}>
          {quest.is_done ? (
            <i className="ti ti-circle-check text-[var(--emerald-500)]" />
          ) : quest.is_premium ? (
            <i className={`ti ${icon} text-[var(--amber-500)]`} />
          ) : (
            <i className={`ti ${icon} text-[var(--fg-2)]`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-[3px]">
            <p className={cn(
              "text-[14px] font-semibold truncate",
              quest.is_done ? "text-[var(--emerald-900)]" : "text-[var(--fg-1)]"
            )}>
              {quest.title}
            </p>
            {quest.is_done && (
              <span className="shrink-0 text-[11px] font-bold px-2 py-[2px] rounded-full
                               bg-[var(--emerald-500)] text-white">
                Complété
              </span>
            )}
          </div>
          <p className="text-[12px] text-[var(--fg-3)] leading-snug">{quest.description}</p>
        </div>

        <span className={cn(
          "shrink-0 text-[13px] font-bold [font-family:var(--font-display)]",
          "px-[10px] py-[5px] rounded-full",
          quest.is_done
            ? "bg-[var(--emerald-100)] text-[var(--emerald-900)]"
            : quest.is_premium
            ? "bg-[var(--amber-50)] text-[var(--amber-700)]"
            : "bg-[var(--emerald-50)] text-[var(--emerald-900)]"
        )}>
          +{quest.reward} B
        </span>
      </div>

      {/* progress bar */}
      <div className="w-full h-[6px] bg-[var(--bg-3)] rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            quest.is_done ? "bg-[var(--emerald-500)]" : "bg-[var(--emerald-500)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--fg-3)]">
          {quest.progress}/{quest.total} {pct < 100 && `(${pct}%)`}
        </span>
        {quest.reset_in && !quest.is_done && (
          <span className="text-[10px] text-[var(--fg-3)] flex items-center gap-1">
            <i className="ti ti-clock text-[12px]" /> Resets {quest.reset_in}
          </span>
        )}
      </div>
    </div>
  )

  if (quest.is_premium && !isPremium) {
    return (
      <PremiumLock label="Quête Premium">
        <div className="opacity-60 pointer-events-none">{inner}</div>
      </PremiumLock>
    )
  }
  return inner
}

/* ─────────────────────── section ────────────────────────────── */
function QuestSection({
  title,
  quests,
  icon,
  badge,
  isPremium,
}: {
  title: string
  quests: Quest[]
  icon: string
  badge?: string
  isPremium: boolean
}) {
  if (!quests.length) return null
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <i className={`ti ${icon} text-[18px] text-[var(--fg-2)]`} />
        <h2 className="text-[19px] font-semibold [font-family:var(--font-display)]
                       text-[var(--fg-1)] tracking-tight">
          {title}
        </h2>
        {badge && (
          <span className="ml-auto text-[11px] font-semibold text-[var(--fg-3)] bg-[var(--bg-3)]
                           px-[8px] py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {quests.map(q => <QuestCard key={q.id} quest={q} isPremium={isPremium} />)}
      </div>
    </section>
  )
}

/* ────────────────────────── PAGE ───────────────────────────── */
export default function QuetesPage() {
  const { profile } = useProfile()
  const supabase = createClient()

  const [quests, setQuests]   = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuests() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback: show definitions with 0 progress
        const fallback: Quest[] = QUEST_DEFINITIONS.map((d, i) => ({
          id: d.key,
          key: d.key,
          title: d.title,
          description: d.description,
          reward: d.reward,
          type: d.type,
          progress: 0,
          total: d.total,
          is_done: false,
          is_premium: d.is_premium,
          reset_in: d.reset_in,
        }))
        setQuests(fallback)
        setLoading(false)
        return
      }

      const { data: progressRows } = await supabase
        .from("quest_progress")
        .select("*")
        .eq("user_id", user.id)

      const progressMap: Record<string, { progress: number; is_done: boolean }> = {}
      for (const row of (progressRows ?? [])) {
        progressMap[row.key] = { progress: row.progress, is_done: row.is_done }
      }

      const merged: Quest[] = QUEST_DEFINITIONS.map((d, i) => {
        const p = progressMap[d.key]
        return {
          id: d.key,
          key: d.key,
          title: d.title,
          description: d.description,
          reward: d.reward,
          type: d.type,
          progress: p?.progress ?? 0,
          total: d.total,
          is_done: p?.is_done ?? false,
          is_premium: d.is_premium,
          reset_in: d.reset_in,
        }
      })

      setQuests(merged)
      setLoading(false)
    }
    fetchQuests()
  }, [supabase])

  const daily       = quests.filter(q => q.type === "daily")
  const weekly      = quests.filter(q => q.type === "weekly")
  const progression = quests.filter(q => q.type === "progression")

  const todayEarned = quests
    .filter(q => q.is_done && q.type === "daily")
    .reduce((s, q) => s + q.reward, 0)

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto">

        {/* ── header ── */}
        <header className="sticky top-0 z-30 bg-[var(--bg-1)] border-b border-[var(--border-light)] px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-[21px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
              Quêtes
            </h1>
            {todayEarned > 0 && (
              <div className="flex items-center gap-2 bg-[var(--emerald-50)] border border-[var(--emerald-100)]
                              rounded-full px-3 py-[6px]">
                <i className="ti ti-bolt text-[var(--emerald-500)] text-[14px]" />
                <span className="text-[13px] font-bold [font-family:var(--font-display)] text-[var(--emerald-900)]">
                  +{todayEarned} B aujourd&apos;hui
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="px-4 pt-5 pb-4 flex flex-col gap-6">

          {loading ? (
            [0, 1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-[110px] rounded-[var(--radius-card)]" />
            ))
          ) : (
            <>
              <QuestSection
                title="Quotidiennes"
                quests={daily}
                icon="ti-sun"
                badge="Reset demain"
                isPremium={profile?.tier === "premium"}
              />
              <QuestSection
                title="Hebdomadaires"
                quests={weekly}
                icon="ti-calendar"
                badge="Reset lundi"
                isPremium={profile?.tier === "premium"}
              />
              <QuestSection
                title="Progression"
                quests={progression}
                icon="ti-chart-bar"
                isPremium={profile?.tier === "premium"}
              />
            </>
          )}

        </div>
      </div>
    </AppShell>
  )
}
