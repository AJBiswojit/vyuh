import { motion } from 'framer-motion'
import { Card } from '@/shared/ui/Card.jsx'
import { clamp, formatNumber } from '@/shared/lib/format.js'

/**
 * Seven-day study log. A bar is a 1px-tracked rule, not a pill, and the target
 * is a dashed reference line so "met / not met" is visible without a second
 * colour. Days under target are labelled in words in the table below.
 *
 * @param {{ log: Array<{ day: string, minutes: number, target: number }>, streakDays: number, goalPercent: number }} props
 */
export function WeekStrip({ log, streakDays, goalPercent }) {
  const max = Math.max(...log.map((entry) => Math.max(entry.minutes, entry.target)))
  const total = log.reduce((sum, entry) => sum + entry.minutes, 0)
  const met = log.filter((entry) => entry.minutes >= entry.target).length

  return (
    <Card
      eyebrow="This week"
      title="Study time against target"
      action={
        <span className="font-mono text-2xs tabular-nums text-muted">
          {formatNumber(Math.round(total / 60))}h logged
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-2xs text-muted">
            {met} of {log.length} days at or above the daily target of 4h.
          </p>
          <p className="font-mono text-2xs tabular-nums text-faint">
            streak {streakDays}d · goal {goalPercent}%
          </p>
        </div>
      }
    >
      <div className="flex items-end justify-between gap-2 pt-2" role="img" aria-label={`Daily study minutes: ${log.map((entry) => `${entry.day} ${entry.minutes}`).join(', ')}`}>
        {log.map((entry) => {
          const heightPercent = clamp((entry.minutes / max) * 100, 4, 100)
          const targetPercent = clamp((entry.target / max) * 100, 4, 100)
          const short = entry.minutes < entry.target

          return (
            <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-2xs tabular-nums text-faint">{entry.minutes}</span>
              <div className="relative flex h-28 w-full items-end justify-center">
                <span
                  className="absolute inset-x-0 border-t border-dashed border-idle/70"
                  style={{ bottom: `${targetPercent}%` }}
                  aria-hidden="true"
                />
                <motion.span
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                  /* Under target reads as a hollow rule; over target fills. A
                     short day is legible at a glance, not just a shorter bar. */
                  className={`w-[62%] max-w-6 rounded-t-[2px] ${short ? 'border border-dashed border-line-strong bg-transparent' : 'bg-heading'}`}
                />
              </div>
              <span
                className={`font-mono text-2xs uppercase tracking-widest ${short ? 'text-faint' : 'text-heading'}`}
              >
                {entry.day}
              </span>
            </div>
          )
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2.5">
        {log
          .filter((entry) => entry.minutes < entry.target)
          .map((entry) => (
            <li key={entry.day} className="text-2xs text-muted">
              <span className="font-mono tabular-nums text-heading">{entry.day}</span> fell {entry.target - entry.minutes}{' '}
              min short
            </li>
          ))}
        {met === log.length ? <li className="text-2xs text-muted">Every day met the target.</li> : null}
      </ul>
    </Card>
  )
}
