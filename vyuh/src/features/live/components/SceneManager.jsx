import { Camera, FileText, LayoutGrid, PenLine, Presentation } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

const ICONS = {
  camera: Camera,
  presentation: Presentation,
  whiteboard: PenLine,
  content: FileText,
  split: LayoutGrid,
}

/**
 * Five program-monitor scenes. Every button dispatches `scene_changed`, so the
 * Studio, the Mirror and the Student Classroom all change together.
 * @param {{ scenes: Array<{id:string,label:string,description:string}>, activeScene: string, send: (type:string,payload?:Object)=>void }} props
 */
export function SceneManager({ scenes, activeScene, send }) {
  return (
    <div role="group" aria-label="Choose what students see" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {scenes.map((scene) => {
        const Icon = ICONS[scene.id] ?? LayoutGrid
        const active = scene.id === activeScene
        return (
          <button
            key={scene.id}
            type="button"
            aria-pressed={active}
            onClick={() => send('scene_changed', { scene: scene.id })}
            className={cn(
              'flex min-h-[var(--spacing-touch)] flex-col items-start gap-1 rounded-sm border px-3 py-2 text-left transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
              active ? 'border-ember bg-ember-wash text-ember-press' : 'border-hairline-on-ink bg-ink-raised text-on-ink hover:border-on-ink-muted',
            )}
          >
            <span className="flex items-center gap-2 text-xs font-[560] tracking-tight">
              <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              {scene.label}
            </span>
            <span className={cn('text-2xs leading-snug', active ? 'text-ember-press' : 'text-on-ink-muted')}>{scene.description}</span>
          </button>
        )
      })}
    </div>
  )
}
