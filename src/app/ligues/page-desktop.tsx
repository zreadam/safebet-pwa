"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import type { League } from "@/types"

export default function LiguesDesktop() {
  const { user } = useAuth()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.from("leagues").select("*")
        setLeagues((data as League[]) || [])
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeagues()
  }, [])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
          Ligues
        </h1>
        <button className="px-6 py-2 rounded-[10px] bg-[var(--emerald-500)] text-white font-semibold hover:bg-[var(--emerald-600)] transition-colors">
          Créer une ligue
        </button>
      </div>

      {loading ? (
        <p className="text-[var(--fg-3)]">Chargement...</p>
      ) : leagues.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-1)] rounded-[12px]">
          <p className="text-[var(--fg-3)]">Aucune ligue disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="p-6 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-1)] hover:shadow-[var(--shadow-hover)] transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--emerald-100)] flex items-center justify-center mb-4">
                <span className="text-[20px]">🏆</span>
              </div>
              <h3 className="text-[17px] font-semibold text-[var(--fg-1)] mb-1">
                {league.name}
              </h3>
              <p className="text-[13px] text-[var(--fg-3)] mb-4">
                Créée par {league.created_by}
              </p>
              <button className="w-full px-4 py-2 rounded-[10px] bg-[var(--emerald-50)] text-[var(--emerald-600)] font-semibold hover:bg-[var(--emerald-100)] transition-colors">
                Rejoindre
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
