import { useRef, useState } from 'react'
import { Hand, LogOut, Mic, MicOff, Pause, Play, Video, VideoOff } from 'lucide-react'
import { Badge, Button, IconButton } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

/**
 * 16:9 mock stage. Interactive rooms expose mic/camera/hand; broadcast rooms
 * deliberately hide mic and camera and read as a faculty-led studio.
 * @param {{ session: import('@/contracts/live.js').LiveSession, onLeave: () => void, leaving?: boolean }} props
 */
export function LiveStage({ session, onLeave, leaving }) {
  const videoRef = useRef(/** @type {HTMLVideoElement|null} */ (null))
  const [paused, setPaused] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const interactive = session.mode === 'interactive'
  function toggleMedia() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { void video.play().catch(() => {}); setPaused(false) }
    else { video.pause(); setPaused(true) }
  }
  return (
    <section aria-label="Live class stage" className={cn('overflow-hidden rounded-md border bg-ink', interactive ? 'border-hairline-on-ink' : 'border-info')}>
      <div className="relative aspect-video">
        <video ref={videoRef} src={session.mediaUrl} poster={session.mediaUrl.replace('.mp4', '-poster.svg')} autoPlay muted loop playsInline tabIndex={0} aria-label={`${session.title} sample media`} className="size-full object-cover" onClick={toggleMedia} onKeyDown={(event) => { if (event.key === ' ' || event.key.toLowerCase() === 'k') { event.preventDefault(); toggleMedia() } }} />
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-sm bg-ink/80 px-2.5 py-1.5">
          <span className="live-dot size-2 rounded-full bg-info" aria-hidden="true" />
          <span className="font-mono text-2xs font-[560] uppercase tracking-widest text-info">Glacier LIVE</span>
        </div>
        <div className="pointer-events-none absolute right-3 top-3">
          <Badge tone={interactive ? 'neutral' : 'info'} variant="outline" className="border-hairline-on-ink bg-ink/80 text-paper">{interactive ? 'Interactive' : 'Broadcast'}</Badge>
        </div>
        {!interactive ? <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-sm bg-ink/80 px-3 py-2 text-2xs text-on-ink">Faculty broadcast · microphone and camera are off for everyone. Ask through the question queue.</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-hairline-on-ink px-3 py-3">
        <IconButton icon={paused ? <Play strokeWidth={1.5} /> : <Pause strokeWidth={1.5} />} label={paused ? 'Play sample media' : 'Pause sample media'} onClick={toggleMedia} className="text-paper hover:bg-on-ink-wash" />
        {interactive ? (
          <>
            <IconButton icon={micOn ? <Mic strokeWidth={1.5} /> : <MicOff strokeWidth={1.5} />} label={micOn ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={micOn} onClick={() => setMicOn((value) => !value)} className={cn('text-paper hover:bg-on-ink-wash', micOn && 'bg-on-ink-wash-soft')} />
            <IconButton icon={cameraOn ? <Video strokeWidth={1.5} /> : <VideoOff strokeWidth={1.5} />} label={cameraOn ? 'Turn camera off' : 'Turn camera on'} aria-pressed={cameraOn} onClick={() => setCameraOn((value) => !value)} className={cn('text-paper hover:bg-on-ink-wash', cameraOn && 'bg-on-ink-wash-soft')} />
            <Button variant="secondary" size="sm" aria-pressed={handRaised} onClick={() => setHandRaised((value) => !value)} icon={<Hand strokeWidth={1.5} />}>{handRaised ? 'Hand raised' : 'Raise hand'}</Button>
            <span className="ml-auto hidden font-mono text-2xs text-on-ink-faint sm:inline">{session.attendingCount} watching · {session.batchName}</span>
          </>
        ) : <span className="font-mono text-2xs text-on-ink-faint">{session.attendingCount} watching · questions only</span>}
        <Button variant="danger" size="sm" onClick={onLeave} loading={leaving} icon={<LogOut strokeWidth={1.5} />} className={cn('text-paper hover:bg-on-ink-wash', interactive ? '' : 'ml-auto')}>Leave</Button>
      </div>
    </section>
  )
}
