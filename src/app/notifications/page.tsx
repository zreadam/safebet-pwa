"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Notif {
  id: string
  type: "bet_won" | "bet_lost" | "bet_void" | "league_invite" | "quest_done" | "system"
  title: string
  body: string
  read: boolean
  created_at: string
  meta?: Record<string, unknown>
}

function notifIcon(type: Notif["type"]) {
  switch (type) {
    case "bet_won":      return { icon: "ti-trophy",        bg: "bg-[var(--emerald-50)]",  color: "text-[var(--emerald-600)]" }
    case "bet_lost":     return { icon: "ti-x",             bg: "bg-red-50",               color: "text-red-500" }
    case "bet_void":     return { icon: "ti-refresh",       bg: "bg-gray-100",             color: "text-gray-500" }
    case "league_invite":return { icon: "ti-users",         bg: "bg-blue-50",              color: "text-blue-500" }
    case "quest_done":   return { icon: "ti-star",          bg: "bg-amber-50",             color: "text-amber-500" }
    default:             return { icon: "ti-bell",          bg: "bg-[var(--bg-3)]",        color: "text-[var(--fg-2)]" }
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [bets, setBets] = useState<{ id: string; status: string; match_label: string; potential_gain: number; stake: number; placed_at: string }[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Récupérer les paris récents comme source de notifications
      const { data: betsData } = await supabase
        .from("bets")
        .select("id, status, match_label, potential_gain, stake, placed_at")
        .eq("user_id", user.id)
        .order("placed_at", { ascending: false })
        .limit(30)

      setBets(betsData ?? [])

      // Construire les notifications à partir des paris
      const generated: Notif[] = (betsData ?? []).map(b => {
        if (b.status === "won") return {
          id: `bet-won-${b.id}`,
          type: "bet_won" as const,
          title: "🏆 Pari gagné !",
          body: `${b.match_label} — Tu remportes ${b.potential_gain} B !`,
          read: false,
          created_at: b.placed_at,
        }
        if (b.status === "lost") return {
          id: `bet-lost-${b.id}`,
          type: "bet_lost" as const,
          title: "Pari perdu",
          body: `${b.match_label} — Tu perds ${b.stake} B.`,
          read: false,
          created_at: b.placed_at,
        }
        if (b.status === "void") return {
          id: `bet-void-${b.id}`,
          type: "bet_void" as const,
          title: "Pari annulé",
          body: `${b.match_label} — Ta mise de ${b.stake} B a été remboursée.`,
          read: false,
          created_at: b.placed_at,
        }
        // pending → notification de confirmation
        return {
          id: `bet-placed-${b.id}`,
          type: "system" as const,
          title: "Pari enregistré",
          body: `${b.match_label} — Mise : ${b.stake} B · Gain potentiel : ${b.potential_gain} B`,
          read: true,
          created_at: b.placed_at,
        }
      }).filter(Boolean) as Notif[]

      // Notification de bienvenue si aucun pari
      if (generated.length === 0) {
        generated.push({
          id: "welcome",
          type: "system",
          title: "Bienvenue sur Safebet 🎉",
          body: "Place ton premier pari pour voir tes notifications ici.",
          read: false,
          created_at: new Date().toISOString(),
        })
      }

      setNotifs(generated)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unread = notifs.filter(n => !n.read).length

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--bg-1)] border-b border-[var(--border-light)]
                           px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-2)]">
            <i className="ti ti-chevron-left text-[18px] text-[var(--fg-2)]" />
          </button>
          <h1 className="flex-1 text-[18px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
            Notifications
          </h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--emerald-500)] text-white text-[11px] font-bold">
              {unread}
            </span>
          )}
        </header>

        <div className="px-4 py-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="skeleton h-16 rounded-[12px]" />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-3)] flex items-center justify-center">
                <i className="ti ti-bell-off text-[32px] text-[var(--fg-3)]" />
              </div>
              <p className="text-[var(--fg-3)] text-[14px] text-center">Aucune notification pour l'instant</p>
            </div>
          ) : (
            <div className="flex flex-col gap-[6px]">
              {notifs.map(n => {
                const { icon, bg, color } = notifIcon(n.type)
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-[14px] border transition-colors",
                      n.read
                        ? "bg-[var(--bg-1)] border-[var(--border-light)]"
                        : "bg-[var(--emerald-50)] border-[var(--emerald-100)]"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bg)}>
                      <i className={cn("ti text-[18px]", icon, color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-[13px] font-semibold leading-tight",
                          n.read ? "text-[var(--fg-2)]" : "text-[var(--fg-1)]"
                        )}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[var(--emerald-500)] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--fg-3)] mt-[2px] leading-snug">{n.body}</p>
                      <p className="text-[11px] text-[var(--fg-3)] mt-1 opacity-70">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
