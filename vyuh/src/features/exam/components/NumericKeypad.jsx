import { Delete, RotateCcw } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/** On-screen numeric keypad. Every key is at least 56px.
 * @param {{ value: string, onChange: (value: string) => void }} props
 */
export function NumericKeypad({ value, onChange }) {
  /** @param {string} key */
  function press(key) {
    if (key === 'back') { onChange(value.slice(0, -1)); return }
    if (key === 'clear') { onChange(''); return }
    if (key === '-') { onChange(value.startsWith('-') ? value.slice(1) : `-${value}`); return }
    if (key === '.') { if (!value.includes('.')) onChange(`${value || '0'}.`); return }
    onChange(`${value}${key}`.replace(/^(-?)0+(?=\d)/, '$1'))
  }
  const keys = ['7', '8', '9', 'back', '4', '5', '6', 'clear', '1', '2', '3', '-', '0', '.', '±']
  return (
    <div className="grid max-w-xs grid-cols-4 gap-2" aria-label="Numeric keypad">
      {keys.map((key) => {
        const action = key === '±' ? '-' : key
        const label = key === 'back' ? 'Backspace' : key === 'clear' ? 'Clear answer' : key === '±' ? 'Toggle sign' : key
        return (
          <button
            key={key}
            type="button"
            aria-label={`Keypad ${label}`}
            onClick={() => press(action)}
            className={cn('flex min-h-[var(--spacing-keypad)] min-w-[var(--spacing-keypad)] items-center justify-center rounded-sm border border-line-strong bg-surface-raised font-mono text-sm tabular-nums text-heading transition-colors hover:border-heading hover:bg-surface-sunken')}
          >
            {key === 'back' ? <Delete className="size-5" strokeWidth={1.5} aria-hidden="true" /> : key === 'clear' ? <RotateCcw className="size-5" strokeWidth={1.5} aria-hidden="true" /> : key}
          </button>
        )
      })}
      <button type="button" aria-label="Keypad equals" onClick={() => onChange(value.trim())} className="flex min-h-[var(--spacing-keypad)] items-center justify-center rounded-sm border border-line-strong bg-surface-sunken font-mono text-sm text-heading">=</button>
    </div>
  )
}
