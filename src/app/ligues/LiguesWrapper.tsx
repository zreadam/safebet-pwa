import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const LiguesPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const LiguesPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function LiguesWrapper() {
  return (
    <>
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <LiguesPageMobile />
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopLayout>
          <LiguesPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
