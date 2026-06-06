"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import QuestesPageMobile from "./page-mobile"

export function QuestesWrapper() {
  return (
    <>
      <div className="md:hidden"><QuestesPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><QuestesPageMobile /></ResponsiveLayout></div>
    </>
  )
}
