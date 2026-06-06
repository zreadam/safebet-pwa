import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const NotificationsPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const NotificationsPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function NotificationsWrapper() {
  return (
    <>
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <NotificationsPageMobile />
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopLayout>
          <NotificationsPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
