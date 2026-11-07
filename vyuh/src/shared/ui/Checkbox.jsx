import { forwardRef, useId } from 'react'
import { AlertCircle, Check, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Checkbox with a real <input> underneath the drawn box, so the native semantics
 * (space to toggle, indeterminate via JS, form submission) survive the styling.
 * The drawn box carries the check as a shape, not only a colour.
 *
 * @typedef {Object} CheckboxProps
 * @property {string} label
 * @property {React.ReactNode} [description]
 * @property {string} [error]
 * @property {boolean} [indeterminate]   Renders a dash; set via a ref effect.
 * @property {string} [className]
 */

/**
 * @param {CheckboxProps & React.ComponentPropsWithoutRef<'input'>} props
 * @param {React.Ref<HTMLInputElement>} ref
 */
function CheckboxInner({ label, description, error, indeterminate = false, className, id, 'aria-describedby': externalDescribedBy, ...rest }, ref) {
  const generated = useId()
  const fieldId = id ?? generated
  const describedBy = [description ? `${fieldId}-desc` : null, error ? `${fieldId}-error` : null, externalDescribedBy].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="relative mt-px flex size-5 shrink-0 items-center justify-center">
        <input
          ref={(node) => {
            if (node) node.indeterminate = indeterminate
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'peer size-5 cursor-pointer appearance-none rounded-xs border bg-surface-raised transition-colors',
            error ? 'border-danger-fg' : 'border-line-strong',
            'checked:border-heading checked:bg-heading indeterminate:border-heading indeterminate:bg-heading',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
            'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken',
          )}
          {...rest}
        />
        <Check
          className="pointer-events-none absolute size-3.5 text-on-inverse opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-0"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <Minus
          className="pointer-events-none absolute size-3.5 text-on-inverse opacity-0 transition-opacity peer-indeterminate:opacity-100"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0 flex-1">
        <label htmlFor={fieldId} className="block cursor-pointer text-xs text-body">
          {label}
        </label>
        {description ? (
          <p id={`${fieldId}-desc`} className="mt-1 text-xs leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={`${fieldId}-error`} role="alert" className="mt-1 flex items-start gap-1.5 text-xs text-danger-fg">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export const Checkbox = forwardRef(CheckboxInner)
Checkbox.displayName = 'Checkbox'
