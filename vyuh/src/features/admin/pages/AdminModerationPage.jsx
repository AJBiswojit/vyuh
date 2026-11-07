import { useState } from 'react'
import { Flag, MessageSquareWarning, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, EmptyState, ErrorState, Select, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatRelative } from '@/shared/lib/format.js'
import { cn } from '@/shared/lib/cn.js'
import { useDecideModeration, useModeration } from '../hooks/useAdminOps.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'
import { RequireNoteDialog } from '../components/RequireNoteDialog.jsx'

const STATUS_TABS = [
  { value: 'open', label: 'Awaiting review' },
  { value: 'decided', label: 'Decided' },
  { value: 'all', label: 'All reports' },
]

const DECISION_LABELS = { removed: 'Content removed', dismissed: 'Report dismissed', warned: 'Author warned' }

/**
 * Reported doubts and chat messages. The office is not the faculty's moderator —
 * it reads what was escalated, and every removal or warning carries a note
 * because the author will ask why.
 */
export function AdminModerationPage() {
  useDocumentTitle('Content moderation')
  const moderation = useModeration({ kind: 'all', status: 'all' })
  const decide = useDecideModeration()
  const toast = useToast()

  const [tab, setTab] = useState('open')
  const [kind, setKind] = useState('all')

  const all = moderation.data ?? []
  const openCount = all.filter((item) => item.status === 'open').length
  const decidedCount = all.length - openCount

  const rows = all
    .filter((item) => (kind === 'all' ? true : item.kind === kind))
    .filter((item) => (tab === 'open' ? item.status === 'open' : tab === 'decided' ? item.status !== 'open' : true))

  const submit = (item, decision, note) => {
    decide.mutate(
      { id: item.id, decision, note },
      {
        onSuccess: () => toast.success(DECISION_LABELS[decision] ?? 'Decision saved', `${item.kind === 'doubt' ? 'Doubt' : 'Chat'} · ${item.batchName}`),
        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Academic office · Moderation"
        title="Content moderation"
        description="Doubts and class messages that someone reported. Removal and warnings need a note; dismissing a report needs a reason in the note as well, because someone took the trouble to flag it."
        meta={
          moderation.data ? (
            <>
              <span className="font-mono text-2xs tabular-nums text-muted">{openCount} awaiting review</span>
              <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
              <span className="font-mono text-2xs tabular-nums text-muted">{decidedCount} decided</span>
            </>
          ) : null
        }
        actions={
          <Select
            label="Kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            options={[
              { value: 'all', label: 'Doubts and chat' },
              { value: 'doubt', label: 'Doubts' },
              { value: 'chat', label: 'Chat messages' },
            ]}
            className="min-w-44"
          />
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-1 border-b border-line pb-2" role="tablist" aria-label="Report status">
        {STATUS_TABS.map((option) => (
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
              {option.value === 'open' ? openCount : option.value === 'decided' ? decidedCount : all.length}
            </span>
          </button>
        ))}
      </div>

      {moderation.isPending ? (
        <div role="status" aria-busy="true" className="space-y-3">
          <span className="sr-only">Loading reports</span>
          {[0, 1, 2].map((key) => <Skeleton.Block key={key} className="h-40 rounded-sm" />)}
        </div>
      ) : moderation.isError ? (
        <ErrorState
          code="E_MODERATION"
          title="The queue could not load"
          description={/** @type {Error} */ (moderation.error)?.message ?? 'Try again.'}
          action={<Button variant="secondary" onClick={() => moderation.refetch()} loading={moderation.isFetching}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          size="panel"
          icon={<ShieldCheck strokeWidth={1.5} />}
          title={tab === 'open' ? 'Nothing is waiting for review' : 'No report in this view'}
          description={tab === 'open' ? 'Every reported message has been decided. Reports appear here as students and faculty flag them.' : 'Switch the tab or the kind filter to see the rest.'}
          code="0 reports"
          action={<Button variant="secondary" onClick={() => { setTab('all'); setKind('all') }}>Show all reports</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-4" data-testid="moderation-list">
          {rows.map((item) => (
            <li key={item.id} data-testid={`moderation-${item.id}`}>
              <Card
                eyebrow={`${item.kind === 'doubt' ? 'Doubt' : 'Chat message'} · reported ${formatRelative(item.reportedAt)} · ${item.flags} flag${item.flags === 1 ? '' : 's'}`}
                title={`${item.authorName} · ${item.batchName}`}
                action={
                  item.status === 'open' ? (
                    <Badge tone="review" variant="soft" shape="diamond">Awaiting review</Badge>
                  ) : item.status === 'removed' ? (
                    <Badge tone="danger" variant="soft" shape="ring" data-testid={`moderation-status-${item.id}`}>Content removed</Badge>
                  ) : item.status === 'warned' ? (
                    <Badge tone="review" variant="soft" shape="diamond" data-testid={`moderation-status-${item.id}`}>Author warned</Badge>
                  ) : (
                    <Badge tone="neutral" variant="outline" shape="square" data-testid={`moderation-status-${item.id}`}>Dismissed</Badge>
                  )
                }
                footer={
                  item.status === 'open' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-xl text-2xs leading-relaxed text-muted">
                        Dismissing keeps the message and closes the report. Removing deletes the message for everyone.
                        A warning leaves the message up and writes to the author's record.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <ConfirmAction
                          title="Dismiss this report?"
                          description="The message stays where it is and the report closes. Nothing is deleted and the author is not contacted."
                          detail={`${item.reason} · reported by ${item.reporterName}`}
                          confirmLabel="Dismiss the report"
                          cancelLabel="Keep it open"
                          tone="neutral"
                          busy={decide.isPending}
                          onConfirm={() => submit(item, 'dismiss')}
                        >
                          {(open) => (
                            <Button variant="secondary" icon={<ShieldCheck strokeWidth={1.5} />} onClick={open}>
                              Dismiss
                            </Button>
                          )}
                        </ConfirmAction>

                        <RequireNoteDialog
                          title={`Warn ${item.authorName}?`}
                          description="The message stays up and the author receives a written warning. Their batch mentor is copied."
                          detail={<Quote item={item} />}
                          noteLabel="What is the warning for?"
                          noteHint="Sent to the author and kept in the audit ledger."
                          confirmLabel="Issue the warning"
                          busy={decide.isPending}
                          onConfirm={(note) => submit(item, 'warn', note)}
                        >
                          {(open) => (
                            <Button variant="secondary" icon={<TriangleAlert strokeWidth={1.5} />} onClick={open}>
                              Warn author
                            </Button>
                          )}
                        </RequireNoteDialog>

                        <RequireNoteDialog
                          title={`Remove this ${item.kind === 'doubt' ? 'doubt' : 'message'}?`}
                          description="It disappears for everyone, including the author. The audit ledger keeps the excerpt and your note."
                          detail={<Quote item={item} />}
                          noteLabel="Why is it being removed?"
                          noteHint="This note is the record of why the message no longer exists."
                          confirmLabel="Remove the content"
                          busy={decide.isPending}
                          onConfirm={(note) => submit(item, 'remove', note)}
                        >
                          {(open) => (
                            <Button variant="danger" icon={<Trash2 strokeWidth={1.5} />} onClick={open}>
                              Remove
                            </Button>
                          )}
                        </RequireNoteDialog>
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xs leading-relaxed text-muted">
                      <p className="text-body">
                        <span className="font-[560] text-heading">{DECISION_LABELS[item.status]}</span>
                        {item.decidedAt ? ` · ${formatRelative(item.decidedAt)}` : ''}
                      </p>
                      {item.note ? <p className="mt-1">{item.note}</p> : null}
                    </div>
                  )
                }
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div>
                    <p className="rule-label mb-2">Reported content</p>
                    <blockquote className="border-l-2 border-l-line-strong pl-3 text-xs leading-relaxed text-body">
                      “{item.excerpt}”
                    </blockquote>
                  </div>
                  <div className="flex flex-col gap-2 text-2xs leading-relaxed text-muted">
                    <p className="flex items-center gap-1.5">
                      <Flag className="size-3.5 shrink-0 text-review-fg" strokeWidth={1.75} aria-hidden="true" />
                      Reported for <span className="font-[560] text-heading">{item.reason.toLowerCase()}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MessageSquareWarning className="size-3.5 shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
                      Reported by {item.reporterName} · {item.reporterRole === 'faculty' ? 'faculty' : 'a student'}
                    </p>
                    <p className="font-mono text-2xs text-faint">{item.id} · {item.kind}</p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** @param {{ item: import('@/contracts/admin.js').ModerationItem }} props */
function Quote({ item }) {
  return (
    <div className="rounded-sm border border-line bg-surface-sunken px-3 py-2">
      <p className="text-2xs leading-relaxed text-body">“{item.excerpt}”</p>
      <p className="mt-1 font-mono text-2xs text-faint">
        {item.authorName} · {item.reason} · {item.flags} flag{item.flags === 1 ? '' : 's'}
      </p>
    </div>
  )
}
