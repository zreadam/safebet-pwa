"use client"

import AppShell from "./AppShell"
import DesktopLayout from "./DesktopLayout"

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

/**
 * ResponsiveLayout automatically selects between:
 * - Mobile: AppShell (bottom nav, optimized for small screens)
 * - Desktop: DesktopLayout (sidebar + topbar, optimized for large screens)
 * 
 * IMPORTANT: Only ONE layout is ever rendered at a time.
 * Mobile: md:hidden (< 768px)
 * Desktop: hidden md:block (>= 768px)
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  return (
    <>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden">
        <AppShell>{children}</AppShell>
      </div>

      {/* ===== DESKTOP LAYOUT (completely independent) ===== */}
      <div className="hidden md:block">
        <DesktopLayout>{children}</DesktopLayout>
      </div>
    </>
  )
}
