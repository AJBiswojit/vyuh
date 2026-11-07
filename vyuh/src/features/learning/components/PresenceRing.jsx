import { cn } from '@/shared/lib/cn.js'

/** Smoothly filling presence ring; the number beside it carries the same state. @param {{ percent: number, size?: number, className?: string, label?: string }} props */
export function PresenceRing({ percent, size = 56, className, label = 'Presence' }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const value = Math.min(100, Math.max(0, percent))
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" role="img" aria-label={`${label}: ${value} percent`} className={cn('shrink-0 -rotate-90', className)}>
      <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--color-line)" strokeWidth="5" />
      <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--color-info)" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-[var(--duration-expressive)] ease-out" />
    </svg>
  )
}
