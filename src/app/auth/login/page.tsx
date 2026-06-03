"use client"

export const dynamic = "force-dynamic"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const needsConfirm = searchParams.get("message") === "confirm"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      toast.error("Erreur avec Google : " + error.message)
      setGoogleLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Remplis tous les champs")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error("Identifiants incorrects")
      return
    }
    router.push("/dashboard")
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Entre ton adresse e-mail d'abord")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error("Erreur : " + error.message)
      return
    }
    setResetSent(true)
    toast.success("E-mail de réinitialisation envoyé !")
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[430px] mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Safebet" className="w-20 h-20 object-contain mb-2" />
          <span className="text-[26px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)]">
            Safebet
          </span>
        </div>

        {/* Bannière confirmation email */}
        {needsConfirm && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-4 mb-4 flex items-start gap-3">
            <i className="ti ti-mail-check text-[var(--emerald-500)] text-xl mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Confirme ton adresse email</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Un email t'a été envoyé. Clique sur le lien pour activer ton compte, puis connecte-toi ici.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-[var(--bg-1)] border border-[var(--border-light)] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <h1 className="text-[22px] font-bold text-[var(--fg-1)] [font-family:var(--font-display)] mb-1">
            Bon retour !
          </h1>
          <p className="text-[14px] text-[var(--fg-3)] mb-6">
            Content de te revoir
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-[10px] border border-[var(--border-light)] bg-white text-[var(--fg-1)] font-semibold text-[15px] transition-opacity disabled:opacity-60 mb-4"
          >
            {googleLoading ? (
              <i className="ti ti-loader-2 text-[18px] animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            Continuer avec Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[var(--border-light)]" />
            <span className="text-[12px] text-[var(--fg-3)]">ou</span>
            <div className="flex-1 h-px bg-[var(--border-light)]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="text-[13px] font-medium text-[var(--fg-2)] mb-1 block">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="toi@exemple.fr"
                className="border border-[var(--border-light)] rounded-[10px] h-12 px-4 w-full text-[15px] text-[var(--fg-1)] bg-white placeholder:text-[var(--fg-3)] focus:outline-none focus:border-[var(--emerald-500)] transition-colors"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[var(--fg-2)] mb-1 block">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border border-[var(--border-light)] rounded-[10px] h-12 px-4 w-full text-[15px] text-[var(--fg-1)] bg-white placeholder:text-[var(--fg-3)] focus:outline-none focus:border-[var(--emerald-500)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--emerald-500)] text-white rounded-[10px] h-12 w-full font-semibold text-[15px] transition-opacity disabled:opacity-60 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ti ti-loader-2 animate-spin" /> Connexion…
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Forgot password */}
          <button
            onClick={handleForgotPassword}
            className="w-full text-center text-[13px] text-[var(--emerald-500)] font-medium mt-3 hover:underline"
          >
            {resetSent ? "E-mail envoyé ✓" : "Mot de passe oublié ?"}
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-[14px] text-[var(--fg-3)] mt-5">
          Pas encore de compte ?{" "}
          <Link href="/onboarding" className="text-[var(--emerald-500)] font-semibold hover:underline">
            Créer un compte →
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  )
}
