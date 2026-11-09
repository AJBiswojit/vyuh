import { motion } from 'framer-motion'
import { Camera, FileText, Radio, Users } from 'lucide-react'
import { Badge } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

function FacultyTile({ name, compact = false }) {
  return (
    <div
      role="img"
      aria-label={`Simulated faculty tile for ${name}. No camera capture.`}
      className={cn(
        'flex h-full min-h-[8rem] w-full flex-col items-center justify-center gap-2 rounded-sm border border-hairline-on-ink bg-ink-raised',
        compact ? 'p-2' : 'p-4',
      )}
    >
      <span className={cn('flex items-center justify-center rounded-sm border border-hairline-on-ink bg-on-ink-wash', compact ? 'size-10' : 'size-16')}>
        <Camera className={compact ? 'size-5' : 'size-8'} strokeWidth={1.2} aria-hidden="true" />
      </span>
      <span className={cn('text-center font-[560] tracking-tight text-on-ink', compact ? 'text-2xs' : 'text-xs')}>{name}</span>
      {!compact ? <span className="text-2xs text-on-ink-muted">Simulated faculty tile</span> : null}
    </div>
  )
}

function SlidePane({ slide, index, count, compact = false }) {
  return (
    <div className={cn('flex h-full min-h-[8rem] w-full flex-col gap-2 rounded-sm border border-hairline-on-ink bg-surface-raised p-3 text-heading', compact && 'p-2')}>
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <FileText className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-xs font-[560] tracking-tight">{slide?.title ?? 'Seeded demo slide'}</span>
        <span className="ml-auto font-mono text-2xs tabular-nums text-muted">{index + 1}/{count}</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {(slide?.bullets ?? []).map((bullet) => (
          <li key={bullet} className={cn('flex gap-2 leading-relaxed text-body', compact ? 'text-2xs' : 'text-xs')}>
            <span className="mt-1 size-1 shrink-0 rounded-full bg-ember" aria-hidden="true" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ContentPane({ slide, mediaUrl, posterUrl }) {
  return (
    <div className="grid h-full min-h-[16rem] w-full gap-2 md:grid-cols-2">
      <div className="flex min-h-[10rem] flex-col overflow-hidden rounded-sm border border-hairline-on-ink bg-ink-sunken">
        {mediaUrl ? (
          <video
            className="h-full min-h-[10rem] w-full object-cover"
            src={mediaUrl}
            poster={posterUrl}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            aria-label="Local silent sample clip used as simulated session content"
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-2xs text-on-ink-muted">No local sample clip available</div>
        )}
        <p className="border-t border-hairline-on-ink px-2 py-1 text-2xs text-on-ink-muted">Local silent sample clip · not a live stream</p>
      </div>
      <SlidePane slide={slide} index={0} count={1} compact />
    </div>
  )
}

function ParticipantStrip({ participants }) {
  const shown = participants.filter((person) => person.state !== 'left').slice(0, 6)
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-hairline-on-ink bg-ink-raised p-2">
      <p className="flex items-center gap-1.5 text-2xs text-on-ink-label"><Users className="size-3.5" aria-hidden="true" /> Roster (labelled demo seeds)</p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((person) => (
          <span key={person.id} className="rounded-xs border border-hairline-on-ink bg-on-ink-wash px-2 py-1 text-2xs text-on-ink" title={person.name}>{person.initials}</span>
        ))}
        {shown.length === 0 ? <span className="text-2xs text-on-ink-muted">No active seeded rows</span> : null}
      </div>
    </div>
  )
}

/**
 * Stage preview. Every scene is DOM/SVG or a local silent sample clip; no
 * camera, microphone, screen capture, WebRTC, WebSocket or streaming is used.
 * The dark theme is pinned here so the same broadcast stage reads consistently
 * inside the dark Faculty Studio, the light Mirror and the light Classroom.
 * @param {Object} props
 * @param {string} props.scene
 * @param {string} props.sceneLabel
 * @param {import('@/contracts/liveStudio.js').StudioSetup} props.setup
 * @param {any} props.slide
 * @param {number} props.slideIndex
 * @param {number} props.slideCount
 * @param {Object} props.media
 * @param {any} props.metadata
 * @param {Array} props.participants
 * @param {React.ReactNode} [props.children]  Whiteboard slot.
 */
export function BroadcastPreview({ scene, sceneLabel, setup, slide, slideIndex, slideCount, media, metadata, participants, children }) {
  const facultyName = metadata?.facultyName ?? 'Faculty'
  const status = media?.recording ? 'Recording indicator (simulated)' : 'Demo stage'

  let stage = null
  if (scene === 'camera') stage = <div className="h-full p-3"><FacultyTile name={facultyName} /></div>
  else if (scene === 'presentation') stage = (
    <div className="grid h-full grid-cols-1 gap-2 p-3 md:grid-cols-[2fr_1fr]">
      <SlidePane slide={slide} index={slideIndex} count={slideCount} />
      <FacultyTile name={facultyName} compact />
    </div>
  )
  else if (scene === 'whiteboard') stage = <div className="h-full p-3">{children ?? <p className="p-4 text-xs text-on-ink-muted">Shared whiteboard is not mounted in this view.</p>}</div>
  else if (scene === 'content') stage = <div className="h-full p-3"><ContentPane slide={slide} mediaUrl={metadata?.mediaUrl} posterUrl={metadata?.posterUrl} /></div>
  else stage = (
    <div className="grid h-full grid-cols-1 gap-2 p-3 md:grid-cols-2">
      <FacultyTile name={facultyName} compact />
      <SlidePane slide={slide} index={slideIndex} count={slideCount} compact />
      <div className="md:col-span-2"><ParticipantStrip participants={participants} /></div>
    </div>
  )

  return (
    <section data-theme="dark" data-testid="broadcast-preview" className="overflow-hidden rounded-sm border border-hairline-on-ink bg-ink-sunken text-on-ink">
      <header className="flex flex-wrap items-center gap-2 border-b border-hairline-on-ink px-3 py-2">
        <span className="rule-label text-on-ink-label">What students see</span>
        <span className="text-xs font-[560] tracking-tight text-on-ink">{sceneLabel}</span>
        <Badge tone="review" variant="soft">Demo preview</Badge>
        <span className="ml-auto flex items-center gap-1.5 text-2xs text-on-ink-muted"><Radio className="size-3.5" aria-hidden="true" />{status}</span>
      </header>
      <div className="min-h-[18rem] w-full sm:min-h-[22rem]">
        <motion.div key={scene} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="h-full">
          {stage}
        </motion.div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline-on-ink px-3 py-2">
        <span className="text-2xs text-on-ink">{setup.title} · {setup.batchName}</span>
        <span className="text-2xs leading-relaxed text-on-ink-muted">Demo stage — no real camera, microphone, screen or recording is used.</span>
      </footer>
    </section>
  )
}
