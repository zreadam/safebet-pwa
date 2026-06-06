"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import LiguesPageMobile from "./page-mobile"

export function LiguesWrapper() {
  return (
    <>
      <div className="md:hidden"><LiguesPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><LiguesPageMobile /></ResponsiveLayout></div>
    </>
  )
}
