import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Timer } from 'lucide-react'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { cn } from '@/shared/lib/cn.js'

/**
 * The hero artefact: a question from a real NEET-UG paper, being answered.
 *
 * Two loops, both driven by one clock:
 *   1. The ember marker walks A → D → back to A.
 *   2. The timer digits roll down one second per tick.
 *
 * Why one clock and not two intervals: the marker is the thing the eye tracks, so
 * the timer must not drift away from it. A single interval that derives both
 * positions keeps them in step and gives the reduced-motion path one place to
 * read the final state from.
 *
 * Reduced motion: the card renders its settled state — marker on the correct
 * option, timer at its final reading — and never animates. The state is not
 * hidden from a user who opted out of motion.
 *
 * Numbers here are specifications from the paper (45 Physics questions, +4/−1),
 * read from mock-data/landing.js. No computed statistic appears on this card.
 *
 * @param {{ content: import('../../../contracts/landing.js').LandingContent, reduced: boolean }} props
 */

const OPTION_KEYS = ['A', 'B', 'C', 'D']

/** Seconds per step of the whole loop. Slower than a UI transition on purpose. */
const TICK_MS = 2600

/** How long the marker dwells on the correct answer before the loop resets. */
const SETTLE_TICKS = 2

export function MockQuestionCard({ content, reduced }) {
  const { samplePaper } = content
  const questions = samplePaper.questions
  const [step, setStep] = useState(0)

  /**
   * Steps: 0..3 walk the four options; 4 and 5 dwell on the answer. Then the
   * loop returns to 0 with the next question, so a visitor who watches for
   * fifteen seconds sees all three subjects rather than one question repeated.
   */
  const questionsCount = questions.length
  const optionSteps = OPTION_KEYS.length
  const perQuestion = optionSteps + SETTLE_TICKS

  useEffect(() => {
    if (reduced) return undefined
    const id = window.setInterval(() => {
      setStep((current) => (current + 1) % (perQuestion * questionsCount))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [reduced, perQuestion, questionsCount])

  const index = reduced ? 0 : Math.floor(step / perQuestion) % questionsCount
  const local = reduced ? 0 : step % perQuestion
  const settled = reduced || local >= optionSteps
  const question = questions[index]
  const activeOption = settled ? question.answer : OPTION_KEYS[local]

  /**
   * The timer counts down from the paper's stated duration; during the loop it
   * shows a plausible mid-paper reading. Derived from `step` so it moves with the
   * marker, and frozen at the final state under reduced motion.
   */
  const timer = useMemo(() => {
    const startSeconds = samplePaper.timer.minutes * 60 + samplePaper.timer.seconds
    const elapsed = reduced ? 0 : Math.floor(step * (TICK_MS / 1000))
    const remaining = Math.max(0, startSeconds - elapsed)
    return {
      minutes: Math.floor(remaining / 60),
      seconds: remaining % 60,
    }
  }, [step, reduced, samplePaper.timer])

  return (
    <figure className="relative m-0 w-full">
      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-hairline-on-ink bg-ink-raised',
          'shadow-[var(--shadow-overlay)]',
        )}
      >
        {/* Paper header: what a candidate actually sees first. */}
        <div className="flex items-center justify-between gap-3 border-b border-hairline-on-ink px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="rule-label truncate text-(--color-on-ink-label)">
              {question.exam} · {question.subject}
            </p>
            <p className="mt-1 truncate font-mono text-2xs tabular-nums text-(--color-on-ink-faint)">
              Question {question.number} of {question.total} · {question.scheme}
            </p>
          </div>

          {/* Timer strip. tabular-nums in mono, so a rolling digit never changes
              the width of the strip and never nudges the header. */}
          <div className="shrink-0 text-right">
            <p className="flex items-center justify-end gap-1.5 text-(--color-on-ink-faint)">
              <Timer className="size-3" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-mono text-[0.625rem] uppercase tracking-widest">
                {samplePaper.timer.label}
              </span>
            </p>
            <p className="mt-0.5 font-mono text-xl tabular-nums leading-none text-paper">
              {/*
                The accessible value is one sentence. The visible digits are
                hidden from assistive tech entirely: a rolling strip puts forty
                stray digits in the accessibility tree otherwise, and "0, 1, 2, 3"
                is not what a countdown sounds like.
                (`aria-label` is not permitted on a bare <p>, so the sentence is
                real text in an sr-only span instead.)
              */}
              <span className="sr-only">
                {timer.minutes} minutes {timer.seconds} seconds remaining
              </span>
              <span aria-hidden="true">
                <RollingDigits minutes={timer.minutes} seconds={timer.seconds} reduced={reduced} />
              </span>
            </p>
          </div>
        </div>

        {/* Question body.
            Every question is rendered into the same grid cell, with only the
            active one visible. The cell is therefore always as tall as the
            tallest question, so the card — and everything below it on the page —
            never changes height as the loop advances. A mount/unmount crossfade
            would reflow the hero every few seconds. */ }
        <div className="grid px-4 py-4 sm:px-5 sm:py-5">
          {questions.map((q, qIndex) => {
            const isCurrent = qIndex === index
            return (
              <div
                key={`${qIndex}-body`}
                style={{ gridArea: '1 / 1' }}
                aria-hidden={!isCurrent}
                className={cn(
                  'transition-opacity duration-300',
                  isCurrent ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
              >
                <p className="text-sm leading-relaxed text-paper">{q.prompt}</p>

                {/* Equation as plain mono text: KaTeX lands in the exam-runner
                    phase. Written so it is legible as text, not as a broken
                    formula. */}
                <p className="mt-3 overflow-x-auto rounded-xs border border-hairline-on-ink bg-ink-sunken px-3 py-2 font-mono text-xs whitespace-nowrap text-(--color-on-ink)">
                  {q.equation}
                </p>

                <ul className="mt-3 space-y-1.5">
                  {q.options.map((option, i) => {
                    const key = OPTION_KEYS[i]
                    const isActive = isCurrent && key === activeOption
                    const showCorrect = isCurrent && settled && key === q.answer
                    return (
                      <li key={`${qIndex}-${key}`}>
                        <div
                          className={cn(
                            'flex items-center gap-2.5 rounded-xs border px-2.5 py-2 transition-colors duration-[2400ms] ease-linear',
                            isActive
                              ? 'border-ember bg-[color-mix(in_oklab,var(--color-ember)_14%,transparent)]'
                              : 'border-hairline-on-ink bg-transparent',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-5 shrink-0 place-items-center rounded-full border font-mono text-2xs tabular-nums',
                              isActive
                                ? 'border-ember text-ember'
                                : 'border-hairline-on-ink-strong text-(--color-on-ink-faint)',
                            )}
                          >
                            {key}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-(--color-on-ink-strong)">
                            {option}
                          </span>
                          {showCorrect ? (
                            <span className="flex shrink-0 items-center gap-1 text-[0.625rem] uppercase tracking-widest text-(--color-on-ink-faint)">
                              <Check className="size-3 text-ember" strokeWidth={2} aria-hidden="true" />
                              Correct
                            </span>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* The remark is the product thesis in one line: a mark has a
                    reason. Same stacking trick, so a two-line remark does not
                    resize the card. */}
                <div className="mt-3 grid border-t border-hairline-on-ink pt-2.5">
                  {questions.map((r, rIndex) => (
                    <p
                      key={`${rIndex}-remark`}
                      style={{ gridArea: '1 / 1' }}
                      aria-hidden={rIndex !== index}
                      className={cn(
                        'text-2xs leading-relaxed text-(--color-on-ink-muted) transition-opacity duration-300',
                        rIndex === index ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      {rIndex === index && !settled ? 'Answering\u2026' : r.remark}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <figcaption className="mt-3 flex items-start gap-2 text-2xs leading-relaxed text-(--color-on-ink-faint)">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ember" aria-hidden="true" />
        {samplePaper.caption}
      </figcaption>
    </figure>
  )
}

/**
 * Digits that roll. Each digit is a 1-character-tall window with a strip of
 * numbers behind it; a digit that does not change does not move, so the strip
 * stays quiet for most of every second.
 *
 * @param {{ minutes: number, seconds: number, reduced: boolean }} props
 */
function RollingDigits({ minutes, seconds, reduced }) {
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return (
    <span className="inline-flex items-baseline">
      {mm.split('').map((digit, i) => (
        <Digit key={`m${i}`} value={digit} reduced={reduced} />
      ))}
      <span className="px-0.5 text-(--color-on-ink-faint)">:</span>
      {ss.split('').map((digit, i) => (
        <Digit key={`s${i}`} value={digit} reduced={reduced} />
      ))}
    </span>
  )
}

/**
 * One rolling digit. The strip holds 0–9; `y` moves it so the current value sits
 * in the window. Width is fixed at 1ch so the strip never reflows.
 *
 * @param {{ value: string, reduced: boolean }} props
 */
function Digit({ value, reduced }) {
  const digit = Number(value)

  if (reduced) {
    // Static final state: no strip, no transform, same box.
    return <span className="inline-block w-[1ch] text-center">{value}</span>
  }

  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-hidden align-baseline">
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        animate={{ y: `-${digit}em` }}
        transition={{ duration: 0.42, ease: easeEntrance }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1em] text-center leading-[1em]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}
