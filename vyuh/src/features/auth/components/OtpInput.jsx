import { useId, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Six native single-character inputs. Tab/Shift+Tab remain normal; arrows and
 * Backspace move within the group. Paste distributes digits from any box and
 * accepts spaces/hyphens from email clients. No paste is intercepted globally.
 * @param {{ value: string, onChange: (value: string) => void, disabled?: boolean, error?: string, describedBy?: string }} props
 */
export function OtpInput({ value, onChange, disabled, error, describedBy }) {
  const id = useId()
  const refs = useRef(/** @type {Array<HTMLInputElement | null>} */ ([]))
  const digits = Array.from({ length: 6 }, (_, index) => value[index]?.trim() ?? '')
  const groupId = `${id}-group`
  const helpId = `${id}-help`
  const errorId = `${id}-error`

  /** @param {number} index */
  function focus(index) { refs.current[Math.max(0, Math.min(5, index))]?.focus() }
  /** @param {number} index @param {string} text */
  function put(index, text) {
    const clean = text.replace(/\D/g, '')
    if (!clean) {
      const next = Array.from({ length: 6 }, (_, i) => value[i] ?? ' '); next[index] = ' '
      onChange(next.join(''))
      return
    }
    const next = Array.from({ length: 6 }, (_, i) => value[i] ?? ' ')
    const available = index === 0 && clean.length >= 6 ? 6 : 6 - index
    const start = index === 0 && clean.length >= 6 ? 0 : index
    clean.slice(0, available).split('').forEach((/** @type {string} */ digit, /** @type {number} */ offset) => { next[start + offset] = digit })
    onChange(next.join('').slice(0, 6))
    focus(start + Math.min(clean.length, available))
  }

  return (
    <div>
      <div id={groupId} role="group" aria-label="Six-digit verification code" aria-describedby={[helpId, describedBy, error ? errorId : null].filter(Boolean).join(' ')} className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => { refs.current[index] = node }}
            id={`${id}-${index}`}
            name={`otp-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={index === 0 ? 12 : 1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${index + 1} of 6`}
            aria-invalid={error ? true : undefined}
            aria-required="true"
            required
            disabled={disabled}
            value={digit}
            placeholder="·"
            onFocus={(event) => event.target.select()}
            onChange={(event) => put(index, event.target.value)}
            onPaste={(event) => { event.preventDefault(); put(index, event.clipboardData.getData('text')) }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digit && index > 0) { event.preventDefault(); const next = [...digits]; next[index - 1] = ' '; onChange(next.join('')); focus(index - 1) }
              if (event.key === 'ArrowLeft') { event.preventDefault(); focus(index - 1) }
              if (event.key === 'ArrowRight') { event.preventDefault(); focus(index + 1) }
              if (event.key === 'Delete') { event.preventDefault(); const next = Array.from({ length: 6 }, (_, i) => value[i] ?? ' '); next[index] = ' '; onChange(next.join('')) }
            }}
            className={cn('h-14 w-full min-w-0 rounded-sm border bg-surface-raised text-center font-mono text-lg tabular-nums text-heading caret-ember placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:bg-surface-sunken sm:h-16', error ? 'border-danger-fg' : 'border-line-strong hover:border-heading')}
          />
        ))}
      </div>
      <p id={helpId} className="mt-2.5 text-xs text-muted">Type, paste all six digits, or use your device’s autofill.</p>
      {error ? <p id={errorId} role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-danger-fg"><AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />{error}</p> : null}
    </div>
  )
}
