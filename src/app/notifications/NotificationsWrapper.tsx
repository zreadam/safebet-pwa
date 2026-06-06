import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const NotificationsPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function NotificationsWrapper() {
  return (
    <>
      <div className="md:hidden"><NotificationsPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><NotificationsPageMobile /></ResponsiveLayout></div>
    </>
  )
}
