"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import ClassementsPageMobile from "./page-mobile"

export function ClassementsWrapper() {
  return (
    <>
      <div className="md:hidden"><ClassementsPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><ClassementsPageMobile /></ResponsiveLayout></div>
    </>
  )
}
