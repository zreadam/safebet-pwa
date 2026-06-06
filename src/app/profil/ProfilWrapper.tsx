import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const ProfilPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const ProfilPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function ProfilWrapper() {
  return (
    <>
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <ProfilPageMobile />
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopLayout>
          <ProfilPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
