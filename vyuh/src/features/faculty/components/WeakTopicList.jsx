import { ArrowUpRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, EmptyState } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

/**
 * Weak topics with a re-teach suggestion. The list is not "topics below X%": it
 * is the topics whose items the cohort answered worst, paired with what to do
 * about them — a session length and the material to bring.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').WeakTopic[]} props.topics
 */
export function WeakTopicList({ topics }) {
  return (
    <Card
      eyebrow="Re-teach"
      title="Topics to put back on the board"
      action={<span className="font-mono text-2xs tabular-nums text-faint">{topics.length} topics</span>}
    >
      {topics.length === 0 ? (
        <EmptyState
          code="NO WEAK TOPICS"
          title="Nothing below the accuracy line"
          description="Every topic in this sitting cleared 55%. Keep the paper and move to the next unit."
        />
      ) : (
        <ol className="flex flex-col divide-y divide-line" data-testid="weak-topics">
          {topics.map((topic) => (
            <li key={topic.topicId} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <p className="text-xs font-[560] tracking-tight text-heading">{topic.topicName}</p>
                  <p className="mt-0.5 text-2xs text-muted">
                    {topic.subjectName} · {topic.itemCount} items · {topic.studentsAffected} candidates lost marks
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline gap-2">
                  <span className={cn('font-mono text-sm tabular-nums', topic.accuracy < 45 ? 'text-danger-fg' : 'text-review-fg')}>
                    {topic.accuracy.toFixed(1)}%
                  </span>
                  <span className="text-2xs text-faint">accuracy</span>
                </div>
              </div>

              <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 rounded-full bg-review" style={{ width: `${Math.min(100, topic.accuracy)}%` }} />
                <span className="absolute inset-y-0 w-px bg-danger" style={{ left: '55%' }} />
              </div>

              <div className="flex items-start gap-2.5 rounded-sm bg-surface-sunken px-3 py-2">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-2xs leading-relaxed text-body">
                    <span className="font-[560] text-heading">Re-teach suggestion · {topic.reteach.minutes} min.</span> {topic.reteach.title}
                  </p>
                  {topic.reteach.resources.length > 0 ? (
                    <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {topic.reteach.resources.map((resource) => {
                        const href = 'href' in resource ? resource.href : undefined
                        const target = href ? facultyLink(href) : null
                        return (
                          <li key={resource.label} className="text-2xs">
                            {target ? (
                              <Link to={target} className="inline-flex items-center gap-1 text-heading underline decoration-line-strong underline-offset-2 hover:text-ember-press">
                                {resource.label}
                                <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                              </Link>
                            ) : (
                              <span className="text-muted">{resource.label}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

/**
 * A re-teach resource usually points at a recording the student library owns.
 * Faculty own the master, so the link is rewritten to the studio rather than
 * dropping the reader into a student route their role guard would bounce.
 * @param {string} href
 */
export function facultyLink(href) {
  const recording = href.match(/\/student\/recordings\/([^?]+)/)
  if (recording) return `/faculty/recordings/${recording[1]}`
  return href.startsWith('/faculty') ? href : null
}
