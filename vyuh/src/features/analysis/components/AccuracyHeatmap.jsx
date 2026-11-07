import { formatNumber } from '@/shared/lib/format.js'
import { ChartFrame } from './ChartFrame.jsx'

/** @param {{ cells: import('@/contracts/analysis.js').HeatmapCell[] }} props */
export function AccuracyHeatmap({ cells }) {
  const sections = [...new Map(cells.map((cell) => [cell.sectionId, cell.sectionName])).entries()]
  return (
    <ChartFrame eyebrow="Accuracy" title="Section and topic heatmap" description="Accuracy among attempted questions. Darker cells mean a higher correct share."
      table={{ caption: 'Accuracy heatmap: section, topic, correct, attempted and accuracy', rows: cells, columns: [
        { key: 'sectionName', label: 'Section' }, { key: 'topicName', label: 'Topic' }, { key: 'correct', label: 'Correct', align: 'right' },
        { key: 'attempted', label: 'Attempted', align: 'right' }, { key: 'accuracy', label: 'Accuracy', align: 'right', format: (value) => `${value}%` },
      ] }}>
      <div className="flex flex-col gap-5">
        {sections.map(([sectionId, sectionName]) => (
          <section key={sectionId} aria-label={sectionName}>
            <h4 className="rule-label mb-2">{sectionName}</h4>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {cells.filter((cell) => cell.sectionId === sectionId).map((cell) => (
                <li key={cell.topicId} className="rounded-sm border border-line px-3 py-3" style={{ background: `color-mix(in oklab, var(--color-answer) ${Math.round(cell.accuracy * 0.35)}%, var(--color-surface-sunken))` }}>
                  <p className="truncate text-xs font-[560] text-heading">{cell.topicName}</p>
                  <p className="mt-1 font-mono text-lg tabular-nums text-heading">{formatNumber(cell.accuracy, { digits: 1, suffix: '%' })}</p>
                  <p className="text-2xs text-body">{cell.correct} correct · {cell.attempted} attempted</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ChartFrame>
  )
}
