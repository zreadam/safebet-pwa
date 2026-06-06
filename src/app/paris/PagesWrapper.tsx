import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const ParisPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const ParisPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function ParisWrapper() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <ParisPageMobile />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopLayout>
          <ParisPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
