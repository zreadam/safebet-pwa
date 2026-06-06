import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const ClassementsPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function ClassementsWrapper() {
  return (
    <>
      <div className="md:hidden"><ClassementsPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><ClassementsPageMobile /></ResponsiveLayout></div>
    </>
  )
}
