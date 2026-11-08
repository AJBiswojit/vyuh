import { Circle, Expand, Mic, MicOff, Monitor, Play, Radio, StopCircle, Video, VideoOff } from 'lucide-react'
import { Badge, Button, IconButton } from '@/shared/ui'
import { ConfirmAction } from '@/features/faculty/components/ConfirmAction.jsx'
import { cn } from '@/shared/lib/cn.js'

const CONTROLS = [
  { key: 'micOn', on: 'Microphone on (simulated)', off: 'Microphone off', onIcon: Mic, offIcon: MicOff },
  { key: 'cameraOn', on: 'Camera on (simulated)', off: 'Camera off', onIcon: Video, offIcon: VideoOff },
  { key: 'screenSharing', on: 'Screen sharing on (simulated)', off: 'Screen sharing off', onIcon: Expand, offIcon: Monitor },
  { key: 'recording', on: 'Recording on (simulated)', off: 'Recording off', onIcon: Radio, offIcon: Circle },
]

/**
 * Broadcast controls. Each toggle writes a recorded mock event; none of them
 * calls a media API. The caption says so in plain language.
 * @param {{ snapshot: import('@/contracts/liveStudio.js').StudioSnapshot, send: (type:string,payload?:Object)=>void, onReset: () => void }} props
 */
export function BroadcastDock({ snapshot, send, onReset }) {
  const media = snapshot.media
  const live = snapshot.status === 'live'
  const ended = snapshot.status === 'ended'
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline-on-ink bg-ink-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        {CONTROLS.map((control) => {
          const value = Boolean(media[control.key])
          const Icon = value ? control.onIcon : control.offIcon
          return (
            <IconButton
              key={control.key}
              label={value ? `${control.on}. Turn off` : `${control.off}. Turn on`}
              icon={<Icon />}
              variant="secondary"
              pressed={value}
              onClick={() => send('media_toggled', { key: control.key, value: !value })}
            />
          )
        })}
        <span className="mx-1 hidden h-8 w-px bg-hairline-on-ink sm:block" aria-hidden="true" />
        <Button
          variant="secondary"
          size="sm"
          icon={<Play />}
          disabled={live || ended}
          onClick={() => send('session_started', {})}
        >
          Go Live
        </Button>
        <ConfirmAction
          title="End this prototype session?"
          description="The recorded Go Live and End Session events will be kept in the mock room log."
          detail="Students will see the ended state. You can reset the prototype data to start a fresh simulated session."
          confirmLabel="End session"
          cancelLabel="Keep it live"
          onConfirm={() => send('session_ended', {})}
        >
          {(open) => (
            <Button variant="danger" size="sm" icon={<StopCircle />} disabled={!live} onClick={open}>
              End Session
            </Button>
          )}
        </ConfirmAction>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset prototype data
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={live ? 'answer' : ended ? 'danger' : 'review'} variant="soft">
          {live ? 'Live (recorded Go Live)' : ended ? 'Ended (recorded)' : 'Scheduled (not started)'}
        </Badge>
        {CONTROLS.map((control) => (
          <span key={control.key} className={cn('text-2xs', media[control.key] ? 'text-answer-fg' : 'text-on-ink-muted')}>
            {control.key}: {media[control.key] ? 'on' : 'off'}
          </span>
        ))}
      </div>
      <p className="text-2xs leading-relaxed text-on-ink-muted">
        Simulated controls only. No microphone, camera, screen capture, recording or transmission is used in this prototype.
      </p>
    </div>
  )
}
