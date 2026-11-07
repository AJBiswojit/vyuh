import { Check, ClipboardList, Radio, PlayCircle, Timer } from 'lucide-react'
import { Badge } from '@/shared/ui/Badge.jsx'
import { StatusDot } from '@/shared/ui/StatusDot.jsx'
import { cn } from '@/shared/lib/cn.js'

/**
 * Feature bento. Four tiles, deliberately unequal: a 7/5 split on the top row
 * and a 5/7 split below. The instruction "avoid three identical cards in a row"
 * is a design constraint, not a stylistic one — equal cards at equal weight tell
 * a reader that the four things are equally important, which they are not.
 *
 * Every tile contains a small, real preview of the surface it describes, drawn
 * from the same primitives the product uses. A tile about question-level
 * analysis shows an actual question row, not an icon of a bar chart.
 *
 * @param {{ content: import('../../../contracts/landing.js').LandingContent, reduced: boolean }} props
 */
export function FeatureBento({ content, reduced }) {
  const tiles = Object.fromEntries(content.bento.tiles.map((tile) => [tile.key, tile]))

  return (
    <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-12">
      {/* The nav anchors land on the tile that answers them, not on a spacer.
          "Analysis" and "Live classes" are promises made by the nav, so they
          scroll to the panel that shows that surface. */}
      <Tile tile={tiles.hall} className="lg:col-span-7" preview={<ExamHallPreview />} />
      <Tile tile={tiles.analysis} id="analysis" className="lg:col-span-5" preview={<QuestionAnalysisPreview />} />
      <Tile tile={tiles.live} id="live-classes" className="lg:col-span-5" preview={<LiveClassPreview reduced={reduced} />} />
      <Tile tile={tiles.recordings} className="lg:col-span-7" preview={<RecordingPreview />} />
    </div>
  )
}

/**
 * @param {{
 *   tile: { eyebrow: string, title: string, body: string },
 *   className?: string,
 *   id?: string,
 *   preview: React.ReactNode,
 * }} props
 */
function Tile({ tile, className, id, preview }) {
  return (
    <article id={id} className={cn('flex flex-col bg-surface-raised p-5 sm:p-6 scroll-mt-4', className)}>
      <p className="rule-label">{tile.eyebrow}</p>
      <h3 className="mt-3 max-w-[30ch] text-lg leading-snug tracking-tight text-heading">{tile.title}</h3>
      <p className="mt-2 max-w-[46ch] text-xs leading-relaxed text-muted">{tile.body}</p>
      <div className="mt-5 flex-1">{preview}</div>
    </article>
  )
}

/* ── 01 · Exam hall ─────────────────────────────────────────────────────
 * The palette, reduced to twelve questions. Fill carries the state, the numeral
 * carries the number, and the legend names each state — colour never alone.
 */
function ExamHallPreview() {
  /** @type {Array<'answered'|'review'|'unanswered'|'current'|'visited'>} */
  const states = [
    'answered', 'answered', 'review', 'unanswered', 'current', 'visited',
    'answered', 'unanswered', 'visited', 'answered', 'review', 'unanswered',
  ]

  const style = {
    answered: 'bg-answer text-ink',
    review: 'bg-review text-ink',
    unanswered: 'border border-danger text-danger-fg',
    current: 'bg-ember text-on-ember',
    visited: 'bg-idle text-ink',
  }

  return (
    <div className="rounded-sm border border-line bg-surface p-3">
      {/* Twelve cells across, at miniature scale: the real palette is a strip of
          numbered squares, and a preview that made them large would read as a
          chart instead of a palette. */}
      <div className="grid grid-cols-12 gap-1">
        {states.map((state, i) => (
          <span
            key={i}
            className={cn(
              'grid h-6 place-items-center rounded-[2px] font-mono text-[0.5625rem] tabular-nums',
              style[state],
            )}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2">
        {[
          ['Answered', 'bg-answer'],
          ['Marked', 'bg-review'],
          ['Current', 'bg-ember'],
          ['Not answered', 'border border-danger'],
        ].map(([label, swatch]) => (
          <span key={label} className="flex items-center gap-1.5 text-[0.625rem] text-muted">
            <span className={cn('size-2 rounded-[1px]', swatch)} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── 02 · Question-level analysis ───────────────────────────────────────
 * One question's ledger: what was answered, how long it took, and what it cost.
 * This is the claim of the section rendered as the artefact.
 */
function QuestionAnalysisPreview() {
  /** @type {Array<{ q: number, verdict: 'correct'|'wrong'|'skipped', secs: number }>} */
  const rows = [
    { q: 12, verdict: 'correct', secs: 74 },
    { q: 13, verdict: 'correct', secs: 51 },
    { q: 14, verdict: 'wrong', secs: 186 },
    { q: 15, verdict: 'skipped', secs: 12 },
  ]

  const verdict = {
    correct: { label: 'Correct', icon: Check, tone: 'text-answer-fg' },
    wrong: { label: 'Wrong', icon: null, tone: 'text-danger-fg' },
    skipped: { label: 'Not attempted', icon: null, tone: 'text-faint' },
  }

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-surface">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">One answer sheet at question level, with time per question</caption>
        <thead>
          <tr className="border-b border-line bg-surface-sunken">
            <th scope="col" className="rule-label px-2.5 py-1.5 font-normal">Q</th>
            <th scope="col" className="rule-label px-2.5 py-1.5 font-normal">Verdict</th>
            <th scope="col" className="rule-label px-2.5 py-1.5 text-right font-normal">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const entry = verdict[row.verdict]
            return (
              <tr key={row.q} className="border-b border-line last:border-b-0">
                <td className="px-2.5 py-1.5 font-mono text-[0.625rem] tabular-nums text-faint">{row.q}</td>
                <td className={cn('px-2.5 py-1.5 text-[0.625rem]', entry.tone)}>
                  <span className="flex items-center gap-1">
                    {entry.icon ? <entry.icon className="size-2.5" strokeWidth={2.5} aria-hidden="true" /> : null}
                    {entry.label}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 text-right font-mono text-[0.625rem] tabular-nums text-muted">
                  {Math.floor(row.secs / 60) > 0 ? `${Math.floor(row.secs / 60)}m ` : ''}
                  {row.secs % 60}s
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-2.5 py-1.5 text-[0.625rem] text-muted">
        Q14 took longest and cost the most. That sentence is the report.
      </p>
    </div>
  )
}

/* ── 03 · Live classes ──────────────────────────────────────────────────
 * The roster is the artefact: presence is a by-product of joining, not a register.
 */
function LiveClassPreview({ reduced }) {
  /** @type {Array<{ initials: string, joined: string, present: boolean }>} */
  const roster = [
    { initials: 'AS', joined: '09:01', present: true },
    { initials: 'RM', joined: '09:01', present: true },
    { initials: 'KD', joined: '09:04', present: true },
    { initials: 'SP', joined: '09:06', present: true },
    { initials: 'TN', joined: '—', present: false },
  ]

  return (
    <div className="rounded-sm border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.625rem] text-muted">
          <Radio className="size-3 text-info-fg" strokeWidth={1.5} aria-hidden="true" />
          Rotational Dynamics · problem set B
        </span>
        <StatusDot tone="info" label="Class is live" animate={!reduced} />
      </div>

      <ul className="mt-2.5 space-y-1">
        {roster.map((member) => (
          <li key={member.initials} className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full font-mono text-[0.5625rem]',
                member.present ? 'bg-surface-sunken text-heading' : 'border border-line text-faint',
              )}
            >
              {member.initials}
            </span>
            <span
              className={cn(
                'h-px flex-1',
                member.present ? 'bg-line' : 'border-t border-dashed border-line bg-transparent',
              )}
              aria-hidden="true"
            />
            <span className="shrink-0 font-mono text-[0.625rem] tabular-nums text-faint">
              {member.present ? member.joined : 'absent'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── 04 · Recordings ────────────────────────────────────────────────────
 * A recording that ends in a problem set, not in another recording.
 */
function RecordingPreview() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="rounded-sm border border-line bg-surface p-3">
        <div className="flex items-center gap-2">
          <PlayCircle className="size-4 text-ember-press" strokeWidth={1.5} aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-[0.6875rem] font-[560] text-heading">
            Rotational Dynamics — class 6
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-0.5 flex-1 bg-line" aria-hidden="true">
            <span className="block h-full w-2/3 bg-ember" />
          </span>
          <span className="font-mono text-[0.5625rem] tabular-nums text-faint">41:12</span>
        </div>
        <p className="mt-1.5 text-[0.625rem] text-muted">Chapter 7 · rigid-body rotation</p>
      </div>

      <div className="flex items-center justify-center gap-1 sm:flex-col" aria-hidden="true">
        <span className="h-px w-3 bg-line sm:h-3 sm:w-px" />
        <span className="font-mono text-[0.5625rem] text-faint">then</span>
        <span className="h-px w-3 bg-line sm:h-3 sm:w-px" />
      </div>

      <div className="rounded-sm border border-line bg-surface p-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-[0.6875rem] font-[560] text-heading">Set 7 · 12 questions</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral" shape="none" mono>
            <Timer className="mr-1 inline size-2.5" strokeWidth={2} aria-hidden="true" />
            25 min
          </Badge>
          <Badge tone="neutral" shape="none" mono>
            Same chapter
          </Badge>
        </div>
        <p className="mt-1.5 text-[0.625rem] text-muted">Queued for after the rewatch.</p>
      </div>
    </div>
  )
}
