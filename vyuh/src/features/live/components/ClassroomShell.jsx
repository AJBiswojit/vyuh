import { AlertCircle } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

/**
 * Light Student Classroom/Mirror shell. `data-theme='light'` is pinned on the
 * subtree so it stays light inside the dark Faculty Studio without editing the
 * theme provider or design tokens.
 * @param {{ title: string, subtitle?: string, status?: string, notice?: string, badge?: string, actions?: React.ReactNode, children: React.ReactNode, className?: string }} props
 */
export function ClassroomShell({ title, subtitle, status, notice, badge, actions, children, className }) {
  return (
    <section data-theme="light" data-testid="student-classroom" className={cn('flex flex-col gap-4 rounded-sm border border-line bg-surface p-4 text-body', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <p className="rule-label">Student classroom</p>
          <h2 className="mt-1 truncate text-base font-[560] tracking-tight text-heading">{title}</h2>
          {subtitle ? <p className="mt-1 text-2xs leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badge ? <Badge tone="info" variant="outline">{badge}</Badge> : null}
          {status ? <Badge tone={status === 'live' ? 'answer' : status === 'ended' ? 'danger' : 'review'} variant="soft">{status === 'live' ? 'Live' : status === 'ended' ? 'Ended' : 'Scheduled'}</Badge> : null}
          {actions}
        </div>
      </header>
      {notice ? (
        <p className="flex items-start gap-2 rounded-sm border border-line-strong bg-surface-sunken px-3 py-2 text-2xs leading-relaxed text-body">
          <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {notice}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  )
}
