"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import ParisPageMobile from "./page-mobile"

export function ParisWrapper() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <ParisPageMobile />
      </div>
      {/* Desktop - réutilise le même contenu mobile dans ResponsiveLayout */}
      <div className="hidden md:block">
        <ResponsiveLayout>
          <ParisPageMobile />
        </ResponsiveLayout>
      </div>
    </>
  )
}
