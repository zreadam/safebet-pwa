"use client"

import AppShell from "./AppShell"
import DesktopLayout from "./DesktopLayout"

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

/**
 * ResponsiveLayout automatically selects between:
 * - Mobile: AppShell (bottom nav, optimized for small screens)
 * - Desktop: DesktopLayout (sidebar, optimized for large screens)
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <AppShell>{children}</AppShell>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <DesktopLayout>{children}</DesktopLayout>
      </div>
    </>
  )
}
