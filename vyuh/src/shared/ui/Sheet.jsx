import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { lockScroll, trapFocus } from '@/shared/lib/focusTrap.js'
import { IconButton } from './IconButton.jsx'

/**
 * Sheet — a panel that slides in from one edge. Same modal contract as Dialog
 * (focus in, focus trapped, Escape closes, focus returned, page scroll locked),
 * different geometry: it keeps the page visible, which is what a paper palette,
 * a review list or a mobile menu needs.
 *
 * `side` picks the edge. Bottom is the mobile default; side sheets are for
 * desktop rails and palettes.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {'right'|'left'|'bottom'} [props.side]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {React.ReactNode} [props.footer]
 * @param {React.ReactNode} [props.children]
 */
export function Sheet({ open, onClose, title, description, side = 'right', size = 'md', footer, children }) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const headingId = useId()

  // Same rule as Dialog: an inline onClose must not re-run the focus trap.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const releaseScroll = lockScroll()
    const releaseFocus = trapFocus(panelRef.current, { onClose: () => onCloseRef.current() })
    return () => {
      releaseFocus()
      releaseScroll()
    }
  }, [open])

  const geometry = {
    right: 'inset-y-0 right-0 h-full w-full border-l',
    left: 'inset-y-0 left-0 h-full w-full border-r',
    bottom: 'inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-[var(--radius-sheet)] border-t',
  }[side]

  const width = {
    right: { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' }[size],
    left: { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' }[size],
    bottom: '',
  }[side]

  const from = {
    right: { x: '100%' },
    left: { x: '-100%' },
    bottom: { y: '100%' },
  }[side]

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.micro }}
            className="absolute inset-0 bg-[var(--color-scrim)]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            initial={from}
            animate={side === 'bottom' ? { y: 0 } : { x: 0 }}
            exit={from}
            transition={{ duration: durations.standard, ease: easeEntrance }}
            className={cn(
              'absolute flex flex-col border-line bg-surface-raised shadow-[var(--shadow-overlay)]',
              geometry,
              width,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 id={headingId} className="text-sm leading-snug tracking-tight">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-2xs leading-relaxed text-muted">{description}</p> : null}
              </div>
              <IconButton icon={<X strokeWidth={1.5} />} label="Close panel" onClick={onClose} />
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

            {footer ? (
              <footer className="border-t border-line px-5 py-4">{footer}</footer>
            ) : (
              <div className="motion-safe-only mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
