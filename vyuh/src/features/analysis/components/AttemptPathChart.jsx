import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { formatDateTime } from '@/shared/lib/format.js'
import { ChartFrame } from './ChartFrame.jsx'

/** @param {{ visits: import('@/contracts/analysis.js').AttemptVisit[] }} props */
export function AttemptPathChart({ visits }) {
  const tokens = readChartTokens()
  return (
    <ChartFrame eyebrow="Attempt path" title="Question visit replay" description="Each bar is one visit in the order it happened; height is time spent before moving on."
      table={{ caption: 'Attempt path: visit order, question, section, entry time and duration', rows: visits, columns: [
        { key: 'sequence', label: 'Visit', align: 'right' }, { key: 'questionNumber', label: 'Question', align: 'right' }, { key: 'sectionName', label: 'Section' },
        { key: 'enteredAt', label: 'Entered', format: (value) => formatDateTime(value) }, { key: 'durationSeconds', label: 'Seconds', align: 'right' },
      ] }}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visits} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
            <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="sequence" tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={{ stroke: tokens.grid }} tickLine={false} tickFormatter={(value) => `Q${visits[Number(value) - 1]?.questionNumber ?? value}`} />
            <YAxis tick={{ fontSize: 12, fill: tokens.axisText }} axisLine={false} tickLine={false} width={44} unit="s" />
            <Tooltip contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }} labelFormatter={(value) => { const visit = visits[Number(value) - 1]; return visit ? `Visit ${visit.sequence}: Q${visit.questionNumber} · ${visit.sectionName}` : String(value) }} />
            <Bar dataKey="durationSeconds" name="Duration" fill={tokens.ember} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
