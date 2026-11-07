import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { lockScroll, trapFocus } from '@/shared/lib/focusTrap.js'
import { IconButton } from './IconButton.jsx'
import { Button } from './Button.jsx'

/**
 * Dialog. Centred, modal, dismissible by Escape, scrim click and a visible close
 * control. It is a floating layer, so it is one of the four things in the product
 * allowed a shadow.
 *
 * The confirm shape is built in rather than left to callers: a destructive action
 * needs a danger-toned primary inside the dialog, never an ember one.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {() => void} [props.onConfirm]
 * @param {'neutral'|'danger'} [props.tone]     Tone of the confirm action.
 * @param {boolean} [props.busy]
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  tone = 'neutral',
  busy = false,
}) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const headingId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const releaseScroll = lockScroll()
    const releaseFocus = trapFocus(panelRef.current, { onClose })
    return () => {
      releaseFocus()
      releaseScroll()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
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
            aria-describedby={description ? descriptionId : undefined}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: durations.standard, ease: easeEntrance }}
            className={cn(
              'relative w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface-raised shadow-[var(--shadow-overlay)]',
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 id={headingId} className="text-sm leading-snug tracking-tight">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-2xs leading-relaxed text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <IconButton icon={<X strokeWidth={1.5} />} label="Close dialog" onClick={onClose} />
            </header>

            {children ? <div className="px-5 py-5 text-xs text-body">{children}</div> : null}

            {confirmLabel ? (
              <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={onClose} disabled={busy}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={tone === 'danger' ? 'danger' : 'primary'}
                  onClick={onConfirm}
                  loading={busy}
                  className={tone === 'danger' ? 'border-danger bg-danger text-on-signal-inverse hover:opacity-90' : undefined}
                >
                  {confirmLabel}
                </Button>
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
