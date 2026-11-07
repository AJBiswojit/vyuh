import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/shared/ui/Card.jsx'
import { Badge } from '@/shared/ui/Badge.jsx'
import { cn } from '@/shared/lib/cn.js'
import { formatMarks } from '@/shared/lib/format.js'
import { useTheme } from '@/app/providers/ThemeProvider.jsx'
import { readChartTokens } from '@/shared/lib/chartTokens.js'

/**
 * Score trend across the last six mocks, against the cohort average.
 *
 * Two series only, and each is labelled in the legend: the student's score in
 * ember (the signal colour is earned here — this line is the point of the card)
 * and the cohort mean as a dashed dust hairline. Grid is hairline. No area fill,
 * no gradient, no rounded bar caps.
 *
 * @param {{ points: import('../../../contracts/assessment.js').TrendPoint[] }} props
 */
export function ScoreTrendCard({ points }) {
  const { resolved } = useTheme()
  const dark = resolved === 'dark'
  const [activeIndex, setActiveIndex] = useState(/** @type {number | null} */ (null))

  // Recharts needs concrete colour strings, so the tokens are read off the
  // document rather than duplicated here. `resolved` is a dependency so the
  // chart repaints when the theme changes.
  const tokens = useMemo(() => readChartTokens(), [resolved])
  const { surface, grid, axisText, ember, idle } = tokens

  const last = points[points.length - 1]
  const first = points[0]
  const delta = last && first ? last.score - first.score : 0
  const active = activeIndex === null ? null : points[activeIndex]

  if (points.length === 0) {
    return (
      <Card eyebrow="Performance" title="Six-mock trend">
        <p className="text-sm text-muted">
          No papers have been evaluated yet this term. Your first mock results will chart here.
        </p>
      </Card>
    )
  }

  return (
    <Card
      eyebrow="Performance · JEE Main pattern"
      title="Six-mock trend"
      action={
        <Badge tone={delta >= 0 ? 'answer' : 'danger'} variant="soft" mono>
          {delta >= 0 ? '+' : '−'}
          {Math.abs(delta)} marks
        </Badge>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ul className="flex items-center gap-4">
            <li className="flex items-center gap-1.5 text-2xs text-muted">
              <span className="h-[2px] w-5 rounded-full bg-ember" aria-hidden="true" />
              Your score
            </li>
            <li className="flex items-center gap-1.5 text-2xs text-muted">
              <span className="h-[2px] w-5 border-t border-dashed border-idle" aria-hidden="true" />
              Batch average
            </li>
          </ul>
          <p className="font-mono text-2xs tabular-nums text-faint">
            {active ? `${active.label} · ${formatMarks(active.score, 300)}` : `${points.length} papers · max 300`}
          </p>
        </div>
      }
    >
      <div className="h-[13.5rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            onMouseMove={(state) => {
              if (typeof state.activeTooltipIndex === 'number') setActiveIndex(state.activeTooltipIndex)
            }}
            onMouseLeave={() => setActiveIndex(null)}
            accessibilityLayer
          >
            <CartesianGrid stroke={grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: axisText, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: grid }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[100, 300]}
              ticks={[100, 150, 200, 250, 300]}
              tick={{ fontSize: 12, fill: axisText, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: grid, strokeWidth: 1 }}
              content={({ active: isActive, payload }) => {
                if (!isActive || !payload?.length) return null
                const point = /** @type {any} */ (payload[0].payload)
                return (
                  <div
                    className={cn(
                      'rounded-sm border border-line bg-surface-raised px-2.5 py-2 shadow-[var(--shadow-float)]',
                    )}
                  >
                    <p className="font-mono text-2xs uppercase tracking-widest text-faint">{point.label}</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-heading">{point.score} / 300</p>
                    <p className="font-mono text-2xs tabular-nums text-muted">
                      avg {point.cohortAverage} · {point.percentile} pct
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="cohortAverage"
              stroke={idle}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive
              animationDuration={650}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={ember}
              strokeWidth={2}
              dot={{ r: 2.5, fill: surface, stroke: ember, strokeWidth: 2 }}
              activeDot={{ r: 4, fill: ember, stroke: surface, strokeWidth: 2 }}
              isAnimationActive
              animationDuration={750}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
