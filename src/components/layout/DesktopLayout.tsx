"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { cn } from "@/lib/utils"

interface DesktopLayoutProps {
  children: React.ReactNode
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [isDark, setIsDark] = useState(false)

  const navItems = [
    { icon: "home", label: "Accueil", href: "/dashboard" },
    { icon: "ball-football", label: "Matchs", href: "/paris" },
    { icon: "ticket", label: "Mes paris", href: "/paris" },
    { icon: "trophy", label: "Ligues", href: "/ligues" },
    { icon: "star", label: "Quêtes", href: "/quetes" },
  ]

  return (
    <div className="hidden md:flex h-screen bg-[var(--bg-2)]">
      {/* ──── SIDEBAR ──── */}
      <aside className="w-[248px] sticky top-0 h-screen bg-[var(--bg-1)] border-r border-[var(--border-light)] flex flex-col p-[22px_16px] gap-2 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-[10px] px-2 pb-[18px]">
          <Link href="/dashboard" className="flex items-center gap-2 flex-1">
            <Image
              src="/logo.png"
              alt="Safebet"
              width={42}
              height={42}
              className="rounded-[11px]"
              priority
            />
            <span className="text-[22px] font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
              Safebet
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-[13px] px-[13px] py-[11px] rounded-[10px] transition-colors text-[15px] font-semibold",
                pathname === item.href
                  ? "bg-[var(--emerald-50)] text-[var(--emerald-600)]"
                  : "text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
              )}
            >
              <i className={`ti ti-${item.icon} text-[22px]`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Premium Box */}
        <div className="rounded-[12px] p-4 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] mb-2">
          <h4 className="text-[15px] font-bold [font-family:var(--font-display)] text-[#78350F] flex items-center gap-[6px] mb-1">
            <i className="ti ti-crown" /> Passe au Premium
          </h4>
          <p className="text-[12px] font-medium text-[#92400E] mb-3">
            Ligues privées, live, stats avancées et quêtes exclusives.
          </p>
          <button className="w-full h-10 rounded-[10px] bg-[var(--amber-500)] text-white font-semibold text-[14px] hover:bg-[var(--amber-700)] transition-colors">
            4,99€ / mois
          </button>
        </div>

        {/* Settings */}
        <Link
          href="/profil"
          className={cn(
            "flex items-center gap-[13px] px-[13px] py-[11px] rounded-[10px] transition-colors text-[15px] font-semibold",
            pathname === "/profil"
              ? "bg-[var(--emerald-50)] text-[var(--emerald-600)]"
              : "text-[var(--fg-2)] hover:bg-[var(--bg-3)]"
          )}
        >
          <i className="ti ti-settings text-[22px]" />
          <span>Réglages</span>
        </Link>

        {/* User Section */}
        <button
          onClick={() => router.push("/profil")}
          className="flex items-center gap-[10px] px-[10px] py-[10px] rounded-[10px] hover:bg-[var(--bg-3)] transition-colors mt-2"
        >
          <div className="w-[38px] h-[38px] rounded-full bg-[var(--emerald-500)] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[13px] font-bold [font-family:var(--font-display)]">
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[13px] font-semibold text-[var(--fg-1)] truncate">
              {profile?.username ?? "Utilisateur"}
            </p>
            <p className="text-[11px] text-[var(--fg-3)] truncate">{user?.email}</p>
          </div>
        </button>
      </aside>

      {/* ──── MAIN CONTENT ──── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex items-center gap-[18px] px-8 py-4 bg-[var(--bg-2)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
          {/* Search */}
          <div className="flex-1 max-w-[420px] flex items-center gap-[9px] h-[42px] px-[14px] bg-[var(--bg-1)] border border-[var(--border-light)] rounded-full text-[var(--fg-3)]">
            <i className="ti ti-search text-[19px]" />
            <input
              type="text"
              placeholder="Rechercher un match, une équipe, un ami…"
              className="border-0 outline-0 bg-none flex-1 text-[var(--fg-1)] placeholder-[var(--fg-3)]"
            />
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bluff-badge-bg)]">
                <span className="text-[13px] text-[var(--fg-3)]">Solde:</span>
                <BluffBadge value={profile.balance.toFixed(2)} />
              </div>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              title="Mode sombre"
              className="w-[42px] h-[42px] rounded-full bg-[var(--bg-1)] border border-[var(--border-light)] flex items-center justify-center text-[var(--fg-1)] hover:bg-[var(--bg-3)] transition-colors"
            >
              <i className={`ti ti-${isDark ? "sun" : "moon"}`} />
            </button>
            <button className="w-[42px] h-[42px] rounded-full bg-[var(--bg-1)] border border-[var(--border-light)] flex items-center justify-center text-[var(--fg-1)] hover:bg-[var(--bg-3)] transition-colors relative">
              <i className="ti ti-bell" />
              <span className="absolute top-[9px] right-[10px] w-2 h-2 bg-[var(--error)] rounded-full border-2 border-[var(--bg-1)]" />
            </button>
            <button className="w-[42px] h-[42px] rounded-full bg-[var(--bg-1)] border border-[var(--border-light)] flex items-center justify-center text-[var(--fg-1)] hover:bg-[var(--bg-3)] transition-colors">
              <i className="ti ti-messages" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto px-8 py-7 bg-[var(--bg-2)]">
          <div className="max-w-[1240px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
