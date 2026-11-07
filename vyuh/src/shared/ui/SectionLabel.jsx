import { cn } from '@/shared/lib/cn.js'

/**
 * Mono eyebrow with a hairline filling the remaining width. Opens a region
 * without spending a heading level on it.
 *
 * @param {{ children: React.ReactNode, className?: string, as?: 'p'|'h2'|'h3', onInk?: boolean }} props
 */
export function SectionLabel({ children, className, as: Tag = 'p', onInk = false }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Tag className={cn('rule-label shrink-0', onInk && 'text-(--color-on-ink-faint)')}>
        {children}
      </Tag>
      <span className={cn('h-px flex-1', onInk ? 'bg-hairline-on-ink' : 'bg-line')} aria-hidden="true" />
    </div>
  )
}
