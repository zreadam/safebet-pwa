"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export default function NotificationsDesktop() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user) return
        const supabase = createClient()
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        setNotifications(data || [])
      } catch (error) {
        console.error("Erreur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-[30px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] mb-6">
        Notifications
      </h1>

      {loading ? (
        <p className="text-[var(--fg-3)]">Chargement...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-1)] rounded-[12px]">
          <p className="text-[var(--fg-3)]">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-4 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-1)] flex items-start gap-3"
            >
              <span className="text-[20px] mt-1">{notif.emoji || "📢"}</span>
              <div className="flex-1">
                <p className="font-semibold text-[var(--fg-1)]">{notif.title}</p>
                <p className="text-[13px] text-[var(--fg-2)] mt-1">{notif.message}</p>
                <p className="text-[11px] text-[var(--fg-3)] mt-2">
                  {new Date(notif.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
