"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", icon: "ti-home",   label: "Accueil" },
  { href: "/paris",     icon: "ti-ticket",  label: "Paris" },
  { href: "/ligues",    icon: "ti-trophy",  label: "Ligues" },
  { href: "/quetes",    icon: "ti-star",    label: "Quêtes" },
  { href: "/profil",    icon: "ti-user",    label: "Profil" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around
                    bg-[var(--bg-1)] border-t border-[var(--border-light)]
                    pb-[env(safe-area-inset-bottom)]"
         style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
      {TABS.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link key={href} href={href}
                className={cn(
                  "flex flex-col items-center gap-[3px] flex-1 py-2 transition-colors",
                  active ? "text-[var(--emerald-500)]" : "text-[var(--fg-3)]"
                )}>
            <span className={cn(
              "px-4 py-1 rounded-full transition-colors",
              active && "bg-[var(--emerald-50)]"
            )}>
              <i className={`ti ${icon} text-2xl`} />
            </span>
            <span className="text-[10px] font-semibold leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
