"use client"

import { useEffect, useState } from "react"
import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { LiguesDesktop } from "@/components/ligues/LiguesDesktop"
import LiguesPageMobile from "./page-mobile"
import type { League } from "@/types"

export function LiguesWrapper() {
  const [leagues, setLeagues] = useState<League[]>([])

  useEffect(() => {
    fetch("/api/leagues").then(r => r.json()).then(data => setLeagues(data.leagues ?? []))
  }, [])

  return (
    <>
      <div className="md:hidden"><LiguesPageMobile /></div>
      <div className="hidden md:block">
        <ResponsiveLayout><LiguesDesktop leagues={leagues} /></ResponsiveLayout>
      </div>
    </>
  )
}
