import { cn } from '@/shared/lib/cn.js'
import { countStatuses } from '../lib/examState.js'

/** @param {{ sections: import('@/contracts/exam.js').ExamSection[], entries: Record<string, import('@/contracts/assessment.js').AnswerEntry>, activeSectionId: string, onSelect: (section: import('@/contracts/exam.js').ExamSection) => void }} props */
export function SectionTabs({ sections, entries, activeSectionId, onSelect }) {
  return (
    <div role="tablist" aria-label="Exam sections" className="flex gap-1.5 overflow-x-auto border-b border-line pb-px">
      {sections.map((section) => {
        const counts = countStatuses(entries, section.questionIds)
        const done = counts.answered + counts.review_answered
        const percent = section.questionIds.length ? Math.round((done / section.questionIds.length) * 100) : 0
        const active = section.id === activeSectionId
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(section)}
            className={cn('min-w-28 flex-1 rounded-t-sm border-x border-t px-2 py-1.5 text-left transition-colors', active ? 'border-line bg-surface-raised text-heading' : 'border-transparent text-muted hover:text-heading')}
          >
            <span className="flex items-center justify-between gap-2 text-xs font-[560]"><span>{section.name}</span><span className="font-mono text-2xs tabular-nums">{done}/{section.questionIds.length}</span></span>
            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={`${section.name} completion`}>
              <span className="block h-full rounded-full bg-answer" style={{ width: `${percent}%` }} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
