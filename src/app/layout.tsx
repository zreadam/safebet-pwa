import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister"
import { BetSlipProvider } from "@/contexts/BetSlipContext"
import { BetSlipModal } from "@/components/match/BetSlipModal"
import "./globals.css"

export const metadata: Metadata = {
  title: "Safebet — Parie avec tes amis",
  description: "Paris fictifs entre amis autour du football. 100% fun, zéro risque.",
  manifest: "/manifest.json",
  applicationName: "Safebet",
  creator: "Safebet Team",
  openGraph: { url: "https://safebet.app", type: "website" },
  alternates: { canonical: "https://safebet.app" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Safebet" },
  icons: {
    icon: [
      { url: "/safebet-logo.png", type: "image/png", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css" />
      </head>
      <body>
        <BetSlipProvider>
          {children}
          {/* Global BetSlipModal - persists across all pages */}
          <BetSlipModal />
        </BetSlipProvider>
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
