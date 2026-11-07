import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { ChartFrame } from './ChartFrame.jsx'

/** @param {{ slices: import('@/contracts/analysis.js').MistakeDnaSlice[], dominant: import('@/contracts/analysis.js').MistakeCategory | null, advice: string }} props */
export function MistakeDnaChart({ slices, dominant, advice }) {
  const tokens = readChartTokens()
  const fills = { conceptual: tokens.danger, careless: tokens.review, time_pressure: tokens.info, misread: tokens.idle, guess: tokens.ember }
  const center = slices.find((slice) => slice.id === dominant) ?? slices[0]
  return (
    <ChartFrame eyebrow="Mistake DNA" title="Why marks leaked" description="Wrong answers grouped by the most likely cause. The centre names the dominant pattern."
      table={{ caption: 'Mistake DNA: category, count, share of wrong answers and advice', rows: slices, columns: [
        { key: 'label', label: 'Category' }, { key: 'count', label: 'Count', align: 'right' }, { key: 'percent', label: 'Share', align: 'right', format: (value) => `${value}%` }, { key: 'advice', label: 'Advice' },
      ] }}>
      {slices.length === 0 ? <p className="py-10 text-center text-xs text-muted">No wrong answers to classify.</p> : (
        <>
          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Tooltip contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }} />
                <Pie data={slices} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="82%" paddingAngle={2} stroke={tokens.surface}>
                  {slices.map((slice) => <Cell key={slice.id} fill={fills[slice.id]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
              <p className="rule-label">Dominant</p>
              <p className="mt-1 text-sm font-[560] text-heading">{center?.label ?? 'None'}</p>
              <p className="font-mono text-2xs tabular-nums text-muted">{center?.count ?? 0} wrong</p>
            </div>
          </div>
          <p className="mt-3 rounded-sm border border-line bg-surface-sunken px-3 py-2 text-xs leading-relaxed text-body">{advice}</p>
        </>
      )}
    </ChartFrame>
  )
}
