import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { spring } from '@/shared/lib/motion.js'

/**
 * Icon-only control. `label` is required and becomes the accessible name — there
 * is no icon-only button in Vyuh without one.
 *
 * @typedef {Object} IconButtonProps
 * @property {React.ReactNode} icon
 * @property {string} label
 * @property {'ghost'|'secondary'|'inverse'} [variant]
 * @property {'sm'|'md'} [size]
 * @property {boolean} [pressed]        Renders the pressed (ember) state.
 * @property {string} [className]
 */

const sizes = {
  sm: 'size-9',
  md: 'size-[var(--spacing-touch)]',
}

const variants = {
  ghost:
    'text-muted hover:bg-[color-mix(in_oklab,var(--color-body)_8%,transparent)] hover:text-heading',
  secondary: 'border border-line-strong bg-surface-raised text-heading hover:border-heading',
  inverse: 'bg-heading text-on-inverse hover:opacity-90',
}

/**
 * @param {IconButtonProps & React.ComponentPropsWithoutRef<'button'>} props
 * @param {React.Ref<HTMLButtonElement>} ref
 */
function IconButtonInner({ icon, label, variant = 'ghost', size = 'md', pressed, className, type = 'button', ...rest }, ref) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.94 }}
      transition={spring}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm transition-colors duration-[175ms]',
        'disabled:cursor-not-allowed disabled:opacity-45',
        sizes[size],
        variants[variant],
        pressed && 'text-ember-press',
        className,
      )}
      {...rest}
    >
      <span className="[&>svg]:size-[1.125rem]" aria-hidden="true">
        {icon}
      </span>
    </motion.button>
  )
}

export const IconButton = forwardRef(IconButtonInner)
IconButton.displayName = 'IconButton'
