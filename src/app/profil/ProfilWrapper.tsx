import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const ProfilPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function ProfilWrapper() {
  return (
    <>
      <div className="md:hidden"><ProfilPageMobile /></div>
      <div className="hidden md:block"><ResponsiveLayout><ProfilPageMobile /></ResponsiveLayout></div>
    </>
  )
}
