import { cn } from "@/lib/utils"

export function BluffBadge({ value, className }: { value: number | string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-[7px] bg-[var(--emerald-50)] text-[var(--emerald-900)]",
      "px-3 py-[6px] rounded-full font-bold text-[15px] leading-none",
      "[font-family:var(--font-display)]",
      className
    )}>
      <span className="w-[22px] h-[22px] rounded-full bg-[var(--emerald-500)] text-white
                       flex items-center justify-center text-xs font-bold
                       [font-family:var(--font-display)]">
        B
      </span>
      {value} B
    </span>
  )
}
