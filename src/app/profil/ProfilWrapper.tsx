"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import ProfilPageMobile from "./page-mobile"

export function ProfilWrapper() {
  return (
    <>
      <div className="md:hidden"><ProfilPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><ProfilPageMobile /></ResponsiveLayout></div>
    </>
  )
}
