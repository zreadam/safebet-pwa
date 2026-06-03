"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import { PremiumLock } from "@/components/ui/premium-lock"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const EMOJIS = ["⚽", "🏆", "🔥", "⚡", "🎯", "🏅", "👑", "🎲"]

const COLORS = [
  { label: "Emerald", value: "#10B981" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Red", value: "#EF4444" },
  { label: "Orange", value: "#F97316" },
  { label: "Pink", value: "#EC4899" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Yellow", value: "#EAB308" },
]

export default function CreateLeaguePage() {
  const router = useRouter()
  const { profile } = useProfile()

  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("⚽")
  const [color, setColor] = useState("#10B981")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)

  const isPremium = profile?.tier === "premium"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Donne un nom à ta ligue")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), emoji, color, is_private: isPrivate }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur")
      const league = await res.json()
      toast.success("Ligue créée !")
      router.push(`/ligues/${league.id}`)
    } catch (err: any) {
      toast.error(err.message ?? "Impossible de créer la ligue")
    } finally {
      setLoading(false)
    }
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
            <h1 className="flex-1 text-[17px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)]">
              Créer une ligue
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pt-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[13px] font-semibold text-[var(--fg-2)] mb-1.5 block uppercase tracking-wide">
              Nom de la ligue
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 30))}
              placeholder="Ex. Les Champions…"
              maxLength={30}
              className="border border-[var(--border-light)] rounded-[10px] h-12 px-4 w-full text-[15px] text-[var(--fg-1)] bg-white placeholder:text-[var(--fg-3)] focus:outline-none focus:border-[var(--emerald-500)] transition-colors"
            />
            <p className="text-[11px] text-[var(--fg-3)] mt-1 text-right">
              {name.length}/30
            </p>
          </div>

          {/* Emoji */}
          <div>
            <label className="text-[13px] font-semibold text-[var(--fg-2)] mb-2 block uppercase tracking-wide">
              Emoji
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "h-10 w-full rounded-[10px] text-[20px] flex items-center justify-center border-2 transition-all",
                    emoji === e
                      ? "border-[var(--emerald-500)] bg-[var(--emerald-50)] scale-110"
                      : "border-transparent bg-[var(--bg-2)]"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[13px] font-semibold text-[var(--fg-2)] mb-2 block uppercase tracking-wide">
              Couleur
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "h-10 w-full rounded-full border-4 transition-all",
                    color === c.value
                      ? "border-[var(--fg-1)] scale-110"
                      : "border-transparent"
                  )}
                  style={{ background: c.value }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] p-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[24px]"
              style={{ background: color + "22" }}
            >
              {emoji}
            </div>
            <div>
              <p className="text-[15px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)]">
                {name || "Nom de ta ligue"}
              </p>
              <p className="text-[12px] text-[var(--fg-3)]">1 membre · {isPrivate ? "Privée" : "Publique"}</p>
            </div>
          </div>

          {/* Private toggle */}
          <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--fg-1)]">
                    Ligue privée
                  </p>
                  <p className="text-[12px] text-[var(--fg-3)] mt-0.5">
                    Accès sur invitation uniquement
                  </p>
                </div>
                {isPremium ? (
                  <button
                    type="button"
                    onClick={() => setIsPrivate(v => !v)}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors shrink-0",
                      isPrivate ? "bg-[var(--emerald-500)]" : "bg-[var(--bg-3)]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                        isPrivate ? "left-[26px]" : "left-0.5"
                      )}
                    />
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      className="relative w-12 h-6 rounded-full bg-[var(--bg-3)] shrink-0 opacity-50 cursor-not-allowed"
                    >
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </button>
                    <span className="absolute -top-1 -right-1">
                      <i className="ti ti-lock text-[12px] text-[var(--amber-500)]" />
                    </span>
                  </div>
                )}
              </div>

              {!isPremium && (
                <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
                  <PremiumLock label="Ligues privées — Premium">
                    <div className="h-10" />
                  </PremiumLock>
                </div>
              )}

              {isPremium && isPrivate && (
                <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
                  <p className="text-[12px] text-[var(--fg-3)]">
                    <i className="ti ti-info-circle mr-1" />
                    Invitation par lien ou par code · Seuls les membres Premium peuvent rejoindre
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-[var(--emerald-500)] text-white rounded-[10px] h-12 w-full font-semibold text-[15px] transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ti ti-loader-2 animate-spin" /> Création…
              </span>
            ) : (
              "Créer la ligue"
            )}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
