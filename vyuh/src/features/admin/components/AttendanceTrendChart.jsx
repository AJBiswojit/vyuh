import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame } from '@/features/analysis/components/ChartFrame.jsx'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { formatNumber } from '@/shared/lib/format.js'

/**
 * Attendance by week. One line, because the office asks one question here: is
 * the term drifting? The early-warning line is drawn at 85%, which is the number
 * the alerts use, so the chart and the alert list cannot tell different stories.
 *
 * @param {{ data: import('@/contracts/admin.js').AttendanceTrendPoint[] }} props
 */
export function AttendanceTrendChart({ data }) {
  const tokens = readChartTokens()
  const last = data[data.length - 1]

  return (
    <ChartFrame
      eyebrow="Last twelve weeks"
      title="Attendance trend"
      description="Present marks as a share of possible marks across every active batch. Weighted by batch size, so a small batch cannot move the line on its own."
      table={{
        caption: 'Attendance by week: present marks, possible marks and percentage',
        rows: data,
        columns: [
          { key: 'label', label: 'Week of' },
          { key: 'sessions', label: 'Sessions', align: 'right' },
          { key: 'present', label: 'Present marks', align: 'right', format: (value) => formatNumber(Number(value)) },
          { key: 'possible', label: 'Possible marks', align: 'right', format: (value) => formatNumber(Number(value)) },
          { key: 'percent', label: 'Attendance', align: 'right', format: (value) => `${Number(value).toFixed(1)}%` },
        ],
      }}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-2xs text-muted">Weeks beginning 17 August to 2 November 2026.</p>
        <p className="font-mono text-2xs tabular-nums text-heading" data-testid="trend-latest">
          {last ? `${last.percent.toFixed(1)}% · w/c ${last.label}` : '—'}
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }} accessibilityLayer>
            <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: tokens.axisText }}
              axisLine={{ stroke: tokens.grid }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[80, 92]}
              ticks={[80, 84, 88, 92]}
              tick={{ fontSize: 12, fill: tokens.axisText }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Attendance']}
            />
            <ReferenceLine
              y={85}
              stroke={tokens.review}
              strokeDasharray="4 4"
              label={{ value: 'Early warning · 85%', position: 'insideTopRight', fontSize: 12, fill: tokens.axisText }}
            />
            <Line
              type="monotone"
              dataKey="percent"
              name="Attendance"
              stroke={tokens.ember}
              strokeWidth={2}
              dot={{ r: 3, fill: tokens.ember, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
