import { Badge, Card } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatMarks } from '@/shared/lib/format.js'

/**
 * The score register, as the students will meet it.
 *
 * When an item is marked faulty the policy is applied to every candidate: a
 * correct response keeps its award as grace, a wrong response loses its penalty.
 * The table shows before, after and the signed change; the student's own result
 * sheet reads the same register, so what faculty see here is what a candidate
 * sees there.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').ScoreImpactRow[]} props.rows
 * @param {number} props.maxMarks
 * @param {number} props.faultyCount
 */
export function ScoreImpactTable({ rows, maxMarks, faultyCount }) {
  const affected = rows.filter((row) => row.delta !== 0)
  const sorted = [...rows].sort((a, b) => b.after - a.after)

  return (
    <Card
      eyebrow="Student-facing scores"
      title="Score register after faults"
      action={
        faultyCount > 0 ? (
          <Badge tone="danger" variant="outline" shape="none" mono>
            {faultyCount} {faultyCount === 1 ? 'item voided' : 'items voided'}
          </Badge>
        ) : (
          <Badge tone="neutral" variant="outline" shape="none">No faults marked</Badge>
        )
      }
    >
      <p className="mb-3 max-w-prose text-2xs leading-relaxed text-muted" data-testid="score-policy">
        A faulty item is dropped from scoring: correct answers keep the mark as grace, wrong answers lose the
        negative. {affected.length} of {rows.length} candidates move.
      </p>
      <div className="max-h-[24rem] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Cohort scores before and after marked faults</caption>
          <thead className="sticky top-0 bg-surface-raised">
            <tr className="border-b border-line text-2xs uppercase tracking-widest text-faint">
              <th scope="col" className="py-2 pr-3 font-normal">Candidate</th>
              <th scope="col" className="py-2 pr-3 font-normal">Roll</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">Before</th>
              <th scope="col" className="py-2 pr-3 text-right font-normal">After</th>
              <th scope="col" className="py-2 text-right font-normal">Change</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.studentId} className={cn('border-b border-line last:border-0', row.delta !== 0 && 'bg-[color-mix(in_oklab,var(--color-review)_8%,transparent)]')}>
                <th scope="row" className="py-2 pr-3 font-[560] text-heading">{row.name}</th>
                <td className="py-2 pr-3 font-mono text-2xs tabular-nums text-faint">{row.rollNumber}</td>
                <td className="py-2 pr-3 text-right font-mono text-2xs tabular-nums text-muted">{formatMarks(row.before, maxMarks)}</td>
                <td className="py-2 pr-3 text-right font-mono text-2xs tabular-nums text-heading">{formatMarks(row.after, maxMarks)}</td>
                <td className={cn('py-2 text-right font-mono text-2xs tabular-nums', row.delta > 0 ? 'text-answer-fg' : row.delta < 0 ? 'text-danger-fg' : 'text-faint')}>
                  {row.delta === 0 ? '—' : `${row.delta > 0 ? '+' : ''}${row.delta}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
