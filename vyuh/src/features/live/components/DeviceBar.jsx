import { Circle, Expand, Mic, MicOff, Radio, Video, VideoOff } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

const DEVICES = [
  { key: 'micOn', label: 'Microphone', onIcon: Mic, offIcon: MicOff },
  { key: 'cameraOn', label: 'Camera', onIcon: Video, offIcon: VideoOff },
  { key: 'screenSharing', label: 'Screen share', onIcon: Expand, offIcon: Expand },
  { key: 'recording', label: 'Recording', onIcon: Radio, offIcon: Circle },
]

/**
 * Level 1 device status — the only media controls visible by default. Every
 * chip shows an icon, a word and an on/off state; none of them captures,
 * transmits or stores anything. Simulated controls only.
 * @param {{ media: import('@/contracts/liveStudio.js').StudioSnapshot['media'], send: (type:string,payload?:Object)=>void }} props
 */
export function DeviceBar({ media, send }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Microphone, camera, screen share and recording (simulated)">
        {DEVICES.map((device) => {
          const on = Boolean(media[/** @type {'micOn'} */ (device.key)])
          const Icon = on ? device.onIcon : device.offIcon
          return (
            <button
              key={device.key}
              type="button"
              aria-pressed={on}
              aria-label={`${device.label} ${on ? 'On' : 'Off'} (simulated)`}
              onClick={() => send('media_toggled', { key: device.key, value: !on })}
              className={cn(
                'flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border px-3 py-2 text-left transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
                on ? 'border-ember bg-ember-wash text-ember-press' : 'border-hairline-on-ink bg-ink-raised text-on-ink hover:border-on-ink-muted',
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-2xs font-[560] leading-tight">{device.label}</span>
                <span className={cn('block text-2xs leading-tight', on ? 'text-ember-press' : 'text-on-ink-muted')}>{on ? 'On' : 'Off'}</span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-2xs leading-relaxed text-on-ink-muted">Simulated controls only. No microphone, camera, screen capture, recording or transmission is used in this demo — every chip just records a mock event.</p>
    </div>
  )
}
