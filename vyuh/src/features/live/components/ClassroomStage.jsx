import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, LogOut, Maximize2, Minimize2, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { Badge, IconButton, Tooltip, useToast } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { lockScroll } from '@/shared/lib/focusTrap.js'
import { BroadcastPreview } from './BroadcastPreview.jsx'
import { Whiteboard } from './Whiteboard.jsx'

/**
 * The student teaching stage: the faculty-synced shared stage (or the local
 * sample clip when the shared classroom is unavailable), a fullscreen control
 * and the familiar bottom control bar — microphone, camera, raise hand,
 * fullscreen, leave.
 *
 * Media controls are explicitly SIMULATED: they only toggle local UI state.
 * No real capture is requested, no fake camera preview is rendered, and the
 * Fullscreen API is used only when the browser supports it — permission or
 * support failures fall back to a focused overlay and are announced honestly.
 *
 * @param {Object} props
 * @param {string} props.classTitle
 * @param {boolean} props.broadcast        Faculty broadcast rooms: mic and camera stay off.
 * @param {boolean} props.studioAvailable  False → render the sample clip instead of the synced stage.
 * @param {import('@/contracts/liveStudio.js').StudioSnapshot|null} props.snapshot
 * @param {{ activeSceneLabel?: string, slide?: any, provenanceLabels?: Object, scenes?: any[] }} props.view
 * @param {any} props.metadata
 * @param {any} props.session              The live-room session fixture (mediaUrl, title, mode).
 * @param {string|null} props.handState    'raised' | 'lowered' | null (null → hand unavailable).
 * @param {() => void} props.onToggleHand
 * @param {() => void} props.onLeave
 * @param {boolean} props.leaving
 */
export function ClassroomStage({ classTitle, broadcast, studioAvailable, snapshot, view, metadata, session, handState, onToggleHand, onLeave, leaving }) {
  const toast = useToast()
  const containerRef = useRef(/** @type {HTMLElement | null} */ (null))
  const [micOn, setMicOn] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const fullscreenActive = nativeFullscreen || immersive

  useEffect(() => {
    /** @param {Event} _event */
    function onFullscreenChange(_event) {
      const active = document.fullscreenElement === containerRef.current
      setNativeFullscreen(active)
      if (active) setImmersive(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // The CSS overlay fallback locks page scroll and exits on Escape. Browser
  // fullscreen exits on Escape natively, so no listener is needed there.
  useEffect(() => {
    if (!immersive) return undefined
    const releaseScroll = lockScroll()
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setImmersive(false)
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      releaseScroll()
    }
  }, [immersive])

  const toggleFullscreen = useCallback(async () => {
    if (fullscreenActive) {
      if (nativeFullscreen && typeof document.exitFullscreen === 'function') {
        try { await document.exitFullscreen() } catch { setNativeFullscreen(false) }
      }
      setImmersive(false)
      return
    }
    const node = containerRef.current
    const supported = typeof document.fullscreenEnabled !== 'undefined' ? document.fullscreenEnabled : Boolean(node && /** @type {any} */ (node).requestFullscreen)
    if (node && supported && typeof node.requestFullscreen === 'function') {
      try {
        await node.requestFullscreen(/** @type {any} */ ({ navigationUI: 'hide' }))
        return
      } catch {
        // Permission denied or the browser refused — fall back, honestly.
      }
    }
    setImmersive(true)
    toast.show({
      title: 'Browser fullscreen is not available',
      description: 'Switched to a focused view instead. Press Escape to leave it.',
      tone: 'neutral',
    })
  }, [fullscreenActive, nativeFullscreen, toast])

  const scene = snapshot?.activeScene ?? null
  const sceneLabel = view?.activeSceneLabel ?? ''
  const handRaised = handState === 'raised'

  return (
    <section
      ref={containerRef}
      aria-label="Teaching stage"
      data-testid="teaching-stage"
      data-fullscreen={fullscreenActive ? 'true' : 'false'}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden bg-ink text-on-ink',
        immersive
          ? 'fixed inset-0 z-50 h-dvh w-full'
          : 'rounded-md border border-hairline-on-ink',
        nativeFullscreen && 'h-full w-full',
      )}
    >
      {fullscreenActive ? (
        <div className="flex shrink-0 items-center gap-3 border-b border-hairline-on-ink bg-ink px-4 py-2.5">
          <span className="live-dot size-2 shrink-0 rounded-full bg-info" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-xs font-[560] tracking-tight text-on-ink">{classTitle}</p>
          <Badge tone="answer" variant="soft">Live</Badge>
          <IconButton icon={<Minimize2 strokeWidth={1.5} />} label="Exit fullscreen" onClick={toggleFullscreen} className="text-on-ink hover:bg-on-ink-wash" />
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {studioAvailable && snapshot ? (
          <BroadcastPreview
            scene={scene ?? 'split'}
            sceneLabel={sceneLabel}
            setup={snapshot.setup}
            slide={view?.slide ?? null}
            slideIndex={snapshot.toolbox.slideIndex}
            slideCount={snapshot.slides.length}
            media={snapshot.media}
            metadata={metadata}
            participants={snapshot.participants}
            variant="student"
            immersive={fullscreenActive}
          >
            <Whiteboard shapes={snapshot.whiteboard.shapes} tool={snapshot.whiteboard.tool} readOnly />
          </BroadcastPreview>
        ) : (
          <SampleStageFallback session={session} broadcast={broadcast} immersive={fullscreenActive} />
        )}
      </div>

      {/* Bottom control bar — always visible on the stage. Icon + short label,
          visible active state, tooltips, keyboard reachable. Mic and camera are
          simulated and labelled as such; nothing is captured or transmitted. */}
      <div
        role="toolbar"
        aria-label="Your classroom controls"
        data-testid="classroom-control-bar"
        className="flex shrink-0 flex-wrap items-stretch justify-center gap-1.5 border-t border-hairline-on-ink bg-ink px-2 py-2 sm:gap-2 sm:px-3"
      >
        {!broadcast ? (
          <>
            <StageToggle
              label={micOn ? 'Mic on' : 'Mic off'}
              tooltip={micOn ? 'Microphone is on (simulated). No audio is captured.' : 'Microphone is muted (simulated).'}
              pressed={micOn}
              onClick={() => setMicOn((value) => !value)}
              icon={micOn ? <Mic strokeWidth={1.5} /> : <MicOff strokeWidth={1.5} />}
            />
            <StageToggle
              label={cameraOn ? 'Camera on' : 'Camera off'}
              tooltip={cameraOn ? 'Camera is on (simulated). No video is captured or shown.' : 'Camera is off (simulated).'}
              pressed={cameraOn}
              onClick={() => setCameraOn((value) => !value)}
              icon={cameraOn ? <Video strokeWidth={1.5} /> : <VideoOff strokeWidth={1.5} />}
            />
            <StageToggle
              label={handRaised ? 'Hand raised' : 'Raise hand'}
              tooltip={handState === null ? 'Hand raising is available in shared demo classes' : handRaised ? 'Lower your hand' : 'Raise your hand — faculty see a recorded mock event'}
              pressed={handRaised}
              onClick={onToggleHand}
              disabled={handState === null}
              icon={<Hand strokeWidth={1.5} />}
            />
          </>
        ) : (
          <p className="flex items-center px-2 text-2xs text-on-ink-muted">Faculty broadcast · microphone and camera are off for everyone.</p>
        )}
        <span className="hidden w-px self-stretch bg-hairline-on-ink sm:block" aria-hidden="true" />
        <StageToggle
          label={fullscreenActive ? 'Exit' : 'Fullscreen'}
          tooltip={fullscreenActive ? 'Leave fullscreen (or press Escape)' : 'Show only the stage — Escape exits'}
          pressed={fullscreenActive}
          onClick={toggleFullscreen}
          icon={fullscreenActive ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
        />
        <Tooltip label="Leave the class — attendance already marked stays recorded">
          <button
            type="button"
            onClick={onLeave}
            disabled={leaving}
            aria-label="Leave class"
            className="flex min-w-16 flex-col items-center justify-center gap-1 rounded-sm border border-[color-mix(in_oklab,var(--color-danger)_55%,transparent)] px-3 py-1.5 text-danger-fg transition-colors hover:bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] disabled:opacity-50"
          >
            <LogOut className="size-5" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-2xs">{leaving ? 'Leaving…' : 'Leave'}</span>
          </button>
        </Tooltip>
      </div>
      <p className="shrink-0 border-t border-hairline-on-ink bg-ink px-3 py-1.5 text-center text-2xs text-on-ink-muted">
        Microphone, camera and hand raise are simulated — nothing is captured or transmitted.
      </p>
    </section>
  )
}

/** Local sample clip stage used when the shared classroom is unavailable. */
function SampleStageFallback({ session, broadcast, immersive }) {
  return (
    <div className={cn('relative h-full w-full bg-ink', immersive ? 'min-h-0' : 'aspect-video')}>
      <video
        src={session.mediaUrl}
        poster={session.mediaUrl.replace('.mp4', '-poster.svg')}
        autoPlay
        muted
        loop
        playsInline
        aria-label={`${session.title} sample clip`}
        className="size-full object-contain"
      />
      <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-sm bg-ink/80 px-2.5 py-1.5">
        <span className="live-dot size-2 rounded-full bg-info" aria-hidden="true" />
        <span className="font-mono text-2xs font-[560] uppercase tracking-widest text-info">Glacier LIVE</span>
      </span>
      <p className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-sm bg-ink/80 px-3 py-2 text-2xs text-on-ink">
        {broadcast
          ? 'You are watching the local sample clip, not a live stream.'
          : 'Shared stage is not available for this session — you are watching the local sample clip.'}
      </p>
    </div>
  )
}

/**
 * One stage control: icon over a short label, pressed state visible, fully
 * keyboard reachable.
 * @param {{ label: string, tooltip: string, pressed?: boolean, onClick: () => void, icon: React.ReactNode, disabled?: boolean }} props
 */
function StageToggle({ label, tooltip, pressed, onClick, icon, disabled }) {
  return (
    <Tooltip label={tooltip}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={pressed}
        aria-label={label}
        className={cn(
          'flex min-w-16 flex-col items-center justify-center gap-1 rounded-sm px-3 py-1.5 text-on-ink transition-colors',
          'hover:bg-on-ink-wash disabled:cursor-not-allowed disabled:opacity-40',
          pressed && 'bg-on-ink-wash text-paper',
        )}
      >
        <span className="[&>svg]:size-5" aria-hidden="true">{icon}</span>
        <span className="text-2xs">{label}</span>
      </button>
    </Tooltip>
  )
}
