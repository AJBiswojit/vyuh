import { memo, useEffect, useRef, useState } from 'react'

/**
 * Isolated one-second countdown. Only this component re-renders on the tick;
 * the dashboard page and the next-up card do not own the interval.
 * @param {{ target: string | null, onReady?: () => void }} props
 */
function ExamCountdownInner({ target, onReady }) {
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)
  const ready = Boolean(target && new Date(target).getTime() <= now)

  useEffect(() => {
    fired.current = false
    if (!target) return
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (!fired.current && new Date(target).getTime() <= current) {
        fired.current = true
        onReady?.()
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [target, onReady])

  if (!target) return <p className="font-mono text-xs text-muted">Timed on release</p>
  const remaining = Math.max(0, new Date(target).getTime() - now)
  const total = Math.floor(remaining / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (/** @type {number} */ value) => String(value).padStart(2, '0')

  return (
    <p role="timer" aria-live="off" aria-label={ready ? 'Exam start time reached' : `Time to exam: ${days} days ${hours} hours ${minutes} minutes`} className="flex flex-wrap items-baseline gap-x-2 font-mono tabular-nums text-heading">
      {ready ? <span className="text-sm font-[560]">Start time reached</span> : (
        <>
          {days > 0 ? <span className="text-2xl leading-none">{days}<span className="ml-1 text-2xs text-faint">d</span></span> : null}
          <span className="text-2xl leading-none">{pad(hours)}<span className="ml-1 text-2xs text-faint">h</span></span>
          <span className="text-2xl leading-none">{pad(minutes)}<span className="ml-1 text-2xs text-faint">m</span></span>
          <span className="text-2xl leading-none text-ember-press">{pad(seconds)}<span className="ml-1 text-2xs text-faint">s</span></span>
        </>
      )}
    </p>
  )
}

export const ExamCountdown = memo(ExamCountdownInner)
