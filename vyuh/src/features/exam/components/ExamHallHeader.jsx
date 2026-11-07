import { Button, Logo } from '@/shared/ui'
import { ExamTimer } from './ExamTimer.jsx'
import { StatusLegend } from './StatusShape.jsx'

/** @param {{ examTitle: string, candidate: import('@/contracts/exam.js').ExamCandidate, remaining: number, timerSource: 'worker'|'fallback', tabSwitches: number, onSubmit: () => void }} props */
export function ExamHallHeader({ examTitle, candidate, remaining, timerSource, tabSwitches, onSubmit }) {
  return (
    <header className="border-b border-line bg-surface-raised px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Logo withName={false} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-[560] text-heading">{examTitle}</h1>
          <p className="mt-0.5 text-2xs text-muted">{candidate.name} · Roll <span className="font-mono tabular-nums">{candidate.rollNumber}</span></p>
        </div>
        <ExamTimer remaining={remaining} source={timerSource} />
        <p className="text-2xs text-muted" aria-label={`Tab switches ${tabSwitches}`}>Tab switches <span className="font-mono tabular-nums text-heading" data-testid="tab-switches">{tabSwitches}</span></p>
        <Button variant="secondary" size="sm" onClick={onSubmit}>Review and submit</Button>
      </div>
      <StatusLegend className="mt-3" />
    </header>
  )
}
