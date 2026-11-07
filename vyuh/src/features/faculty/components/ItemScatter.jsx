import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { readChartTokens } from '@/shared/lib/chartTokens.js'
import { ChartFrame } from '@/features/analysis/components/ChartFrame.jsx'
import { difficultyLabel, discriminationLabel } from '@/shared/lib/facultyMath.js'

/**
 * Difficulty against discrimination — the canonical item-analysis picture.
 *
 * x is the proportion who answered correctly (a hard item sits left), y is the
 * discrimination index (an item that separates strong from weak candidates sits
 * high). The dashed line at r = 0.10 is the policy line: below it, strong and
 * weak candidates perform alike, and the item is flagged.
 *
 * Every point is a button in the table view, so the chart is never the only way
 * to reach the underlying numbers.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').ItemPoint[]} props.points
 * @param {string|null} props.selectedId
 * @param {(questionId: string) => void} props.onSelect
 */
export function ItemScatter({ points, selectedId, onSelect }) {
  const tokens = readChartTokens()
  const data = points.map((point) => ({
    ...point,
    x: point.difficultyIndex,
    y: point.discrimination,
  }))
  const normal = data.filter((point) => !point.flagged && !point.faulty)
  const flagged = data.filter((point) => point.flagged && !point.faulty)
  const faulty = data.filter((point) => point.faulty)
  const selected = data.find((point) => point.questionId === selectedId)

  return (
    <ChartFrame
      eyebrow="Item analysis"
      title="Difficulty against discrimination"
      description="Left means harder. Below the dashed line, strong and weak candidates answered alike — the case worth flagging."
      table={{
        caption: 'Every analysed item with its difficulty and discrimination index',
        rows: points,
        columns: [
          { key: 'number', label: 'Q', align: 'right' },
          { key: 'questionId', label: 'Item' },
          { key: 'topicName', label: 'Topic' },
          { key: 'difficultyIndex', label: 'Difficulty', align: 'right', format: (value) => value.toFixed(2) },
          { key: 'discrimination', label: 'Discrimination', align: 'right', format: (value) => value.toFixed(2) },
          { key: 'flagReason', label: 'Flag', format: (value) => value ?? '—' },
        ],
      }}
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -18 }} accessibilityLayer>
            <CartesianGrid stroke={tokens.grid} strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 1]}
              tickCount={6}
              name="Difficulty index"
              tick={{ fontSize: 12, fill: tokens.axisText }}
              axisLine={{ stroke: tokens.grid }}
              tickLine={false}
              label={{ value: 'Difficulty (proportion correct)', position: 'insideBottom', offset: -2, style: { fontSize: 12, fill: tokens.axisText } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.3, 1]}
              tickCount={5}
              name="Discrimination"
              tick={{ fontSize: 12, fill: tokens.axisText }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <ZAxis range={[70, 70]} />
            <ReferenceLine y={0.1} stroke={tokens.review} strokeDasharray="4 4" label={{ value: 'flag line', position: 'insideTopRight', style: { fontSize: 12, fill: tokens.axisText } }} />
            <ReferenceLine y={0} stroke={tokens.grid} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: tokens.surface, border: `1px solid ${tokens.grid}`, borderRadius: 6, fontSize: 12 }}
              formatter={(/** @type {number} */ value) => value.toFixed(2)}
              labelFormatter={() => ''}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = /** @type {any} */ (payload[0]?.payload)
                if (!point) return null
                return (
                  <div className="max-w-[16rem] rounded-sm border border-line bg-surface-raised px-3 py-2 text-2xs text-body shadow-[var(--shadow-float)]">
                    <p className="font-mono text-2xs text-faint">Q{point.number} · {point.questionId}</p>
                    <p className="mt-1 font-[560] text-heading">{point.topicName}</p>
                    <p className="mt-1">Difficulty {point.difficultyIndex.toFixed(2)} · {difficultyLabel(point.difficultyIndex)}</p>
                    <p>Discrimination {point.discrimination.toFixed(2)} · {discriminationLabel(point.discrimination)}</p>
                    {point.flagReason ? <p className="mt-1 text-review-fg">{point.flagReason}</p> : null}
                  </div>
                )
              }}
            />
            <Scatter
              name="On target"
              data={normal}
              fill={tokens.ink}
              isAnimationActive={false}
              onClick={(/** @type {any} */ payload) => onSelect?.(payload?.questionId)}
            />
            <Scatter
              name="Flagged — weak separation"
              data={flagged}
              fill={tokens.review}
              shape="diamond"
              isAnimationActive={false}
              onClick={(/** @type {any} */ payload) => onSelect?.(payload?.questionId)}
            />
            <Scatter
              name="Marked faulty"
              data={faulty}
              fill={tokens.danger}
              isAnimationActive={false}
              onClick={(/** @type {any} */ payload) => onSelect?.(payload?.questionId)}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-2xs text-muted" aria-label="Scatter legend">
        <li><span className="mr-1.5 inline-block size-2.5 rounded-full bg-heading align-middle" aria-hidden="true" />On target</li>
        <li><span className="mr-1.5 inline-block size-2.5 rotate-45 bg-review align-middle" aria-hidden="true" />Flagged</li>
        <li><span className="mr-1.5 inline-block size-2.5 rounded-full bg-danger align-middle" aria-hidden="true" />Marked faulty</li>
      </ul>
      {selected ? (
        <p className="mt-2 text-2xs text-muted" aria-live="polite">
          Selected Q{selected.number} · {selected.topicName} · p {selected.difficultyIndex.toFixed(2)} · r {selected.discrimination.toFixed(2)}
        </p>
      ) : null}
    </ChartFrame>
  )
}
