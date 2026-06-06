"use client"

import type { Quest } from "@/types"

interface QuestesDesktopProps {
  quests: Quest[]
}

export function QuestesDesktop({ quests }: QuestesDesktopProps) {
  const dailyQuests = quests.filter(q => q.type === "daily")
  const weeklyQuests = quests.filter(q => q.type === "weekly")
  const progressionQuests = quests.filter(q => q.type === "progression")

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
        ⭐ Quêtes
      </h1>

      {/* Daily */}
      {dailyQuests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            Quotidienne ({dailyQuests.filter(q => !q.is_done).length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyQuests.map(q => <QuestCard key={q.id} quest={q} />)}
          </div>
        </div>
      )}

      {/* Weekly */}
      {weeklyQuests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            Hebdomadaire ({weeklyQuests.filter(q => !q.is_done).length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyQuests.map(q => <QuestCard key={q.id} quest={q} />)}
          </div>
        </div>
      )}

      {/* Progression */}
      {progressionQuests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-4">
            Progression ({progressionQuests.filter(q => !q.is_done).length})
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {progressionQuests.map(q => <QuestCard key={q.id} quest={q} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function QuestCard({ quest }: { quest: Quest }) {
  const progress = (quest.progress / quest.total) * 100

  return (
    <div className={`p-4 rounded-lg border border-[var(--border-light)] ${quest.is_done ? "bg-[var(--emerald-50)]" : "bg-[var(--bg-2)]"}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="font-bold text-[var(--fg-1)] flex-1">{quest.title}</p>
        {quest.is_done && <span className="text-2xl">✓</span>}
      </div>
      <p className="text-xs text-[var(--fg-3)] mb-3">{quest.description}</p>
      <div className="w-full bg-[var(--bg-3)] rounded-full h-2 mb-2">
        <div className="bg-[var(--emerald-500)] h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--fg-3)]">{quest.progress}/{quest.total}</span>
        <span className="font-bold text-[var(--emerald-500)]">+{quest.reward} B</span>
      </div>
    </div>
  )
}
