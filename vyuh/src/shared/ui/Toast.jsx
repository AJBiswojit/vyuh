import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'
import { durations, easeEntrance, spring } from '@/shared/lib/motion.js'

/**
 * Toasts. The only floating layer that appears without the reader aiming at it,
 * so it is used sparingly: confirmations after an action, never the primary
 * report of a failure (those belong inline, next to the thing that failed).
 *
 * Timing: auto-dismiss at 5.2s, paused while hovered or focused, and never
 * auto-dismissed for `danger` — an error the reader did not see is an error
 * they cannot act on.
 *
 * @typedef {'neutral'|'success'|'danger'|'info'} ToastTone
 *
 * @typedef {Object} ToastRecord
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {ToastTone} [tone]
 *
 * @typedef {Object} ToastApi
 * @property {(toast: Omit<ToastRecord, 'id'>) => string} show
 * @property {(id: string) => void} dismiss
 * @property {() => void} clear
 */

const ToastContext = createContext(/** @type {ToastApi | null} */ (null))

const AUTO_DISMISS_MS = 5200

const toneIcon = {
  neutral: Info,
  info: Info,
  success: CheckCircle2,
  danger: AlertCircle,
}

const toneGlyphClass = {
  neutral: 'text-on-inverse',
  info: 'text-info-fg',
  success: 'text-answer-fg',
  danger: 'text-danger-fg',
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState(/** @type {ToastRecord[]} */ ([]))
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((current) => [...current.slice(-2), { tone: 'neutral', ...toast, id }])
      return id
    },
    [],
  )

  const clear = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer))
    timers.current.clear()
    setToasts([])
  }, [])

  const api = useMemo(() => ({ show, dismiss, clear }), [show, dismiss, clear])

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
          role="region"
          aria-label="Notifications"
        >
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const Icon = toneIcon[toast.tone ?? 'neutral']
              return (
                <motion.div
                  key={toast.id}
                  layout
                  role="status"
                  aria-live={toast.tone === 'danger' ? 'assertive' : 'polite'}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.99 }}
                  transition={{ duration: durations.standard, ease: easeEntrance }}
                  onMouseEnter={() => {
                    const timer = timers.current.get(toast.id)
                    if (timer) clearTimeout(timer)
                  }}
                  onMouseLeave={() => {
                    if (toast.tone === 'danger') return
                    timers.current.set(
                      toast.id,
                      setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS),
                    )
                  }}
                  className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-hairline-on-ink bg-ink px-4 py-3 text-paper shadow-[var(--shadow-overlay)]"
                >
                  <Icon
                    className={cn('mt-0.5 size-4 shrink-0', toneGlyphClass[toast.tone ?? 'neutral'])}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-[560] leading-snug">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-0.5 text-2xs leading-relaxed text-(--color-on-ink-muted)">
                        {toast.description}
                      </p>
                    ) : null}
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    transition={spring}
                    onClick={() => dismiss(toast.id)}
                    aria-label={`Dismiss: ${toast.title}`}
                    className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-xs text-(--color-on-ink-faint) hover:text-paper"
                  >
                    <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/**
 * @param {{ tone?: ToastTone }} [options]
 * @returns {ToastApi & { success: (title: string, description?: string) => void, error: (title: string, description?: string) => void }}
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')

  return useMemo(
    () => ({
      ...context,
      success: (title, description) => context.show({ title, description, tone: 'success' }),
      error: (title, description) => context.show({ title, description, tone: 'danger' }),
    }),
    [context],
  )
}
