import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { formatClock } from '@/shared/lib/format.js'

/** @param {{ chapters: import('@/contracts/learning.js').RecordingChapter[], completedIds: string[], currentTime: number, onSeek: (time:number)=>void }} props */
export function ChapterRail({ chapters, completedIds, currentTime, onSeek }) {
  return (
    <nav aria-label="Chapters" className="rounded-md border border-line bg-surface-raised p-3">
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {chapters.map((chapter, index) => {
          const completed = completedIds.includes(chapter.id)
          const active = currentTime >= chapter.startSeconds && currentTime < chapter.endSeconds
          return (
            <li key={chapter.id}>
              <button type="button" onClick={() => onSeek(chapter.startSeconds)} aria-current={active ? 'true' : undefined} className={cn('flex min-h-11 w-full items-start gap-2 rounded-sm border px-3 py-2 text-left transition-colors', active ? 'border-info bg-surface-sunken' : 'border-line hover:border-line-strong')}>
                {completed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-answer-fg" strokeWidth={1.75} aria-hidden="true" /> : <Circle className="mt-0.5 size-4 shrink-0 text-faint" strokeWidth={1.5} aria-hidden="true" />}
                <span className="min-w-0">
                  <span className="block text-2xs font-[560] text-heading">{index + 1}. {chapter.title}</span>
                  <span className="mt-0.5 block font-mono text-2xs tabular-nums text-faint">{formatClock(chapter.startSeconds)}–{formatClock(chapter.endSeconds)}{completed ? ' · completed' : ''}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
