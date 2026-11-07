import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { spring } from '@/shared/lib/motion.js'

/**
 * Button.
 *
 * Variants:
 *   primary    filled ember. The one thing the view wants done. ONE per view.
 *   secondary  ink-filled on paper, paper-filled on ink. Hairline, not ember.
 *   ghost      no fill, no border until hover. Never carries the only path forward.
 *   danger     oxblood outline; fills only inside a confirm dialog.
 *
 * Every variant is paired with a visible 2px ember focus ring (global rule) and
 * a 44px minimum height. Disabled states keep their variant's foreground instead
 * of fading the whole control, because a 45% ember fill cannot carry a label at
 * 4.5:1.
 *
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'|'ghost'|'danger'} [variant]
 * @property {'sm'|'md'|'lg'} [size]
 * @property {React.ReactNode} [icon]          Leading icon, lucide, 1.5px stroke.
 * @property {React.ReactNode} [trailingIcon]
 * @property {boolean} [loading]               Sets aria-busy; keeps width and colour.
 * @property {boolean} [full]
 * @property {string} [className]
 */

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-[560] tracking-tight ' +
  'transition-colors duration-[175ms] ease-[cubic-bezier(0.2,0,0,1)] disabled:cursor-not-allowed'

const sizes = {
  sm: 'min-h-[var(--spacing-touch)] px-3 text-2xs',
  md: 'min-h-[var(--spacing-touch)] px-4 text-xs',
  lg: 'min-h-12 px-5 text-sm',
}

const variants = {
  primary:
    'border border-ember bg-ember text-on-ember hover:border-ember-press hover:bg-ember-press ' +
    'disabled:border-ember-wash disabled:bg-ember-wash disabled:text-ember-press',
  secondary:
    'border border-heading bg-heading text-on-inverse hover:opacity-90 ' +
    'disabled:border-line disabled:bg-surface-sunken disabled:text-faint',
  ghost:
    'border border-transparent bg-transparent text-body hover:bg-[color-mix(in_oklab,var(--color-body)_7%,transparent)] ' +
    'disabled:text-faint',
  danger:
    'border border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-transparent text-danger-fg ' +
    'hover:bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] disabled:border-line disabled:text-faint',
}

/**
 * @param {ButtonProps & React.ComponentPropsWithoutRef<'button'>} props
 * @param {React.Ref<HTMLButtonElement>} ref
 */
function ButtonInner(
  { variant = 'secondary', size = 'md', icon, trailingIcon, loading = false, full = false, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={disabled || loading ? undefined : { scale: 0.975 }}
      transition={spring}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], full && 'w-full', className)}
      {...rest}
    >
      {icon ? (
        <span className="shrink-0 [&>svg]:size-[1.125em]" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className="shrink-0 [&>svg]:size-[1.125em]" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </motion.button>
  )
}

export const Button = forwardRef(ButtonInner)
Button.displayName = 'Button'
