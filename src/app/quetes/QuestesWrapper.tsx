import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const QuestesPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function QuestesWrapper() {
  return (
    <>
      <div className="md:hidden"><QuestesPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><QuestesPageMobile /></ResponsiveLayout></div>
    </>
  )
}
