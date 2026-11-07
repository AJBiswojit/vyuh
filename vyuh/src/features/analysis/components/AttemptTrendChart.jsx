import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { formatDate } from '@/shared/lib/format.js'
import { ChartFrame } from './ChartFrame.jsx'

/** Historical trend is normalized from attempts.js by the analysis service. @param {{ points: import('@/contracts/analysis.js').AnalysisTrendPoint[] }} props */
export function AttemptTrendChart({ points }) {
  const tokens = readChartTokens()
  return (
    <ChartFrame eyebrow="Across attempts" title="Historical score trend" description="Past JEE mocks from the attempts ledger, shown as score percent so papers with different maxima stay comparable."
      table={{ caption: 'Attempt trend: paper, date, track, score, score percent, percentile and cohort average percent', rows: points, columns: [
        { key: 'label', label: 'Paper' }, { key: 'date', label: 'Date', format: (value) => formatDate(value) }, { key: 'track', label: 'Track' },
        { key: 'score', label: 'Score', align: 'right', format: (value, row) => `${value}/${row.maxMarks}` }, { key: 'scorePercent', label: 'Score %', align: 'right', format: (value) => `${value}%` },
        { key: 'percentile', label: 'Percentile', align: 'right' }, { key: 'cohortAveragePercent', label: 'Batch avg %', align: 'right', format: (value) => `${value}%` },
      ] }}>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
            <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={{ stroke: tokens.grid }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={false} tickLine={false} width={44} unit="%" />
            <Tooltip contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }} />
            <Line type="monotone" dataKey="cohortAveragePercent" name="Batch average %" stroke={tokens.idle} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="scorePercent" name="Your score %" stroke={tokens.ember} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
