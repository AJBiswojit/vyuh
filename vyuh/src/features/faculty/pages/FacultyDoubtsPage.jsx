import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, ErrorState, Select, Skeleton } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { formatRelative } from '@/shared/lib/format.js'
import { useFacultyDoubts } from '../hooks/useFacultyLive.js'

/**
 * The doubt inbox. Ordered by how long a student has been waiting, because the
 * only urgent thing about a doubt is that someone is stuck. Status is filtered in
 * the top bar; the thread itself is where the answer is written.
 */
export function FacultyDoubtsPage() {
  useDocumentTitle('Doubts')
  const [status, setStatus] = useState('open')
  const doubts = useFacultyDoubts(status)
  const items = [...(doubts.data ?? [])].sort((a, b) => b.waitingMinutes - a.waitingMinutes)
  const open = items.filter((doubt) => doubt.status !== 'resolved').length

  return (
    <>
      <PageHeader
        eyebrow="Faculty workspace · Doubts"
        title="Doubt inbox"
        description="Questions students asked against a lecture or a paper. A reply moves the thread to answered; resolving closes it after the student confirms."
        meta={
          <>
            <span className="font-mono text-2xs tabular-nums text-muted">{open} open in this view</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="font-mono text-2xs tabular-nums text-muted">
              oldest waiting {items[0]?.waitingMinutes ?? 0} min
            </span>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-sm border border-line bg-surface-raised px-3 py-2.5">
        <div className="w-full max-w-[16rem]">
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { value: 'open', label: 'Open and unanswered' },
              { value: 'answered', label: 'Answered' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'all', label: 'Everything' },
            ]}
            hint="Resolved threads stay readable; they never enter this inbox again."
          />
        </div>
        <p className="text-2xs text-muted">Sorted longest wait first</p>
      </div>

      {doubts.isPending ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">Loading doubts</span>
          {[0, 1, 2, 3, 4].map((index) => <Skeleton.Block key={index} className="h-16 rounded-sm" />)}
        </div>
      ) : doubts.isError ? (
        <ErrorState
          code="E_DOUBTS"
          title="Doubts did not load"
          description={/** @type {Error} */ (doubts.error)?.message ?? 'Nothing was changed. Try again.'}
          action={<Button variant="secondary" onClick={() => doubts.refetch()} loading={doubts.isFetching}>Try again</Button>}
        />
      ) : items.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line-strong px-6 py-12 text-center">
          <MessageSquare className="mx-auto size-6 text-muted" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-3 text-xs font-[560] text-heading">Nothing waiting in this view</p>
          <p className="mx-auto mt-1 max-w-md text-2xs text-muted">
            A new doubt appears here the moment a student asks it, with the lecture timestamp already attached.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-sm border border-line bg-surface-raised" data-testid="doubt-inbox">
          {items.map((doubt) => (
            <li key={doubt.id}>
              <Link
                to={`/faculty/doubts/${doubt.id}`}
                className={cn(
                  'flex flex-wrap items-start gap-3 px-3 py-3 transition-colors hover:bg-surface-sunken',
                  doubt.status === 'open' && 'bg-[color-mix(in_oklab,var(--color-review)_5%,transparent)]',
                )}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface-sunken font-mono text-2xs text-muted">
                  {doubt.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-xs font-[560] tracking-tight text-heading">{doubt.title}</span>
                    <Badge
                      tone={doubt.status === 'open' ? 'review' : doubt.status === 'answered' ? 'answer' : 'idle'}
                      variant="outline"
                      shape={doubt.status === 'open' ? 'diamond' : doubt.status === 'answered' ? 'square' : 'hollow'}
                    >
                      {doubt.status === 'open' ? 'Waiting' : doubt.status === 'answered' ? 'Answered' : 'Resolved'}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-2xs text-muted">
                    {doubt.studentName} · {doubt.batchName} · {doubt.subjectName} · {doubt.topicName}
                  </span>
                  <span className="mt-0.5 block truncate text-2xs text-faint">{doubt.body}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {doubt.timestampLink ? (
                    <span className="font-mono text-2xs tabular-nums text-muted">lecture link</span>
                  ) : null}
                  <span className="font-mono text-2xs tabular-nums text-muted">waiting {doubt.waitingMinutes} min</span>
                  <span className="font-mono text-2xs tabular-nums text-faint">{formatRelative(doubt.updatedAt)}</span>
                  <ArrowUpRight className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
