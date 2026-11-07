import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Play } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { formatClock, formatDateTime, formatRelative } from '@/shared/lib/format.js'
import { useFacultyDoubt, useReplyDoubt, useReplyTemplates, useResolveDoubt } from '../hooks/useFacultyLive.js'
import { ReplyComposer } from '../components/ReplyComposer.jsx'
import { ConfirmAction } from '../components/ConfirmAction.jsx'

/**
 * One thread. The student's question is at the top, the conversation below it,
 * and the composer last — the order a reader works in. A lecture timestamp is a
 * link into the recording at that second, so the answer can point at the board
 * instead of describing it.
 */
export function FacultyDoubtThreadPage() {
  const { doubtId = '' } = useParams()
  useDocumentTitle('Doubt thread')
  const navigate = useNavigate()
  const toast = useToast()
  const doubt = useFacultyDoubt(doubtId)
  const templates = useReplyTemplates()
  const reply = useReplyDoubt(doubtId)
  const resolve = useResolveDoubt(doubtId)

  if (doubt.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading the thread</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-9 w-[min(28rem,80%)]" />
        <Skeleton.Block className="h-64 rounded-sm" />
      </div>
    )
  }

  if (doubt.isError) {
    return (
      <ErrorState
        code="E_DOUBT"
        title="That thread is not here"
        description={/** @type {Error} */ (doubt.error)?.message ?? 'It may have been resolved and removed from the inbox. The inbox lists everything still open.'}
        action={<Button variant="secondary" onClick={() => navigate('/faculty/doubts')}>Back to the inbox</Button>}
      />
    )
  }

  const thread = /** @type {import('@/contracts/faculty.js').FacultyDoubt} */ (doubt.data)
  const statusTone = thread.status === 'open' ? 'review' : thread.status === 'answered' ? 'answer' : 'idle'

  return (
    <>
      <PageHeader
        eyebrow={`Faculty workspace · ${thread.batchName}`}
        title={thread.title}
        description={`${thread.studentName} · ${thread.subjectName} · ${thread.topicName} · asked ${formatRelative(thread.createdAt)}`}
        meta={
          <>
            <Badge tone={statusTone} variant="outline" shape={thread.status === 'open' ? 'diamond' : thread.status === 'answered' ? 'square' : 'hollow'}>
              {thread.status === 'open' ? 'Waiting on you' : thread.status === 'answered' ? 'Answered' : 'Resolved'}
            </Badge>
            <span className="inline-flex items-center gap-1.5 font-mono text-2xs tabular-nums text-muted">
              <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              waiting {thread.waitingMinutes} min
            </span>
            <span className="font-mono text-2xs tabular-nums text-muted">{thread.messages.length} messages</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={<ArrowLeft strokeWidth={1.5} />} onClick={() => navigate('/faculty/doubts')}>
              Inbox
            </Button>
            {thread.status !== 'resolved' ? (
              <ConfirmAction
                title="Mark this doubt resolved?"
                description="The thread closes and leaves the open inbox. The student keeps the whole conversation and can reopen it by asking again."
                detail={`${thread.studentName} · ${thread.title}`}
                confirmLabel="Mark resolved"
                tone="neutral"
                busy={resolve.isPending}
                onConfirm={() =>
                  resolve.mutate(undefined, {
                    onSuccess: () => toast.success('Doubt resolved', 'The thread is closed and stays readable.'),
                    onError: (/** @type {Error} */ error) => toast.error('Not resolved', error.message),
                  })
                }
              >
                {(open) => (
                  <Button variant="secondary" icon={<CheckCircle2 strokeWidth={1.5} />} onClick={open}>
                    Resolve
                  </Button>
                )}
              </ConfirmAction>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card eyebrow="Question" title={thread.studentName}>
            <p className="text-xs leading-relaxed text-body">{thread.body}</p>
            {thread.timestampLink ? (
              <Link
                to={`/faculty/recordings/${thread.timestampLink.recordingId}${thread.timestampLink.timeSeconds !== null ? `?t=${thread.timestampLink.timeSeconds}` : ''}`}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-sm border border-line px-2.5 text-2xs font-[560] text-heading hover:border-line-strong"
              >
                <Play className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                {thread.timestampLink.recordingTitle}
                {thread.timestampLink.timeSeconds !== null ? (
                  <span className="font-mono tabular-nums text-muted">from {formatClock(thread.timestampLink.timeSeconds)}</span>
                ) : null}
              </Link>
            ) : null}
          </Card>

          <Card eyebrow="Thread" title="Conversation">
            <ol className="flex flex-col gap-4" data-testid="doubt-thread">
              {thread.messages.map((message) => (
                <li key={message.id} className={cn('flex items-start gap-2.5', message.role === 'faculty' && 'flex-row-reverse text-right')}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-sunken font-mono text-2xs text-muted">
                    {message.role === 'faculty' ? 'SM' : thread.initials}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 max-w-[46rem] rounded-sm border px-3 py-2',
                      message.role === 'faculty'
                        ? 'border-[color-mix(in_oklab,var(--color-answer)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-answer)_8%,transparent)]'
                        : 'border-line bg-surface-sunken',
                    )}
                  >
                    <span className={cn('flex flex-wrap items-baseline gap-2', message.role === 'faculty' && 'justify-end')}>
                      <span className="text-2xs font-[560] text-heading">{message.author}</span>
                      <span className="font-mono text-2xs tabular-nums text-faint">{formatDateTime(message.createdAt)}</span>
                    </span>
                    <span className="mt-1 block whitespace-pre-line text-left text-xs leading-relaxed text-body">{message.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Card eyebrow="Answer" title={thread.status === 'resolved' ? 'Thread closed' : 'Write a reply'}>
            {thread.status === 'resolved' ? (
              <p className="text-2xs leading-relaxed text-muted">
                This doubt is resolved. A student asking again opens a new thread that links back to this one.
              </p>
            ) : (
              <ReplyComposer
                templates={templates.data ?? []}
                busy={reply.isPending}
                error={/** @type {any} */ (reply.error)?.message}
                onSend={(body) =>
                  reply.mutate(body, {
                    onSuccess: () => toast.success('Answer sent', `${thread.studentName} has been notified.`),
                  })
                }
              />
            )}
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card eyebrow="Student" title={thread.studentName}>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="rule-label">Batch</dt>
                <dd className="mt-1 text-2xs text-heading">{thread.batchName}</dd>
              </div>
              <div>
                <dt className="rule-label">Subject</dt>
                <dd className="mt-1 text-2xs text-heading">{thread.subjectName}</dd>
              </div>
              <div>
                <dt className="rule-label">Topic</dt>
                <dd className="mt-1 text-2xs text-heading">{thread.topicName}</dd>
              </div>
              <div>
                <dt className="rule-label">Last activity</dt>
                <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{formatRelative(thread.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card eyebrow="Saved replies" title="Reuse a template">
            {(templates.data ?? []).length === 0 ? (
              <p className="text-2xs text-muted">No saved replies yet. Write the first answer and it can be saved as a template later.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {(templates.data ?? []).map((template) => (
                  <li key={template.id} className="py-2 first:pt-0 last:pb-0">
                    <p className="text-2xs font-[560] text-heading">{template.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-2xs text-muted">{template.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-2xs text-faint">Pick one in the composer above to fill the box; it never sends on its own.</p>
          </Card>
        </aside>
      </div>
    </>
  )
}
