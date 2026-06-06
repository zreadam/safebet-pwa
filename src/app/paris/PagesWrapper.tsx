"use client"

import { useEffect, useState } from "react"
import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { ParisDesktop } from "@/components/paris/ParisDesktop"
import ParisPageMobile from "./page-mobile"
import type { Match } from "@/types"

export function ParisWrapper() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    fetch("/api/matches").then(r => r.json()).then(data => setMatches(data.matches ?? []))
  }, [])

  return (
    <>
      <div className="md:hidden"><ParisPageMobile /></div>
      <div className="hidden md:block">
        <ResponsiveLayout><ParisDesktop matches={matches} /></ResponsiveLayout>
      </div>
    </>
  )
}
