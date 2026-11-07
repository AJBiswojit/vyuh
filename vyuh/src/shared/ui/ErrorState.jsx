import { AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * ErrorState. Same anatomy as EmptyState — rule, glyph, title, sentence — but
 * oxblood-led and never dismissible-by-waiting: every instance offers a next
 * step. The message passed in must state what happened and what to do; this
 * component does not invent that copy.
 *
 * @param {Object} props
 * @param {string} title
 * @param {string} [description]
 * @param {string} [code]              e.g. 'E_SNAPSHOT', 'gateway_timeout'.
 * @param {React.ReactNode} [action]   The retry / escape control. Almost always present.
 * @param {'inline'|'panel'} [size]
 * @param {string} [className]
 */
export function ErrorState({ title, description, code, action, size = 'inline', className }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 border-l-2 border-l-danger',
        size === 'panel' && 'rounded-sm border border-l-2 border-line border-l-danger bg-surface-raised p-5',
        size === 'inline' ? 'py-1.5 pl-4' : 'pl-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-[1.1rem] text-danger-fg" strokeWidth={1.5} aria-hidden="true" />
        {code ? <p className="rule-label text-danger-fg">{code}</p> : null}
      </div>
      <div className="max-w-prose">
        <p className="text-xs font-[560] tracking-tight text-heading">{title}</p>
        {description ? <p className="mt-1 text-2xs leading-relaxed text-body">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
