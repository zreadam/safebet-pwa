"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { League, LeagueMember } from "@/types"

export default function ClassementsDesktop() {
  const [leagues, setLeagues] = useState<(League & { members: LeagueMember[] })[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("leagues")
          .select("*, members:league_members(user_id,username,avatar_color,rank,balance,balance_change)")
          .eq("created_by", user.id)

        setLeagues((data as any) || [])
        if (data && data.length > 0) {
          setSelectedLeague(data[0].id)
        }
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeagues()
  }, [])

  const selected = leagues.find(l => l.id === selectedLeague)

  return (
    <div className="w-full">
      <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-6">
        Classements
      </h1>

      <div className="grid grid-cols-[340px_1fr] gap-6">
        {/* Leagues List */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-[var(--fg-3)]">Chargement...</p>
          ) : leagues.length === 0 ? (
            <p className="text-[var(--fg-3)]">Aucune ligue</p>
          ) : (
            leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={`w-full p-4 rounded-[12px] text-left transition-all ${
                  selectedLeague === league.id
                    ? "bg-[var(--emerald-500)] text-white"
                    : "bg-[var(--bg-1)] border border-[var(--border-light)] text-[var(--fg-1)] hover:bg-[var(--bg-2)]"
                }`}
              >
                <p className="font-semibold">{league.name}</p>
                <p className="text-[13px] opacity-75">
                  {league.members?.length || 0} participants
                </p>
              </button>
            ))
          )}
        </div>

        {/* Rankings */}
        <div className="bg-[var(--bg-1)] rounded-[12px] border border-[var(--border-light)] overflow-hidden">
          {selected ? (
            <div>
              <div className="p-6 border-b border-[var(--border-light)]">
                <h2 className="text-[24px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                  {selected.name}
                </h2>
                <p className="text-[var(--fg-3)] mt-1">{selected.members?.length || 0} participants</p>
              </div>
              <div>
                {selected.members && selected.members.length > 0 ? (
                  selected.members
                    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
                    .map((member, idx) => (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-2)]"
                      >
                        <span className="font-bold [font-family:var(--font-display)] text-[var(--fg-2)] w-8">
                          {idx + 1}
                        </span>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold [font-family:var(--font-display)]"
                          style={{
                            backgroundColor:
                              member.avatar_color ||
                              `hsl(${(idx * 360) / 12}, 70%, 60%)`,
                          }}
                        >
                          {member.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--fg-1)]">
                            {member.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                            {member.balance} B
                          </p>
                          <p
                            className="text-[13px] font-semibold"
                            style={{
                              color:
                                (member.balance_change || 0) >= 0
                                  ? "var(--emerald-600)"
                                  : "var(--error)",
                            }}
                          >
                            {(member.balance_change || 0) >= 0 ? "+" : ""}
                            {member.balance_change} B
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-8 text-center text-[var(--fg-3)]">
                    Aucun participant
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--fg-3)]">
              Sélectionne une ligue
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
