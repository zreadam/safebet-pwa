"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { BluffBadge } from "@/components/ui/bluff-badge"
import { cn } from "@/lib/utils"

interface DesktopLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  icon: string
  label: string
  href: string
  badge?: string
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems: NavItem[] = [
    { icon: "ti-home", label: "Accueil", href: "/dashboard" },
    { icon: "ti-ball-football", label: "Matchs", href: "/paris" },
    { icon: "ti-trophy", label: "Classements", href: "/classements" },
    { icon: "ti-users", label: "Ligues", href: "/ligues" },
    { icon: "ti-star", label: "Quêtes", href: "/quetes" },
    { icon: "ti-bell", label: "Notifications", href: "/notifications" },
  ]

  return (
    <div className="hidden md:flex h-screen bg-[var(--bg-1)]">
      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "transition-all duration-300 bg-[var(--bg-1)] border-r border-[var(--border-light)]",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-[var(--border-light)]">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--emerald-500)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚽</span>
              </div>
              {sidebarOpen && (
                <span className="text-lg font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
                  SafeBet
                </span>
              )}
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-[var(--emerald-500)] text-white"
                    : "text-[var(--fg-2)] hover:bg-[var(--bg-2)]"
                )}
                title={!sidebarOpen ? item.label : ""}
              >
                <i className={`ti ${item.icon} text-lg`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Profile Section */}
          <div className="border-t border-[var(--border-light)] p-4">
            <button
              onClick={() => router.push("/profil")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                "bg-[var(--bg-2)] hover:bg-[var(--bg-3)] transition-colors"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--emerald-500)] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {profile?.username?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-[var(--fg-1)] truncate">
                    {profile?.username ?? "Utilisateur"}
                  </p>
                  <p className="text-xs text-[var(--fg-3)] truncate">{user?.email}</p>
                </div>
              )}
            </button>
          </div>

          {/* Toggle Button */}
          <div className="border-t border-[var(--border-light)] p-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full p-2 rounded-lg hover:bg-[var(--bg-2)] transition-colors"
            >
              <i className={cn("ti text-lg text-[var(--fg-2)]", sidebarOpen ? "ti-chevron-left" : "ti-chevron-right")} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="border-b border-[var(--border-light)] bg-[var(--bg-1)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold [font-family:var(--font-display)] text-[var(--fg-1)]">
              {pathname === "/dashboard" && "Tableau de bord"}
              {pathname === "/paris" && "Matchs"}
              {pathname === "/classements" && "Classements"}
              {pathname === "/ligues" && "Ligues"}
              {pathname === "/quetes" && "Quêtes"}
              {pathname === "/notifications" && "Notifications"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-2)]">
                <span className="text-xs text-[var(--fg-3)]">Solde :</span>
                <BluffBadge value={profile.balance.toFixed(2)} />
              </div>
            )}
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--error)] hover:bg-[var(--bg-2)] transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
