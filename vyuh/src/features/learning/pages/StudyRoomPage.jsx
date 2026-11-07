import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mic, MicOff, Pause, Play, RotateCcw, Users } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, ErrorState, IconButton, Skeleton, useToast } from '@/shared/ui'
import { formatClock } from '@/shared/lib/format.js'
import { cn } from '@/shared/lib/cn.js'
import { useLearningStudentId, useRoomMembership, useRoomRealtime, useStudyRoom } from '../hooks/useLearning.js'

/** Interactive room with mock participants and a local focus timer. */
export function StudyRoomPage() {
  useDocumentTitle('Study room')
  const { roomId = '' } = useParams()
  const studentId = useLearningStudentId()
  const query = useStudyRoom(roomId, studentId)
  if (query.isPending) return <Skeleton.Region label="Loading room"><Skeleton.Block className="h-64" /></Skeleton.Region>
  if (query.isError || !query.data) return <ErrorState title="Room could not load" description={query.error?.message ?? 'This room is not available.'} action={<Link to="/student/study-rooms" className="text-xs font-[560] text-heading underline">Back to rooms</Link>} />
  return <StudyRoomView room={query.data} studentId={studentId} />
}

/** @param {{ room: import('@/contracts/learning.js').StudyRoomDetail, studentId: string }} props */
function StudyRoomView({ room, studentId }) {
  const join = useRoomMembership(room.id, studentId, 'join')
  const leave = useRoomMembership(room.id, studentId, 'leave')
  const toast = useToast()
  useRoomRealtime(room.id, studentId, true)
  const [seconds, setSeconds] = useState(room.focusMinutes * 60)
  const [running, setRunning] = useState(false)
  const [micOn, setMicOn] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [running])
  return (
    <div>
      <PageHeader eyebrow="Study room · Interactive" title={room.name} description={`${room.topic} · ${room.batchName}`} meta={<Link to="/student/study-rooms" className="inline-flex items-center gap-1.5 text-2xs text-muted hover:text-heading"><ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />All rooms</Link>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-md border border-line bg-surface-raised p-6" aria-label="Focus timer">
          <Badge tone="neutral" variant="outline">Interactive only</Badge>
          <p className="mt-6 font-mono text-4xl tabular-nums text-heading" role="timer" aria-live="off">{formatClock(seconds)}</p>
          <p className="mt-2 text-2xs text-muted">{room.joined ? 'You are in the room. Keep the timer running while you solve.' : 'Join to add yourself to the participant list and start the focus timer.'}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {room.joined ? <Button variant="secondary" onClick={() => leave.mutate(undefined, { onSuccess: () => setRunning(false) })} loading={leave.isPending}>Leave room</Button> : <Button variant="primary" onClick={() => join.mutate(undefined, { onError: (error) => toast.show({ title: 'Could not join', description: error.message, tone: 'danger' }) })} loading={join.isPending}>Join room</Button>}
            <Button variant="ghost" disabled={!room.joined} onClick={() => setRunning((value) => !value)} icon={running ? <Pause strokeWidth={1.5} /> : <Play strokeWidth={1.5} />}>{running ? 'Pause timer' : 'Start timer'}</Button>
            <IconButton icon={<RotateCcw strokeWidth={1.5} />} label="Reset focus timer" onClick={() => { setRunning(false); setSeconds(room.focusMinutes * 60) }} />
            <IconButton icon={micOn ? <Mic strokeWidth={1.5} /> : <MicOff strokeWidth={1.5} />} label={micOn ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={micOn} disabled={!room.joined} onClick={() => setMicOn((value) => !value)} />
          </div>
        </section>
        <section className="rounded-md border border-line bg-surface-raised p-4" aria-label="Participants">
          <h2 className="flex items-center gap-2 text-sm font-[560] text-heading"><Users className="size-4" strokeWidth={1.5} aria-hidden="true" />Participants <span className="font-mono text-2xs tabular-nums text-faint">{room.peerCount}/{room.capacity}</span></h2>
          <ul className="mt-4 space-y-2" aria-live="polite">
            {room.participants.map((person) => (
              <li key={person.id} className="flex items-center gap-3 rounded-sm border border-line px-3 py-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken font-mono text-2xs text-heading" aria-hidden="true">{person.initials}</span>
                <span className="min-w-0 flex-1 text-xs font-[560] text-heading">{person.name}{person.isSelf && person.name !== 'You' ? ' (you)' : ''}</span>
                <span className={cn('inline-flex items-center gap-1.5 text-2xs', person.presence === 'speaking' ? 'text-info-fg' : person.presence === 'away' ? 'text-faint' : 'text-answer-fg')}><span className={cn('size-1.5 rounded-full', person.presence === 'speaking' ? 'bg-info' : person.presence === 'away' ? 'bg-idle' : 'bg-answer')} aria-hidden="true" />{person.presence}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-2xs leading-relaxed text-faint">Peer presence ticks are mocked through the same realtime boundary as live chat.</p>
        </section>
      </div>
    </div>
  )
}
