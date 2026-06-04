"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Cropper from "react-easy-crop"
import AppShell from "@/components/layout/AppShell"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { useProfile } from "@/hooks/useProfile"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Area } from "react-easy-crop"

/* ── helper: crop image via canvas ───────────────────────────── */
async function getCroppedBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = imageSrc
  })
  const canvas = document.createElement("canvas")
  canvas.width  = cropArea.width
  canvas.height = cropArea.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height)
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error("blob null")), "image/jpeg", 0.9)
  )
}

const PIXEL_AVATARS = [
  { id: "r9",           label: "Ronaldo R9",   src: "/avatars/r9.png" },
  { id: "ronaldinho",   label: "Ronaldinho",   src: "/avatars/ronaldinho.png" },
  { id: "zidane",       label: "Zidane",       src: "/avatars/zidane.png" },
  { id: "beckham",      label: "Beckham",      src: "/avatars/beckam.png" },
  { id: "luis-enrique", label: "Luis Enrique", src: "/avatars/luis-enrique.png" },
  { id: "guardiola",    label: "Guardiola",    src: "/avatars/guardiola.png" },
  { id: "mbappe",       label: "Mbappé",       src: "/avatars/mbappe.png" },
  { id: "yamal",        label: "Yamal",        src: "/avatars/yamal.png" },
]

/* ──────────────── stat card ─────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1
                    bg-[var(--bg-2)] border border-[var(--border-light)]
                    rounded-[var(--radius-card)] p-4 text-center">
      <span className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
        {value}
      </span>
      <span className="text-[11px] text-[var(--fg-3)]">{label}</span>
    </div>
  )
}

/* ──────────────── toggle ────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "w-11 h-6 rounded-full border-2 transition-all duration-200 relative",
        value ? "bg-[var(--emerald-500)] border-[var(--emerald-500)]" : "bg-[var(--bg-3)] border-[var(--border-light)]"
      )}>
      <span className={cn(
        "absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow transition-all duration-200",
        value ? "left-[calc(100%-18px)]" : "left-[2px]"
      )} />
    </button>
  )
}

/* ──────────────── setting row ───────────────────────────────── */
interface SettingRowProps {
  icon: string
  label: string
  sub?: string
  toggle?: { value: boolean; onChange: (v: boolean) => void }
  rightText?: string
  href?: string
  danger?: boolean
  onClick?: () => void
}

function SettingRow({ icon, label, sub, toggle, rightText, href, danger, onClick }: SettingRowProps) {
  const content = (
    <div className={cn(
      "flex items-center gap-4 px-4 py-[14px] border-b border-[var(--border-light)] last:border-0",
      "transition-colors hover:bg-[var(--bg-2)] active:bg-[var(--bg-3)] cursor-pointer"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[18px]",
        danger ? "bg-[#FEF2F2] text-[var(--error)]" : "bg-[var(--bg-3)] text-[var(--fg-2)]"
      )}>
        <i className={`ti ${icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[14px] font-medium", danger ? "text-[var(--error)]" : "text-[var(--fg-1)]")}>
          {label}
        </p>
        {sub && <p className="text-[12px] text-[var(--fg-3)] mt-[1px]">{sub}</p>}
      </div>
      {toggle && <Toggle value={toggle.value} onChange={toggle.onChange} />}
      {rightText && <span className="text-[13px] text-[var(--fg-3)]">{rightText}</span>}
      {!toggle && !rightText && !danger && (
        <i className="ti ti-chevron-right text-[16px] text-[var(--fg-3)]" />
      )}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return <div onClick={onClick}>{content}</div>
}

/* ────────────────────────── PAGE ───────────────────────────── */
export default function ProfilPage() {
  const { profile, loading, refetch } = useProfile()
  const { signOut } = useAuth()

  const [darkMode, setDarkMode]         = useState(false)
  const [notifs, setNotifs]             = useState(true)
  const [notifBets, setNotifBets]       = useState(true)
  const [notifLeagues, setNotifLeagues] = useState(false)
  const [notifMatches, setNotifMatches] = useState(true)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushGranted, setPushGranted]     = useState(false)
  const [showSheet, setShowSheet]         = useState(false)
  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [editingName, setEditingName]   = useState(false)
  const [username, setUsername]         = useState("")
  const [savingName, setSavingName]     = useState(false)
  // crop
  const [cropSrc, setCropSrc]           = useState<string | null>(null)
  const [crop, setCrop]                 = useState({ x: 0, y: 0 })
  const [zoom, setZoom]                 = useState(1)
  const [croppedArea, setCroppedArea]   = useState<Area | null>(null)

  useEffect(() => {
    if (profile) {
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
      setUsername(profile.username || "")
    }
  }, [profile])

  useEffect(() => {
    setPushSupported("Notification" in window && "serviceWorker" in navigator)
    setPushGranted(Notification.permission === "granted")
  }, [])

  async function saveName() {
    if (!username.trim()) return
    setSavingName(true)
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })
      refetch()
      toast.success("Pseudo mis à jour !")
    } catch {
      toast.error("Erreur")
    } finally {
      setSavingName(false)
      setEditingName(false)
    }
  }

  /* sync dark mode with actual html class */
  useEffect(() => {
    const html = document.documentElement
    setDarkMode(html.classList.contains("dark"))
  }, [])

  /* choisir un avatar pixel art — sheet reste ouvert */
  async function selectAvatar(src: string) {
    setAvatarUrl(src)
    // on ne ferme PAS le sheet
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: src }),
      })
      refetch()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  /* ouvrir le crop modal quand une photo est choisie */
  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }, [])

  /* confirmer le rognage et uploader */
  const confirmCrop = useCallback(async () => {
    if (!cropSrc || !croppedArea) return
    setUploading(true)
    setCropSrc(null)
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea)
      const fd = new FormData()
      fd.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }))
      const res  = await fetch("/api/profile/avatar", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatarUrl(data.url)
      toast.success("Photo mise à jour !")
      refetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur upload")
    } finally {
      setUploading(false)
    }
  }, [cropSrc, croppedArea, refetch])

  function toggleDark(on: boolean) {
    setDarkMode(on)
    document.documentElement.classList.toggle("dark", on)
  }

  const initial = profile?.username?.[0]?.toUpperCase() ?? "?"
  const isPremium = profile?.tier === "premium"

  return (
    <AppShell>
      <div className="max-w-[430px] mx-auto">

        {/* ── header ── */}
        <header className="sticky top-0 z-30 bg-[var(--bg-1)] border-b border-[var(--border-light)] px-4 py-3">
          <h1 className="text-[21px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)] tracking-tight">
            Mon profil
          </h1>
        </header>

        <div className="px-4 pt-6 pb-4 flex flex-col gap-6">

          {/* ── Avatar + identity ── */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {/* Avatar — sans liseré, crayon transparent */}
              <button onClick={() => setShowSheet(true)} className="relative w-[88px] h-[88px]">
                <div className="w-[88px] h-[88px] rounded-full overflow-hidden shadow-lg">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar"
                         className="w-full h-full object-cover"
                         style={{ imageRendering: "pixelated" }} />
                  ) : (
                    <div className="w-full h-full bg-[var(--emerald-500)] flex items-center justify-center
                                    text-white text-[36px] font-bold [font-family:var(--font-display)]">
                      {loading ? "?" : initial}
                    </div>
                  )}
                </div>
                {/* Rond crayon transparent */}
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/30 backdrop-blur-sm
                                rounded-full flex items-center justify-center border border-white/20">
                  {uploading
                    ? <i className="ti ti-loader-2 text-white text-[13px] animate-spin" />
                    : <i className="ti ti-pencil text-white text-[13px]" />}
                </div>
              </button>
            </div>

            {loading ? (
              <>
                <div className="skeleton w-32 h-5 rounded" />
                <div className="skeleton w-20 h-5 rounded" />
              </>
            ) : (
              <>
                {/* Nom éditable */}
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false) }}
                      maxLength={20}
                      className="text-[18px] font-bold text-center bg-[var(--bg-2)] border border-[var(--emerald-500)]
                                 rounded-xl px-3 py-1 text-[var(--fg-1)] outline-none w-40"
                    />
                    <button onClick={saveName} disabled={savingName}
                            className="w-8 h-8 rounded-full bg-[var(--emerald-500)] flex items-center justify-center">
                      {savingName
                        ? <i className="ti ti-loader-2 text-white text-xs animate-spin" />
                        : <i className="ti ti-check text-white text-xs" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-[20px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                      {profile?.username ?? "Utilisateur"}
                    </p>
                    <button onClick={() => setEditingName(true)}
                            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center">
                      <i className="ti ti-pencil text-[var(--fg-3)] text-[12px]" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[11px] font-bold px-[10px] py-[4px] rounded-full",
                    isPremium
                      ? "bg-[var(--amber-50)] text-[var(--amber-700)]"
                      : "bg-[var(--bg-3)] text-[var(--fg-3)]"
                  )}>
                    {isPremium ? "✨ PREMIUM" : "FREE"}
                  </span>
                  <BluffBadge value={(profile?.balance ?? 0).toFixed(2)} />
                </div>
              </>
            )}
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total paris"
              value={loading ? "—" : (profile?.total_bets ?? 0)}
            />
            <StatCard
              label="Réussite"
              value={
                loading ? "—" : (
                  <span className="text-[var(--emerald-500)]">
                    {Math.round((profile?.win_rate ?? 0) * 100)}%
                  </span>
                )
              }
            />
            <StatCard
              label="Meilleur gain"
              value={
                loading ? "—" : (
                  <span className="text-[var(--emerald-500)] text-[18px]">
                    {/* derive from balance history; show balance as proxy */}
                    {(profile?.balance ?? 0).toFixed(0)} B
                  </span>
                )
              }
            />
            <StatCard
              label="Série"
              value={
                loading ? "—" : (
                  <span className="flex items-center gap-1 justify-center">
                    🔥 {profile?.streak ?? 0}
                  </span>
                )
              }
            />
          </div>

          {/* ── Premium CTA (free only) ── */}
          {!loading && !isPremium && (
            <Link href="/premium"
                  className="flex items-center justify-center gap-2 py-[14px] rounded-[var(--radius-btn)]
                             bg-gradient-to-r from-[var(--amber-500)] to-[#f97316]
                             text-white font-bold text-[15px] [font-family:var(--font-display)]
                             shadow-md hover:opacity-90 transition-opacity active:scale-[.98]">
              <i className="ti ti-crown text-[18px]" />
              Passe au Premium
            </Link>
          )}

          {/* ── Paramètres ── */}
          <section>
            <h2 className="text-[17px] font-semibold [font-family:var(--font-display)]
                           text-[var(--fg-1)] tracking-tight mb-2">
              Paramètres
            </h2>
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                            [box-shadow:var(--shadow-card)] overflow-hidden">
              <SettingRow
                icon="ti-moon"
                label="Mode sombre"
                sub="Changer l'apparence de l'app"
                toggle={{ value: darkMode, onChange: toggleDark }}
              />
              <SettingRow
                icon="ti-world"
                label="Langue"
                sub="Langue de l'interface"
                rightText="Français"
              />
              <SettingRow
                icon="ti-crown"
                label="Abonnement"
                sub={isPremium ? "Tu es Premium ✨" : "Passe au Premium"}
                href="/premium"
              />
              <SettingRow
                icon="ti-logout"
                label="Déconnexion"
                danger
                onClick={signOut}
              />
            </div>
          </section>

          {/* ── Notifications ── */}
          <section>
            <h2 className="text-[17px] font-semibold [font-family:var(--font-display)]
                           text-[var(--fg-1)] tracking-tight mb-2">
              Notifications
            </h2>
            <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[var(--radius-card)]
                            [box-shadow:var(--shadow-card)] overflow-hidden">
              <SettingRow icon="ti-bell"     label="Résultats de paris"  toggle={{ value: notifBets,    onChange: setNotifBets }} />
              <SettingRow icon="ti-star"     label="Quêtes disponibles"  toggle={{ value: notifs,       onChange: setNotifs }} />
              <SettingRow icon="ti-users"    label="Activité des ligues" toggle={{ value: notifLeagues, onChange: setNotifLeagues }} />
              <SettingRow icon="ti-calendar" label="Rappels avant match" toggle={{ value: notifMatches, onChange: setNotifMatches }} />
              {pushSupported && !pushGranted && (
                <div className="px-4 py-3">
                  <button
                    onClick={async () => {
                      const perm = await Notification.requestPermission()
                      setPushGranted(perm === "granted")
                      if (perm === "granted") toast.success("Notifications activées !")
                      else toast.error("Notifications refusées")
                    }}
                    className="w-full py-3 rounded-xl border border-[var(--emerald-500)]
                               text-[var(--emerald-500)] text-sm font-semibold flex items-center justify-center gap-2">
                    <i className="ti ti-bell-ringing text-base" />
                    Activer les notifications push
                  </button>
                </div>
              )}
              {pushGranted && (
                <div className="px-4 py-3 flex items-center gap-2">
                  <i className="ti ti-bell-check text-[var(--emerald-500)]" />
                  <span className="text-xs text-[var(--fg-3)]">Notifications push activées</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Legal note ── */}
          <p className="text-[11px] text-[var(--fg-3)] text-center pb-2">
            Safebet utilise de la monnaie fictive uniquement. Aucun argent réel.
          </p>

        </div>
      </div>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80">
            <button onClick={() => setCropSrc(null)}
                    className="text-white/60 text-sm font-semibold">
              Annuler
            </button>
            <p className="text-white font-bold text-sm">Rogner la photo</p>
            <div className="w-16" />
          </div>

          {/* Zone de crop */}
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, area) => setCroppedArea(area)}
            />
          </div>

          {/* Bas : slider + bouton confirmer */}
          <div className="px-6 pt-4 pb-8 bg-black/80 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <i className="ti ti-zoom-out text-white/50 text-lg" />
              <input
                type="range"
                min={1} max={3} step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--emerald-500)]"
              />
              <i className="ti ti-zoom-in text-white/50 text-lg" />
            </div>
            <button
              onClick={confirmCrop}
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-[var(--emerald-500)] text-white font-bold text-[16px]
                         flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[.98] transition-all">
              {uploading
                ? <><i className="ti ti-loader-2 animate-spin" /> Envoi en cours…</>
                : <><i className="ti ti-check" /> Utiliser cette photo</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom sheet avatar ── */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSheet(false)} />
          <div className="relative bg-[#1a1f2e] rounded-t-3xl px-4 pt-4 pb-8">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold text-white">Choisis ton avatar</p>
              <button onClick={() => setShowSheet(false)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <i className="ti ti-x text-white text-sm" />
              </button>
            </div>

            {/* Grille 4×2 — sans noms, sheet reste ouvert */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {PIXEL_AVATARS.map(av => (
                <button key={av.id} type="button"
                        onClick={() => selectAvatar(av.src)}
                        className="flex flex-col items-center">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all",
                    avatarUrl === av.src
                      ? "border-[var(--emerald-500)] scale-105"
                      : "border-transparent opacity-70"
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={av.src} alt={av.label}
                         className="w-full h-full object-cover"
                         style={{ imageRendering: "pixelated" }} />
                  </div>
                </button>
              ))}
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/40">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Upload photo perso — iOS-safe */}
            <div className="relative w-full h-12">
              <div className="absolute inset-0 rounded-2xl border border-white/20 flex items-center justify-center gap-2 pointer-events-none">
                <i className={cn("ti text-[var(--emerald-500)] text-lg",
                   uploading ? "ti-loader-2 animate-spin" : "ti-photo")} />
                <span className="text-sm font-semibold text-white">
                  {uploading ? "Envoi…" : "Importer ma propre photo"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={uploading}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  fontSize: "0",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
