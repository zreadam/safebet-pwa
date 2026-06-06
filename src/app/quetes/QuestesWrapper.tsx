"use client"

import { useEffect, useState } from "react"
import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { QuestesDesktop } from "@/components/quetes/QuestesDesktop"
import QuestesPageMobile from "./page-mobile"
import type { Quest } from "@/types"

export function QuestesWrapper() {
  const [quests, setQuests] = useState<Quest[]>([])

  useEffect(() => {
    fetch("/api/quests").then(r => r.json()).then(data => setQuests(data.quests ?? []))
  }, [])

  return (
    <>
      <div className="md:hidden"><QuestesPageMobile /></div>
      <div className="hidden md:block">
        <ResponsiveLayout><QuestesDesktop quests={quests} /></ResponsiveLayout>
      </div>
    </>
  )
}
