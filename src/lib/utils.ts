import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBluff(value: number): string {
  return value % 1 === 0 ? `${value} B` : `${value.toFixed(2)} B`
}

export function formatOdds(value: number): string {
  return value.toFixed(2)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return "Auj."
  if (diff === 1) return "Demain"
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}
