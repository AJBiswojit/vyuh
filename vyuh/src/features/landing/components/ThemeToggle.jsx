import { useCallback, useRef } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/shared/hooks/useTheme.js'

const OPTIONS = [
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
  { value: 'system', label: 'Match system theme', Icon: Monitor },
]

/**
 * Light / dark / system, as a three-option radio radiogroup. Roving tabindex:
 * Tab enters the group once, arrow keys move between options (selection follows
 * focus, per the ARIA radio pattern), Enter or Space commits; Home / End jump
 * to the ends. The painted theme flips on <html data-theme> — no reload, no
 * scroll reset, and the lattice scenes pick it up on their next frame.
 */
export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const optionRefs = useRef([])

  const focusAndSelect = useCallback((index) => {
    const option = OPTIONS[index]
    if (!option) return
    setMode(option.value)
    optionRefs.current[index]?.focus()
  }, [setMode])

  const onKeyDown = useCallback((event) => {
    const currentIndex = OPTIONS.findIndex((option) => option.value === mode)
    const last = OPTIONS.length - 1
    let next = null
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (currentIndex + 1) % OPTIONS.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (currentIndex - 1 + OPTIONS.length) % OPTIONS.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        return
    }
    event.preventDefault()
    focusAndSelect(next)
  }, [mode, focusAndSelect])

  return (
    <div role="radiogroup" aria-label="Colour theme" className="vyuh-theme-toggle" onKeyDown={onKeyDown}>
      {OPTIONS.map(({ value, label, Icon }, index) => {
        const checked = mode === value
        return (
          <button
            key={value}
            ref={(el) => { optionRefs.current[index] = el }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={label}
            tabIndex={checked ? 0 : -1}
            className="vyuh-theme-option"
            onClick={() => setMode(value)}
          >
            <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
