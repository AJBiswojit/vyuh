import { cn } from '@/shared/lib/cn.js'

/** One small square per day; filled squares are the current streak. */
/** @param {{ days: number, total?: number }} props */
export function StreakSquares({ days, total = 14 }) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${days} day streak over the last ${total} days`}>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={cn('size-2.5 rounded-[2px] border', index < days ? 'border-heading bg-heading' : 'border-line-strong bg-transparent')} />
        ))}
      </span>
      <span className="font-mono text-2xs tabular-nums text-muted">{days}d streak</span>
    </div>
  )
}
