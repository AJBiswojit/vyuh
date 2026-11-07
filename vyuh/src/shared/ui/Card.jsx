import { cn } from '@/shared/lib/cn.js'

/**
 * Card — a hairline-bounded block of content. No shadow (shadows belong to
 * floating layers), no coloured header band, no uniform "rounded-2xl + drop
 * shadow" look. The header is separated by a 1px rule, which is enough.
 *
 * Tones:
 *   paper  raised surface with a hairline. The default.
 *   sunken recessed panel inside a paper surface.
 *   ink    dark structural panel: hero, exam header. Paper text.
 *   bare   no border, no fill. Grouping only.
 *
 * @typedef {Object} CardProps
 * @property {string} [title]
 * @property {string} [eyebrow]         Mono label above the title.
 * @property {React.ReactNode} [action] Right-aligned header control.
 * @property {React.ReactNode} [footer]
 * @property {'paper'|'sunken'|'ink'|'bare'} [tone]
 * @property {'none'|'sm'|'md'} [radius]
 * @property {'section'|'article'|'div'|'aside'} [as]
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

const tones = {
  paper: 'border border-line bg-surface-raised text-body',
  sunken: 'border border-line bg-surface-sunken text-body',
  ink: 'border border-hairline-on-ink bg-ink text-paper',
  bare: 'border border-transparent bg-transparent',
}

const radii = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md' }

/**
 * @param {CardProps & Omit<React.HTMLAttributes<HTMLElement>, 'title'>} props
 */
export function Card({ title, eyebrow, action, footer, tone = 'paper', radius = 'md', as: Tag = 'section', className, children, ...rest }) {
  const ink = tone === 'ink'

  return (
    <Tag className={cn('flex flex-col', tones[tone], radii[radius], className)} {...rest}>
      {title || eyebrow || action ? (
        <header
          className={cn(
            'flex items-start justify-between gap-4 border-b px-5 py-4',
            ink ? 'border-hairline-on-ink' : 'border-line',
          )}
        >
          <div className="min-w-0">
            {eyebrow ? (
              <p className={cn('rule-label mb-1.5', ink && 'text-(--color-on-ink-faint)')}>
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h3 className={cn('truncate text-sm leading-snug tracking-tight', ink && 'text-paper')}>{title}</h3>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div data-card-body className="min-w-0 flex-1 px-5 py-5">
        {children}
      </div>
      {footer ? (
        <footer className={cn('border-t px-5 py-3', ink ? 'border-hairline-on-ink' : 'border-line')}>{footer}</footer>
      ) : null}
    </Tag>
  )
}
