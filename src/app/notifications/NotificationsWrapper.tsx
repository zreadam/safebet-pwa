"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import NotificationsPageMobile from "./page-mobile"

export function NotificationsWrapper() {
  return (
    <>
      <div className="md:hidden"><NotificationsPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><NotificationsPageMobile /></ResponsiveLayout></div>
    </>
  )
}
