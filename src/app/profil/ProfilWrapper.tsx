"use client"

import { useEffect, useState } from "react"
import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { ProfilDesktop } from "@/components/profil/ProfilDesktop"
import ProfilPageMobile from "./page-mobile"
import type { Profile } from "@/types"

export function ProfilWrapper() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => setProfile(data.profile ?? null))
  }, [])

  return (
    <>
      <div className="md:hidden"><ProfilPageMobile /></div>
      <div className="hidden md:block">
        <ResponsiveLayout><ProfilDesktop profile={profile} /></ResponsiveLayout>
      </div>
    </>
  )
}
