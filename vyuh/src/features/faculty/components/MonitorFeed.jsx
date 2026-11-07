import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Flag, LogIn, LogOut, PencilLine, Send, WifiOff } from 'lucide-react'
import { Card, EmptyState } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { formatRelative } from '@/shared/lib/format.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'

/**
 * The live feed. Newest first, capped by the service at forty entries; the
 * reader sees the last five with a count of the rest.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').MonitorEvent[]} props.events
 * @param {number} [props.limit]
 * @param {string} [props.title]
 */
export function MonitorFeed({ events, limit = 8, title = 'Live event feed' }) {
  const reduced = usePrefersReducedMotion()
  const visible = events.slice(0, limit)

  return (
    <Card
      eyebrow="Realtime"
      title={title}
      action={<span className="font-mono text-2xs tabular-nums text-faint">{events.length} logged</span>}
    >
      {visible.length === 0 ? (
        <EmptyState
          code="WAITING FOR EVENTS"
          title="No events yet"
          description="Answers, submissions, integrity flags and dropped connections appear here as the sitting runs."
        />
      ) : (
        <ol className="flex flex-col gap-2.5" aria-live="polite" aria-relevant="additions" data-testid="monitor-feed">
          <AnimatePresence initial={false}>
            {visible.map((event) => {
              const Icon = ICONS[event.type] ?? PencilLine
              return (
                <motion.li
                  key={event.id}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: durations.standard, ease: easeEntrance }}
                  className="flex items-start gap-2.5"
                >
                  <span
                    className={cn(
                      'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border',
                      event.type === 'integrity' ? 'border-danger text-danger-fg' : event.type === 'submit' ? 'border-answer text-answer-fg' : 'border-line text-muted',
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-2xs leading-snug text-body">
                      <span className="font-[560] text-heading">{event.studentName}</span> — {event.label}
                    </span>
                    {event.note ? <span className="mt-0.5 block text-2xs text-danger-fg">{event.note}</span> : null}
                    <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">{formatRelative(event.at)}</span>
                  </span>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ol>
      )}
      {events.length > limit ? (
        <p className="mt-3 text-2xs text-muted">Showing the newest {limit} of {events.length} events.</p>
      ) : null}
    </Card>
  )
}

const ICONS = {
  answer: PencilLine,
  review: Flag,
  submit: Send,
  integrity: Flag,
  disconnect: WifiOff,
  reconnect: LogIn,
  join: LogIn,
  end: LogOut,
  check: CheckCheck,
}
