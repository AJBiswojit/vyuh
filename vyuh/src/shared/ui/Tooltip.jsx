import { cloneElement, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { durations } from '@/shared/lib/motion.js'

/**
 * Tooltip. Supplements a label; it never replaces one. Shown on hover and on
 * keyboard focus, dismissed on Escape, wired with aria-describedby. The trigger
 * is cloned, so the caller keeps their own element and its semantics.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ReactElement<{ 'aria-describedby'?: string }>} props.children
 * @param {'top'|'bottom'|'left'|'right'} [placement]
 * @param {string} [className]
 */
export function Tooltip({ label, children, placement = 'top', className }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const timer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  const show = () => {
    if (timer.current) clearTimeout(timer.current)
    // A short dwell keeps the tooltip from flashing while the pointer crosses
    // a toolbar. 300ms is long enough to intend it.
    timer.current = setTimeout(() => setOpen(true), 300)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }

  const position = {
    top: 'bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2',
    bottom: 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2',
    left: 'right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2',
    right: 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2',
  }[placement]

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide()
      }}
    >
      {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      <AnimatePresence>
        {open ? (
          <motion.span
            role="tooltip"
            id={id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.micro }}
            className={cn(
              'pointer-events-none absolute z-40 w-max max-w-[16rem] rounded-sm border border-line bg-surface-inverse px-2 py-1.5',
              'text-2xs leading-snug text-on-inverse shadow-[var(--shadow-float)]',
              position,
            )}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
