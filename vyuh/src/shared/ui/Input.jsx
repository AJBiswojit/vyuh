import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Text input with a persistent label, hint and error slot.
 *
 * Errors are never colour-only: a lucide glyph marks the field, the message says
 * what happened and what to do, and aria-invalid + aria-describedby are wired so
 * a screen reader hears the same thing the eye sees.
 *
 * @typedef {Object} InputProps
 * @property {string} label
 * @property {string} [hint]
 * @property {string} [error]
 * @property {React.ReactNode} [icon]      Leading icon.
 * @property {React.ReactNode} [trailing]  Trailing control slot (e.g. a reveal toggle).
 * @property {string} [className]
 * @property {string} [containerClassName]
 */

/**
 * @param {InputProps & React.ComponentPropsWithoutRef<'input'>} props
 * @param {React.Ref<HTMLInputElement>} ref
 */
function InputInner({ label, hint, error, icon, trailing, className, containerClassName, id, 'aria-describedby': externalDescribedBy, ...rest }, ref) {
  const generated = useId()
  const fieldId = id ?? generated
  const describedBy = [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null, externalDescribedBy].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex w-full flex-col gap-2', containerClassName)}>
      <label htmlFor={fieldId} className="text-xs font-[560] tracking-tight text-heading">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon ? (
          <span className="pointer-events-none absolute left-3 text-muted [&>svg]:size-[1.05rem]" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-h-[var(--spacing-touch)] w-full rounded-sm border bg-surface-raised px-3 py-2 text-xs text-heading',
            'placeholder:text-faint transition-colors duration-[175ms]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
            'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-faint',
            error
              ? 'border-[color-mix(in_oklab,var(--color-danger)_60%,transparent)]'
              : 'border-line-strong hover:border-heading',
            icon ? 'pl-9' : null,
            trailing ? 'pr-12' : null,
            className,
          )}
          {...rest}
        />
        {trailing ? <span className="absolute right-1">{trailing}</span> : null}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="flex items-start gap-1.5 text-xs text-danger-fg" role="alert">
          <AlertCircle className="mt-px size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef(InputInner)
Input.displayName = 'Input'
