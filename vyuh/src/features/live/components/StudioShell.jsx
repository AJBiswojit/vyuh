import { useEffect, useState } from 'react'
import { Hand, MessageCircleQuestion, MessageSquare, SlidersHorizontal, Users } from 'lucide-react'
import { Button, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { formatRelative } from '@/shared/lib/format.js'
import { selectFacultyView } from '@/features/faculty/hooks/useLiveStudio.js'
import { ParticipantList } from '@/features/faculty/components/HostPanels.jsx'
import { AdvancedOptionsDialog } from './AdvancedOptionsDialog.jsx'
import { BroadcastPreview } from './BroadcastPreview.jsx'
import { ClassroomMirror } from './ClassroomMirror.jsx'
import { DeviceBar } from './DeviceBar.jsx'
import { QuickTeachActions } from './QuickTeachActions.jsx'
import { SessionSummary } from './SessionSummary.jsx'
import { TeachingToolsPanel } from './TeachingToolsPanel.jsx'
import { Whiteboard } from './Whiteboard.jsx'

/**
 * Faculty Live Studio — reorganized around "technology without complexity".
 *
 * Level 1 (visible): the teaching stage, the microphone/camera/screen/recording
 * status chips, four plain-language quick actions and a classroom-engagement
 * strip. Start/End class live in the page header.
 * Level 2 (Teaching tools): slides, stage view, Q&A, chat, polls, students,
 * resources — one click away, in plain language.
 * Level 3 (More options): attendance, attention checks, moderation, class
 * setup, recording/reset, logs and facts — nothing removed, simply out of the
 * way until it is needed.
 *
 * @param {Object} props
 * @param {ReturnType<typeof import('@/features/faculty/hooks/useLiveStudio.js').useLiveStudio>} props.studio
 *   The shared classroom hook result, owned by the page so the header pill and
 *   the stage can never disagree.
 * @param {import('@/contracts/faculty.js').HostConsole} props.hostConsole
 * @param {(studentId:string, muted:boolean)=>void} props.onToggleMute
 * @param {boolean} props.mutePending
 * @param {() => void} props.onTriggerAttention
 * @param {boolean} props.attentionPending
 * @param {(messageId:string)=>void} props.onHideChat
 * @param {boolean} props.hidePending
 * @param {(questionId:string)=>void} props.onApproveQuestion
 * @param {boolean} props.approvePending
 */
export function StudioShell({
  studio,
  hostConsole,
  onToggleMute,
  mutePending,
  onTriggerAttention,
  attentionPending,
  onHideChat,
  hidePending,
  onApproveQuestion,
  approvePending,
}) {
  const [activeTab, setActiveTab] = useState('slides')
  const [mirrorOpen, setMirrorOpen] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const studioStatus = studio.snapshot?.status ?? null
  useEffect(() => {
    if (studioStatus !== 'live') return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [studioStatus])

  if (studio.isPending) {
    return (
      <Skeleton.Region label="Loading your live class">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Skeleton.Block className="h-80" />
          <Skeleton.Block className="h-80" />
        </div>
      </Skeleton.Region>
    )
  }
  if (studio.isError) {
    return (
      <ErrorState
        size="panel"
        code="E_STUDIO"
        title="The live class could not open"
        description={studio.error?.message ?? 'The shared classroom state is unavailable. Your class register is unaffected.'}
        action={<button type="button" onClick={() => { studio.retrySubscription?.(); studio.refetch() }} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading">Try again</button>}
      />
    )
  }
  if (!studio.compatible || !studio.snapshot) {
    return (
      <section data-theme="dark" className="mb-6 flex flex-col gap-4 rounded-sm border border-hairline-on-ink bg-ink p-4 text-on-ink">
        <EmptyState
          size="panel"
          title="Live Studio is not available for this session"
          description={`${studio.reason ?? 'Only the shared demo session supports the classroom.'} Attendance, moderation and the class register still work — open More options.`}
        />
        {/* The attendance-linked roster works for every session, so it stays reachable. */}
        <ParticipantList participants={hostConsole.participants} onToggleMute={onToggleMute} busy={mutePending} />
        <MoreOptionsButton onClick={() => setMoreOpen(true)} />
        <AdvancedOptionsDialog
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          host={hostConsole}
          onTriggerAttention={onTriggerAttention}
          attentionPending={attentionPending}
          onHideChat={onHideChat}
          hidePending={hidePending}
          onApproveQuestion={onApproveQuestion}
          approvePending={approvePending}
          snapshot={null}
          view={null}
        />
      </section>
    )
  }

  const { snapshot, metadata, send, summary } = studio
  const view = selectFacultyView(snapshot, metadata)
  const waitingQuestions = view.pendingQuestions.length
  const chatLines = view.visibleChat.length
  const handsRaised = snapshot.participants.filter((person) => person.handRaised && person.state !== 'left').length
  const presentLegacy = hostConsole?.counts.present ?? 0
  const liveElapsed = snapshot.status === 'live' && snapshot.startedAt
    ? Math.max(0, Math.floor((now - Date.parse(snapshot.startedAt)) / 1000))
    : null

  /** @param {string} tab */
  const jumpToTab = (tab) => {
    setActiveTab(tab)
    if (typeof document !== 'undefined') {
      document.getElementById('teaching-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section data-theme="dark" data-testid="faculty-live-studio" className="mb-6 flex flex-col gap-4 rounded-sm border border-hairline-on-ink bg-ink p-4 text-on-ink">
      {/* ── Level 1 · everyday teaching ─────────────────────────────────── */}
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
        <Whiteboard shapes={snapshot.whiteboard.shapes} tool={snapshot.whiteboard.tool} onEvent={(type, payload) => send(type, payload)} />
      </BroadcastPreview>
      <DeviceBar media={snapshot.media} send={send} />

      <QuickTeachActions
        activeScene={snapshot.activeScene}
        waitingQuestions={waitingQuestions}
        presentCount={hostConsole?.counts.present ?? snapshot.participants.filter((person) => person.state !== 'left').length}
        send={send}
        onJumpToTab={jumpToTab}
      />

      {/* Classroom engagement — one glance, plain words; every chip opens the detail */}
      <div role="group" aria-label="Classroom engagement" className="flex flex-wrap items-center gap-2 border-t border-hairline-on-ink pt-3">
        <span className="rule-label text-on-ink-label">Classroom engagement</span>
        <EngagementChip onClick={() => jumpToTab('students')} icon={<Users className="size-4" strokeWidth={1.5} aria-hidden="true" />}>
          {presentLegacy} present
        </EngagementChip>
        <EngagementChip onClick={() => jumpToTab('students')} icon={<Hand className="size-4" strokeWidth={1.5} aria-hidden="true" />}>
          {handsRaised} hand{handsRaised === 1 ? '' : 's'} raised
        </EngagementChip>
        <EngagementChip onClick={() => jumpToTab('questions')} icon={<MessageCircleQuestion className="size-4" strokeWidth={1.5} aria-hidden="true" />} highlight={waitingQuestions > 0}>
          {waitingQuestions} question{waitingQuestions === 1 ? '' : 's'} waiting
        </EngagementChip>
        <EngagementChip onClick={() => jumpToTab('chat')} icon={<MessageSquare className="size-4" strokeWidth={1.5} aria-hidden="true" />}>
          {chatLines} chat message{chatLines === 1 ? '' : 's'}
        </EngagementChip>
        {liveElapsed !== null ? (
          <span className="ml-auto font-mono text-2xs tabular-nums text-on-ink-muted" role="status">
            Live for {Math.floor(liveElapsed / 60)}:{String(liveElapsed % 60).padStart(2, '0')}
          </span>
        ) : null}
      </div>

      {/* ── Level 2 · teaching tools ────────────────────────────────────── */}
      <div id="teaching-tools" className="scroll-mt-4">
        <TeachingToolsPanel
          snapshot={snapshot}
          view={view}
          send={send}
          metadata={metadata}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          participants={hostConsole.participants}
          muteBusy={mutePending}
          onToggleMute={onToggleMute}
        />
      </div>

      {/* Clearly labelled doorway to the advanced tools and records */}
      <MoreOptionsButton onClick={() => setMoreOpen(true)} />

      <ClassroomMirror
        snapshot={snapshot}
        view={view}
        metadata={metadata}
        send={send}
        open={mirrorOpen}
        onToggle={() => setMirrorOpen((previous) => !previous)}
      />

      <SessionSummary summary={summary} snapshot={snapshot} metadata={metadata} />

      <p className="text-2xs leading-relaxed text-on-ink-muted">
        Demo classroom — no real microphone, camera, screen or recording is used, and nothing is transmitted. Updated {formatRelative(snapshot.updatedAt)}.
      </p>

      <AdvancedOptionsDialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        host={hostConsole}
        onTriggerAttention={onTriggerAttention}
        attentionPending={attentionPending}
        onHideChat={onHideChat}
        hidePending={hidePending}
        onApproveQuestion={onApproveQuestion}
        approvePending={approvePending}
        snapshot={snapshot}
        view={view}
        send={send}
        onResetStudio={studio.resetStudio}
      />
    </section>
  )
}

/** @param {{ onClick: () => void }} props */
function MoreOptionsButton({ onClick }) {
  return (
    <Button variant="secondary" icon={<SlidersHorizontal />} onClick={onClick} className="justify-center" full>
      More options — attendance, attention checks, moderation and records
    </Button>
  )
}

/** @param {{ icon: React.ReactNode, children: React.ReactNode, onClick: () => void, highlight?: boolean }} props */
function EngagementChip({ icon, children, onClick, highlight = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        (highlight
          ? 'border-ember bg-ember-wash text-ember-press '
          : 'border-hairline-on-ink bg-ink-raised text-on-ink hover:border-on-ink-muted ')
        + 'flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border px-3 text-2xs font-[560] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember'
      }
    >
      {icon}
      {children}
    </button>
  )
}
