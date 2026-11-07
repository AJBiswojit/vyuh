import { Link } from 'react-router-dom'
import { ArrowUpRight, FileText } from 'lucide-react'
import { Card } from '@/shared/ui/Card.jsx'
import { EmptyState } from '@/shared/ui/EmptyState.jsx'
import { formatDate, formatMarks } from '@/shared/lib/format.js'
import { Sparkline } from './Sparkline.jsx'

/** Last five attempts. A table on wider screens; a stacked ledger on phones so
 * score, percentile and sparkline stay visible without horizontal scrolling.
 * @param {{ attempts: import('@/contracts/student.js').AttemptSummary[] }} props
 */
export function RecentResultsCard({ attempts }) {
  const resultSheet = '/student/exams/exam-neet-practice/result'
  return (
    <Card eyebrow="Recent results" title="Last five attempts"
      action={<span className="flex items-center gap-3"><Link to={resultSheet} className="inline-flex min-h-9 items-center gap-1 rounded-xs px-1.5 text-2xs font-[560] text-heading hover:text-ember-press">Result sheet<ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" /></Link><Link to="/student/performance" className="inline-flex min-h-9 items-center gap-1 rounded-xs px-1.5 text-2xs font-[560] text-heading hover:text-ember-press">Performance<ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" /></Link></span>}>
      {attempts.length === 0 ? (
        <EmptyState icon={<FileText strokeWidth={1.5} />} title="No past attempts yet" description="Once you submit a paper, its score and percentile appear here. Your first mock is the baseline." code="0 attempts" />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Recent attempts with score, percentile and score sparkline</caption>
              <thead><tr className="border-b border-line"><th scope="col" className="rule-label py-2 font-normal">Paper</th><th scope="col" className="rule-label py-2 text-right font-normal">Score</th><th scope="col" className="rule-label py-2 text-right font-normal">Percentile</th><th scope="col" className="rule-label py-2 text-right font-normal">Trend</th></tr></thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 pr-3 text-xs font-[560] text-heading"><Link to={`/student/exams/${attempt.examId}`} className="block hover:text-ember-press">{attempt.title}</Link><span className="mt-0.5 block font-mono text-2xs font-normal text-faint">{formatDate(attempt.submittedAt)}</span></th>
                    <td className="py-3 text-right font-mono text-xs tabular-nums text-body">{formatMarks(attempt.score, attempt.maxMarks)}</td>
                    <td className="py-3 text-right font-mono text-xs tabular-nums text-heading">{attempt.percentile.toFixed(1)}</td>
                    <td className="py-3 pl-3 text-right"><Sparkline values={attempt.sparkline} label={`${attempt.title} score trend`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="divide-y divide-line md:hidden" aria-label="Recent attempts">
            {attempts.map((attempt) => (
              <li key={attempt.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><Link to={`/student/exams/${attempt.examId}`} className="block text-xs font-[560] text-heading hover:text-ember-press">{attempt.title}</Link><p className="mt-0.5 font-mono text-2xs text-faint">{formatDate(attempt.submittedAt)}</p></div>
                  <p className="shrink-0 font-mono text-xs tabular-nums text-heading">{formatMarks(attempt.score, attempt.maxMarks)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-2xs text-muted">Percentile <span className="ml-1 font-mono tabular-nums text-heading">{attempt.percentile.toFixed(1)}</span></p>
                  <Sparkline values={attempt.sparkline} label={`${attempt.title} score trend`} />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  )
}
