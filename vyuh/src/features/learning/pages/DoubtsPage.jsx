import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CircleDot, Clock } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { formatClock, formatRelative } from '@/shared/lib/format.js'
import { useDoubtInbox, useLearningStudentId } from '../hooks/useLearning.js'

/** Inbox with open/answered status and timestamp links back to recordings. */
export function DoubtsPage() {
  useDocumentTitle('Doubts')
  const studentId = useLearningStudentId()
  const query = useDoubtInbox(studentId)
  const [filter, setFilter] = useState('all')
  const all = query.data ?? []
  const items = all.filter((item) => filter === 'all' || item.status === filter)
  return (
    <div>
      <PageHeader eyebrow="Learning · Doubts" title="Doubts" description="Questions attached to the exact moment that confused you, with faculty replies in the thread." />
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter doubts">
        {[['all', 'All', all.length], ['open', 'Open', all.filter((item) => item.status === 'open').length], ['answered', 'Answered', all.filter((item) => item.status === 'answered').length]].map(([value, label, count]) => (
          <Button key={String(value)} variant="ghost" size="sm" aria-pressed={filter === value} onClick={() => setFilter(String(value))} className={filter === value ? 'bg-surface-sunken text-heading' : ''}>{label} <span className="font-mono tabular-nums text-faint">{count}</span></Button>
        ))}
      </div>
      {query.isPending ? <Skeleton.Region label="Loading doubts"><div className="space-y-3"><Skeleton.Block className="h-24" /><Skeleton.Block className="h-24" /></div></Skeleton.Region> : query.isError ? <ErrorState title="Doubts could not load" description={query.error.message} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : items.length === 0 ? <EmptyState size="panel" title="No doubts here" description="Open a recording and use “Doubt at…” to attach a question to a timestamp." /> : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-line bg-surface-raised p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/student/doubts/${item.id}`} className="text-sm font-[560] text-heading hover:underline">{item.title}</Link>
                  <p className="mt-1 text-2xs text-muted">{item.subjectName} · updated {formatRelative(item.updatedAt)} · {item.messages.length} message{item.messages.length === 1 ? '' : 's'}</p>
                  {item.recordingId && item.timeSeconds !== null ? <Link to={`/student/recordings/${item.recordingId}?t=${item.timeSeconds}`} className="mt-2 inline-flex items-center gap-1.5 font-mono text-2xs tabular-nums text-info-fg underline-offset-2 hover:underline"><Clock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />{formatClock(item.timeSeconds)} in {item.recordingTitle}</Link> : null}
                </div>
                <Badge tone={item.status === 'answered' ? 'answer' : 'review'} variant="outline" className="shrink-0 gap-1.5">{item.status === 'answered' ? <CheckCircle2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" /> : <CircleDot className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}{item.status === 'answered' ? 'Answered' : 'Open'}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
