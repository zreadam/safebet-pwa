"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { createClient } from "@/lib/supabase/client"
import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { DashboardDesktop } from "@/components/dashboard/DashboardDesktop"
import DashboardPageOriginal from "./page-mobile"
import type { Match, Quest, League } from "@/types"

export function DashboardWrapper() {
  const { profile, refetch } = useProfile()
  const [matches, setMatches] = useState<Match[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [leagues, setLeagues] = useState<League[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch matches
      const matchRes = await fetch("/api/matches").then(r => r.json())
      setMatches(matchRes.matches ?? [])

      // Fetch quests
      const questRes = await fetch("/api/quests").then(r => r.json())
      setQuests(questRes.quests ?? [])

      // Fetch leagues
      const leagueRes = await fetch("/api/leagues").then(r => r.json())
      setLeagues(leagueRes.leagues ?? [])
    }

    fetchData()
  }, [])

  return (
    <>
      {/* Mobile Content */}
      <div className="md:hidden">
        <DashboardPageOriginal />
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        <ResponsiveLayout>
          <DashboardDesktop
            matches={matches}
            quests={quests}
            leagues={leagues}
            balance={profile?.balance ?? 0}
          />
        </ResponsiveLayout>
      </div>
    </>
  )
}
