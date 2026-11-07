import { Bookmark, Captions, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { IconButton, Select } from '@/shared/ui'
import { formatClock } from '@/shared/lib/format.js'

/**
 * Custom controls are all native keyboard targets: buttons, a range slider and
 * a select. The video itself also accepts Space/K, arrows, M and F.
 * @param {{ recording: import('@/contracts/learning.js').RecordingDetail, playback: ReturnType<import('../hooks/useVideoPlayback.js').useVideoPlayback>, onBookmark: () => void, bookmarkBusy?: boolean }} props
 */
export function RecordingPlayer({ recording, playback, onBookmark, bookmarkBusy }) {
  const { videoRef, wrapperRef, currentTime, duration, playing, muted, captionsOn, speed, timeLabel, seek, togglePlay, toggleMute, toggleCaptions, toggleFullscreen, changeSpeed, onLoadedMetadata, onTimeUpdate, onPause, onEnded, onKeyDown, setPlaying } = playback
  return (
    <div ref={wrapperRef} className="overflow-hidden rounded-md border border-line bg-ink" onKeyDown={onKeyDown}>
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={recording.mediaUrl}
          poster={recording.posterUrl}
          muted={muted}
          playsInline
          preload="metadata"
          tabIndex={0}
          aria-label={`${recording.title} video`}
          aria-describedby="video-keyboard-hint"
          className="size-full object-cover"
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={onPause}
          onEnded={onEnded}
          onClick={togglePlay}
        >
          <track kind="captions" src={recording.captionsUrl} srcLang="en" label="English captions" />
        </video>
      </div>
      <div className="space-y-3 border-t border-hairline-on-ink p-3">
        <div className="flex items-center gap-3">
          <IconButton icon={playing ? <Pause strokeWidth={1.5} /> : <Play strokeWidth={1.5} />} label={playing ? 'Pause video' : 'Play video'} onClick={togglePlay} className="text-paper hover:bg-on-ink-wash" />
          <input
            type="range"
            min={0}
            max={duration || recording.durationSeconds}
            step={0.1}
            value={currentTime}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek video"
            aria-valuetext={timeLabel}
            className="h-2 min-w-0 flex-1 cursor-pointer"
            style={{ accentColor: 'var(--color-ember)' }}
          />
          <output className="shrink-0 font-mono text-2xs tabular-nums text-on-ink" aria-live="off">{timeLabel}</output>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select label="Playback speed" className="w-36 [&_label]:text-on-ink [&_select]:border-hairline-on-ink [&_select]:bg-ink [&_select]:text-paper" value={String(speed)} onChange={(event) => changeSpeed(Number(event.target.value))} options={[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => ({ value: String(value), label: `${value}×` }))} />
          <IconButton icon={muted ? <VolumeX strokeWidth={1.5} /> : <Volume2 strokeWidth={1.5} />} label={muted ? 'Unmute video' : 'Mute video'} aria-pressed={!muted} onClick={toggleMute} className="text-paper hover:bg-on-ink-wash" />
          <IconButton icon={<Captions strokeWidth={1.5} />} label={captionsOn ? 'Hide captions' : 'Show captions'} aria-pressed={captionsOn} onClick={toggleCaptions} className="text-paper hover:bg-on-ink-wash" />
          <IconButton icon={<Bookmark strokeWidth={1.5} />} label="Bookmark this moment" onClick={onBookmark} disabled={bookmarkBusy} aria-busy={bookmarkBusy || undefined} className="text-paper hover:bg-on-ink-wash" />
          <IconButton icon={<Maximize strokeWidth={1.5} />} label="Toggle fullscreen" onClick={toggleFullscreen} className="ml-auto text-paper hover:bg-on-ink-wash" />
        </div>
        <p id="video-keyboard-hint" className="text-2xs text-on-ink-faint">Keyboard: Space/K play · ←/→ seek 5s · M mute · F fullscreen. Resume at {formatClock(recording.playback.positionSeconds)}.</p>
      </div>
    </div>
  )
}
