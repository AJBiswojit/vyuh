import { cn } from '@/shared/lib/cn.js'

/**
 * Status label. Every status is carried by a shape as well as a colour, so the
 * meaning survives greyscale, colour-blindness and a printed sheet:
 *
 *   answer  filled square   answered / correct / present
 *   review  diamond (45°)   marked for review / warning
 *   danger  ring with cut   not answered / wrong / absent
 *   info    filled circle   live / informational
 *   idle    hollow square   not visited / muted
 *   neutral dot             no semantic claim
 *
 * Semantic tones are for status only. They never become a section background.
 *
 * @typedef {Object} BadgeProps
 * @property {'neutral'|'answer'|'review'|'danger'|'info'|'idle'|'ember'|'inverse'} [tone]
 * @property {'soft'|'outline'|'solid'} [variant]
 * @property {'square'|'diamond'|'ring'|'circle'|'hollow'|'dot'|'none'} [shape]
 * @property {boolean} [mono]     Tabular mono, for counts and codes.
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

const toneStyles = {
  neutral: {
    soft: 'bg-[color-mix(in_oklab,var(--color-body)_8%,transparent)] text-body',
    outline: 'border border-line-strong text-body',
    solid: 'bg-heading text-on-inverse',
  },
  answer: {
    soft: 'bg-[color-mix(in_oklab,var(--color-answer)_18%,transparent)] text-answer-fg',
    outline: 'border border-[color-mix(in_oklab,var(--color-answer)_55%,transparent)] text-answer-fg',
    solid: 'bg-answer text-on-signal',
  },
  review: {
    soft: 'bg-[color-mix(in_oklab,var(--color-review)_22%,transparent)] text-review-fg',
    outline: 'border border-[color-mix(in_oklab,var(--color-review)_60%,transparent)] text-review-fg',
    solid: 'bg-review text-on-signal',
  },
  danger: {
    soft: 'bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)] text-danger-fg',
    outline: 'border border-[color-mix(in_oklab,var(--color-danger)_55%,transparent)] text-danger-fg',
    solid: 'bg-danger text-on-signal-inverse',
  },
  info: {
    soft: 'bg-[color-mix(in_oklab,var(--color-info)_20%,transparent)] text-info-fg',
    outline: 'border border-[color-mix(in_oklab,var(--color-info)_60%,transparent)] text-info-fg',
    solid: 'bg-info text-on-signal',
  },
  idle: {
    soft: 'bg-[color-mix(in_oklab,var(--color-idle)_24%,transparent)] text-idle-fg',
    outline: 'border border-[color-mix(in_oklab,var(--color-idle)_60%,transparent)] text-idle-fg',
    solid: 'bg-idle text-on-signal',
  },
  ember: {
    soft: 'bg-ember-wash text-ember-press',
    outline: 'border border-ember text-ember-press',
    solid: 'bg-ember text-on-ember',
  },
  // For badges that sit on an ink surface, where the paper-scale tones above
  // would either vanish or shout.
  inverse: {
    soft: 'bg-on-ink-wash-soft text-on-ink-strong',
    outline: 'border border-hairline-on-ink-strong text-on-ink',
    solid: 'bg-paper text-ink',
  },
}

const shapeFill = {
  inverse: 'bg-paper',
  answer: 'bg-answer',
  review: 'bg-review',
  danger: 'bg-danger',
  info: 'bg-info',
  idle: 'bg-idle',
  ember: 'bg-ember',
  neutral: 'bg-body',
}

/**
 * The glyph that carries the status. Shapes, not emoji, not icons.
 * @param {{ shape: NonNullable<BadgeProps['shape']>, tone: NonNullable<BadgeProps['tone']> }} props
 */
function StatusShape({ shape, tone }) {
  if (shape === 'none') return null
  const fill = shapeFill[tone]

  switch (shape) {
    case 'diamond':
      return <span className={cn('size-[7px] rotate-45 rounded-[1px]', fill)} aria-hidden="true" />
    case 'circle':
      return <span className={cn('size-[7px] rounded-full', fill)} aria-hidden="true" />
    case 'hollow':
      return (
        <span
          className={cn('size-[7px] rounded-[1px] border', tone === 'idle' ? 'border-idle-fg' : 'border-current')}
          aria-hidden="true"
        />
      )
    case 'ring':
      return (
        <span className="relative size-[9px] rounded-full border border-current" aria-hidden="true">
          <span className={cn('absolute left-1/2 top-1/2 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full', fill)} />
        </span>
      )
    case 'dot':
    default:
      return <span className={cn('size-1.5 rounded-full', fill)} aria-hidden="true" />
  }
}

/**
 * @param {BadgeProps & React.HTMLAttributes<HTMLSpanElement>} props
 */
export function Badge({ tone = 'neutral', variant = 'soft', shape = 'dot', mono = false, className, children, ...rest }) {
  const toneKey = /** @type {keyof typeof toneStyles} */ (tone in toneStyles ? tone : 'neutral')
  const variantKey = /** @type {keyof (typeof toneStyles)['neutral']} */ (
    variant in toneStyles.neutral ? variant : 'soft'
  )

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xs px-2 py-[3px] text-2xs font-[560] leading-none tracking-wide',
        mono && 'font-mono tabular-nums tracking-normal',
        toneStyles[toneKey][variantKey],
        className,
      )}
      {...rest}
    >
      <StatusShape shape={shape} tone={/** @type {any} */ (toneKey)} />
      {children}
    </span>
  )
}
