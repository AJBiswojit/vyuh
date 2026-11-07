import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * The import wizard's progress rail. A list, because it is a sequence: each step
 * is exactly one screen, and the reader can see how many are left.
 *
 * @param {{ steps: Array<{ id: string, label: string, hint: string }>, current: number }} props
 */
export function Stepper({ steps, current }) {
  return (
    <ol className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-0" aria-label="Import steps">
      {steps.map((step, index) => {
        const number = index + 1
        const done = number < current
        const active = number === current
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex min-w-0 flex-1 items-start gap-3 border-l-2 px-3 py-2',
              active ? 'border-l-ember bg-surface-sunken' : done ? 'border-l-answer' : 'border-l-line',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-2xs tabular-nums',
                done ? 'bg-answer text-on-signal' : active ? 'bg-ember text-on-ember' : 'bg-surface-sunken text-faint',
              )}
              aria-hidden="true"
            >
              {done ? <Check className="size-3" strokeWidth={2.5} /> : number}
            </span>
            <span className="min-w-0">
              <span className={cn('block text-2xs font-[560] tracking-tight', active ? 'text-heading' : 'text-body')}>
                {number}. {step.label}
              </span>
              <span className="mt-0.5 block text-2xs leading-relaxed text-muted">{step.hint}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
