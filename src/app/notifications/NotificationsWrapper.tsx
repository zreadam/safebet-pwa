"use client"

import ResponsiveLayout from "@/components/layout/ResponsiveLayout"
import { NotificationsDesktop } from "@/components/notifications/NotificationsDesktop"
import NotificationsPageMobile from "./page-mobile"

export function NotificationsWrapper() {
  return (
    <>
      <div className="md:hidden"><NotificationsPageMobile /></div>
      <div className="hidden md:block">
        <ResponsiveLayout><NotificationsDesktop /></ResponsiveLayout>
      </div>
    </>
  )
}
