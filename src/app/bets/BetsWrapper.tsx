import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const BetsPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const BetsPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function BetsWrapper() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <BetsPageMobile />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopLayout>
          <BetsPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
