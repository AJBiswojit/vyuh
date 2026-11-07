import { Monitor, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { spring } from '@/shared/lib/motion.js'
import { useTheme } from '@/app/providers/ThemeProvider.jsx'

/**
 * ThemeToggle — three-position switch: paper (light), ink (dark), system.
 *
 * Three positions rather than two, because "follow my device" is a real choice
 * and a binary toggle silently destroys it. The current mode is marked by the
 * raised cell *and* aria-pressed, never by colour alone.
 *
 * @param {{ className?: string, compact?: boolean, onInk?: boolean }} props
 */
export function ThemeToggle({ className, compact = false, onInk = false }) {
  const { mode, setMode, resolved } = useTheme()

  const options = [
    { mode: 'light', label: 'Light theme', icon: Sun },
    { mode: 'dark', label: 'Dark theme', icon: Moon },
    { mode: 'system', label: `System theme, currently ${resolved}`, icon: Monitor },
  ]

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-sm border p-0.5',
        onInk ? 'border-hairline-on-ink bg-on-ink-wash' : 'border-line bg-surface-sunken',
        className,
      )}
    >
      {options.map((option) => {
        const active = mode === option.mode
        return (
          <motion.button
            key={option.mode}
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={spring}
            onClick={() => setMode(/** @type {'light'|'dark'|'system'} */ (option.mode))}
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            className={cn(
              'relative inline-flex items-center justify-center rounded-xs transition-colors duration-[175ms]',
              compact ? 'size-8' : 'size-9',
              active
                ? onInk
                  ? 'bg-paper text-ink shadow-[var(--shadow-float)]'
                  : 'bg-surface-raised text-heading shadow-[var(--shadow-float)]'
                : onInk
                  ? 'text-on-ink-faint hover:text-on-ink-strong'
                  : 'text-muted hover:text-body',
            )}
          >
            <option.icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
            {active ? <span className="sr-only">selected</span> : null}
          </motion.button>
        )
      })}
    </div>
  )
}
