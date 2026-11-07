import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { durations } from '@/shared/lib/motion.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { ChartFrame } from './ChartFrame.jsx'

/** @param {{ points: import('@/contracts/analysis.js').PacingPoint[] }} props */
export function PacingChart({ points }) {
  const tokens = readChartTokens()
  const reduced = usePrefersReducedMotion()
  const flags = points.filter((point) => point.flag)
  return (
    <ChartFrame eyebrow="Pacing" title="Time per question" description="Your seconds against the batch median band. Dots mark rushed or stalled questions."
      table={{ caption: 'Pacing data: student seconds, cohort average, median band and flags', rows: points, columns: [
        { key: 'questionNumber', label: 'Question', align: 'right' }, { key: 'studentSeconds', label: 'You (s)', align: 'right' },
        { key: 'cohortAverageSeconds', label: 'Batch avg (s)', align: 'right' }, { key: 'cohortMedianSeconds', label: 'Median (s)', align: 'right' },
        { key: 'cohortBand', label: 'Band (s)', format: (value) => `${value[0]}–${value[1]}` }, { key: 'flag', label: 'Flag', format: (value) => value ?? '—' },
      ] }}>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
            <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="questionNumber" tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={{ stroke: tokens.grid }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={false} tickLine={false} width={44} unit="s" />
            <Tooltip contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }} />
            <Area type="monotone" dataKey="cohortBand" name="Batch median band" stroke="none" fill={tokens.idle} fillOpacity={0.14} isAnimationActive={false} />
            <Line type="monotone" dataKey="cohortMedianSeconds" name="Batch median" stroke={tokens.idle} strokeDasharray="2 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="studentSeconds" name="Your time" stroke={tokens.ember} strokeWidth={2} fill={tokens.ember} fillOpacity={0.08} animationDuration={durations.expressive * 1000} isAnimationActive={!reduced} dot={false} />
            {flags.map((point) => <ReferenceDot key={point.questionId} x={point.questionNumber} y={point.studentSeconds} r={4} fill={point.flag === 'rushed' ? tokens.info : tokens.danger} stroke={tokens.surface} />)}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-2xs text-muted" aria-label="Pacing legend">
        <li><span className="mr-1.5 inline-block h-0.5 w-4 align-middle bg-ember" aria-hidden="true" />You</li>
        <li><span className="mr-1.5 inline-block h-0.5 w-4 align-middle border-t border-dashed border-idle-fg" aria-hidden="true" />Batch median</li>
        <li><span className="mr-1.5 inline-block size-2 rounded-full bg-info" aria-hidden="true" />Rushed</li>
        <li><span className="mr-1.5 inline-block size-2 rounded-full bg-danger" aria-hidden="true" />Stalled</li>
      </ul>
    </ChartFrame>
  )
}
