import { createContext, useContext, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { spring } from '@/shared/lib/motion.js'

/**
 * Tabs. A full ARIA tablist: arrow keys move between tabs (Home/End jump to the
 * ends), the selected tab is the only one in the tab order, and each panel is
 * labelled by its tab. The active indicator is an ember rule under the label —
 * a rule, not a pill, because pills read as buttons.
 *
 * Controlled or uncontrolled:
 *   <Tabs defaultValue="papers"> … </Tabs>
 *   <Tabs value={tab} onValueChange={setTab}> … </Tabs>
 *
 * @typedef {Object} TabsContextValue
 * @property {string} value
 * @property {(next: string) => void} setValue
 * @property {string} baseId
 */

const TabsContext = createContext(/** @type {TabsContextValue | null} */ (null))

/** @returns {TabsContextValue} */
function useTabs() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs sub-components must be used inside <Tabs>')
  return context
}

/**
 * @param {{ children: React.ReactNode, defaultValue?: string, value?: string, onValueChange?: (value: string) => void, className?: string }} props
 */
export function Tabs({ children, defaultValue = '', value: controlled, onValueChange, className }) {
  const baseId = useId()
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const value = controlled ?? uncontrolled

  const setValue = (next) => {
    if (controlled === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  return (
    <TabsContext.Provider value={{ value, setValue, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

/**
 * @param {{ children: React.ReactNode, 'aria-label': string, className?: string }} props
 */
export function TabList({ children, 'aria-label': ariaLabel, className }) {
  const ref = useRef(/** @type {HTMLDivElement | null} */ (null))

  /** @param {React.KeyboardEvent<HTMLDivElement>} event */
  function onKeyDown(event) {
    const tabs = Array.from(ref.current?.querySelectorAll('[role="tab"]:not([disabled])') ?? [])
    const index = tabs.indexOf(/** @type {Element} */ (document.activeElement))
    if (index === -1) return

    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key]

    if (next === undefined) return
    event.preventDefault()
    /** @type {HTMLElement} */ (tabs[next]).focus()
    /** @type {HTMLElement} */ (tabs[next]).click()
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('flex items-center gap-1 overflow-x-auto border-b border-line', className)}
    >
      {children}
    </div>
  )
}

/**
 * @param {{ value: string, children: React.ReactNode, count?: number, className?: string }} props
 */
export function Tab({ value, children, count, className }) {
  const { value: selected, setValue, baseId } = useTabs()
  const active = selected === value

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'relative inline-flex min-h-[var(--spacing-touch)] shrink-0 items-center gap-2 px-3 text-xs transition-colors',
        active ? 'font-[560] text-heading' : 'text-muted hover:text-body',
        className,
      )}
    >
      {children}
      {typeof count === 'number' ? (
        <span className="font-mono text-2xs tabular-nums text-faint">{count}</span>
      ) : null}
      {active ? (
        <motion.span
          layoutId={`${baseId}-tab-indicator`}
          transition={spring}
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember"
          aria-hidden="true"
        />
      ) : null}
    </button>
  )
}

/**
 * @param {{ value: string, children: React.ReactNode, className?: string }} props
 */
export function TabPanel({ value, children, className }) {
  const { value: selected, baseId } = useTabs()
  if (selected !== value) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn('focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember', className)}
    >
      {children}
    </div>
  )
}
