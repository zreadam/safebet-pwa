import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const ClassementsPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const ClassementsPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function ClassementsWrapper() {
  return (
    <>
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <ClassementsPageMobile />
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopLayout>
          <ClassementsPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
