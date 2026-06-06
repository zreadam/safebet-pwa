import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const DashboardPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const DashboardPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function DashboardWrapper() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <DashboardPageMobile />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopLayout>
          <DashboardPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
