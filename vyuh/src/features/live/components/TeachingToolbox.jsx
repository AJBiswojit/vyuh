import { BarChart3, ChevronLeft, ChevronRight, FileText, LayoutGrid, MessageCircleQuestion, PenLine, Presentation, RotateCcw, Trash2, Users } from 'lucide-react'
import { Button, IconButton } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

const ICONS = {
  whiteboard: PenLine, slides: Presentation, polls: BarChart3,
  questions: MessageCircleQuestion, participants: Users, resources: FileText,
}

/** Toolbox selection also switches the matching engagement tab. */
export const TOOL_TABS = Object.freeze({
  polls: 'polls', questions: 'questions', participants: 'participants', resources: 'resources',
})

/**
 * Six teaching tools. Each performs real, visible state changes: selecting a
 * tool moves the program monitor to its scene, opens the matching engagement
 * tab, and is recorded in the room log. Slide and whiteboard controls act on the
 * shared state too.
 * @param {{ tools: Array<{id:string,label:string}>, snapshot: import('@/contracts/liveStudio.js').StudioSnapshot, send: (type:string,payload?:Object)=>void, onSelectTool: (id:string)=>void }} props
 */
export function TeachingToolbox({ tools, snapshot, send, onSelectTool }) {
  const slideIndex = snapshot.toolbox.slideIndex
  const slideCount = snapshot.slides.length
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline-on-ink bg-ink-raised p-3">
      <div>
        <p className="rule-label text-on-ink-label">Teaching toolbox</p>
        <p className="mt-1 text-2xs leading-relaxed text-on-ink-muted">Each tool changes the shared classroom state.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-6">
        {tools.map((tool) => {
          const Icon = ICONS[tool.id] ?? LayoutGrid
          const active = snapshot.toolbox.activeTool === tool.id
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="sm"
              icon={<Icon />}
              aria-pressed={active}
              className={cn('justify-start border', active ? 'border-ember bg-ember-wash text-ember-press' : 'border-hairline-on-ink text-on-ink')}
              onClick={() => { send('tool_selected', { tool: tool.id }); onSelectTool(TOOL_TABS[tool.id] ?? 'chat') }}
            >
              {tool.label}
            </Button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-hairline-on-ink pt-3">
        <span className="text-2xs text-on-ink-muted">Slide {slideIndex + 1} of {slideCount}</span>
        <IconButton label="Previous slide" icon={<ChevronLeft />} variant="secondary" size="sm" onClick={() => send('slide_changed', { index: (slideIndex - 1 + slideCount) % slideCount })} />
        <IconButton label="Next slide" icon={<ChevronRight />} variant="secondary" size="sm" onClick={() => send('slide_changed', { index: (slideIndex + 1) % slideCount })} />
        <span className="mx-1 h-6 w-px bg-hairline-on-ink" aria-hidden="true" />
        <span className="text-2xs text-on-ink-muted">Board: {snapshot.whiteboard.shapes.length} actions</span>
        <IconButton label="Undo last whiteboard action" icon={<RotateCcw />} variant="secondary" size="sm" onClick={() => send('whiteboard_undo', {})} />
        <IconButton label="Clear whiteboard" icon={<Trash2 />} variant="secondary" size="sm" onClick={() => send('whiteboard_clear', {})} />
      </div>
    </div>
  )
}
