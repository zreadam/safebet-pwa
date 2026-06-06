"use client"

export const dynamic = "force-dynamic"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import DashboardPageMobile from "./page-mobile"

export function DashboardWrapper() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <DashboardPageMobile />
      </div>
      {/* Desktop - réutilise le même contenu mobile dans ResponsiveLayout */}
      <div className="hidden md:block">
        <ResponsiveLayout>
          <DashboardPageMobile />
        </ResponsiveLayout>
      </div>
    </>
  )
}
