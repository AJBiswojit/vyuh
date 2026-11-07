import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { useLearningStudentId, useStudyRooms } from '../hooks/useLearning.js'

/** Interactive-only room list with live peer counts. */
export function StudyRoomsPage() {
  useDocumentTitle('Study rooms')
  const studentId = useLearningStudentId()
  const query = useStudyRooms(studentId)
  const rooms = (query.data ?? []).filter((room) => room.mode === 'interactive')
  return (
    <div>
      <PageHeader eyebrow="Learning · Together" title="Study rooms" description="Small interactive rooms for focused practice with your batch. Broadcast rooms never appear here." />
      {query.isPending ? <Skeleton.Region label="Loading study rooms"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Skeleton.Block className="h-48" /><Skeleton.Block className="h-48" /><Skeleton.Block className="h-48" /></div></Skeleton.Region> : query.isError ? <ErrorState title="Study rooms could not load" description={query.error.message} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : rooms.length === 0 ? <EmptyState size="panel" title="No interactive rooms open" description="Check back after the next live class; rooms usually open around problem sets." /> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id} className="flex flex-col rounded-md border border-line bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-2"><Badge tone="neutral" variant="outline">Interactive</Badge><span className="inline-flex items-center gap-1.5 font-mono text-2xs tabular-nums text-muted"><Users className="size-3.5" strokeWidth={1.5} aria-hidden="true" />{room.peerCount}/{room.capacity}</span></div>
              <h2 className="mt-3 text-sm font-[560] text-heading">{room.name}</h2>
              <p className="mt-1 text-2xs leading-relaxed text-muted">{room.topic} · {room.subjectName}</p>
              <p className="mt-1 text-2xs text-faint">{room.batchName} · {room.focusMinutes}-min focus</p>
              <div className="mt-4 flex -space-x-2" aria-hidden="true">{room.participants.slice(0, 5).map((person) => <span key={person.id} className="flex size-8 items-center justify-center rounded-full border border-line bg-surface-sunken font-mono text-2xs text-heading">{person.initials}</span>)}</div>
              <Link to={`/student/study-rooms/${room.id}`} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90">{room.joined ? 'Return to room' : 'Open room'}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
