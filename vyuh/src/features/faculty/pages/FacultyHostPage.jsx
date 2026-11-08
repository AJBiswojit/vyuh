import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, BellRing, StopCircle } from 'lucide-react'
import { PageHeader } from '@/app/layouts/WorkspaceLayout.jsx'
import { Badge, Button, Card, ErrorState, Skeleton, useToast } from '@/shared/ui'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { cn } from '@/shared/lib/cn.js'
import { formatDateTime, formatRelative } from '@/shared/lib/format.js'
import {
  useApproveQuestion,
  useEndSession,
  useHideChatMessage,
  useHostConsole,
  useMuteParticipant,
  useStartSession,
  useTriggerAttention,
} from '../hooks/useFacultyLive.js'
import { ConfirmAction } from '../components/ConfirmAction.jsx'
import { ChatModeration, ParticipantList, QuestionQueue } from '../components/HostPanels.jsx'
import { StudioShell } from '@/features/live/components/StudioShell.jsx'

/**
 * The host console. One room, three jobs: who is here, what they are saying, and
 * what is waiting to be put on screen. Ending the session is the only irreversible
 * control, so it is the only one that asks first.
 */
export function FacultyHostPage() {
  const { sessionId = '' } = useParams()
  useDocumentTitle('Host console')
  const toast = useToast()
  const host = useHostConsole(sessionId)
  const start = useStartSession(sessionId)
  const end = useEndSession(sessionId)
  const attention = useTriggerAttention(sessionId)
  const mute = useMuteParticipant(sessionId)
  const hide = useHideChatMessage(sessionId)
  const approve = useApproveQuestion(sessionId)

  if (host.isPending) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Opening the room</span>
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
        title="That room could not be opened"
        description={/** @type {Error} */ (host.error)?.message ?? 'The session may have been cancelled. The class list has everything still scheduled.'}
        action={<Button variant="secondary" onClick={() => host.refetch()} loading={host.isFetching}>Try again</Button>}
      />
    )
  }

  const console_ = /** @type {import('@/contracts/faculty.js').HostConsole} */ (host.data)
  const session = console_.session
  const busy = mute.isPending || hide.isPending || approve.isPending
  const check = console_.attentionCheck

  return (
    <>
      <PageHeader
        eyebrow={`Faculty workspace · ${session.batchName}`}
        title={console_.session.title}
        description={`${session.subjectName} · ${session.mode === 'interactive' ? 'interactive' : 'broadcast'} · scheduled ${formatDateTime(session.startsAt)} for ${session.durationMinutes} minutes.`}
        meta={
          <>
            {console_.live ? (
              <Badge tone="info" variant="solid" shape="dot">Live</Badge>
            ) : (
              <Badge tone="info" variant="outline" shape="circle">Not started</Badge>
            )}
            <span className="font-mono text-2xs tabular-nums text-muted">
              {console_.counts.present} present · {console_.counts.handRaised} hands · {console_.counts.muted} muted
            </span>
            <span className="font-mono text-2xs tabular-nums text-muted">updated {formatRelative(console_.updatedAt)}</span>
            <span className="sr-only" aria-live="polite">
              {console_.counts.present} present, {console_.counts.idle} idle, {check ? `${check.responded} of ${check.issued} answered the attention check` : 'no attention check running'}.
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
            <Button
              variant="primary"
              icon={console_.live ? <BellRing strokeWidth={1.5} /> : undefined}
              loading={attention.isPending || start.isPending}
              onClick={() => {
                if (console_.live) {
                  attention.mutate(undefined, {
                    onSuccess: (next) =>
                      toast.success('Attention check sent', next.attentionCheck ? `${next.attentionCheck.issued} checks issued; the room has 15 seconds.` : 'Sent to the room.'),
                    onError: (/** @type {Error} */ error) => toast.error('Not sent', error.message),
                  })
                  return
                }
                start.mutate(undefined, {
                  onSuccess: () => toast.success('Session started', 'Presence tracking is on.'),
                  onError: (/** @type {Error} */ error) => toast.error('Not started', error.message),
                })
              }}
            >
              {console_.live ? 'Attention check' : 'Start session'}
            </Button>
            {console_.live ? (
              <ConfirmAction
                title="End this session?"
                description="The room closes for every participant and the recording is queued for editing. Attendance for this session is final once it ends."
                detail={`${console_.counts.present} present · started ${console_.startedAt ? formatDateTime(console_.startedAt) : 'just now'}`}
                confirmLabel="End session"
                busy={end.isPending}
                onConfirm={() =>
                  end.mutate(undefined, {
                    onSuccess: () => toast.show({ title: 'Session ended', description: 'Attendance is final. The recording is in the library.', tone: 'neutral' }),
                    onError: (/** @type {Error} */ error) => toast.error('Not ended', error.message),
                  })
                }
              >
                {(open) => (
                  <Button variant="danger" icon={<StopCircle strokeWidth={1.5} />} onClick={open}>
                    End
                  </Button>
                )}
              </ConfirmAction>
            ) : null}
          </>
        }
      />

      {/* VYUH LIVE STUDIO — dark broadcast surface. The host console below is
          unchanged: start/end, attention checks, mute, chat moderation and
          question approval all keep their existing service paths. */}
      <StudioShell sessionId={sessionId} hostConsole={console_} />

      <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4 lg:grid-cols-7">
        <Count label="Present" value={console_.counts.present} tone="answer" />
        <Count label="Idle" value={console_.counts.idle} />
        <Count label="Left" value={console_.counts.left} />
        <Count label="Muted" value={console_.counts.muted} />
        <Count label="Hands raised" value={console_.counts.handRaised} tone="review" />
        <Count label="Check on time" value={console_.counts.attentionOnTime} />
        <Count label="Check missed" value={console_.counts.attentionMissed} tone={console_.counts.attentionMissed > 0 ? 'danger' : undefined} />
      </dl>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <ParticipantList
            participants={console_.participants}
            busy={mute.isPending}
            onToggleMute={(studentId, muted) =>
              mute.mutate(
                { studentId, muted },
                {
                  onSuccess: () => toast.show({ title: muted ? 'Participant muted' : 'Participant unmuted', tone: 'neutral' }),
                  onError: (/** @type {Error} */ error) => toast.error('Not changed', error.message),
                },
              )
            }
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ChatModeration
              chat={console_.chat}
              hiddenIds={console_.hiddenChatIds}
              busy={hide.isPending}
              onHide={(messageId) =>
                hide.mutate(messageId, {
                  onSuccess: () => toast.show({ title: 'Message hidden', description: 'It is gone from the room and kept in the log.', tone: 'neutral' }),
                  onError: (/** @type {Error} */ error) => toast.error('Not hidden', error.message),
                })
              }
            />
            <QuestionQueue
              queue={console_.queue}
              busy={approve.isPending}
              onApprove={(questionId) =>
                approve.mutate(questionId, {
                  onSuccess: () => toast.success('Question on screen', 'The room can see it now.'),
                  onError: (/** @type {Error} */ error) => toast.error('Not approved', error.message),
                })
              }
            />
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card eyebrow="Attention" title={check ? 'Check running' : 'No check running'}>
            {check ? (
              <div className="flex flex-col gap-3">
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="rule-label">Issued</dt>
                    <dd className="mt-1 font-mono text-sm tabular-nums text-heading">{check.issued}</dd>
                  </div>
                  <div>
                    <dt className="rule-label">Responded</dt>
                    <dd className="mt-1 font-mono text-sm tabular-nums text-answer-fg">{check.responded}</dd>
                  </div>
                </dl>
                <p className="text-2xs text-muted">
                  Closes {formatRelative(check.expiresAt)}. A missed check is logged against the participant&apos;s attention average, not their attendance.
                </p>
                <Link
                  to="/faculty/attendance"
                  className="inline-flex min-h-9 items-center gap-1 text-2xs font-[560] text-heading hover:text-ember-press"
                >
                  Open the register
                  <ArrowUpRight className="size-3" strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-2xs leading-relaxed text-muted">
                Send a check while the room is live. Attendance still counts a student as present; the check measures attention inside the session.
              </p>
            )}
          </Card>

          <Card eyebrow="Room log" title="What happened" action={<span className="font-mono text-2xs tabular-nums text-faint">{console_.feed.length}</span>}>
            {console_.feed.length === 0 ? (
              <p className="text-2xs text-muted">Nothing logged yet. Presence, chat, queue actions and checks appear here.</p>
            ) : (
              <ol className="flex max-h-[22rem] flex-col gap-2 overflow-y-auto" aria-live="polite">
                {console_.feed.map((event) => (
                  <li key={event.id} className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                        event.type === 'attention' ? 'bg-review' : event.type === 'host' ? 'bg-heading' : event.type === 'chat' ? 'bg-info' : 'bg-answer',
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-2xs leading-snug text-body">{event.label}</span>
                      {event.detail ? <span className="mt-0.5 block text-2xs text-faint">{event.detail}</span> : null}
                      <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">{formatRelative(event.at)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card eyebrow="Session" title="Facts">
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="rule-label">Started</dt>
                <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{console_.startedAt ? formatDateTime(console_.startedAt) : 'Not yet'}</dd>
              </div>
              <div>
                <dt className="rule-label">Ended</dt>
                <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{console_.endedAt ? formatDateTime(console_.endedAt) : '—'}</dd>
              </div>
              <div>
                <dt className="rule-label">Threshold</dt>
                <dd className="mt-1 font-mono text-2xs tabular-nums text-heading">{session.attendanceThresholdPercent}%</dd>
              </div>
              <div>
                <dt className="rule-label">Resources</dt>
                <dd className="mt-1 text-2xs text-heading">{session.resourcesAttached ? 'Attached' : 'None'}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  )
}

/** @param {{ label: string, value: number, tone?: 'answer'|'danger'|'review' }} props */
function Count({ label, value, tone }) {
  return (
    <div className="bg-surface-raised px-3 py-2">
      <dt className="rule-label">{label}</dt>
      <dd
        className={cn(
          'mt-1 font-mono text-lg tabular-nums leading-none',
          tone === 'answer' ? 'text-answer-fg' : tone === 'danger' && value > 0 ? 'text-danger-fg' : tone === 'review' && value > 0 ? 'text-review-fg' : 'text-heading',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
