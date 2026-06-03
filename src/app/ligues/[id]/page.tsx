"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LeagueMember {
  rank: number
  user_id: string
  username: string
  avatar_color: string
  balance: number
  balance_change: number
  is_me?: boolean
  tier?: "free" | "premium"
}

interface ActivityItem {
  id: string
  emoji: string
  text: string
  time_ago: string
}

interface LeagueDetail {
  id: string
  name: string
  emoji: string
  color: string
  is_private: boolean
  invite_code?: string
  member_count: number
  is_creator: boolean
  members: LeagueMember[]
  activity: ActivityItem[]
}

type Tab = "classement" | "activite"

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[18px]">🥇</span>
  if (rank === 2) return <span className="text-[18px]">🥈</span>
  if (rank === 3) return <span className="text-[18px]">🥉</span>
  return (
    <span className="w-6 h-6 flex items-center justify-center text-[12px] font-bold text-[var(--fg-3)] [font-family:var(--font-display)]">
      {rank}
    </span>
  )
}

export default function LeagueDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { profile } = useProfile()

  const [league, setLeague] = useState<LeagueDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("classement")
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/leagues/${id}`)
      .then(r => r.json())
      .then(setLeague)
      .catch(() => toast.error("Impossible de charger la ligue"))
      .finally(() => setLoading(false))
  }, [id])

  function copyInviteLink() {
    if (!league?.invite_code) return
    const url = `${window.location.origin}/ligues/rejoindre?code=${league.invite_code}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Lien copié !")
    })
  }

  async function handleLeave() {
    setLeaveLoading(true)
    try {
      const res = await fetch(`/api/leagues/${id}/join`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Tu as quitté la ligue")
      router.push("/ligues")
    } catch {
      toast.error("Erreur lors de la sortie de la ligue")
    } finally {
      setLeaveLoading(false)
      setShowLeaveConfirm(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[430px] mx-auto px-4 pt-5 pb-24 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-[12px]" />
          ))}
        </div>
      </AppShell>
    )
  }

  if (!league) {
    return (
      <AppShell>
        <div className="max-w-[430px] mx-auto px-4 pt-10 text-center">
          <p className="text-[var(--fg-3)]">Ligue introuvable</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto pb-24">
        {/* AppBar */}
        <div className="sticky top-0 z-10 bg-[var(--bg-1)] border-b border-[var(--border-light)] px-4 pt-safe-top">
          <div className="flex items-center gap-2 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[var(--bg-2)] transition-colors"
            >
              <i className="ti ti-chevron-left text-[20px] text-[var(--fg-1)]" />
            </button>
            <h1 className="flex-1 text-[17px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)] truncate">
              {league.name}
            </h1>
            {league.is_creator && (
              <button className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[var(--bg-2)] transition-colors">
                <i className="ti ti-settings text-[18px] text-[var(--fg-2)]" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* League header card */}
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] shrink-0"
                style={{ background: league.color + "22" }}
              >
                {league.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[17px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)]">
                    {league.name}
                  </h2>
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full px-2 py-0.5 leading-none",
                      league.is_private
                        ? "bg-[var(--amber-900)] text-[var(--amber-500)]"
                        : "bg-[var(--emerald-50)] text-[var(--emerald-600)]"
                    )}
                  >
                    {league.is_private ? "PRIVÉE" : "PUBLIQUE"}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--fg-3)] mt-0.5">
                  {league.member_count} membre{league.member_count > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Invite code — creator + private only */}
            {league.is_private && league.is_creator && league.invite_code && (
              <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-[var(--fg-3)] font-medium uppercase tracking-wide mb-0.5">
                      Code d'invitation
                    </p>
                    <p className="text-[16px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)] tracking-widest">
                      {league.invite_code}
                    </p>
                  </div>
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-1.5 bg-[var(--bg-2)] border border-[var(--border-light)] rounded-[10px] px-3 h-9 text-[13px] font-semibold text-[var(--fg-2)] hover:bg-[var(--bg-3)] transition-colors shrink-0"
                  >
                    <i className="ti ti-copy text-[14px]" />
                    Copier le lien
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-[var(--bg-2)] rounded-[12px]">
            <button
              onClick={() => setTab("classement")}
              className={cn(
                "flex-1 h-9 rounded-[10px] text-[14px] font-semibold transition-all",
                tab === "classement"
                  ? "bg-white text-[var(--fg-1)] shadow-[0_1px_3px_rgba(0,0,0,0.10)]"
                  : "text-[var(--fg-3)]"
              )}
            >
              Classement
            </button>
            <button
              onClick={() => setTab("activite")}
              className={cn(
                "flex-1 h-9 rounded-[10px] text-[14px] font-semibold transition-all",
                tab === "activite"
                  ? "bg-white text-[var(--fg-1)] shadow-[0_1px_3px_rgba(0,0,0,0.10)]"
                  : "text-[var(--fg-3)]"
              )}
            >
              Activité
            </button>
          </div>

          {/* Classement tab */}
          {tab === "classement" && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[var(--border-light)]">
              {league.members.map(member => (
                <div
                  key={member.user_id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-[10px] transition-colors",
                    member.is_me &&
                      "bg-[var(--emerald-50)] border-l-2 border-[var(--emerald-500)]"
                  )}
                >
                  <RankBadge rank={member.rank} />
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                    style={{ background: member.avatar_color || "#10B981" }}
                  >
                    {(member.username?.[0] ?? "?").toUpperCase()}
                  </div>
                  <span
                    className={cn(
                      "flex-1 text-[14px] truncate",
                      member.is_me
                        ? "font-bold text-[var(--fg-1)]"
                        : "text-[var(--fg-2)]"
                    )}
                  >
                    {member.username}
                    {member.is_me ? " (toi)" : ""}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[14px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                      {member.balance} B
                    </span>
                    {member.balance_change !== 0 && (
                      <span
                        className={cn(
                          "text-[11px] font-semibold [font-family:var(--font-display)]",
                          member.balance_change > 0
                            ? "text-[var(--emerald-500)]"
                            : "text-[var(--error)]"
                        )}
                      >
                        {member.balance_change > 0 ? "+" : ""}
                        {member.balance_change} B
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activité tab */}
          {tab === "activite" && (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] divide-y divide-[var(--border-light)]">
              {league.activity.length === 0 ? (
                <div className="py-10 text-center text-[var(--fg-3)] text-[14px]">
                  Pas encore d'activité
                </div>
              ) : (
                league.activity.map(item => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-[20px] mt-0.5">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--fg-1)]">{item.text}</p>
                      <p className="text-[11px] text-[var(--fg-3)] mt-0.5">{item.time_ago}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Leave button */}
          {!showLeaveConfirm ? (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="w-full h-12 rounded-[10px] border border-[var(--error)] text-[var(--error)] font-semibold text-[14px] bg-transparent hover:bg-red-50 transition-colors"
            >
              Quitter la ligue
            </button>
          ) : (
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] p-4 space-y-3">
              <p className="text-[14px] text-[var(--fg-1)] font-medium text-center">
                Sûr(e) de vouloir quitter cette ligue ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 h-10 rounded-[10px] border border-[var(--border-light)] text-[var(--fg-2)] font-semibold text-[14px]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLeave}
                  disabled={leaveLoading}
                  className="flex-1 h-10 rounded-[10px] bg-[var(--error)] text-white font-semibold text-[14px] disabled:opacity-60"
                >
                  {leaveLoading ? "…" : "Quitter"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
