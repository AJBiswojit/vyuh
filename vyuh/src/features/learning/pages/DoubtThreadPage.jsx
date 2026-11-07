import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CircleDot, Clock } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { formatClock, formatDateTime } from '@/shared/lib/format.js'
import { cn } from '@/shared/lib/cn.js'
import { useDoubtThread, useLearningStudentId, useReplyDoubt } from '../hooks/useLearning.js'

/** Thread view with a timestamp link back to the recording. */
export function DoubtThreadPage() {
  useDocumentTitle('Doubt')
  const { doubtId = '' } = useParams()
  const studentId = useLearningStudentId()
  const query = useDoubtThread(doubtId, studentId)
  const reply = useReplyDoubt(doubtId, studentId)
  const toast = useToast()
  const [body, setBody] = useState('')
  const doubt = query.data
  return (
    <div>
      <PageHeader eyebrow="Doubt thread" title={doubt?.title ?? 'Doubt'} meta={<><Link to="/student/doubts" className="inline-flex items-center gap-1.5 text-2xs text-muted hover:text-heading"><ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Inbox</Link>{doubt ? <Badge tone={doubt.status === 'answered' ? 'answer' : 'review'} variant="outline" className="gap-1.5">{doubt.status === 'answered' ? <CheckCircle2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" /> : <CircleDot className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}{doubt.status === 'answered' ? 'Answered' : 'Open'}</Badge> : null}</>} />
      {query.isPending ? <Skeleton.Region label="Loading thread"><Skeleton.Block className="h-32" /><Skeleton.Block className="mt-3 h-32" /></Skeleton.Region> : query.isError || !doubt ? <ErrorState title="Thread could not load" description={query.error?.message ?? 'This doubt is not available.'} action={<Link to="/student/doubts" className="text-xs font-[560] text-heading underline">Back to inbox</Link>} /> : (
        <div className="max-w-3xl space-y-4">
          {doubt.recordingId && doubt.timeSeconds !== null ? <Link to={`/student/recordings/${doubt.recordingId}?t=${doubt.timeSeconds}`} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 font-mono text-2xs tabular-nums text-info-fg hover:border-heading"><Clock className="size-4" strokeWidth={1.5} aria-hidden="true" />Jump to {formatClock(doubt.timeSeconds)} in {doubt.recordingTitle}</Link> : null}
          <ol className="space-y-3" aria-label="Thread messages">
            {doubt.messages.map((message) => (
              <li key={message.id} className={cn('rounded-md border p-4', message.role === 'faculty' ? 'border-info bg-surface-raised' : 'border-line bg-surface-sunken')}>
                <p className="flex flex-wrap items-baseline justify-between gap-2 text-xs font-[560] text-heading">{message.author}<span className="font-mono text-2xs font-normal text-faint">{message.role === 'faculty' ? 'Faculty · ' : ''}{formatDateTime(message.createdAt)}</span></p>
                <p className="mt-2 text-xs leading-relaxed text-body">{message.body}</p>
              </li>
            ))}
          </ol>
          <form className="space-y-2 rounded-md border border-line bg-surface-raised p-4" onSubmit={(event) => { event.preventDefault(); if (!body.trim()) return; reply.mutate(body, { onSuccess: () => { setBody(''); toast.show({ title: 'Reply sent', description: 'Faculty will see it in this thread.', tone: 'success' }) }, onError: (error) => toast.show({ title: 'Reply not sent', description: error.message, tone: 'danger' }) }) }}>
            <label htmlFor="doubt-reply" className="text-xs font-[560] text-heading">Add to the thread</label>
            <textarea id="doubt-reply" value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={2000} placeholder="Add context or ask a follow-up…" className="w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-xs text-heading placeholder:text-faint" />
            <Button type="submit" variant="secondary" size="sm" loading={reply.isPending} disabled={!body.trim()}>Send reply</Button>
          </form>
        </div>
      )}
    </div>
  )
}
