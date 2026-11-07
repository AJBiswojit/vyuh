import { ArrowUpRight, MinusCircle, Target, Timer, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { formatDuration, formatMarks, formatNumber } from '@/shared/lib/format.js'

/**
 * Last evaluated paper. The score is the largest numeral on the screen after
 * the page title, set in Fraunces with a mono denominator — marks are the one
 * place the display face and the mono face share a line.
 *
 * The three secondary stats are a ruled table, not three identical cards.
 *
 * @param {{ report: import('../../../contracts/assessment.js').ScoreReport }} props
 */
export function ReportCard({ report }) {
  const accuracyTone = report.accuracy >= 75 ? 'answer' : report.accuracy >= 60 ? 'review' : 'danger'

  return (
    <Card
      eyebrow="Latest report · Full Syllabus Mock 03"
      title="Where you stand"
      action={
        <Link
          to="/app/reports/latest"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xs px-1.5 text-2xs font-[560] text-heading transition-colors hover:text-ember-press"
        >
          Full report
          <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      }
      footer={
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li className="flex items-center gap-1.5 text-2xs text-muted">
            <span className="size-2 rounded-full bg-answer" aria-hidden="true" />
            {report.correct} correct
          </li>
          <li className="flex items-center gap-1.5 text-2xs text-muted">
            <span className="size-2 rounded-full bg-danger" aria-hidden="true" />
            {report.wrong} wrong
          </li>
          <li className="flex items-center gap-1.5 text-2xs text-muted">
            <span className="size-2 rounded-sm border border-idle" aria-hidden="true" />
            {report.unattempted} left blank
          </li>
        </ul>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-5xl leading-none tracking-tightest text-heading" style={{ fontVariationSettings: "'wght' 520" }}>
              {report.score}
            </span>
            <span className="font-mono text-xl tabular-nums leading-none text-faint">/ {report.maxMarks}</span>
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Trophy className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
            Rank <span className="font-mono tabular-nums text-heading">{formatNumber(report.rank)}</span> of{' '}
            <span className="font-mono tabular-nums">{formatNumber(report.cohortSize)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="answer" variant="outline" mono>
            {report.percentile.toFixed(1)} pct
          </Badge>
          <Badge tone={accuracyTone} variant="soft" mono>
            {report.accuracy.toFixed(1)}% accuracy
          </Badge>
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-left">
        <caption className="sr-only">Subject split for the last evaluated paper</caption>
        <thead>
          <tr>
            <th scope="col" className="rule-label py-1.5 font-normal">Subject</th>
            <th scope="col" className="rule-label py-1.5 text-right font-normal">Marks</th>
            <th scope="col" className="rule-label py-1.5 text-right font-normal">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.map((subject) => (
            <tr key={subject.subjectId} className="border-t border-line">
              <th scope="row" className="py-2.5 text-xs font-[560] tracking-tight text-heading">
                {subject.subjectName}
              </th>
              <td className="py-2.5 text-right font-mono text-xs tabular-nums text-body">
                {formatMarks(subject.scored, subject.max)}
              </td>
              <td className="py-2.5 text-right">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-body">
                  <span
                    className={
                      subject.accuracy >= 75
                        ? 'size-1.5 rounded-full bg-answer'
                        : subject.accuracy >= 60
                          ? 'size-1.5 rounded-full bg-review'
                          : 'size-1.5 rounded-full bg-danger'
                    }
                    aria-hidden="true"
                  />
                  {subject.accuracy.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3.5">
        <span className="flex items-center gap-1.5 text-2xs text-muted">
          <Timer className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
          {formatDuration(report.durationSeconds)} of 3h used
        </span>
        <span className="flex items-center gap-1.5 text-2xs text-muted">
          <Target className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
          {report.attempted} of {report.attempted + report.unattempted} attempted
        </span>
        <span className="flex items-center gap-1.5 text-2xs text-muted">
          <MinusCircle className="size-3.5 text-faint" strokeWidth={1.5} aria-hidden="true" />
          Negative marking cost {report.wrong} marks
        </span>
      </div>
    </Card>
  )
}
