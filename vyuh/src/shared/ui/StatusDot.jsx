import { cn } from '@/shared/lib/cn.js'

/**
 * A live pulse for the one genuinely time-sensitive state in the product: a
 * class or a paper that is happening now. The motion explains the state, and it
 * stops under reduced motion, where the ring is simply static.
 *
 * This is not a Badge: it carries no text, so it must always be paired with a
 * visible label — `label` is the accessible name, not the visible one.
 *
 * @param {Object} props
 * @param {'info'|'answer'|'review'|'danger'|'idle'} [props.tone]
 * @param {string} props.label
 * @param {boolean} [props.animate]
 * @param {string} [props.className]
 */
export function StatusDot({ tone = 'info', label, animate = true, className }) {
  const fill = {
    info: 'bg-info',
    answer: 'bg-answer',
    review: 'bg-review',
    danger: 'bg-danger',
    idle: 'bg-idle',
  }[tone]

  return (
    <span className={cn('relative inline-flex size-2 shrink-0', className)} role="img" aria-label={label}>
      <span className={cn('absolute inset-0 rounded-full', fill)} />
      {animate ? (
        <span
          className={cn('motion-safe-only absolute inset-0 rounded-full opacity-40', fill)}
          style={{ animation: 'status-ping 2.4s cubic-bezier(0.2, 0, 0, 1) infinite' }}
        />
      ) : null}
    </span>
  )
}
