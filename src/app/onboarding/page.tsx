"use client"

export const dynamic = "force-dynamic"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const COMPETITIONS = [
  { key: "L1",   name: "Ligue 1",        color: "#10B981" },
  { key: "UCL",  name: "Champions Lg",   color: "#0a1a5e" },
  { key: "PL",   name: "Premier League", color: "#3d195b" },
  { key: "LIGA", name: "La Liga",        color: "#e01a22" },
  { key: "SA",   name: "Serie A",        color: "#0067b1" },
  { key: "BL",   name: "Bundesliga",     color: "#e01a22" },
  { key: "CDM",  name: "Coupe du Monde", color: "#f59e0b" },
  { key: "EL",   name: "Europa League",  color: "#f97316" },
]

const TEAMS = [
  { code: "PSG",  name: "Paris SG",    color: "#0b1b3a" },
  { code: "OM",   name: "Marseille",   color: "#2faee0" },
  { code: "OL",   name: "Lyon",        color: "#13294b" },
  { code: "ASM",  name: "Monaco",      color: "#cf1730" },
  { code: "LOSC", name: "Lille",       color: "#e01e2c" },
  { code: "NUFC", name: "Newcastle",   color: "#0a0a0a" },
  { code: "MCI",  name: "Man City",    color: "#6caddf" },
  { code: "FCB",  name: "Barcelona",   color: "#a50044" },
  { code: "RM",   name: "Real Madrid", color: "#e8e8e8" },
  { code: "BVB",  name: "Dortmund",    color: "#fde12d" },
  { code: "BAY",  name: "Bayern",      color: "#dc052d" },
  { code: "JUV",  name: "Juventus",    color: "#0a0a0a" },
]

function ObProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="absolute top-12 left-6 right-6 flex gap-[6px] z-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i}
             className={cn(
               "flex-1 h-[5px] rounded-full transition-all duration-500",
               i < step ? "bg-white" : "bg-white/40"
             )} />
      ))}
    </div>
  )
}

function ObInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
           className="w-full h-[50px] rounded-[12px] border border-white/60
                      bg-white/85 px-4 text-[var(--fg-1)] placeholder:text-[var(--fg-3)]
                      outline-none focus:border-white focus:ring-2 focus:ring-white/30
                      [font-family:var(--font-body)] text-[15px]" />
  )
}

/* Champ date custom — 3 selects Jour / Mois / Année */
const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
]

function ObDateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // value est au format "YYYY-MM-DD" ou ""
  const parts = value ? value.split("-") : ["", "", ""]
  const year  = parts[0] || ""
  const month = parts[1] || ""
  const day   = parts[2] || ""

  function update(y: string, m: string, d: string) {
    if (y && m && d) onChange(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`)
    else onChange("")
  }

  const daysInMonth = month && year
    ? new Date(parseInt(year), parseInt(month), 0).getDate()
    : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  const selectClass = cn(
    "flex-1 h-[50px] rounded-[12px] border border-white/60 bg-white/85",
    "px-3 text-[15px] [font-family:var(--font-body)] text-[var(--fg-1)]",
    "outline-none focus:border-white focus:ring-2 focus:ring-white/30",
    "appearance-none cursor-pointer",
  )

  return (
    <div className="w-full space-y-2">
      <p className="text-[13px] text-white/80 [font-family:var(--font-body)] pl-1">
        Date de naissance
      </p>
      <div className="flex gap-2 w-full">
        {/* Jour */}
        <div className="relative flex-1">
          <select
            value={day}
            onChange={e => update(year, month, e.target.value)}
            className={cn(selectClass, !day && "text-[var(--fg-3)]")}
          >
            <option value="" disabled>Jour</option>
            {days.map(d => (
              <option key={d} value={String(d)}>{String(d).padStart(2,"0")}</option>
            ))}
          </select>
          <i className="ti ti-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)] text-[14px] pointer-events-none" />
        </div>

        {/* Mois */}
        <div className="relative flex-[1.6]">
          <select
            value={month}
            onChange={e => update(year, e.target.value, day)}
            className={cn(selectClass, !month && "text-[var(--fg-3)]")}
          >
            <option value="" disabled>Mois</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2,"0")}>{m}</option>
            ))}
          </select>
          <i className="ti ti-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)] text-[14px] pointer-events-none" />
        </div>

        {/* Année */}
        <div className="relative flex-[1.2]">
          <select
            value={year}
            onChange={e => update(e.target.value, month, day)}
            className={cn(selectClass, !year && "text-[var(--fg-3)]")}
          >
            <option value="" disabled>Année</option>
            {years.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <i className="ti ti-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)] text-[14px] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

/* Boutons : max-w-sm centré sur desktop, pleine largeur mobile */
function ObBtn({ children, onClick, variant = "primary", type = "button" }: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "ghost" | "google"
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "w-full max-w-sm mx-auto h-[48px] rounded-[12px] flex items-center justify-center gap-2",
        "font-semibold text-[15px] [font-family:var(--font-body)] transition-all duration-150",
        "active:scale-[.96]",
        variant === "primary" && "bg-white border-2 border-[var(--emerald-500)] text-[var(--emerald-600)] hover:bg-[var(--emerald-50)]",
        variant === "ghost"   && "bg-transparent text-white/90 hover:bg-white/10",
        variant === "google"  && "bg-white text-gray-700 border border-white/80 shadow-sm",
      )}>
      {children}
    </button>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [step, setStep]       = useState(() => {
    const s = searchParams.get("step")
    return s ? parseInt(s) : 1
  })
  const [settled, setSettled] = useState(false)
  const [loading, setLoading] = useState(false)
  // Si l'utilisateur vient de Google OAuth, son compte est déjà créé
  const fromGoogle = searchParams.get("step") !== null

  const [username, setUsername] = useState("")
  const [country, setCountry]   = useState("France")
  const [selComps, setSelComps] = useState(["L1"])
  const [favTeam, setFavTeam]   = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [dob, setDob]           = useState("")

  // 5 étapes : 1 profil · 2 compétitions+équipe · 3 compte · 4 PWA · 5 bienvenue
  const TOTAL = 5

  useEffect(() => { const t = setTimeout(() => setSettled(true), 1100); return () => clearTimeout(t) }, [])

  // Si l'user a déjà fini l'onboarding et revient sur cette page, redirect
  useEffect(() => {
    async function checkDone() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles").select("onboarding_done").eq("id", user.id).single()
      if (profile?.onboarding_done) {
        window.location.href = "/dashboard"
      }
    }
    // Ne vérifier que si on est à l'étape 1 (pas si envoyé par Google OAuth step=2+)
    if (step === 1) checkDone()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleComp = (k: string) =>
    setSelComps(c => c.includes(k) ? c.filter(x => x !== k) : [...c, k])

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard` },
    })
  }

  async function handleEmailSignup() {
    setLoading(true)
    if (dob) {
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)
      if (age < 12) { toast.error("Tu dois avoir au moins 12 ans pour t'inscrire."); setLoading(false); return }
    }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username || email.split("@")[0] } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setStep(4)
    setLoading(false)
  }

  async function finish() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("profiles").update({
        username: username || user.email?.split("@")[0],
        country,
        favorite_competitions: selComps,
        favorite_team: favTeam || null,
        onboarding_done: true,
      }).eq("id", user.id)
      // Hard redirect pour forcer le rafraîchissement de session
      window.location.href = "/dashboard"
    } else {
      // Session pas encore active (email non confirmé) → page de confirmation
      window.location.href = "/auth/login?message=confirm"
    }
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 overflow-hidden bg-white",
      settled && "[&_.ob-bg]:![animation:none]"
    )}>
      {/* Wave background */}
      <div className="ob-bg absolute inset-0 animate-blob-expand"
           style={{
             backgroundImage: "url('/bg/fond-safebet.png')",
             backgroundSize: "cover",
             backgroundPosition: "center",
             clipPath: "circle(150% at 50% 50%)",
           }}>

        <ObProgress step={step} total={TOTAL} />

        {/* Scrollable content — fade au top pour ne pas dépasser la barre de progression */}
        <div key={step}
             className="absolute inset-0 flex flex-col items-center overflow-y-auto pt-20 pb-10 px-6"
             style={{
               maskImage: "linear-gradient(to bottom, transparent 0px, transparent 68px, black 100px, black 100%)",
               WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, transparent 68px, black 100px, black 100%)",
             }}>
          <div className="w-full max-w-lg flex flex-col">

            {/* ── ÉTAPE 1 : Pseudo + pays ── */}
            {step === 1 && <>
              <div className="flex flex-col items-center gap-3 mt-2 mb-6 animate-ob-pop"
                   style={{ animationDelay: "0.45s" }}>
                <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center
                                shadow-[0_8px_24px_rgba(6,95,70,.25)] animate-ob-float"
                     style={{ animationDelay: "1.3s" }}>
                  <i className="ti ti-shield-check text-[36px] text-[var(--emerald-500)]" />
                </div>
              </div>
              <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white
                             text-center [font-family:var(--font-display)] mb-2 animate-rise-in"
                  style={{ animationDelay: "0.3s" }}>
                Parie avec tes amis.<br />Sans risque.
              </h1>
              <p className="text-white/95 text-[15px] text-center mb-6 animate-rise-in"
                 style={{ animationDelay: "0.38s" }}>
                Crée ton profil pour commencer
              </p>
              <div className="flex flex-col gap-3 animate-rise-in" style={{ animationDelay: "0.46s" }}>
                <ObInput placeholder="Ton pseudo" value={username} onChange={e => setUsername(e.target.value)} />
                <ObInput placeholder="🇫🇷 Pays" value={country} onChange={e => setCountry(e.target.value)} />
              </div>
              <div className="mt-6 flex flex-col gap-2 animate-rise-in" style={{ animationDelay: "0.54s" }}>
                <ObBtn onClick={() => setStep(2)}>Continuer <i className="ti ti-arrow-right" /></ObBtn>
                <p className="text-center text-[13px] text-white/70 mt-1">
                  Déjà un compte ?{" "}
                  <a href="/auth/login" className="text-white font-semibold underline underline-offset-2">
                    Se connecter
                  </a>
                </p>
              </div>
            </>}

            {/* ── ÉTAPE 2 : Compétitions + équipe favorite ── */}
            {step === 2 && <>
              <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white text-center
                             [font-family:var(--font-display)] mb-2 animate-rise-in mt-4"
                  style={{ animationDelay: "0.3s" }}>
                Tes préférences
              </h1>
              <p className="text-white/95 text-[15px] mb-5 animate-rise-in text-center" style={{ animationDelay: "0.38s" }}>
                On personnalisera ton expérience
              </p>

              {/* Compétitions */}
              <div className="animate-rise-in" style={{ animationDelay: "0.44s" }}>
                <p className="text-white/90 text-sm font-semibold mb-2">Compétitions favorites</p>
                <div className="grid grid-cols-2 gap-[10px]">
                  {COMPETITIONS.map(c => (
                    <button key={c.key}
                            onClick={() => toggleComp(c.key)}
                            className={cn(
                              "flex items-center gap-[9px] px-3 py-[11px] rounded-[12px]",
                              "bg-white/85 border-2 text-[13px] font-semibold text-[var(--fg-1)]",
                              "transition-all duration-150 active:scale-95",
                              selComps.includes(c.key) ? "border-[var(--emerald-500)] bg-white" : "border-transparent"
                            )}>
                      <span className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center
                                       text-[10px] font-bold text-white shrink-0"
                            style={{ background: c.color }}>
                        {c.key[0]}
                      </span>
                      <span className="truncate">{c.name}</span>
                      {selComps.includes(c.key) && <span className="ml-auto text-[var(--emerald-600)] font-bold shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Équipe favorite */}
              <div className="mt-5 animate-rise-in" style={{ animationDelay: "0.52s" }}>
                <p className="text-white/90 text-sm font-semibold mb-2">
                  Équipe de cœur <span className="font-normal opacity-70">(optionnel)</span>
                </p>
                <div className="grid grid-cols-2 gap-[10px]">
                  {TEAMS.map(t => (
                    <button key={t.code}
                            onClick={() => setFavTeam(favTeam === t.code ? "" : t.code)}
                            className={cn(
                              "flex items-center gap-[9px] px-3 py-[11px] rounded-[12px]",
                              "bg-white/85 border-2 text-[13px] font-semibold text-[var(--fg-1)]",
                              "transition-all duration-150 active:scale-95",
                              favTeam === t.code ? "border-[var(--emerald-500)] bg-white" : "border-transparent"
                            )}>
                      <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center
                                       text-[9px] font-bold text-white shrink-0"
                            style={{ background: t.color }}>
                        {t.code.slice(0, 2)}
                      </span>
                      <span className="truncate">{t.name}</span>
                      {favTeam === t.code && <span className="ml-auto text-[var(--emerald-600)] font-bold shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 animate-rise-in" style={{ animationDelay: "0.60s" }}>
                <ObBtn onClick={() => setStep(3)}>Continuer <i className="ti ti-arrow-right" /></ObBtn>
                {!fromGoogle && (
                  <ObBtn variant="ghost" onClick={() => setStep(1)}><i className="ti ti-arrow-left" /> Retour</ObBtn>
                )}
              </div>
            </>}

            {/* ── ÉTAPE 3 : Création de compte ── */}
            {step === 3 && <>
              <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white text-center
                             [font-family:var(--font-display)] mb-2 animate-rise-in mt-4"
                  style={{ animationDelay: "0.3s" }}>
                Crée ton compte
              </h1>
              <p className="text-white/95 text-[15px] mb-6 animate-rise-in text-center" style={{ animationDelay: "0.38s" }}>
                Sauvegarde ton solde et tes ligues
              </p>

              <div className="flex flex-col gap-3 animate-rise-in w-full max-w-sm mx-auto"
                   style={{ animationDelay: "0.46s" }}>
                {/* Google */}
                <ObBtn variant="google" onClick={handleGoogleAuth}>
                  <span className="w-[18px] h-[18px] rounded-full shrink-0"
                        style={{ background: "conic-gradient(#EA4335 0 25%,#FBBC05 25% 50%,#34A853 50% 75%,#4285F4 75% 100%)" }} />
                  Continuer avec Google
                </ObBtn>

                <div className="flex items-center gap-2 text-white/80 text-xs font-semibold">
                  <span className="flex-1 h-px bg-white/50" />OU<span className="flex-1 h-px bg-white/50" />
                </div>

                <ObInput placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <ObInput placeholder="Mot de passe (6 caractères min.)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <ObDateInput value={dob} onChange={setDob} />

                <p className="text-white/70 text-[11px] text-center">
                  En continuant, tu acceptes les <span className="underline cursor-pointer">CGU</span>. Âge minimum : 12 ans.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2 animate-rise-in" style={{ animationDelay: "0.70s" }}>
                <ObBtn onClick={handleEmailSignup}>
                  {loading ? "Chargement…" : <><span>Créer mon compte</span> <i className="ti ti-arrow-right" /></>}
                </ObBtn>
                <ObBtn variant="ghost" onClick={() => setStep(2)}><i className="ti ti-arrow-left" /> Retour</ObBtn>
              </div>
            </>}

            {/* ── ÉTAPE 4 : Tuto PWA ── */}
            {step === 4 && <>
              <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white text-center
                             [font-family:var(--font-display)] mb-2 animate-rise-in mt-4"
                  style={{ animationDelay: "0.3s" }}>
                Installe l'app !
              </h1>
              <p className="text-white/95 text-[15px] mb-6 animate-rise-in text-center" style={{ animationDelay: "0.38s" }}>
                Accède à Safebet depuis ton écran d'accueil
              </p>
              <div className="flex flex-col gap-4 animate-rise-in" style={{ animationDelay: "0.46s" }}>
                <div className="bg-white/90 rounded-[18px] p-5 max-w-sm mx-auto w-full">
                  <p className="font-semibold text-[var(--fg-1)] mb-1 flex items-center gap-2">
                    <i className="ti ti-brand-apple text-[var(--fg-2)]" /> Sur iPhone (Safari)
                  </p>
                  <p className="text-sm text-[var(--fg-2)]">
                    Appuie sur <strong>Partager</strong> <i className="ti ti-share" /> → <strong>Sur l'écran d'accueil</strong>
                  </p>
                </div>
                <div className="bg-white/90 rounded-[18px] p-5 max-w-sm mx-auto w-full">
                  <p className="font-semibold text-[var(--fg-1)] mb-1 flex items-center gap-2">
                    <i className="ti ti-brand-android text-[var(--fg-2)]" /> Sur Android (Chrome)
                  </p>
                  <p className="text-sm text-[var(--fg-2)]">
                    Appuie sur <strong>⋮ Menu</strong> → <strong>Ajouter à l'écran d'accueil</strong>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 animate-rise-in" style={{ animationDelay: "0.62s" }}>
                <ObBtn onClick={() => setStep(5)}>C'est fait ! <i className="ti ti-check" /></ObBtn>
                <ObBtn variant="ghost" onClick={() => setStep(5)}>Passer cette étape</ObBtn>
              </div>
            </>}

            {/* ── ÉTAPE 5 : Bienvenue ── */}
            {step === 5 && <>
              <div className="flex flex-col items-center gap-3 mt-6 mb-6">
                <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center
                                shadow-[0_8px_24px_rgba(6,95,70,.25)] animate-ob-pop"
                     style={{ animationDelay: "0.45s" }}>
                  <i className="ti ti-confetti text-[36px] text-[var(--emerald-500)]" />
                </div>
              </div>
              <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white
                             text-center [font-family:var(--font-display)] mb-2 animate-rise-in"
                  style={{ animationDelay: "0.3s" }}>
                Bienvenue sur Safebet !
              </h1>
              <p className="text-white/95 text-[15px] text-center mb-6 animate-rise-in"
                 style={{ animationDelay: "0.38s" }}>
                Ton solde de départ est prêt
              </p>
              <div className="bg-white/95 rounded-[18px] p-6 text-center animate-rise-in max-w-sm mx-auto w-full"
                   style={{ animationDelay: "0.46s" }}>
                <div className="flex items-center justify-center gap-3 text-[44px] font-bold
                                [font-family:var(--font-display)] text-[var(--emerald-600)]">
                  <span className="w-10 h-10 rounded-full bg-[var(--emerald-500)] text-white
                                   flex items-center justify-center text-xl font-bold">B</span>
                  50
                </div>
                <p className="text-sm text-[var(--fg-2)] mt-2">50 Bluffs offerts pour te lancer</p>
              </div>
              <div className="mt-6 animate-rise-in" style={{ animationDelay: "0.54s" }}>
                <ObBtn onClick={finish}>
                  Découvrir Safebet <i className="ti ti-arrow-right" />
                </ObBtn>
              </div>
            </>}

          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-white" />}>
      <OnboardingContent />
    </Suspense>
  )
}
