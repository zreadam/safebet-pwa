import BottomNav from "./BottomNav"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-1)] pb-[calc(64px+env(safe-area-inset-bottom))]">
      {children}
      <BottomNav />
    </div>
  )
}
