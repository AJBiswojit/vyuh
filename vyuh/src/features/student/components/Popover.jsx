import { useEffect, useRef } from 'react'
import { cn } from '@/shared/lib/cn.js'
import { focusableWithin } from '@/shared/lib/focusTrap.js'

/**
 * A small non-modal popover anchored to its trigger. Escape and outside click
 * close it; focus returns to the trigger. Used for notifications and profile.
 * @param {{ open: boolean, onClose: () => void, label: string, trigger: React.ReactNode, children: React.ReactNode, className?: string }} props
 */
export function Popover({ open, onClose, label, trigger, children, className }) {
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const triggerRef = useRef(/** @type {HTMLElement | null} */ (null))

  useEffect(() => {
    if (!open) return
    triggerRef.current = /** @type {HTMLElement | null} */ (document.activeElement)
    focusableWithin(panelRef.current)[0]?.focus({ preventScroll: true })
    /** @param {PointerEvent} event */
    const onPointer = (event) => { if (!rootRef.current?.contains(/** @type {Node} */ (event.target))) onClose() }
    /** @param {KeyboardEvent} event */
    const onKey = (event) => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); triggerRef.current?.focus() } }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  return (
    <div ref={rootRef} className="relative">
      {trigger}
      {open ? (
        <div ref={panelRef} role="dialog" aria-label={label} className={cn('absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-line bg-surface-raised shadow-[var(--shadow-overlay)]', className)}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
