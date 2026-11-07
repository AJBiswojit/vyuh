import { forwardRef, useId } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Native select, restyled. Native is deliberate: it keeps the platform picker on
 * mobile, the type-ahead on desktop, and full keyboard behaviour for free. The
 * chevron is decoration over a real <select>, so nothing is lost if it fails.
 *
 * @typedef {Object} SelectProps
 * @property {string} label
 * @property {{ value: string, label: string, disabled?: boolean }[]} options
 * @property {string} [hint]
 * @property {string} [error]
 * @property {string} [placeholder]   Rendered as a disabled first option.
 * @property {string} [className]
 */

/**
 * @param {SelectProps & React.ComponentPropsWithoutRef<'select'>} props
 * @param {React.Ref<HTMLSelectElement>} ref
 */
function SelectInner({ label, options, hint, error, placeholder, className, id, 'aria-describedby': externalDescribedBy, ...rest }, ref) {
  const generated = useId()
  const fieldId = id ?? generated
  const describedBy = [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null, externalDescribedBy].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <label htmlFor={fieldId} className="text-xs font-[560] tracking-tight text-heading">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-h-[var(--spacing-touch)] w-full appearance-none rounded-sm border bg-surface-raised px-3 py-2 pr-10 text-xs text-heading',
            'transition-colors duration-[175ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
            'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-faint',
            error ? 'border-[color-mix(in_oklab,var(--color-danger)_60%,transparent)]' : 'border-line-strong hover:border-heading',
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          strokeWidth={1.5}
          aria-hidden="true"
        />
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

export const Select = forwardRef(SelectInner)
Select.displayName = 'Select'
