import Link from "next/link"
import { cn } from "@/lib/utils"

export function PremiumLock({
  children,
  label = "Fonctionnalité Premium",
  className,
}: {
  children: React.ReactNode
  label?: string
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <Link href="/premium"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2
                       bg-[rgba(249,250,251,0.85)] rounded-[var(--radius-card)]
                       dark:bg-[rgba(15,23,42,0.85)]">
        <i className="ti ti-lock text-[26px] text-[var(--amber-500)]" />
        <span className="text-[13px] font-semibold text-[var(--amber-900)] dark:text-[var(--amber-200)]">
          {label}
        </span>
      </Link>
    </div>
  )
}
