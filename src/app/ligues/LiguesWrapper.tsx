import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const LiguesPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function LiguesWrapper() {
  return (
    <>
      <div className="md:hidden"><LiguesPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><LiguesPageMobile /></ResponsiveLayout></div>
    </>
  )
}
