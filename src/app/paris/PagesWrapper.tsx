import dynamic from "next/dynamic"

const ResponsiveLayout = dynamic(() => import("@/components/layout/ResponsiveLayout"), { ssr: true })
const ParisPageMobile = dynamic(() => import("./page-mobile"), { ssr: true })

export function ParisWrapper() {
  return (
    <>
      <div className="md:hidden">
        <ParisPageMobile />
      </div>
      <div className="hidden md:block">
        <ResponsiveLayout>
          <ParisPageMobile />
        </ResponsiveLayout>
      </div>
    </>
  )
}
