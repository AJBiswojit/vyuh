import { useState } from 'react'
import { Radio, RefreshCw } from 'lucide-react'
import { Badge, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { formatRelative } from '@/shared/lib/format.js'
import { useLiveStudio } from '@/features/faculty/hooks/useLiveStudio.js'
import { BroadcastDock } from './BroadcastDock.jsx'
import { BroadcastPreview } from './BroadcastPreview.jsx'
import { ClassroomMirror } from './ClassroomMirror.jsx'
import { EngagementPanel } from './EngagementPanel.jsx'
import { SceneManager } from './SceneManager.jsx'
import { SessionSetup } from './SessionSetup.jsx'
import { SessionSummary } from './SessionSummary.jsx'
import { TeachingToolbox } from './TeachingToolbox.jsx'
import { Whiteboard } from './Whiteboard.jsx'

/**
 * Faculty Live Studio — dark broadcast control surface at
 * /faculty/classes/:sessionId/host. Composes every M2–M8 capability from the
 * single shared classroom state. The EXISTING host console in FacultyHostPage
 * remains below this pane and keeps all of its own controls.
 *
 * @param {{ sessionId: string, hostConsole: any }} props
 */
export function StudioShell({ sessionId, hostConsole }) {
  const studio = useLiveStudio(sessionId, hostConsole?.counts ?? null)
  const [activeTab, setActiveTab] = useState('chat')
  const [mirrorOpen, setMirrorOpen] = useState(true)

  if (studio.isPending) {
    return (
      <Skeleton.Region label="Loading Faculty Live Studio">
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
        title="The Live Studio could not open"
        description={studio.error?.message ?? 'The shared classroom state is unavailable.'}
        action={<button type="button" onClick={() => { studio.retrySubscription?.(); studio.refetch() }} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-xs font-[560] text-heading">Retry studio</button>}
      />
    )
  }
  if (!studio.compatible || !studio.snapshot) {
    return (
      <EmptyState
        size="panel"
        title="Live Studio is not available for this session"
        description={studio.reason ?? 'Only the shared demo session supports Studio synchronization. The existing host console below is unchanged.'}
      />
    )
  }

  const { snapshot, view, metadata, send, summary } = studio
  const revision = snapshot.revision

  return (
    <section data-theme="dark" data-testid="faculty-live-studio" className="mb-6 flex flex-col gap-4 rounded-sm border border-hairline-on-ink bg-ink p-4 text-on-ink">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline-on-ink pb-3">
        <div>
          <p className="rule-label text-on-ink-label">Faculty Live Studio</p>
          <h2 className="mt-1 text-lg font-[560] tracking-tight text-on-ink">{snapshot.setup.title}</h2>
          <p className="mt-1 text-2xs leading-relaxed text-on-ink-muted">
            {snapshot.setup.subjectName} · {snapshot.setup.batchName} · {metadata?.facultyName ?? 'Faculty'} · revision {revision}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge tone="review" variant="soft">Prototype · simulated state</Badge>
          <Badge tone={snapshot.status === 'live' ? 'answer' : snapshot.status === 'ended' ? 'danger' : 'neutral'} variant="soft" shape="dot">
            {snapshot.status === 'live' ? 'Live' : snapshot.status === 'ended' ? 'Ended' : 'Scheduled'}
          </Badge>
        </div>
      </header>

      <p role="status" aria-live="polite" className="flex items-center gap-2 text-2xs text-on-ink-muted">
        <Radio className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Program monitor: {view.activeSceneLabel}. Shared state updated {formatRelative(snapshot.updatedAt)}. No live media is captured or transmitted.
      </p>

      <SessionSetup setup={snapshot.setup} status={snapshot.status} send={send} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <SceneManager scenes={view.scenes} activeScene={snapshot.activeScene} send={send} />
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
          <TeachingToolbox tools={view.tools} snapshot={snapshot} send={send} onSelectTool={setActiveTab} />
          <BroadcastDock snapshot={snapshot} send={send} onReset={studio.resetStudio} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="min-h-[24rem] overflow-hidden rounded-sm border border-hairline-on-ink bg-ink-raised">
            <EngagementPanel
              snapshot={snapshot}
              view={view}
              send={send}
              role="faculty"
              activeTab={activeTab}
              onTabChange={setActiveTab}
              metadata={metadata}
            />
          </div>
          <div className="rounded-sm border border-hairline-on-ink bg-ink-raised p-3">
            <p className="rule-label text-on-ink-label">Room log (recorded mock events)</p>
            {view.roomLog.length === 0 ? (
              <p className="mt-2 text-2xs leading-relaxed text-on-ink-muted">No recorded events yet. Use any control above to create one.</p>
            ) : (
              <ul role="log" aria-label="Studio room log" className="mt-2 flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                {view.roomLog.map((entry) => (
                  <li key={entry.id} className="flex gap-2 border-b border-hairline-on-ink pb-1.5 text-2xs leading-relaxed">
                    <span className="shrink-0 font-mono tabular-nums text-on-ink-label">{formatRelative(entry.at)}</span>
                    <span className="text-on-ink">{entry.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ClassroomMirror
        snapshot={snapshot}
        view={view}
        metadata={metadata}
        send={send}
        open={mirrorOpen}
        onToggle={() => setMirrorOpen((previous) => !previous)}
      />

      <SessionSummary summary={summary} snapshot={snapshot} metadata={metadata} />

      <p className="flex items-center gap-2 text-2xs leading-relaxed text-on-ink-muted">
        <RefreshCw className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        One shared mock classroom state per session, synchronized in this tab and across same-identity tabs. The existing host console below is unchanged.
      </p>
    </section>
  )
}
