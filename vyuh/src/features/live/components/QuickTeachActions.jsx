import { MessageCircleQuestion, PenLine, Presentation, Users } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Level 1 quick actions — the four everyday teaching moves, big and plain.
 * Each one either moves the stage (Share presentation / Open whiteboard) or
 * jumps to the matching Level 2 panel (questions / students). Nothing here is
 * technical: no scenes, no tools, no tabs by name.
 * @param {Object} props
 * @param {string} props.activeScene
 * @param {number} props.waitingQuestions  Pending questions in the student view queue.
 * @param {number} props.presentCount
 * @param {(type:string,payload?:Object)=>void} props.send
 * @param {(tab:string)=>void} props.onJumpToTab
 */
export function QuickTeachActions({ activeScene, waitingQuestions, presentCount, send, onJumpToTab }) {
  const slidesOnStage = activeScene === 'presentation'
  const boardOnStage = activeScene === 'whiteboard'

  return (
    <div role="group" aria-label="Quick teaching actions" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <QuickAction
        icon={<Presentation strokeWidth={1.5} aria-hidden="true" />}
        label="Share presentation"
        hint={slidesOnStage ? 'Slides are on the stage' : 'Put the slides on the stage'}
        pressed={slidesOnStage}
        onClick={() => send('tool_selected', { tool: 'slides' })}
      />
      <QuickAction
        icon={<PenLine strokeWidth={1.5} aria-hidden="true" />}
        label="Open whiteboard"
        hint={boardOnStage ? 'The board is on the stage' : 'Write and draw with the class'}
        pressed={boardOnStage}
        onClick={() => send('tool_selected', { tool: 'whiteboard' })}
      />
      <QuickAction
        icon={<MessageCircleQuestion strokeWidth={1.5} aria-hidden="true" />}
        label="Questions"
        hint={waitingQuestions > 0 ? `${waitingQuestions} waiting for you` : 'Nothing waiting right now'}
        badge={waitingQuestions > 0 ? String(waitingQuestions) : undefined}
        onClick={() => onJumpToTab('questions')}
      />
      <QuickAction
        icon={<Users strokeWidth={1.5} aria-hidden="true" />}
        label="View students"
        hint={`${presentCount} in the room — roster and mute`}
        onClick={() => onJumpToTab('students')}
      />
    </div>
  )
}

/** @param {{ icon: React.ReactNode, label: string, hint: string, pressed?: boolean, badge?: string, onClick: () => void }} props */
function QuickAction({ icon, label, hint, pressed, badge, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={pressed === undefined ? undefined : pressed}
      aria-label={`${label}. ${hint}`}
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[4.25rem] flex-col items-start justify-center gap-1 rounded-sm border px-3 py-2.5 text-left transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
        pressed ? 'border-ember bg-ember-wash' : 'border-line bg-surface-raised hover:border-line-strong',
      )}
    >
      <span className={cn('flex items-center gap-2 text-xs font-[560] tracking-tight', pressed ? 'text-ember-press' : 'text-heading')}>
        <span className={cn('flex size-8 items-center justify-center rounded-sm border', pressed ? 'border-ember bg-surface-raised text-ember-press' : 'border-line bg-surface-sunken text-heading group-hover:border-line-strong')}>
          {icon}
        </span>
        {label}
        {badge ? (
          <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-ember font-mono text-2xs tabular-nums text-on-ember">{badge}</span>
        ) : null}
      </span>
      <span className={cn('text-2xs leading-snug', pressed ? 'text-ember-press' : 'text-muted')}>{hint}</span>
    </button>
  )
}
