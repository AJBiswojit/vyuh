import { useState } from 'react'
import { ArrowLeft, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Dialog, Skeleton, ErrorState } from '@/shared/ui'
import { ClassroomStage } from './ClassroomStage.jsx'
import { ClassroomInteractionPanel } from './ClassroomInteractionPanel.jsx'
import { CompactAttendance } from './CompactAttendance.jsx'
import { PollsPanel, ResourcesPanel } from './EngagementPanels.jsx'

const SELF_ID = 'current-student'

/**
 * The student live classroom at /student/live/:sessionId.
 *
 * One job: let a student watch the class, join the conversation and leave —
 * without managing anything. Three areas only:
 *   1. A compact header — title, faculty, subject and batch, live status,
 *      Leave class.
 *   2. The teaching stage — faculty-synced scene (or the sample clip when the
 *      shared classroom is unavailable) with fullscreen and bottom controls
 *      (simulated microphone / camera / hand raise, fullscreen, leave).
 *   3. The conversation panel — Chat and Questions tabs, with polls and
 *      resources one tap away in side panels.
 *
 * @param {{ session: any, attendanceState: any, classroom: any, onLeave: () => void, leaving: boolean, broadcast: boolean }} props
 */
export function StudentClassroom({ session, attendanceState, classroom, onLeave, leaving, broadcast }) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  const incompatible = classroom.compatible === false || !classroom.snapshot
  const { snapshot, view, send } = classroom
  const self = snapshot?.participants.find((person) => person.id === SELF_ID) ?? null
  const joined = Boolean(self && self.state !== 'left')
  const handState = !snapshot ? null : self?.handRaised ? 'raised' : 'lowered'

  /**
   * Sends a participation event. Joining is implicit in participating: a
   * student never has to press "Join" before they can speak — the first
   * action records one join event, then does its own.
   * @param {string} type @param {Object} [payload]
   */
  function participate(type, payload = {}) {
    if (type !== 'participant_joined' && type !== 'participant_left' && !joined) {
      send('participant_joined', { participantId: SELF_ID, name: 'You' })
    }
    send(type, payload)
  }

  function toggleHand() {
    if (!snapshot) return
    participate(self?.handRaised ? 'hand_lowered' : 'hand_raised', { participantId: SELF_ID })
  }

  function confirmLeave() {
    if (joined) send('participant_left', { participantId: SELF_ID })
    setLeaveDialogOpen(false)
    onLeave()
  }

  if (classroom.isPending) {
    return (
      <Skeleton.Region label="Loading live class">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton.Block className="aspect-video" />
          <Skeleton.Block className="h-96" />
        </div>
      </Skeleton.Region>
    )
  }

  if (classroom.isError) {
    return (
      <ErrorState
        size="panel"
        code="E_CLASSROOM"
        title="The classroom could not open"
        description={classroom.error?.message ?? 'The shared classroom state is unavailable.'}
        action={<button type="button" onClick={() => { classroom.retrySubscription?.(); classroom.refetch() }} className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading">Retry classroom</button>}
      />
    )
  }

  const broadcastStage = broadcast || session?.mode === 'broadcast'

  return (
    <div data-testid="student-classroom" className="flex min-w-0 flex-col gap-3">
      {/* ── 1. Compact classroom header ─────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
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
          <Badge tone="answer" variant="soft">
            <span className="live-dot mr-1 inline-block size-1.5 rounded-full bg-answer align-middle" aria-hidden="true" />
            Live now
          </Badge>
          <Button variant="danger" size="sm" icon={<LogOut strokeWidth={1.5} />} onClick={() => setLeaveDialogOpen(true)}>Leave class</Button>
        </div>
      </header>

      {/* ── Compact automatic attendance ────────────────────────── */}
      <CompactAttendance attendance={attendanceState} />

      {/* ── 2 + 3. Teaching stage and conversation panel ─────────── */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ClassroomStage
          classTitle={session.title}
          broadcast={Boolean(broadcastStage)}
          studioAvailable={!incompatible}
          snapshot={snapshot}
          view={view}
          metadata={classroom.metadata}
          session={session}
          handState={incompatible ? null : handState}
          onToggleHand={toggleHand}
          onLeave={() => setLeaveDialogOpen(true)}
          leaving={leaving}
        />
        <ClassroomInteractionPanel
          snapshot={snapshot}
          view={view}
          studioAvailable={!incompatible}
          participate={participate}
          pollsPanel={snapshot ? <PollsPanel snapshot={snapshot} send={participate} role="student" metadata={classroom.metadata} /> : null}
          resourcesPanel={snapshot ? <ResourcesPanel snapshot={snapshot} view={view} send={participate} role="student" /> : null}
        />
      </div>

      {/* Honest provenance, one quiet line — no dashboard furniture. */}
      <p className="text-2xs leading-relaxed text-muted">{view?.prototypeNotice ?? 'Prototype session data — simulated events and labelled demo seeds.'}</p>

      {/* Back to the schedule stays available, but leave is the primary exit. */}
      <Link to="/student/live" className="inline-flex w-fit items-center gap-1.5 text-2xs text-muted hover:text-heading">
        <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Back to class schedule
      </Link>

      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        title="Leave this class?"
        description="Attendance already marked stays recorded. You can rejoin while the class is live."
        confirmLabel="Leave class"
        cancelLabel="Keep watching"
        tone="danger"
        busy={leaving}
        onConfirm={confirmLeave}
      >
        <p className="text-xs leading-relaxed text-body">Your microphone, camera and hand controls are simulated in this demo. Leaving records a stop event for this class and returns you to the schedule.</p>
      </Dialog>
    </div>
  )
}
