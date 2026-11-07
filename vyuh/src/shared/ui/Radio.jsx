import { forwardRef, useId } from 'react'
import { cn } from '@/shared/lib/cn.js'

/**
 * Radio. A group needs a <fieldset> and <legend> from the caller — this
 * component owns one option, not the group's semantics.
 *
 * Selection is shown by a filled inner disc *and* the ring's weight, so the
 * state does not depend on hue.
 *
 * @typedef {Object} RadioProps
 * @property {string} label
 * @property {string} [description]
 * @property {string} [className]
 */

/**
 * @param {RadioProps & React.ComponentPropsWithoutRef<'input'>} props
 * @param {React.Ref<HTMLInputElement>} ref
 */
function RadioInner({ label, description, className, id, ...rest }, ref) {
  const generated = useId()
  const fieldId = id ?? generated

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="relative mt-px flex size-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={fieldId}
          type="radio"
          aria-describedby={description ? `${fieldId}-desc` : undefined}
          className={cn(
            'peer size-5 cursor-pointer appearance-none rounded-full border border-line-strong bg-surface-raised transition-colors',
            'checked:border-[6px] checked:border-heading',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
            'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken',
          )}
          {...rest}
        />
      </span>
      <span className="min-w-0">
        <label htmlFor={fieldId} className="block cursor-pointer text-xs text-body">
          {label}
        </label>
        {description ? (
          <p id={`${fieldId}-desc`} className="mt-0.5 text-2xs text-muted">
            {description}
          </p>
        ) : null}
      </span>
    </div>
  )
}

export const Radio = forwardRef(RadioInner)
Radio.displayName = 'Radio'
