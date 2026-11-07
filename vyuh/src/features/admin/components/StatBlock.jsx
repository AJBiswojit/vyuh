import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { formatNumber } from '@/shared/lib/format.js'

/**
 * One key figure. The numeral is the point, so it is set in Fraunces at display
 * scale with tabular figures; the label sits above it and the context line
 * below. The whole block is a link to the screen that explains the number, which
 * is why it is a <Link> and not a decorated <div>.
 *
 * @param {{ stat: import('@/contracts/admin.js').AdminStat }} props
 */
export function StatBlock({ stat }) {
  const TrendIcon = stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : Minus
  const digits = stat.digits ?? 0

  return (
    <Link
      to={stat.to ?? '/admin'}
      data-testid={`admin-stat-${stat.key}`}
      className={cn(
        'group flex flex-col justify-between gap-4 bg-surface-raised px-5 py-5 transition-colors',
        'hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ember',
      )}
    >
      <div>
        <p className="rule-label">{stat.label}</p>
        <p
          className="mt-3 font-display text-3xl leading-[0.95] tracking-tightest text-heading tabular-nums lg:text-4xl"
          style={{ fontVariationSettings: "'wght' var(--font-weight-display)" }}
        >
          {formatNumber(stat.value, { digits })}
          {stat.unit ? <span className="ml-1 align-baseline font-sans text-sm text-faint">{stat.unit}</span> : null}
        </p>
      </div>
      <div>
        {stat.trendLabel ? (
          <p
            className={cn(
              'flex items-center gap-1 text-2xs font-[560]',
              stat.trend === 'down' ? 'text-review-fg' : stat.trend === 'up' ? 'text-answer-fg' : 'text-faint',
            )}
          >
            <TrendIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            {stat.trendLabel}
          </p>
        ) : null}
        <p className="mt-1 text-2xs leading-relaxed text-muted">{stat.detail}</p>
      </div>
    </Link>
  )
}
