"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import { useProfile } from "@/hooks/useProfile"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
  "#10B981","#F59E0B","#3B82F6","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#64748B","#0EA5E9",
]

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
        value ? "bg-[var(--color-brand-primary)]" : "bg-white/20"
      )}
    >
      <span className={cn(
        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
        value ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider px-1 mb-2">
        {title}
      </h2>
      <div className="bg-[var(--color-bg-card)] rounded-2xl overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  )
}

function SettingRow({ icon, label, children, danger }: {
  icon: string; label: string; children?: React.ReactNode; danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <i className={cn(`ti ${icon} text-lg`, danger ? "text-red-400" : "text-[var(--color-text-secondary)]")} />
        <span className={cn("text-sm font-medium", danger ? "text-red-400" : "text-[var(--color-text-primary)]")}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

export default function ParametresPage() {
  const router = useRouter()
  const { profile, refetch } = useProfile()
  const { signOut } = useAuth()

  const [username, setUsername] = useState("")
  const [avatarColor, setAvatarColor] = useState("#10B981")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [notifBets, setNotifBets] = useState(true)
  const [notifQuests, setNotifQuests] = useState(true)
  const [notifLeagues, setNotifLeagues] = useState(false)
  const [notifMatches, setNotifMatches] = useState(true)

  const [pushSupported, setPushSupported] = useState(false)
  const [pushGranted, setPushGranted] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "")
      setAvatarColor(profile.avatar_color || "#10B981")
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatarUrl(data.url)
      toast.success("Photo mise à jour !")
      refetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur upload")
    } finally {
      setUploadingPhoto(false)
      // L'input overlay est recréé à chaque render, pas besoin de reset manuel
    }
  }, [refetch])

  useEffect(() => {
    setPushSupported("Notification" in window && "serviceWorker" in navigator)
    setPushGranted(Notification.permission === "granted")
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar_color: avatarColor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Profil mis à jour !")
      refetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleRequestPush() {
    if (!pushSupported) return
    const perm = await Notification.requestPermission()
    setPushGranted(perm === "granted")
    if (perm === "granted") {
      toast.success("Notifications activées !")
    } else {
      toast.error("Notifications refusées")
    }
  }

  async function handleManageStripe() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Impossible d'accéder au portail Stripe")
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push("/auth/login")
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from("profiles").delete().eq("id", user.id)
      await supabase.auth.signOut()
      router.push("/onboarding")
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteLoading(false)
    }
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "??"

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[var(--color-bg-card)] flex items-center justify-center">
            <i className="ti ti-arrow-left text-lg text-[var(--color-text-primary)]" />
          </button>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Paramètres</h1>
        </div>

        {/* ── PROFIL ── */}
        <Section title="Mon profil">
          <form onSubmit={handleSaveProfile}>
            <div className="px-4 pt-4 pb-3 space-y-4">
              {/* Avatar preview + upload + color */}
              <div className="flex items-center gap-4">
                {/* Avatar — input file transparent superposé (iOS-safe) */}
                <div className="relative flex-shrink-0 w-16 h-16">
                  {/* Visuel avatar */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Overlay caméra permanent (visible uniquement quand pas en chargement) */}
                  <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center pointer-events-none">
                    {uploadingPhoto
                      ? <i className="ti ti-loader-2 text-white text-[22px] animate-spin" />
                      : <i className="ti ti-camera text-white text-[22px]" />}
                  </div>

                  {/* Input file directement superposé — iOS Safari compatible */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={uploadingPhoto}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      fontSize: "0",   // évite le texte "Choose file" sur Android
                    }}
                  />
                </div>

                <div className="flex-1">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                    Appuie sur l'avatar pour changer ta photo
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">Couleur de l'avatar</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          avatarColor === c ? "ring-2 ring-offset-1 ring-offset-[var(--color-bg-card)] ring-white scale-110" : ""
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Pseudo</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={20}
                  placeholder="Ton pseudo"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 rounded-xl bg-[var(--color-brand-primary)] text-white font-semibold text-sm disabled:opacity-50"
              >
                {savingProfile ? "Sauvegarde…" : "Sauvegarder le profil"}
              </button>
            </div>
          </form>
        </Section>

        {/* ── NOTIFICATIONS ── */}
        <Section title="Notifications">
          <SettingRow icon="ti-bell" label="Résultats de paris">
            <Toggle value={notifBets} onChange={setNotifBets} />
          </SettingRow>
          <SettingRow icon="ti-star" label="Quêtes disponibles">
            <Toggle value={notifQuests} onChange={setNotifQuests} />
          </SettingRow>
          <SettingRow icon="ti-users" label="Activité des ligues">
            <Toggle value={notifLeagues} onChange={setNotifLeagues} />
          </SettingRow>
          <SettingRow icon="ti-calendar" label="Rappels avant match">
            <Toggle value={notifMatches} onChange={setNotifMatches} />
          </SettingRow>
          {pushSupported && !pushGranted && (
            <div className="px-4 py-3">
              <button
                onClick={handleRequestPush}
                className="w-full py-2.5 rounded-xl border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-sm font-semibold"
              >
                <i className="ti ti-bell-ringing mr-2" />
                Activer les notifications push
              </button>
            </div>
          )}
        </Section>

        {/* ── ABONNEMENT ── */}
        <Section title="Abonnement">
          <SettingRow icon="ti-crown" label="Plan actuel">
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              profile?.tier === "premium"
                ? "bg-[var(--amber-400)]/20 text-[var(--amber-400)]"
                : "bg-white/10 text-[var(--color-text-secondary)]"
            )}>
              {profile?.tier === "premium" ? "PREMIUM" : "FREE"}
            </span>
          </SettingRow>

          {profile?.tier !== "premium" ? (
            <div className="px-4 py-3">
              <button
                onClick={() => router.push("/premium")}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--amber-400)] to-[var(--amber-500)] text-white text-sm font-bold"
              >
                <i className="ti ti-crown mr-2" />
                Passer Premium — 4,99€/mois
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              {/* Bouton Stripe portal — bien visible */}
              <button
                onClick={handleManageStripe}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                           bg-gradient-to-r from-[var(--amber-400)] to-[var(--amber-500)]
                           text-white font-bold text-sm active:scale-[.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <i className="ti ti-credit-card text-lg" />
                  <span>Gérer mon abonnement</span>
                </div>
                <i className="ti ti-external-link text-base opacity-80" />
              </button>
              <p className="text-[11px] text-[var(--color-text-secondary)] text-center px-1">
                Modifier, mettre en pause ou annuler via Stripe
              </p>
            </div>
          )}
        </Section>

        {/* ── COMPTE ── */}
        <Section title="Compte">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-white/5"
          >
            <i className="ti ti-logout text-lg text-[var(--color-text-secondary)]" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Se déconnecter</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-white/5"
          >
            <i className="ti ti-trash text-lg text-red-400" />
            <span className="text-sm font-medium text-red-400">Supprimer mon compte</span>
          </button>
        </Section>

        {/* App info */}
        <div className="flex flex-col items-center gap-2 mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Safebet" className="w-12 h-12 object-contain opacity-80" />
          <p className="text-center text-xs text-[var(--color-text-secondary)]">
            Safebet v1.0 · Fabriqué avec ❤️
          </p>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-[var(--color-bg-card)] rounded-t-3xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto">
              <i className="ti ti-alert-triangle text-red-400 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] text-center">
              Supprimer le compte ?
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] text-center">
              Cette action est irréversible. Toutes tes données, paris et solde seront supprimés définitivement.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold disabled:opacity-50"
            >
              {deleteLoading ? "Suppression…" : "Oui, supprimer mon compte"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full py-3.5 rounded-2xl bg-white/10 text-[var(--color-text-primary)] font-semibold"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
