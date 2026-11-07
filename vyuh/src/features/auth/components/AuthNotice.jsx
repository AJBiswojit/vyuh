import { AlertCircle, CheckCircle2, Info, LockKeyhole, WifiOff } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { describeAuthError } from '../lib/authErrors.js'
import { formatCountdown, useCountdown } from '../hooks/useCountdown.js'

/** @param {{ title: string, message: React.ReactNode, tone?: 'danger'|'warning'|'success'|'info', children?: React.ReactNode, id?: string }} props */
export function AuthNotice({ title, message, tone = 'info', children, id }) {
  const Icon = { danger: AlertCircle, warning: Info, success: CheckCircle2, info: Info }[tone]
  return (
    <div id={id} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} className={cn(
      'flex items-start gap-3 rounded-sm border border-line border-l-2 bg-surface-raised px-3.5 py-3',
      tone === 'danger' ? 'border-l-danger' : tone === 'warning' ? 'border-l-review' : tone === 'success' ? 'border-l-answer' : 'border-l-info',
    )}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', tone === 'danger' ? 'text-danger-fg' : tone === 'warning' ? 'text-review-fg' : tone === 'success' ? 'text-answer-fg' : 'text-info-fg')} strokeWidth={1.5} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-[600] text-heading">{title}</p>
        <div className="mt-1 text-xs leading-relaxed text-body">{message}</div>
        {children}
      </div>
    </div>
  )
}

/** @param {{ error: unknown, children?: React.ReactNode, id?: string }} props */
export function AuthErrorNotice({ error, children, id }) {
  const info = describeAuthError(error)
  const seconds = useCountdown(info.lockedUntil)
  const Icon = info.code === 'account_locked' ? LockKeyhole : info.code === 'network_unavailable' ? WifiOff : null
  return (
    <AuthNotice id={id} title={info.title} message={info.message} tone={info.tone === 'warning' ? 'warning' : 'danger'}>
      {Icon ? <span className="mt-2 flex items-center gap-1.5 font-mono text-2xs text-muted"><Icon className="size-3.5" aria-hidden="true" />{info.code === 'account_locked' ? 'TEMPORARY LOCK' : 'NETWORK ERROR'}</span> : null}
      {info.lockedUntil && seconds > 0 ? <p className="mt-2 font-mono text-xs tabular-nums text-heading">Try again in <span aria-label={`${Math.ceil(seconds / 60)} minutes remaining`}>{formatCountdown(seconds)}</span></p> : null}
      {info.lockedUntil && seconds === 0 ? <p className="mt-2 text-xs text-answer-fg">The lock has ended. You can try again.</p> : null}
      {children}
    </AuthNotice>
  )
}
