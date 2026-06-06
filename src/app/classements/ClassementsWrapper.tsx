"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { ClassementsDesktop } from "@/components/classements/ClassementsDesktop"
import ClassementsPageMobile from "./page-mobile"

export function ClassementsWrapper() {
  return (
    <>
      <div className="md:hidden"><ClassementsPageMobile /></div>
      <div className="hidden md:block">
        <ResponsiveLayout><ClassementsDesktop /></ResponsiveLayout>
      </div>
    </>
  )
}
