import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Play, StopCircle } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import {
  useEndSession,
  useHideChatMessage,
  useHostConsole,
  useMuteParticipant,
  useStartSession,
  useTriggerAttention,
  useApproveQuestion,
} from '../hooks/useFacultyLive.js'
import { useLiveStudio } from '@/features/faculty/hooks/useLiveStudio.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'
import { StudioShell } from '@/features/live/components/StudioShell.jsx'

/**
 * The faculty live-class page, rebuilt around one plain promise: a teacher who
 * has never used online teaching tools can open the class and teach, without a
 * broadcasting control panel in the way.
 *
 *   Level 1 (this header + the stage below) — open the class, press Start
 *   class, share the presentation or the whiteboard, see students' questions,
 *   end the class.
 *   Level 2 (Teaching tools, in the stage) — slides, stage view, Q&A, chat,
 *   polls, students, resources.
 *   Level 3 (More options, in the stage) — attendance, attention checks,
 *   moderation, class setup, recording/reset, logs and facts.
 *
 * One button starts the class; one button ends it. Both drive the attendance
 * record and the shared classroom together, so the status can never disagree
 * with itself.
 */
export function FacultyHostPage() {
  const { sessionId = '' } = useParams()
  useDocumentTitle('Live class')
  const toast = useToast()
  const host = useHostConsole(sessionId)
  const start = useStartSession(sessionId)
  const end = useEndSession(sessionId)
  const attention = useTriggerAttention(sessionId)
  const mute = useMuteParticipant(sessionId)
  const hide = useHideChatMessage(sessionId)
  const approve = useApproveQuestion(sessionId)

  // One shared classroom subscription for the whole page; the stage, the
  // header status and the summary all read from it.
  const hostCounts = /** @type {import('@/contracts/faculty.js').HostConsole|undefined} */ (host.data)?.counts ?? null
  const studio = useLiveStudio(sessionId, hostCounts)

  if (host.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Opening the class</span>
        <Skeleton.Line className="w-40" />
        <Skeleton.Block className="h-9 w-[min(28rem,80%)]" />
        <Skeleton.Block className="h-72 rounded-sm" />
      </div>
    )
  }

  if (host.isError) {
    return (
      <ErrorState
        code="E_HOST"
        title="That class could not be opened"
        description={/** @type {Error} */ (host.error)?.message ?? 'The session may have been cancelled. The class list has everything still scheduled.'}
        action={<Button variant="secondary" onClick={() => host.refetch()} loading={host.isFetching}>Try again</Button>}
      />
    )
  }

  const console_ = /** @type {import('@/contracts/faculty.js').HostConsole} */ (host.data)
  const session = console_.session
  const check = console_.attentionCheck
  const studioSnapshot = studio.snapshot
  const studioCompatible = studio.compatible === true && Boolean(studioSnapshot)
  const legacyStatus = console_.endedAt ? 'ended' : console_.startedAt ? 'live' : 'scheduled'
  const classStatus = studioCompatible && studioSnapshot ? studioSnapshot.status : legacyStatus
  const live = classStatus === 'live'
  const ended = classStatus === 'ended'
  const startedAt = studioCompatible && studioSnapshot?.startedAt ? studioSnapshot.startedAt : console_.startedAt

  const readiness = ended
    ? 'Class ended — attendance is final. The recording is in the library.'
    : live
      ? `Live now${startedAt ? ` · started ${formatRelative(startedAt)}` : ''} — students are in the room.`
      : 'Ready when you are. Everything is loaded — press Start class.'

  const dispatchStudioStart = () => {
    if (studioCompatible && studioSnapshot && studioSnapshot.status === 'scheduled') {
      studio.send('session_started', {})
    }
  }
  const dispatchStudioEnd = () => {
    if (studioCompatible && studioSnapshot && studioSnapshot.status === 'live') {
      studio.send('session_ended', {})
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`Faculty · ${session.batchName}`}
        title={session.title}
        description={`${session.subjectName} · ${session.mode === 'interactive' ? 'interactive' : 'broadcast'} · scheduled ${formatDateTime(session.startsAt)} for ${session.durationMinutes} minutes.`}
        meta={
          <>
            <ClassStatusBadge status={classStatus} />
            <span className="text-2xs text-muted" role="status">{readiness}</span>
            <span className="sr-only" aria-live="polite">
              {classStatus === 'live' ? 'The class is live.' : classStatus === 'ended' ? 'The class has ended.' : 'The class has not started.'} {console_.counts.present} present, {console_.counts.handRaised} hands raised.
              {check ? ` ${check.responded} of ${check.issued} answered the attention check.` : ''}
            </span>
          </>
        }
        actions={
          <>
            <Link
              to="/faculty/classes"
              className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line px-3 text-xs font-[560] text-heading hover:border-line-strong"
            >
              All classes
              <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            {ended ? (
              <Badge tone="idle" variant="outline" shape="none">Class ended</Badge>
            ) : live ? (
              <ConfirmAction
                title="End this class?"
                description="The room closes for every student and the recording is queued for editing. Attendance for this class is final once it ends."
                detail={`${console_.counts.present} present · started ${console_.startedAt ? formatDateTime(console_.startedAt) : 'just now'}`}
                confirmLabel="End class"
                cancelLabel="Keep teaching"
                busy={end.isPending}
                onConfirm={() => {
                  dispatchStudioEnd()
                  end.mutate(undefined, {
                    onSuccess: () => toast.show({ title: 'Class ended', description: 'Attendance is final. The recording is in the library.', tone: 'neutral' }),
                    onError: (/** @type {Error} */ error) => toast.error('Class not ended', error.message),
                  })
                }}
              >
                {(open) => (
                  <Button variant="danger" icon={<StopCircle strokeWidth={1.5} />} onClick={open}>
                    End class
                  </Button>
                )}
              </ConfirmAction>
            ) : (
              <Button
                variant="primary"
                icon={<Play strokeWidth={1.5} />}
                loading={start.isPending}
                onClick={() => {
                  dispatchStudioStart()
                  start.mutate(undefined, {
                    onSuccess: () => toast.success('Class started', 'The room is open. Students can join now.'),
                    onError: (/** @type {Error} */ error) => toast.error('Class not started', error.message),
                  })
                }}
              >
                Start class
              </Button>
            )}
          </>
        }
      />

      {/* Level 1 · the stage and the everyday actions, Level 2 · Teaching tools,
          Level 3 · More options. One shared classroom state drives the stage,
          the student view and the demo mirror; attendance and moderation keep
          their existing service paths. */}
      <StudioShell
        studio={studio}
        hostConsole={console_}
        onToggleMute={(studentId, muted) =>
          mute.mutate(
            { studentId, muted },
            {
              onSuccess: () => toast.show({ title: muted ? 'Student muted' : 'Student unmuted', tone: 'neutral' }),
              onError: (/** @type {Error} */ error) => toast.error('Not changed', error.message),
            },
          )
        }
        mutePending={mute.isPending}
        onTriggerAttention={() =>
          attention.mutate(undefined, {
            onSuccess: (next) =>
              toast.success('Attention check sent', next.attentionCheck ? `${next.attentionCheck.issued} checks issued; the room has 15 seconds.` : 'Sent to the room.'),
            onError: (/** @type {Error} */ error) => toast.error('Not sent', error.message),
          })
        }
        attentionPending={attention.isPending}
        onHideChat={(messageId) =>
          hide.mutate(messageId, {
            onSuccess: () => toast.show({ title: 'Message hidden', description: 'It is gone from the room and kept in the class report.', tone: 'neutral' }),
            onError: (/** @type {Error} */ error) => toast.error('Not hidden', error.message),
          })
        }
        hidePending={hide.isPending}
        onApproveQuestion={(questionId) =>
          approve.mutate(questionId, {
            onSuccess: () => toast.success('Question on screen', 'The room can see it now.'),
            onError: (/** @type {Error} */ error) => toast.error('Not approved', error.message),
          })
        }
        approvePending={approve.isPending}
      />
    </>
  )
}

/** @param {{ status: 'scheduled'|'live'|'ended'|string }} props */
function ClassStatusBadge({ status }) {
  if (status === 'live') {
    return <Badge tone="answer" variant="solid" shape="dot">Live now</Badge>
  }
  if (status === 'ended') {
    return <Badge tone="danger" variant="soft" shape="dot">Class ended</Badge>
  }
  return <Badge tone="info" variant="outline" shape="circle">Not started</Badge>
}
