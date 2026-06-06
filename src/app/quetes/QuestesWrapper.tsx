import dynamic from "next/dynamic"

const DesktopLayout = dynamic(() => import("@/components/layout/DesktopLayout"), { ssr: true })
const QuestesPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })
const QuestesPageDesktop = dynamic(() => import("./page-desktop"), { ssr: true })

export function QuestesWrapper() {
  return (
    <>
      <div className="md:hidden">
        <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
          <QuestesPageMobile />
        </div>
      </div>

      <div className="hidden md:block">
        <DesktopLayout>
          <QuestesPageDesktop />
        </DesktopLayout>
      </div>
    </>
  )
}
