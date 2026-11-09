import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, EmptyState, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib/format.js'
import { AttentionToast } from '../components/AttentionToast.jsx'
import { SessionSummary } from '@/features/live/components/SessionSummary.jsx'
import { useLearningStudentId, useLeaveLive, useLiveAttendance, useLiveRealtime, useLiveRoom, useRespondAttention } from '../hooks/useLearning.js'
import { useLiveClassroom } from '../hooks/useLiveClassroom.js'
import { StudentClassroom } from '@/features/live/components/StudentClassroom.jsx'

/**
 * The student live class. One screen, three areas: a compact header, the
 * teaching stage, and the conversation panel. Everything advanced — attendance
 * detail, replay, after-class summary — lives in its own destination, not on
 * the active stage.
 */
export function LiveRoomPage() {
  useDocumentTitle('Live class')
  const { sessionId = '' } = useParams()
  const studentId = useLearningStudentId()
  const navigate = useNavigate()
  const toast = useToast()
  const room = useLiveRoom(sessionId, studentId)
  const session = room.data?.session
  const live = session?.status === 'live'
  const attendance = useLiveAttendance(sessionId, studentId, Boolean(live))
  const attendanceState = attendance.data ?? room.data?.attendance ?? null
  const { challenge } = useLiveRealtime(sessionId, studentId, Boolean(live && attendance.data))
  const respond = useRespondAttention(sessionId, studentId)
  const leave = useLeaveLive(sessionId, studentId)
  const broadcast = session?.mode === 'broadcast'
  // The shared classroom is loaded here once and passed down; the live branch
  // shows the stage and the conversation, the ended branch shows what happened.
  const classroom = useLiveClassroom(sessionId, attendanceState)

  // The service names the recording this class actually produced. A missing id
  // means "not published yet", not "link to the default demo recording".
  const replayHref = room.data?.recordingId
    ? `/student/recordings/${room.data.recordingId}`
    : /^\/student\/recordings\/[^/?#]+/.test(session?.joinUrl ?? '') ? session.joinUrl : null

  if (room.isPending) return <Skeleton.Region label="Loading live class"><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"><Skeleton.Block className="aspect-video" /><Skeleton.Block className="h-96" /></div></Skeleton.Region>
  if (room.isError || !session) return <ErrorState title="Class could not load" description={room.error?.message ?? 'This session is not available.'} action={<Link to="/student/live" className="text-xs font-[560] text-heading underline">Back to schedule</Link>} />

  const leaveClass = () => {
    leave.mutate(undefined, {
      onSuccess: () => navigate('/student/live'),
      onError: (error) => toast.show({ title: 'Could not leave cleanly', description: error.message, tone: 'danger' }),
    })
  }

  if (!live) return (
    <div>
      <NotLiveHeader session={session} />
      <EmptyState
        size="panel"
        title={session.status === 'ended' ? 'This class has ended' : 'This room is not open yet'}
        description={session.status === 'ended' ? (replayHref ? 'The recording is in your library with chapters, transcript and practice.' : 'This class has ended. Its recording has not been published to the library yet.') : `Scheduled for ${formatDateTime(session.startsAt)}. Come back when the class goes live.`}
        action={session.status === 'ended' ? (replayHref ? <Link to={replayHref} className="inline-flex min-h-11 items-center rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse">Watch recording</Link> : <span className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 font-mono text-2xs text-faint">Recording not published yet</span>) : <Link to="/student/live" className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading">Back to schedule</Link>}
      />
      {session.status === 'ended' ? (
        <div className="mt-4 space-y-3">
          {classroom.summary ? <SessionSummary summary={classroom.summary} snapshot={classroom.snapshot} metadata={classroom.metadata} /> : null}
          <p className="text-2xs text-muted">Attendance for this class is on your <Link to="/student/attendance" className="font-[560] text-heading underline underline-offset-2">attendance page</Link>.</p>
        </div>
      ) : null}
    </div>
  )

  return (
    <div>
      <StudentClassroom
        session={session}
        attendanceState={attendanceState}
        classroom={classroom}
        onLeave={leaveClass}
        leaving={leave.isPending}
        broadcast={Boolean(broadcast)}
      />
      {attendance.isError ? <div className="mt-3"><ErrorState size="inline" title="Attendance could not start" description={attendance.error.message} action={<Button variant="secondary" onClick={() => attendance.refetch()}>Retry join</Button>} /></div> : null}
      {challenge ? <AttentionToast challenge={challenge} busy={respond.isPending} onRespond={() => respond.mutate(challenge.id, { onError: (error) => toast.show({ title: 'Check already closed', description: error.message, tone: 'danger' }) })} /> : null}
    </div>
  )
}

/** Compact header for the not-open-yet states — same information shape, no Leave action. */
function NotLiveHeader({ session }) {
  const ended = session.status === 'ended'
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
      <div className="min-w-0">
        <p className="rule-label">Live class</p>
        <h1 className="mt-1 text-lg leading-[1.15] tracking-tighter text-heading sm:text-xl">{session.title}</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted">
          <span>{session.facultyName}</span>
          <span aria-hidden="true">·</span>
          <span>{session.subjectName}</span>
          <span aria-hidden="true">·</span>
          <span>{session.batchName}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge tone={ended ? 'neutral' : 'review'} variant="outline">{ended ? 'Class ended' : 'Not started'}</Badge>
        <Link to="/student/live" className="inline-flex min-h-11 items-center gap-1.5 text-2xs text-muted hover:text-heading">
          <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Schedule
        </Link>
      </div>
    </header>
  )
}
