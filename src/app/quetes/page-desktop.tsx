"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Quest } from "@/types"

export default function QuestesDesktop() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.from("quests").select("*")
        setQuests((data as Quest[]) || [])
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuests()
  }, [])

  return (
    <div className="w-full">
      <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-6">
        Quêtes
      </h1>

      {loading ? (
        <p className="text-[var(--fg-3)]">Chargement...</p>
      ) : quests.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-1)] rounded-[12px]">
          <p className="text-[var(--fg-3)]">Aucune quête disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-[12px] border ${
                quest.is_done
                  ? "border-[var(--emerald-100)] bg-[var(--emerald-50)]"
                  : "border-[var(--border-light)] bg-[var(--bg-1)]"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--fg-1)] flex items-center gap-2">
                    <span>"⭐"</span>
                    {quest.title}
                  </p>
                  <p className="text-[13px] text-[var(--fg-2)] mt-1">{quest.description}</p>
                </div>
                <span className="text-[15px] font-bold [font-family:var(--font-display)] text-[var(--emerald-600)]">
                  {quest.reward} B
                </span>
              </div>

              <div className="bg-[var(--bg-3)] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[var(--emerald-500)] transition-all"
                  style={{
                    width: `${((quest.progress || 0) / (quest.total || 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-[var(--fg-3)]">
                  {quest.progress || 0} / {quest.total || 1}
                </span>
                {quest.is_done && (
                  <span className="text-[11px] font-semibold text-[var(--emerald-600)] flex items-center gap-1">
                    <i className="ti ti-check" /> Complète
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
