import { Button, Logo } from '@/shared/ui'
import { ExamTimer } from './ExamTimer.jsx'
import { StatusLegend } from './StatusShape.jsx'

/** @param {{ examTitle: string, candidate: import('@/contracts/exam.js').ExamCandidate, remaining: number, timerSource: 'worker'|'fallback', tabSwitches: number, onSubmit: () => void }} props */
export function ExamHallHeader({ examTitle, candidate, remaining, timerSource, tabSwitches, onSubmit }) {
  return (
    <header className="border-b border-line bg-surface-raised px-2 py-1.5 sm:px-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3 sm:gap-y-1.5">
        <Logo withName={false} size="sm" />
        <div className="min-w-0 flex-1 basis-32">
          <h1 className="truncate text-2xs font-[560] text-heading sm:text-xs">{examTitle}</h1>
          <p className="mt-0.5 truncate text-2xs text-muted">{candidate.name} · Roll <span className="font-mono tabular-nums">{candidate.rollNumber}</span></p>
        </div>
        <ExamTimer remaining={remaining} source={timerSource} className="max-sm:px-2 max-sm:py-0.5 max-sm:text-base" />
        <p className="text-2xs text-muted max-sm:order-5" aria-label={`Tab switches ${tabSwitches}`}>Tab switches <span className="font-mono tabular-nums text-heading" data-testid="tab-switches">{tabSwitches}</span></p>
        <Button variant="secondary" size="sm" className="max-sm:order-6 max-sm:ml-auto max-sm:px-2 max-sm:text-2xs" onClick={onSubmit}>Review and submit</Button>
      </div>
      <StatusLegend className="mt-1.5 max-sm:mt-1" />
    </header>
  )
}
