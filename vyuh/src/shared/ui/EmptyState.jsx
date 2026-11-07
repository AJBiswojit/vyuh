import { cn } from '@/shared/lib/cn.js'

/**
 * EmptyState. Set as a ruled aside rather than an illustration: a hairline rule
 * on the leading edge, an optional lucide glyph, a title that names the situation
 * and one sentence that says what to do next. No stock drawings of people, no
 * "Nothing here yet!" — the copy has to be actionable or it is not shipped.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.code]                 Mono line: a count, a filter, an empty-set code.
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.action]
 * @param {'inline'|'panel'} [props.size]       `panel` adds the surface and padding.
 * @param {string} [props.className]
 */
export function EmptyState({ title, description, code, icon, action, size = 'inline', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 border-l-2 border-l-line-strong',
        size === 'panel' && 'rounded-sm border border-l-2 border-line border-l-line-strong bg-surface-raised p-5',
        size === 'inline' ? 'py-1.5 pl-4' : 'pl-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon ? <span className="text-faint [&>svg]:size-[1.1rem]">{icon}</span> : null}
        {code ? <p className="rule-label">{code}</p> : null}
      </div>
      <div className="max-w-prose">
        <p className="text-xs font-[560] tracking-tight text-heading">{title}</p>
        <p className="mt-1 text-2xs leading-relaxed text-muted">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
