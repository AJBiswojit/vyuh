import { useCallback, useEffect, useRef, useState } from 'react'
import { formatClock } from '@/shared/lib/format.js'
import { useSavePlayback } from './useLearning.js'

/**
 * Keyboard-operable media state + persisted resume. Natural playback advances a
 * monotonic watched-through mark; seeking moves the resume point but does not
 * silently complete chapters. The `ended` flag comes only from the media event
 * (or a previously persisted completion), never from a seek alone.
 * @param {import('@/contracts/learning.js').RecordingDetail} recording
 * @param {string} studentId
 * @param {number|null} deepLinkTime
 */
export function useVideoPlayback(recording, studentId, deepLinkTime) {
  const videoRef = useRef(/** @type {HTMLVideoElement|null} */ (null))
  const wrapperRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  const [currentTime, setCurrentTime] = useState(recording.playback.positionSeconds)
  const [duration, setDuration] = useState(recording.durationSeconds)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [captionsOn, setCaptionsOn] = useState(false)
  const [speed, setSpeed] = useState(recording.playback.speed)
  const [ended, setEnded] = useState(recording.playback.ended)
  const [savedAt, setSavedAt] = useState(/** @type {number|null} */ (null))
  const watchedThrough = useRef(recording.playback.watchedThroughSeconds)
  const completedIds = useRef([...recording.playback.completedChapterIds])
  const previousTime = useRef(recording.playback.positionSeconds)
  const lastSave = useRef(0)
  const { mutateAsync: savePlayback, isPending: saving } = useSavePlayback(recording.id, studentId)
  const latest = useRef({ position: recording.playback.positionSeconds, speed: recording.playback.speed, ended: recording.playback.ended })

  const persist = useCallback((forceEnded = false) => {
    const state = latest.current
    void savePlayback({ positionSeconds: state.position, speed: state.speed, watchedThroughSeconds: watchedThrough.current, ended: forceEnded || state.ended, completedChapterIds: completedIds.current })
      .then(() => setSavedAt(Date.now()))
      .catch(() => {})
  }, [savePlayback])

  const seek = useCallback((/** @type {number} */ time) => {
    const video = videoRef.current
    const next = Math.max(0, Math.min(video?.duration || recording.durationSeconds, time))
    if (video) video.currentTime = next
    previousTime.current = next
    setCurrentTime(next)
    latest.current.position = next
    persist()
  }, [persist, recording.durationSeconds])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => {})
    else video.pause()
  }, [])
  const skip = useCallback((/** @type {number} */ delta) => seek((videoRef.current?.currentTime ?? currentTime) + delta), [seek, currentTime])
  const changeSpeed = useCallback((/** @type {number} */ value) => {
    setSpeed(value)
    if (videoRef.current) videoRef.current.playbackRate = value
    latest.current.speed = value
    persist()
  }, [persist])
  const toggleMute = useCallback(() => {
    setMuted((value) => { if (videoRef.current) videoRef.current.muted = !value; return !value })
  }, [])
  const toggleCaptions = useCallback(() => {
    setCaptionsOn((value) => {
      const track = videoRef.current?.textTracks[0]
      if (track) track.mode = value ? 'hidden' : 'showing'
      return !value
    })
  }, [])
  const toggleFullscreen = useCallback(() => {
    const node = wrapperRef.current
    if (!node) return
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    else void node.requestFullscreen?.().catch(() => {})
  }, [])

  function onLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration || recording.durationSeconds)
    video.playbackRate = speed
    video.muted = muted
    const track = video.textTracks[0]
    if (track) track.mode = captionsOn ? 'showing' : 'hidden'
    const start = deepLinkTime ?? recording.playback.positionSeconds
    video.currentTime = Math.max(0, Math.min(video.duration || recording.durationSeconds, start))
    previousTime.current = video.currentTime
    setCurrentTime(video.currentTime)
  }
  function onTimeUpdate() {
    const video = videoRef.current
    if (!video) return
    const time = video.currentTime
    const delta = time - previousTime.current
    if (!video.paused && delta > 0 && delta <= 1.5 * speed + 0.5) {
      watchedThrough.current = Math.max(watchedThrough.current, time)
      for (const chapter of recording.chapters) {
        if (previousTime.current >= chapter.startSeconds - 0.25 && previousTime.current < chapter.endSeconds && time >= chapter.endSeconds && !completedIds.current.includes(chapter.id)) completedIds.current.push(chapter.id)
      }
    }
    previousTime.current = time
    setCurrentTime(time)
    const now = Date.now()
    if (now - lastSave.current >= 1000) { lastSave.current = now; persist() }
  }
  function onPause() {
    setPlaying(false)
    persist()
  }
  function onEnded() {
    const video = videoRef.current
    watchedThrough.current = video?.duration || recording.durationSeconds
    const last = recording.chapters.at(-1)
    if (last && previousTime.current >= last.startSeconds - 0.25 && !completedIds.current.includes(last.id)) completedIds.current.push(last.id)
    setEnded(true)
    latest.current.ended = true
    setCurrentTime(watchedThrough.current)
    setPlaying(false)
    persist(true)
  }
  /** @param {import('react').KeyboardEvent} event */
  function onKeyDown(event) {
    if (event.target !== videoRef.current && event.target !== wrapperRef.current) return
    const key = event.key.toLowerCase()
    if (key === ' ' || key === 'k') { event.preventDefault(); togglePlay() }
    if (key === 'arrowright') { event.preventDefault(); skip(5) }
    if (key === 'arrowleft') { event.preventDefault(); skip(-5) }
    if (key === 'm') { event.preventDefault(); toggleMute() }
    if (key === 'f') { event.preventDefault(); toggleFullscreen() }
  }

  useEffect(() => { latest.current = { position: currentTime, speed, ended } }, [currentTime, speed, ended])

  useEffect(() => {
    const flush = () => persist()
    const onVisibility = () => { if (document.hidden) flush() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [persist])

  return {
    videoRef, wrapperRef, currentTime, duration, playing, muted, captionsOn, speed, ended, savedAt,
    completedChapterIds: recording.playback.completedChapterIds,
    bookmarks: recording.playback.bookmarks, notes: recording.playback.notes,
    seek, skip, togglePlay, toggleMute, toggleCaptions, toggleFullscreen, changeSpeed, onLoadedMetadata, onTimeUpdate, onPause, onEnded, onKeyDown,
    setPlaying,
    timeLabel: `${formatClock(currentTime)} of ${formatClock(duration)}`,
    saving,
  }
}
