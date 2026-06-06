import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const DashboardPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function DashboardWrapper() {
  return (
    <>
      <div className="md:hidden"><DashboardPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><DashboardPageMobile /></ResponsiveLayout></div>
    </>
  )
}
