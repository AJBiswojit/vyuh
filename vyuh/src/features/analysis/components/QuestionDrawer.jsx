import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge, Sheet } from '@/shared/ui'
import { MathText } from '@/features/exam/components/MathText.jsx'
import { formatNumber } from '@/shared/lib/format.js'
import { answerLabel, difficultyLabel, mistakeTone, OUTCOME_LABELS, signedMarks } from '../lib/labels.js'

/** @typedef {import('@/contracts/analysis.js').QuestionAnalysis} QuestionAnalysis */

/** @param {{ row: QuestionAnalysis }} props */
function DrawerBody({ row }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={row.outcome === 'correct' ? 'answer' : row.outcome === 'wrong' ? 'danger' : 'idle'} variant="outline" shape="none">{OUTCOME_LABELS[row.outcome]}</Badge>
        <span className="font-mono text-sm tabular-nums text-heading">{signedMarks(row.marksDelta)}</span>
        {row.mistakeCategory ? <Badge tone={mistakeTone(row.mistakeCategory)} variant="outline" shape="none">{row.mistakeLabel}</Badge> : null}
        {row.confidentMistake ? <Badge tone="danger" variant="soft" shape="none">Confident mistake</Badge> : null}
        {row.luckyGuess ? <Badge tone="ember" variant="outline" shape="none">Lucky guess</Badge> : null}
      </div>
      <div>
        <p className="rule-label mb-2">{row.sectionName} · {row.topicName}</p>
        <MathText text={row.question.body} className="block text-sm leading-relaxed text-heading" />
      </div>
      {row.question.type === 'numeric' ? (
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-surface-sunken px-4 py-3 text-xs">
          <div><dt className="rule-label">Your answer</dt><dd className="mt-1 font-mono text-heading">{answerLabel(row, row.studentAnswer)}</dd></div>
          <div><dt className="rule-label">Correct answer</dt><dd className="mt-1 font-mono text-answer-fg">{answerLabel(row, row.correctAnswer)}</dd></div>
        </dl>
      ) : (
        <ul className="divide-y divide-line border-y border-line" aria-label="Options">
          {row.question.options.map((option) => {
            const correct = row.correctAnswer.includes(option.key)
            const selected = row.studentAnswer.includes(option.key)
            return (
              <li key={option.key} className="flex items-start gap-3 py-3 text-xs">
                <span className="mt-0.5 font-mono text-heading">{option.key}</span>
                <MathText text={option.body} className="min-w-0 flex-1 text-body" />
                <span className="flex shrink-0 flex-col items-end gap-1">{correct ? <Badge tone="answer" variant="soft" shape="none">Key</Badge> : null}{selected ? <Badge tone={correct ? 'answer' : 'danger'} variant="outline" shape="none">You</Badge> : null}</span>
              </li>
            )
          })}
        </ul>
      )}
      <section aria-label="Official explanation">
        <h3 className="rule-label mb-2">Official explanation</h3>
        <div className="rounded-md border border-line bg-surface-sunken px-4 py-3"><MathText text={row.explanation} className="block text-xs leading-relaxed text-body" /></div>
      </section>
      <section aria-label="Batch option distribution">
        <div className="mb-3 flex items-center justify-between gap-3"><h3 className="rule-label">Batch response split</h3><p className="text-2xs text-muted">Difficulty index <span className="font-mono text-heading">{formatNumber(row.difficultyIndex, { suffix: '%' })}</span> · {difficultyLabel(row.difficultyIndex)}</p></div>
        <ul className="flex flex-col gap-3">
          {row.responseDistribution.map((item) => (
            <li key={item.key} className="text-xs">
              <div className="mb-1 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-body"><span className="font-mono text-heading">{item.label}</span>{item.correct ? <Badge tone="answer" variant="soft" shape="none">Key</Badge> : null}{item.selectedByStudent ? <Badge tone="neutral" variant="outline" shape="none">You</Badge> : null}</span><span className="font-mono tabular-nums text-muted">{item.count} · {formatNumber(item.percent, { digits: 1, suffix: '%' })}</span></div>
              <div className="h-2 rounded-full bg-surface-sunken" role="img" aria-label={`${item.label}: ${item.count} students, ${item.percent} percent`}><div className={item.correct ? 'h-full rounded-full bg-answer' : 'h-full rounded-full bg-idle'} style={{ width: `${item.percent}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** @param {{ row: QuestionAnalysis | null, onClose: () => void, examId: string, attemptId: string }} props */
export function QuestionDrawer({ row, onClose, examId, attemptId }) {
  return (
    <Sheet open={Boolean(row)} onClose={onClose} title={row ? `Question ${row.number} analysis` : 'Question analysis'} description={row ? `${row.sectionName} · ${row.topicName}` : undefined} size="lg"
      footer={row ? <Link to={`/student/revision/${row.topicId}?exam=${encodeURIComponent(examId)}${attemptId ? `&attempt=${encodeURIComponent(attemptId)}` : ''}`} className="inline-flex min-h-[var(--spacing-touch)] items-center gap-2 rounded-sm border border-heading bg-heading px-4 text-xs font-[560] text-on-inverse hover:opacity-90">Revise this topic<ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" /></Link> : null}>
      {row ? <DrawerBody row={row} /> : null}
    </Sheet>
  )
}
