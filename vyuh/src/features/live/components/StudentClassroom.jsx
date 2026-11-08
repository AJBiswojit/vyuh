import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Hand, PlayCircle, Radio, Users } from 'lucide-react'
import { Badge, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { useLiveClassroom } from '@/features/learning/hooks/useLiveClassroom.js'
import { BroadcastPreview } from './BroadcastPreview.jsx'
import { ClassroomShell } from './ClassroomShell.jsx'
import { EngagementPanel } from './EngagementPanel.jsx'
import { SessionSummary } from './SessionSummary.jsx'
import { Whiteboard } from './Whiteboard.jsx'

const SELF_ID = 'current-student'

/**
 * The complete, independent light Student Classroom at
 * /student/live/:sessionId. It works with or without the Faculty Mirror,
 * requires the real Student identity through the shared service gate, and reads
 * the same shared classroom state as the Studio.
 *
 * The existing live-room stage, attendance strip, live rail, attention toast
 * and recording links remain in LiveRoomPage above this section; this pane adds
 * the synchronized broadcast stage, polls, resources, participants and hand.
 *
 * @param {{ sessionId: string, session: any, attendanceState: any, replayHref: string|null }} props
 */
export function StudentClassroom({ sessionId, session, attendanceState, replayHref }) {
  const classroom = useLiveClassroom(sessionId, attendanceState)
  const [activeTab, setActiveTab] = useState('chat')

  if (classroom.isPending) {
    return (
      <Skeleton.Region label="Loading Student Classroom">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Skeleton.Block className="h-72" />
          <Skeleton.Block className="h-72" />
        </div>
      </Skeleton.Region>
    )
  }
  if (classroom.isError) {
    return (
      <ErrorState
        size="panel"
        code="E_CLASSROOM"
        title="The shared classroom could not open"
        description={classroom.error?.message ?? 'The shared classroom state is unavailable.'}
        action={<button type="button" onClick={() => { classroom.retrySubscription?.(); classroom.refetch() }} className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading">Retry classroom</button>}
      />
    )
  }
  if (!classroom.compatible || !classroom.snapshot) {
    return (
      <EmptyState
        size="panel"
        title="Shared Studio classroom is unavailable"
        description={classroom.reason ?? 'Only the shared demo session supports classroom synchronization. The live-room tools above are unchanged.'}
      />
    )
  }

  const { snapshot, view, metadata, send, summary } = classroom
  const self = snapshot.participants.find((person) => person.id === SELF_ID)
  const joined = Boolean(self && self.state !== 'left')
  const prototypeNotice = view.prototypeNotice

  return (
    <ClassroomShell
      title={snapshot.setup.title}
      subtitle={`${metadata?.facultyName ?? session?.facultyName ?? 'Faculty'} · ${snapshot.setup.batchName} · ${snapshot.setup.subjectName}`}
      status={snapshot.status}
      badge={view.activeSceneLabel}
      notice={prototypeNotice}
    >
      <p role="status" aria-live="polite" className="flex items-center gap-2 text-2xs leading-relaxed text-muted">
        <Radio className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        Faculty scene: {view.activeSceneLabel}. Shared state revision {snapshot.revision}. This is a simulated broadcast, not a live stream.
      </p>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <BroadcastPreview
            scene={snapshot.activeScene}
            sceneLabel={view.activeSceneLabel}
            setup={snapshot.setup}
            slide={view.slide}
            slideIndex={snapshot.toolbox.slideIndex}
            slideCount={snapshot.slides.length}
            media={snapshot.media}
            metadata={metadata}
            participants={snapshot.participants}
          >
            <Whiteboard shapes={snapshot.whiteboard.shapes} tool={snapshot.whiteboard.tool} readOnly />
          </BroadcastPreview>

          <div className="overflow-hidden rounded-sm border border-line bg-surface-raised">
            <EngagementPanel
              snapshot={snapshot}
              view={view}
              send={send}
              role="student"
              activeTab={activeTab}
              onTabChange={setActiveTab}
              metadata={metadata}
              questions={view.visibleQuestions}
            />
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Classroom participation and session information">
          {/* R18: this is the ONE accessible participation-control group. A
              named region lets tests and assistive technology target it. */}
          <section aria-labelledby="student-participation-heading" className="rounded-sm border border-line bg-surface-raised p-3">
            <p className="rule-label">Your participation</p>
            <h3 id="student-participation-heading" className="mt-1 flex items-center gap-2 text-sm font-[560] tracking-tight text-heading"><Hand className="size-4" strokeWidth={1.5} aria-hidden="true" /> Shared classroom</h3>
            <p className="mt-1 text-2xs leading-relaxed text-muted">Join, raise your hand or leave the shared prototype classroom. Each action is a recorded mock event.</p>
            <div role="group" aria-label="Shared classroom participation controls" className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={joined} onClick={() => send('participant_joined', { participantId: SELF_ID, name: 'You' })} className="min-h-[var(--spacing-touch)] rounded-sm border border-heading bg-heading px-3 text-xs font-[560] text-on-inverse disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-faint">Join shared classroom</button>
              <button type="button" disabled={!joined} onClick={() => send('participant_left', { participantId: SELF_ID })} className="min-h-[var(--spacing-touch)] rounded-sm border border-line-strong px-3 text-xs font-[560] text-heading disabled:cursor-not-allowed disabled:text-faint">Leave shared classroom</button>
              <button type="button" disabled={!joined} onClick={() => send(self?.handRaised ? 'hand_lowered' : 'hand_raised', { participantId: SELF_ID })} className="min-h-[var(--spacing-touch)] rounded-sm border border-line-strong px-3 text-xs font-[560] text-heading disabled:cursor-not-allowed disabled:text-faint">{self?.handRaised ? 'Lower hand' : 'Raise hand'}</button>
            </div>
            <p className="mt-2 font-mono text-2xs tabular-nums text-muted">{joined ? (self.handRaised ? 'Joined · hand raised' : 'Joined · hand lowered') : 'Not joined to the shared classroom'}</p>
          </section>

          <section className="rounded-sm border border-line bg-surface-raised p-3">
            <p className="rule-label">Session state</p>
            <dl className="mt-2 flex flex-col gap-2 text-2xs">
              <div className="flex items-center justify-between gap-2"><dt className="text-muted">Broadcast scene</dt><dd className="font-[560] text-heading">{view.activeSceneLabel}</dd></div>
              <div className="flex items-center justify-between gap-2"><dt className="text-muted">Studio lifecycle</dt><dd className="font-[560] text-heading">{snapshot.status === 'live' ? 'Live (recorded)' : snapshot.status === 'ended' ? 'Ended (recorded)' : 'Scheduled (no Go Live)'}</dd></div>
              <div className="flex items-center justify-between gap-2"><dt className="text-muted">Catalogue state</dt><dd className="font-[560] text-heading">{snapshot.setup.catalogueStatus} (seeded)</dd></div>
              <div className="flex items-center justify-between gap-2"><dt className="text-muted">Whiteboard actions</dt><dd className="font-[560] text-heading">{snapshot.whiteboard.shapes.length} recorded</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="review" variant="soft"><Users className="size-3" aria-hidden="true" /> {snapshot.participants.length} labelled roster rows</Badge>
              <Badge tone="info" variant="soft"><BookOpen className="size-3" aria-hidden="true" /> {snapshot.resources.length} resources</Badge>
            </div>
          </section>

          <section className="rounded-sm border border-line bg-surface-raised p-3">
            <p className="rule-label">Recording and replay</p>
            <h3 className="mt-1 flex items-center gap-2 text-sm font-[560] tracking-tight text-heading"><PlayCircle className="size-4" strokeWidth={1.5} aria-hidden="true" /> Library links</h3>
            {replayHref ? (
              <Link to={replayHref} className="mt-3 inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-line-strong px-3 text-xs font-[560] text-heading hover:border-heading">Watch this session recording</Link>
            ) : (
              <p className="mt-2 text-2xs leading-relaxed text-muted">A recording for this session has not been published to the library yet.</p>
            )}
            <Link to="/student/recordings" className="mt-2 block text-2xs text-heading underline">Open the recording library</Link>
            <p className="mt-2 text-2xs leading-relaxed text-muted">Recordings are existing mock library items. The Studio recording control is a simulated preference only.</p>
          </section>
        </aside>
      </div>

      <SessionSummary summary={summary} snapshot={snapshot} metadata={metadata} />
    </ClassroomShell>
  )
}
