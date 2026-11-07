import { cn } from '@/shared/lib/cn.js'

/**
 * Keycap. Mono, tabular, hairline — a keyboard hint that reads as a key and not
 * as a chip. `keys` renders a sequence with a thin separator.
 *
 * @param {{ children?: React.ReactNode, keys?: string[], className?: string, onInk?: boolean, 'aria-label'?: string }} props
 */
export function Kbd({ children, keys, className, onInk = false, 'aria-label': ariaLabel }) {
  const shell = cn(
    'inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-xs border px-1.5 font-mono text-2xs tabular-nums',
    onInk
      ? 'border-hairline-on-ink-strong bg-transparent text-(--color-on-ink)'
      : 'border-line-strong bg-surface-sunken text-muted',
    className,
  )

  if (keys?.length) {
    return (
      <span className="inline-flex items-center gap-1" aria-label={ariaLabel ?? keys.join(' then ')}>
        {keys.map((key, index) => (
          <span key={key} className="inline-flex items-center gap-1">
            {index > 0 ? <span className="text-2xs text-faint" aria-hidden="true">+</span> : null}
            <kbd className={shell}>{key}</kbd>
          </span>
        ))}
      </span>
    )
  }

  return (
    <kbd className={shell} aria-label={ariaLabel}>
      {children}
    </kbd>
  )
}
