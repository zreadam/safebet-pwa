"use client"

export const dynamic = "force-dynamic"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LeaguePreview {
  id: string
  name: string
  emoji: string
  color: string
  member_count: number
  is_private: boolean
}

function JoinLeagueContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCode = searchParams?.get("code") ?? ""

  const [code, setCode] = useState(initialCode.toUpperCase())
  const [lookupLoading, setLookupLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [preview, setPreview] = useState<LeaguePreview | null>(null)
  const [codeError, setCodeError] = useState("")
  const [publicLeagues, setPublicLeagues] = useState<LeaguePreview[]>([])
  const [publicLoading, setPublicLoading] = useState(true)

  const didAutoSearch = useRef(false)
  useEffect(() => {
    if (initialCode && !didAutoSearch.current) {
      didAutoSearch.current = true
      lookupCode(initialCode.toUpperCase())
    }
  }, [initialCode]) // eslint-disable-line

  useEffect(() => {
    fetch("/api/leagues?public=true")
      .then(r => r.json())
      .then(data => setPublicLeagues(data.leagues ?? []))
      .catch(() => {})
      .finally(() => setPublicLoading(false))
  }, [])

  async function lookupCode(c: string) {
    if (!c || c.length < 4) return
    setLookupLoading(true)
    setCodeError("")
    setPreview(null)
    try {
      const res = await fetch(`/api/leagues/lookup?code=${c}`)
      if (!res.ok) { setCodeError("Code invalide — aucune ligue trouvée"); return }
      setPreview(await res.json())
    } catch {
      setCodeError("Erreur lors de la recherche")
    } finally {
      setLookupLoading(false)
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
    setCode(val)
    setCodeError("")
    setPreview(null)
    if (val.length >= 6) lookupCode(val)
  }

  async function handleJoin(leagueId: string) {
    setJoinLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur")
      toast.success("Tu as rejoint la ligue !")
      router.push(`/ligues/${leagueId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Impossible de rejoindre")
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div className="max-w-[430px] mx-auto pb-24">
      {/* AppBar */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg-base)] border-b border-white/10 px-4">
        <div className="flex items-center gap-2 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          >
            <i className="ti ti-chevron-left text-xl text-[var(--color-text-primary)]" />
          </button>
          <h1 className="flex-1 text-[17px] font-bold text-[var(--color-text-primary)] [font-family:var(--font-display)]">
            Rejoindre une ligue
          </h1>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Code input */}
        <div>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 block uppercase tracking-wide">
            Code d'invitation
          </label>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="EX: ABC12345"
              maxLength={8}
              className={cn(
                "rounded-xl h-14 px-4 w-full text-xl font-bold [font-family:var(--font-display)] tracking-[0.2em] text-center bg-[var(--color-bg-card)] border placeholder:text-[var(--color-text-secondary)] placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-2 transition-colors text-[var(--color-text-primary)]",
                codeError
                  ? "border-red-500 focus:ring-red-500/30"
                  : "border-white/10 focus:ring-[var(--color-brand-primary)]/30"
              )}
            />
            {lookupLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <i className="ti ti-loader-2 animate-spin text-[var(--color-text-secondary)]" />
              </div>
            )}
          </div>
          {codeError && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <i className="ti ti-alert-circle" />
              {codeError}
            </p>
          )}
        </div>

        {/* League preview */}
        {preview && (
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-brand-primary)] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                style={{ background: (preview.color ?? "#10B981") + "22" }}
              >
                {preview.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-[var(--color-text-primary)] truncate">{preview.name}</p>
                  {preview.is_private && (
                    <span className="text-[10px] font-bold bg-[var(--amber-400)]/20 text-[var(--amber-400)] rounded-full px-1.5 py-0.5">
                      PRIVÉE
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {preview.member_count} membre{preview.member_count > 1 ? "s" : ""}
                </p>
              </div>
              <i className="ti ti-circle-check text-2xl text-[var(--color-brand-primary)] shrink-0" />
            </div>
            <button
              onClick={() => handleJoin(preview.id)}
              disabled={joinLoading}
              className="bg-[var(--color-brand-primary)] text-white rounded-xl h-12 w-full font-semibold disabled:opacity-60"
            >
              {joinLoading ? <span className="flex items-center justify-center gap-2"><i className="ti ti-loader-2 animate-spin" /> Rejoindre…</span> : "Rejoindre"}
            </button>
          </div>
        )}

        {/* Public leagues */}
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
            Ligues publiques disponibles
          </h2>
          {publicLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-[var(--color-bg-card)] animate-pulse" />
              ))}
            </div>
          ) : publicLeagues.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-6">
              Aucune ligue publique pour l'instant
            </p>
          ) : (
            <div className="space-y-2">
              {publicLeagues.map(league => (
                <div
                  key={league.id}
                  className="bg-[var(--color-bg-card)] border border-white/5 rounded-2xl p-3 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                    style={{ background: (league.color ?? "#10B981") + "22" }}
                  >
                    {league.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{league.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{league.member_count} membre{league.member_count > 1 ? "s" : ""}</p>
                  </div>
                  <button
                    onClick={() => handleJoin(league.id)}
                    disabled={joinLoading}
                    className="shrink-0 h-8 px-3 rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-sm font-semibold border border-[var(--color-brand-primary)]/30 disabled:opacity-60"
                  >
                    Rejoindre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JoinLeaguePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><i className="ti ti-loader-2 animate-spin text-2xl text-[var(--color-brand-primary)]" /></div>}>
        <JoinLeagueContent />
      </Suspense>
    </AppShell>
  )
}
