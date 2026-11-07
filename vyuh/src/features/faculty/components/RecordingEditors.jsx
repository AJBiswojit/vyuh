import { useId } from 'react'
import { Plus, Scissors, Trash2 } from 'lucide-react'
import { Button, IconButton, Input } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'
import { formatClock } from '@/shared/lib/format.js'
import { chapterProblem, nextTrim } from '@/shared/lib/facultyMath.js'

/**
 * Trim handles over a proportional timeline. Two range inputs rather than a
 * canvas: keyboard users get arrow-key trimming for free, and a screen reader
 * hears "Trim start, 0:04, slider".
 *
 * @param {Object} props
 * @param {{ trimStartSeconds: number, trimEndSeconds: number, durationSeconds: number, chapters: { startSeconds: number, title: string }[] }} props.recording
 * @param {(handle: 'start'|'end', seconds: number) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export function TrimHandles({ recording, onChange, disabled = false }) {
  const startId = useId()
  const endId = useId()
  const window = Math.max(1, recording.trimEndSeconds - recording.trimStartSeconds)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-10 overflow-hidden rounded-sm border border-line bg-surface-sunken" aria-hidden="true">
        <span
          className="absolute inset-y-0 bg-[color-mix(in_oklab,var(--color-answer)_22%,transparent)]"
          style={{ left: `${(recording.trimStartSeconds / recording.durationSeconds) * 100}%`, right: `${100 - (recording.trimEndSeconds / recording.durationSeconds) * 100}%` }}
        />
        {recording.chapters.map((chapter) => (
          <span
            key={`${chapter.title}-${chapter.startSeconds}`}
            className="absolute inset-y-0 w-px bg-heading"
            style={{ left: `${(chapter.startSeconds / recording.durationSeconds) * 100}%` }}
            title={chapter.title}
          />
        ))}
        <span className="absolute inset-y-0 left-0 w-1 bg-ink" style={{ left: `${(recording.trimStartSeconds / recording.durationSeconds) * 100}%` }} />
        <span className="absolute inset-y-0 w-1 bg-ink" style={{ right: `${100 - (recording.trimEndSeconds / recording.durationSeconds) * 100}%` }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={startId} className="flex items-baseline justify-between gap-2 text-xs font-[560] text-heading">
            Trim start
            <span className="font-mono text-2xs tabular-nums text-muted">{formatClock(recording.trimStartSeconds)}</span>
          </label>
          <input
            id={startId}
            type="range"
            min={0}
            max={recording.durationSeconds}
            step={1}
            value={recording.trimStartSeconds}
            disabled={disabled}
            onChange={(event) => onChange('start', nextTrim(recording, 'start', Number(event.target.value)))}
            className="h-11 w-full accent-[var(--color-ember)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={endId} className="flex items-baseline justify-between gap-2 text-xs font-[560] text-heading">
            Trim end
            <span className="font-mono text-2xs tabular-nums text-muted">{formatClock(recording.trimEndSeconds)}</span>
          </label>
          <input
            id={endId}
            type="range"
            min={0}
            max={recording.durationSeconds}
            step={1}
            value={recording.trimEndSeconds}
            disabled={disabled}
            onChange={(event) => onChange('end', nextTrim(recording, 'end', Number(event.target.value)))}
            className="h-11 w-full accent-[var(--color-ember)]"
          />
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-2xs text-muted">
        <Scissors className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Published length {formatClock(window)} of {formatClock(recording.durationSeconds)}. Chapters outside the trim are removed on publish.
      </p>
    </div>
  )
}

/**
 * Chapter editor. A chapter is a title and an offset; the offset is validated
 * against the trim window by the same helper the service uses, so the inline
 * message and the save error cannot disagree.
 *
 * @param {Object} props
 * @param {{ trimStartSeconds: number, trimEndSeconds: number }} props.recording
 * @param {{ id: string, title: string, startSeconds: number }[]} props.chapters
 * @param {(chapters: { id: string, title: string, startSeconds: number }[]) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export function ChapterEditor({ recording, chapters, onChange, disabled = false }) {
  const problem = chapterProblem(chapters, recording)
  const fieldId = useId()

  const update = (index, patch) => {
    onChange(chapters.map((chapter, position) => (position === index ? { ...chapter, ...patch } : chapter)))
  }

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {chapters.map((chapter, index) => (
          <li key={chapter.id} className="flex items-end gap-2">
            <span className="mb-2.5 font-mono text-2xs tabular-nums text-faint">{String(index + 1).padStart(2, '0')}</span>
            <Input
              label={index === 0 ? 'First chapter title' : `Chapter ${index + 1} title`}
              value={chapter.title}
              disabled={disabled}
              onChange={(event) => update(index, { title: event.target.value })}
              containerClassName="min-w-0 flex-1"
            />
            <div className="w-28 shrink-0">
              <Input
                label="Starts (s)"
                type="number"
                min={0}
                max={recording.trimEndSeconds}
                value={chapter.startSeconds}
                disabled={disabled}
                onChange={(event) => update(index, { startSeconds: Math.max(0, Number(event.target.value)) })}
              />
            </div>
            <span className="mb-2.5 font-mono text-2xs tabular-nums text-faint">{formatClock(chapter.startSeconds)}</span>
            <div className="mb-0.5">
              <IconButton
                icon={<Trash2 strokeWidth={1.5} />}
                label={`Remove chapter ${index + 1}`}
                onClick={() => onChange(chapters.filter((_, position) => position !== index))}
                disabled={disabled || chapters.length <= 1}
              />
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus strokeWidth={1.5} />}
          disabled={disabled}
          onClick={() => {
            const last = chapters.at(-1)
            const nextStart = Math.min(recording.trimEndSeconds - 1, (last?.startSeconds ?? 0) + 12)
            onChange([...chapters, { id: `ch-new-${fieldId}-${chapters.length}`, title: '', startSeconds: Math.max(recording.trimStartSeconds, nextStart) }])
          }}
        >
          Add chapter
        </Button>
        <p className={cn('text-2xs', problem ? 'text-review-fg' : 'text-answer-fg')} role="status">
          {problem ?? 'Chapters ascend and sit inside the trim window.'}
        </p>
      </div>
    </div>
  )
}

/**
 * Transcript preview. Timings are shown because a chapter is written against
 * them; the text is the caption track the upload produced.
 *
 * @param {Object} props
 * @param {{ at: number, text: string }[]} props.lines
 */
export function TranscriptPreview({ lines }) {
  if (lines.length === 0) {
    return (
      <p className="border-l-2 border-l-line-strong py-1.5 pl-4 text-2xs leading-relaxed text-muted">
        Captions are generated after the upload finishes. Nothing to preview yet.
      </p>
    )
  }
  return (
    <ol className="flex max-h-72 flex-col divide-y divide-line overflow-y-auto rounded-sm border border-line" data-testid="transcript-preview">
      {lines.map((line) => (
        <li key={`${line.at}-${line.text.slice(0, 12)}`} className="flex items-start gap-3 px-3 py-2">
          <span className="mt-0.5 shrink-0 font-mono text-2xs tabular-nums text-faint">{formatClock(line.at)}</span>
          <span className="text-2xs leading-relaxed text-body">{line.text}</span>
        </li>
      ))}
    </ol>
  )
}
