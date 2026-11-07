import { useEffect, useState } from 'react'
import { AlertTriangle, Camera, Clock, Eye, ShieldAlert, ShieldCheck, Volume2 } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, ErrorState, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatMarks, formatRelative } from '@/shared/lib/format.js'
import { cn } from '@/shared/lib/cn.js'
import { useDecideIntegrity, useIntegrityReports } from '../hooks/useAdminOps.js'
import { RequireNoteDialog } from '../components/RequireNoteDialog.jsx'

const DECISIONS = [
  {
    value: 'clear',
    label: 'Clear',
    confirmLabel: 'Clear the flag',
    tone: /** @type {'neutral'} */ ('neutral'),
    description: 'No action against the candidate. The flag is recorded as reviewed and the score stands.',
    noteLabel: 'Why is the flag being cleared?',
    noteHint: 'The candidate and guardian see this if they ask for the record.',
  },
  {
    value: 'warn',
    label: 'Warn',
    confirmLabel: 'Issue the warning',
    tone: /** @type {'danger'} */ ('danger'),
    description: 'A written warning goes to the candidate and guardian. The score stands and the flag stays visible.',
    noteLabel: 'What is the warning for?',
    noteHint: 'This note is sent to the candidate and guardian and kept in the audit ledger.',
  },
  {
    value: 'invalidate',
    label: 'Invalidate',
    confirmLabel: 'Invalidate the sitting',
    tone: /** @type {'danger'} */ ('danger'),
    description: 'The sitting is voided for this candidate. Their score is withdrawn and the batch average is recomputed.',
    noteLabel: 'Why is the sitting being invalidated?',
    noteHint: 'This is the strongest decision available. The note is the record the family is shown.',
  },
]

const DECISION_LABELS = { clear: 'Cleared', warn: 'Warning issued', invalidate: 'Sitting invalidated' }

/** @param {string} kind */
function EvidenceIcon({ kind }) {
  const Icon = kind === 'audio' ? Volume2 : kind === 'camera' ? Camera : kind === 'focus' ? Eye : Clock
  return <Icon className="size-3.5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden="true" />
}

/**
 * Per paper, the sessions the room flagged and why. A flag is a signal; the
 * office's decision is the finding. Every decision needs a note because the note
 * is what the candidate and guardian are shown — the button stays disabled until
 * one is written.
 */
export function AdminIntegrityPage() {
  useDocumentTitle('Integrity reports')
  const reports = useIntegrityReports()
  const decide = useDecideIntegrity()
  const toast = useToast()

  const [examId, setExamId] = useState('')
  const [filter, setFilter] = useState('undecided')

  useEffect(() => {
    if (!examId && reports.data && reports.data.length > 0) setExamId(reports.data[0].examId)
  }, [reports.data, examId])

  const report = reports.data?.find((candidate) => candidate.examId === examId)
  const sessions = (report?.sessions ?? []).filter((session) => {
    if (filter === 'undecided') return !session.decision
    if (filter === 'decided') return Boolean(session.decision)
    return true
  })
  const totalFlags = reports.data?.reduce((sum, candidate) => sum + candidate.sessions.length, 0) ?? 0
  const openFlags = reports.data?.reduce((sum, candidate) => sum + candidate.sessions.filter((session) => !session.decision).length, 0) ?? 0

  const submit = (session, decision, note) => {
    if (!report) return
    decide.mutate(
      { examId: report.examId, sessionId: session.id, decision, note },
      {
        onSuccess: () => toast.success(`${DECISION_LABELS[decision]}`, `${session.studentName} · ${report.examTitle}`),
        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Integrity"
        title="Integrity reports"
        description="What the exam room flagged, per paper, with the evidence behind each signal. A flag is not a finding: the decision and its note are."
        meta={
          reports.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{totalFlags} flags this term</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{openFlags} without a decision</span>
            </>
          ) : null
        }
      />

      {reports.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3">
          <span className="sr-only">Loading integrity reports</span>
          <Skeleton.Block className="h-20" />
          {[0, 1].map((key) => <Skeleton.Block key={key} className="h-44 rounded-sm" />)}
        </div>
      ) : reports.isError ? (
        <ErrorState
          code="E_INTEGRITY"
          title="Reports could not load"
          description={/** @type {Error} */ (reports.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => reports.refetch()} loading={reports.isFetching}>Try again</Button>}
        />
      ) : !reports.data || reports.data.length === 0 ? (
        <EmptyState
          size="panel"
          icon={<ShieldCheck strokeWidth={1.5} />}
          title="No sitting has raised a flag"
          description="Papers run with proctoring report here when a signal fires. Nothing to review this term."
          code="0 flags"
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 rounded-sm border border-line bg-surface-raised p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] sm:items-end">
            <Select
              label="Paper"
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              options={(reports.data ?? []).map((candidate) => ({
                value: candidate.examId,
                label: `${candidate.examTitle} · ${candidate.sessions.length} flag${candidate.sessions.length === 1 ? '' : 's'}`,
              }))}
            />
            <Select
              label="Show"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              options={[
                { value: 'undecided', label: 'Without a decision' },
                { value: 'decided', label: 'Decided' },
                { value: 'all', label: 'All flagged sessions' },
              ]}
            />
          </div>

          {report ? (
            <div data-testid="integrity-report" data-exam-id={report.examId}>
              <Card
                tone="sunken"
                eyebrow={`Sat ${formatDateTime(report.satAt)}`}
                title={report.examTitle}
                action={<Badge tone="neutral" variant="outline" shape="square" mono>{report.proctoringLevel} proctoring</Badge>}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="rule-label">Batch</p>
                    <p className="mt-1 text-xs text-heading">{report.batchName}</p>
                  </div>
                  <div>
                    <p className="rule-label">Flagged sessions</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-heading">{report.sessions.length}</p>
                  </div>
                  <div>
                    <p className="rule-label">Still open</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-heading">{report.sessions.filter((session) => !session.decision).length}</p>
                  </div>
                </div>
              </Card>

              <div className="mt-5 flex flex-col gap-4">
                {sessions.length === 0 ? (
                  <EmptyState
                    size="panel"
                    icon={<ShieldCheck strokeWidth={1.5} />}
                    title={filter === 'undecided' ? 'Every flag on this paper has a decision' : 'No flagged session in this view'}
                    description={filter === 'undecided' ? 'Switch to Decided to read the notes behind them.' : 'Change the filter to see the rest of this paper.'}
                    code="0 sessions"
                    action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all flags</Button>}
                  />
                ) : (
                  sessions.map((session) => (
                    <Card
                      key={session.id}
                      data-testid={`flag-${session.id}`}
                      eyebrow={`${session.rollNumber} · flagged ${formatRelative(session.flaggedAt)}`}
                      title={session.studentName}
                      action={
                        session.decision ? (
                          <Badge
                            tone={session.decision === 'clear' ? 'answer' : session.decision === 'warn' ? 'review' : 'danger'}
                            variant="soft"
                            shape={session.decision === 'clear' ? 'square' : session.decision === 'warn' ? 'diamond' : 'ring'}
                            data-testid={`flag-status-${session.id}`}
                          >
                            {DECISION_LABELS[session.decision]}
                          </Badge>
                        ) : (
                          <Badge tone="review" variant="soft" shape="diamond" data-testid={`flag-status-${session.id}`}>Awaiting decision</Badge>
                        )
                      }
                      footer={
                        session.decision ? (
                          <div className="text-2xs leading-relaxed text-muted">
                            <p className="text-body">
                              <span className="font-[560] text-heading">{DECISION_LABELS[session.decision]}</span> · {session.decidedBy} · {formatDateTime(session.decidedAt)}
                            </p>
                            <p className="mt-1">{session.note}</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-2xs text-muted">Every decision needs a note; it is the record the candidate and guardian are shown.</p>
                            <div className="flex flex-wrap gap-2">
                              {DECISIONS.map((decision) => (
                                <RequireNoteDialog
                                  key={decision.value}
                                  title={`${decision.label} ${session.studentName}?`}
                                  description={decision.description}
                                  detail={
                                    <div className="space-y-2 rounded-sm border border-line bg-surface-sunken px-3 py-2">
                                      <p className="text-2xs leading-relaxed text-body">
                                        <span className="font-[560] text-heading">{report.examTitle}</span> · {session.rollNumber} · scored{' '}
                                        {formatMarks(session.score, session.maxMarks)}
                                      </p>
                                      {session.reasons.map((reason) => (
                                        <p key={reason} className="flex items-start gap-1.5 text-2xs leading-relaxed text-muted">
                                          <AlertTriangle className="mt-0.5 size-3 shrink-0 text-review-fg" strokeWidth={1.75} aria-hidden="true" />
                                          {reason}
                                        </p>
                                      ))}
                                    </div>
                                  }
                                  noteLabel={decision.noteLabel}
                                  noteHint={decision.noteHint}
                                  confirmLabel={decision.confirmLabel}
                                  tone={decision.tone}
                                  busy={decide.isPending}
                                  onConfirm={(note) => submit(session, /** @type {'clear'|'warn'|'invalidate'} */ (decision.value), note)}
                                >
                                  {(open) => (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      icon={decision.value === 'clear' ? <ShieldCheck strokeWidth={1.5} /> : <ShieldAlert strokeWidth={1.5} />}
                                      onClick={open}
                                      aria-label={`${decision.label} ${session.studentName}`}
                                    >
                                      {decision.label}
                                    </Button>
                                  )}
                                </RequireNoteDialog>
                              ))}
                            </div>
                          </div>
                        )
                      }
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                        <div>
                          <p className="rule-label mb-2">Why it was flagged</p>
                          <ul className="flex flex-col gap-1.5">
                            {session.reasons.map((reason) => (
                              <li key={reason} className={cn('flex items-start gap-2 text-2xs leading-relaxed', session.decision === 'clear' ? 'text-muted' : 'text-body')}>
                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-review" aria-hidden="true" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 font-mono text-2xs tabular-nums text-muted">
                            Score {formatMarks(session.score, session.maxMarks)}
                          </p>
                        </div>
                        <div>
                          <p className="rule-label mb-2">Evidence</p>
                          <ul className="flex flex-col divide-y divide-line">
                            {session.evidence.map((item) => (
                              <li key={item.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
                                <EvidenceIcon kind={item.kind} />
                                <div className="min-w-0">
                                  <p className="text-2xs font-[560] text-heading">
                                    {item.label} <span className="font-mono font-normal text-faint">· {formatDateTime(item.at)}</span>
                                  </p>
                                  <p className="mt-0.5 text-2xs leading-relaxed text-muted">{item.detail}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}
