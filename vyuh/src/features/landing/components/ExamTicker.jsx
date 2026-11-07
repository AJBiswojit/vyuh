import { useCallback, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Exam ticker. A slow horizontal marquee of the exams the platform runs.
 *
 * Three constraints shaped this:
 *   1. It must pause on hover *and* on keyboard focus. A marquee that ignores
 *      focus takes content away from the person who arrived by keyboard.
 *   2. Under reduced motion it stops entirely and becomes a static, wrapping
 *      row — the content is still there, it just stops moving.
 *   3. It must not cost layout. The strip has a fixed height and the track is
 *      duplicated for the loop, so the join is invisible and nothing reflows.
 *
 * The animation is CSS, not JS: a JS marquee competes with the hero's own loop
 * for the main thread, and this is the least important motion on the page.
 *
 * @param {{ label: string, exams: string[], reduced: boolean }} props
 */
export function ExamTicker({ label, exams, reduced }) {
  const [paused, setPaused] = useState(false)
  const itemCount = exams.length

  const pause = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])

  // A single set of names, rendered twice so the loop has no visible seam.
  const track = [...exams, ...exams]

  return (
    <div
      className="group relative overflow-hidden border-y border-hairline-on-ink bg-ink-sunken"
      data-paused={paused || reduced ? 'true' : 'false'}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <p className="sr-only">{label}</p>

      {/* Edge fade, so names enter and leave rather than being clipped. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(to_right,var(--color-ink-sunken),transparent)] sm:w-16"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(to_left,var(--color-ink-sunken),transparent)] sm:w-16"
        aria-hidden="true"
      />

      <div
        className={cn(
          'flex w-max items-center py-2.5',
          reduced ? 'flex-wrap w-full justify-center gap-x-6 gap-y-1' : 'exam-ticker-track',
        )}
        style={reduced ? undefined : { animationPlayState: paused ? 'paused' : 'running' }}
      >
        {(reduced ? exams : track).map((exam, index) => (
          <span
            key={`${exam}-${index}`}
            className="flex shrink-0 items-center gap-6 whitespace-nowrap px-3 sm:gap-8"
            aria-hidden={reduced ? undefined : index >= itemCount}
          >
            <span className="font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-muted)">
              {exam}
            </span>
            {/* The separator is a rule, not a decorative dot: it reads as a list. */}
            <span className="h-3 w-px shrink-0 bg-hairline-on-ink" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  )
}
