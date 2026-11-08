import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { Badge, Button, EmptyState, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib/format.js'
import { AttendanceStrip } from '../components/AttendanceStrip.jsx'
import { AttentionToast } from '../components/AttentionToast.jsx'
import { LiveRail } from '../components/LiveRail.jsx'
import { LiveStage } from '../components/LiveStage.jsx'
import { useLearningStudentId, useLeaveLive, useLiveAttendance, useLiveRealtime, useLiveRoom, useRespondAttention, useSendChat, useSubmitQuestion, useUpvoteQuestion } from '../hooks/useLearning.js'

/** Live room: attendance strip above a 16:9 stage, chat/queue rail beside it. */
export function LiveRoomPage() {
  useDocumentTitle('Live room')
  const { sessionId = '' } = useParams()
  const studentId = useLearningStudentId()
  const navigate = useNavigate()
  const toast = useToast()
  const room = useLiveRoom(sessionId, studentId)
  const session = room.data?.session
  const live = session?.status === 'live'
  const attendance = useLiveAttendance(sessionId, studentId, Boolean(live))
  const { challenge } = useLiveRealtime(sessionId, studentId, Boolean(live && attendance.data))
  const respond = useRespondAttention(sessionId, studentId)
  const leave = useLeaveLive(sessionId, studentId)
  const sendChat = useSendChat(sessionId, studentId)
  const ask = useSubmitQuestion(sessionId, studentId)
  const upvote = useUpvoteQuestion(sessionId, studentId)
  const policy = room.data?.policy ?? attendancePolicyFallback
  const broadcast = session?.mode === 'broadcast'
  // The service names the recording this class actually produced. A missing id
  // means "not published yet", not "link to the default demo recording".
  const replayHref = room.data?.recordingId
    ? `/student/recordings/${room.data.recordingId}`
    : /^\/student\/recordings\/[^/?#]+/.test(session?.joinUrl ?? '') ? session.joinUrl : null

  if (room.isPending) return <Skeleton.Region label="Loading live room"><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"><Skeleton.Block className="aspect-video" /><Skeleton.Block className="h-96" /></div></Skeleton.Region>
  if (room.isError || !session) return <ErrorState title="Room could not load" description={room.error?.message ?? 'This session is not available.'} action={<Link to="/student/live" className="text-xs font-[560] text-heading underline">Back to schedule</Link>} />
  if (!live) return (
    <div>
      <PageHeader eyebrow="Live room" title={session.title} />
      <EmptyState size="panel" title={session.status === 'ended' ? 'This class has ended' : 'This room is not open yet'} description={session.status === 'ended' ? (replayHref ? 'The recording is in your library with chapters, transcript and practice.' : 'This class has ended. Its recording has not been published to the library yet.') : `Scheduled for ${formatDateTime(session.startsAt)}. Come back when the Glacier LIVE label appears.`} action={session.status === 'ended' ? (replayHref ? <Link to={replayHref} className="inline-flex min-h-11 items-center rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse">Watch recording</Link> : <span className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 font-mono text-2xs text-faint">Recording not published yet</span>) : <Link to="/student/live" className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading">Back to schedule</Link>} />
    </div>
  )
  return (
    <div>
      <PageHeader eyebrow="Live room" title={session.title} description={`${session.facultyName} · ${session.batchName}`} meta={<><Badge tone={broadcast ? 'info' : 'neutral'} variant="outline">{broadcast ? 'Broadcast' : 'Interactive'}</Badge><Link to="/student/live" className="inline-flex items-center gap-1.5 text-2xs text-muted hover:text-heading"><ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />Schedule</Link></>} />
      <div className={broadcast ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]' : 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]'}>
        <div className="min-w-0 space-y-4">
          <AttendanceStrip attendance={attendance.data ?? room.data?.attendance ?? null} policy={policy} />
          {attendance.isError ? <ErrorState title="Attendance could not start" description={attendance.error.message} action={<Button variant="secondary" onClick={() => attendance.refetch()}>Retry join</Button>} /> : null}
          <LiveStage session={session} leaving={leave.isPending} onLeave={() => { leave.mutate(undefined, { onSuccess: () => navigate('/student/live'), onError: (error) => toast.show({ title: 'Could not leave cleanly', description: error.message, tone: 'danger' }) }) }} />
          <p className="text-2xs leading-relaxed text-muted">Presence is automatic while this tab is visible. {broadcast ? 'Broadcast rooms keep microphone and camera off; use the question queue.' : 'Mic, camera and hand are local UI controls in this mock room.'}</p>
        </div>
        <LiveRail chat={room.data?.chat ?? []} queue={room.data?.queue ?? []} chatBusy={sendChat.isPending} askBusy={ask.isPending} upvotingId={upvote.isPending ? upvote.variables ?? null : null}
          onSendChat={(body) => sendChat.mutate(body, { onError: (error) => toast.show({ title: 'Message not sent', description: error.message, tone: 'danger' }) })}
          onAsk={(body) => ask.mutate(body, { onSuccess: () => toast.show({ title: 'Question added', description: 'Faculty approval will appear in the queue.', tone: 'success' }), onError: (error) => toast.show({ title: 'Question not added', description: error.message, tone: 'danger' }) })}
          onUpvote={(id) => upvote.mutate(id)} />
      </div>
      {challenge ? <AttentionToast challenge={challenge} busy={respond.isPending} onRespond={() => respond.mutate(challenge.id, { onError: (error) => toast.show({ title: 'Check already closed', description: error.message, tone: 'danger' }) })} /> : null}
    </div>
  )
}
const attendancePolicyFallback = { thresholdPercent: 75, graceMinutes: 10, attentionReward: 2, attentionPenalty: 4, checkMinMinutes: 8, checkMaxMinutes: 15, responseWindowSeconds: 15 }
