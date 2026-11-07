import { useState } from 'react'
import { CalendarClock, Check, Clock, FileText, Stamp, X } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Input, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatDuration, formatNumber, formatRelative } from '@/shared/lib/format.js'
import { cn } from '@/shared/lib/cn.js'
import { useApprovals, useDecideApproval } from '../hooks/useAdmin.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'
import { RequireNoteDialog } from '../components/RequireNoteDialog.jsx'

const TABS = [
  { value: 'pending', label: 'Awaiting decision' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All papers' },
]

/** @param {string} iso */
function toLocalInput(iso) {
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * The gate between a faculty draft and a sitting. Approving is one click and a
 * confirmation; rejecting needs a note because the note is the whole feedback
 * loop; overriding the schedule needs both ends of a window, because a paper
 * without a window cannot run.
 */
export function AdminApprovalsPage() {
  useDocumentTitle('Exam approvals')
  const approvals = useApprovals('all')
  const decide = useDecideApproval()
  const toast = useToast()

  const [tab, setTab] = useState('pending')
  const [scheduleFor, setScheduleFor] = useState(/** @type {import('@/contracts/admin.js').ApprovalItem | null} */ (null))
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')

  const all = approvals.data ?? []
  const counts = {
    pending: all.filter((item) => item.status === 'pending').length,
    approved: all.filter((item) => item.status === 'approved').length,
    rejected: all.filter((item) => item.status === 'rejected').length,
    all: all.length,
  }
  const rows = tab === 'all' ? all : all.filter((item) => item.status === tab)

  const submit = (
    item,
    input,
    /** @type {string} */ successTitle,
    /** @type {(payload: import('@/contracts/admin.js').ApprovalItem) => void} */ onDone,
  ) => {
    decide.mutate(
      { examId: item.examId, ...input },
      {
        onSuccess: (updated) => {
          toast.success(successTitle, `${updated.title} · ${updated.status === 'approved' ? 'approved' : 'returned to faculty'}`)
          onDone(updated)
        },
        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
      },
    )
  }

  const openSchedule = (item) => {
    setScheduleFor(item)
    setStart(toLocalInput(item.windowStart))
    setEnd(toLocalInput(item.windowEnd))
    setNote('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Papers"
        title="Exam approval queue"
        description="Papers faculty have submitted for the term. An approved paper can be scheduled; a rejected one returns to its author with your note, and the reason is what they work from."
        meta={
          approvals.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{counts.pending} awaiting a decision</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{counts.approved} approved this term</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{counts.rejected} returned</span>
            </>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-1 border-b border-line pb-2" role="tablist" aria-label="Approval status">
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              'min-h-[var(--spacing-touch)] rounded-xs px-3 text-xs transition-colors',
              tab === option.value ? 'bg-ink font-[560] text-paper' : 'text-muted hover:bg-surface-sunken hover:text-heading',
            )}
          >
            {option.label}
            <span className={cn('ml-2 font-mono text-2xs tabular-nums', tab === option.value ? 'text-on-ink-muted' : 'text-faint')}>
              {counts[/** @type {'pending'|'approved'|'rejected'|'all'} */ (option.value)]}
            </span>
          </button>
        ))}
      </div>

      {approvals.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3">
          <span className="sr-only">Loading the queue</span>
          {[0, 1, 2].map((key) => <Skeleton.Block key={key} className="h-36 rounded-sm" />)}
        </div>
      ) : approvals.isError ? (
        <ErrorState
          code="E_APPROVALS"
          title="The queue could not load"
          description={/** @type {Error} */ (approvals.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => approvals.refetch()} loading={approvals.isFetching}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          size="panel"
          icon={<Stamp strokeWidth={1.5} />}
          title={tab === 'pending' ? 'Nothing is waiting for a decision' : 'No paper has that status'}
          description={tab === 'pending' ? 'Every submitted paper has been approved or returned. New submissions appear here as faculty send them.' : 'Switch to another tab to see the rest of the term’s queue.'}
          code={`0 ${tab}`}
          action={<Button variant="secondary" onClick={() => setTab('all')}>Show all papers</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-4" data-testid="approval-list">
          {rows.map((item) => (
            <li key={item.id} data-testid={`approval-row-${item.examId}`}>
              <Card
                tone="paper"
                eyebrow={`${item.subjectNames.join(' · ')} · submitted ${formatRelative(item.submittedAt)}`}
                title={item.title}
                action={
                  item.status === 'pending' ? (
                    <Badge tone="review" variant="soft" shape="diamond">Awaiting decision</Badge>
                  ) : item.status === 'approved' ? (
                    <Badge tone="answer" variant="soft" shape="square">Approved</Badge>
                  ) : (
                    <Badge tone="danger" variant="soft" shape="ring">Returned</Badge>
                  )
                }
                footer={
                  item.status === 'pending' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-2xs text-muted">
                        Approving schedules the paper in its submitted window. Override the window if the room or the batch has moved.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" icon={<CalendarClock strokeWidth={1.5} />} onClick={() => openSchedule(item)}>
                          Override schedule
                        </Button>
                        <RequireNoteDialog
                          title={`Return ${item.title} to ${item.facultyName}?`}
                          description="The note is what the faculty receives. Say what has to change before it can run."
                          detail={
                            <p className="rounded-sm border border-line bg-surface-sunken px-3 py-2 text-2xs leading-relaxed text-body">
                              {item.totalQuestions} questions · {formatNumber(item.maxMarks)} marks · {formatDuration(item.durationMinutes * 60)} · window starts {formatDateTime(item.windowStart)}
                            </p>
                          }
                          noteLabel="Why is it being returned?"
                          noteHint="Kept on the paper and in the audit ledger; the faculty sees this note first."
                          placeholder="For example: two sections exceed the syllabus weighting for this point in the term."
                          confirmLabel="Return the paper"
                          busy={decide.isPending}
                          onConfirm={(text) => submit(item, { decision: 'reject', note: text }, 'Paper returned', () => {})}
                        >
                          {(open) => (
                            <Button variant="danger" icon={<X strokeWidth={1.5} />} onClick={open}>
                              Reject
                            </Button>
                          )}
                        </RequireNoteDialog>
                        <ConfirmAction
                          title={`Approve ${item.title}?`}
                          description="The paper becomes schedulable and the faculty is notified. Its questions are locked from editing once the sitting is scheduled."
                          detail={`${item.batchNames.join(' · ')} · ${formatDateTime(item.windowStart)} to ${formatDateTime(item.windowEnd)}`}
                          confirmLabel="Approve the paper"
                          cancelLabel="Not yet"
                          tone="neutral"
                          busy={decide.isPending}
                          onConfirm={() => submit(item, { decision: 'approve' }, 'Paper approved', () => {})}
                        >
                          {(open) => (
                            <Button variant="primary" icon={<Check strokeWidth={1.75} />} onClick={open}>
                              Approve
                            </Button>
                          )}
                        </ConfirmAction>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-2xs text-muted">
                          {item.status === 'approved' ? 'Approved' : 'Returned'} by {item.decidedBy ?? 'the academic office'}
                          {item.decidedAt ? ` · ${formatRelative(item.decidedAt)}` : ''}
                        </p>
                        {item.note ? <p className="mt-1 max-w-2xl text-2xs leading-relaxed text-body">{item.note}</p> : null}
                      </div>
                      <span className="flex items-center gap-1 font-mono text-2xs text-muted">
                        <Clock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                        {formatDateTime(item.windowStart)}
                      </span>
                    </div>
                  )
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="rule-label">Submitted by</p>
                    <p className="mt-1 text-xs font-[560] text-heading">{item.facultyName}</p>
                    <p className="mt-0.5 text-2xs text-muted">{formatDateTime(item.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="rule-label">Batches</p>
                    <p className="mt-1 text-xs leading-relaxed text-body">{item.batchNames.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="rule-label">Paper</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-heading">{item.totalQuestions} questions</p>
                    <p className="mt-0.5 text-2xs text-muted">{formatNumber(item.maxMarks)} marks · {formatDuration(item.durationMinutes * 60)}</p>
                  </div>
                  <div>
                    <p className="rule-label">Proposed window</p>
                    <p className="mt-1 text-2xs leading-relaxed text-body">
                      {formatDateTime(item.windowStart)}
                      <br />
                      {formatDateTime(item.windowEnd)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-2xs text-faint">
                  <FileText className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  {item.examId} · {item.subjectNames.length} subjects · queued with the office
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(scheduleFor)}
        onClose={() => setScheduleFor(null)}
        title={scheduleFor ? `Set the window for ${scheduleFor.title}` : 'Set the window'}
        description="Overriding the schedule approves the paper in the same step: a paper with a window and no approval would still not run."
      >
        {scheduleFor ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!start || !end) return
              submit(
                scheduleFor,
                { decision: 'schedule', windowStart: start, windowEnd: end, note },
                'Window set',
                () => setScheduleFor(null),
              )
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Window opens" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} required />
              <Input label="Window closes" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="schedule-note" className="text-xs font-[560] tracking-tight text-heading">Note (optional)</label>
              <textarea
                id="schedule-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Why the window moved, for the record."
                className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              />
            </div>
            <p className="text-2xs leading-relaxed text-muted">
              The proposed window was {formatDateTime(scheduleFor.windowStart)} to {formatDateTime(scheduleFor.windowEnd)}.
            </p>
            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setScheduleFor(null)} disabled={decide.isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" loading={decide.isPending} disabled={!start || !end}>
                Approve with this window
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </>
  )
}
