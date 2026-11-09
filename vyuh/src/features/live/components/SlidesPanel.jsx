import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { IconButton } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

/**
 * Slides panel — Level 2 "teaching tools" tab. Everything here acts on the
 * shared classroom state, so the stage, the student view and the demo mirror
 * all move together. No slide is uploaded or stored; the deck is the seeded
 * demo deck.
 * @param {Object} props
 * @param {Array<{id:string,title:string,bullets:string[]}>} props.slides
 * @param {number} props.slideIndex
 * @param {(type:string,payload?:Object)=>void} props.send
 */
export function SlidesPanel({ slides, slideIndex, send }) {
  const count = slides.length
  const current = slides[slideIndex] ?? slides[0] ?? null

  if (count === 0) {
    return <p className="text-2xs text-muted">This class has no slides attached. Add resources to share material with students.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Previous slide" icon={<ChevronLeft />} variant="secondary" size="sm" onClick={() => send('slide_changed', { index: (slideIndex - 1 + count) % count })} />
        <span className="font-mono text-xs tabular-nums text-heading" aria-live="polite">Slide {slideIndex + 1} of {count}</span>
        <IconButton label="Next slide" icon={<ChevronRight />} variant="secondary" size="sm" onClick={() => send('slide_changed', { index: (slideIndex + 1) % count })} />
        <span className="ml-1 text-2xs text-muted">Students see this change on the stage immediately.</span>
      </div>
      <ul className="flex flex-col gap-1.5" aria-label="Slides in this deck">
        {slides.map((slide, index) => {
          const active = index === slideIndex
          return (
            <li key={slide.id}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => send('slide_changed', { index })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm border px-3 py-2 text-left transition-colors',
                  'min-h-[var(--spacing-touch)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
                  active ? 'border-ember bg-ember-wash text-ember-press' : 'border-line bg-surface-raised text-body hover:border-line-strong',
                )}
              >
                <FileText className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-xs font-[560] tracking-tight">{slide.title}</span>
                {active ? <Check className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" /> : null}
              </button>
            </li>
          )
        })}
      </ul>
      {current ? (
        <div className="rounded-sm border border-line bg-surface-sunken p-3">
          <p className="rule-label">On this slide</p>
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-2xs leading-relaxed text-body">
            {current.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
