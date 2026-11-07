import { useId } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { GripHorizontal, X } from 'lucide-react'
import { IconButton } from '@/shared/ui'

/** Movable, non-modal tool panel. The exam remains interactive behind it.
 * @param {{ title: string, onClose: () => void, children: React.ReactNode, initial?: { x: number, y: number }, width?: number }} props
 */
export function ToolPanel({ title, onClose, children, initial = { x: 120, y: 120 }, width = 340 }) {
  const controls = useDragControls()
  const titleId = useId()
  return (
    <motion.section
      role="region"
      aria-labelledby={titleId}
      data-exam-tool-panel
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.04}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ left: initial.x, top: initial.y, width: `min(${width}px, calc(100vw - 1.5rem))` }}
      className="fixed z-40 overflow-hidden rounded-md border border-line-strong bg-surface-raised shadow-[var(--shadow-overlay)]"
    >
      <header
        data-tool-drag
        onPointerDown={(event) => { event.preventDefault(); controls.start(event) }}
        className="flex cursor-grab touch-none items-center justify-between gap-2 border-b border-line bg-surface-sunken px-3 py-2 active:cursor-grabbing"
      >
        <h3 id={titleId} className="flex items-center gap-2 text-xs font-[560] text-heading"><GripHorizontal className="size-4 text-faint" strokeWidth={1.5} aria-hidden="true" />{title}</h3>
        <IconButton icon={<X strokeWidth={1.5} />} label={`Close ${title}`} size="sm" onClick={onClose} />
      </header>
      <div className="max-h-[70dvh] overflow-y-auto p-3">{children}</div>
    </motion.section>
  )
}
