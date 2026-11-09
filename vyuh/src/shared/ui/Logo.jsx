import { useContext, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { ThemeContext } from '@/app/providers/ThemeProvider.jsx'

/**
 * The Vyuh mark: the official Vyuh × MediXO artwork, rendered inline so its
 * gradient can answer the surface it sits on.
 *
 * The artwork is a single even-odd compound path — a ring cradling the
 * diagonal "V". On ink surfaces (`tone="paper"`, or automatically when the
 * document is dark) the mark paints a warm near-white gradient; on paper
 * surfaces (`tone="ink"`, or automatically in light mode) it paints the ink
 * gradient the other way. All four stops come from tokens — no literal
 * colours live in this file. `tone` overrides the theme guess, which is how
 * the permanently-ink rails and the /design-preview dual panes pin the mark
 * to the surface underneath it.
 *
 * `loading` breathes the mark in opacity. The breath is skipped entirely
 * under reduced motion (the mark simply rests at full strength).
 *
 * @typedef {Object} LogoProps
 * @property {boolean} [withName]
 * @property {'ink'|'paper'} [tone]   Pin the mark to a surface; omit to follow the theme.
 * @property {'sm'|'md'|'lg'|'xl'} [size]
 * @property {boolean} [loading]
 * @property {string | null} [to]      Wraps the mark in a link when set.
 * @property {string} [className]
 */

/** The official artwork, identical to public/logo/Vyuh_medixo.svg. */
const ARTWORK_PATH =
  'M 149.69328,19.272117 A 119.95076,119.95076 0 0 0 63.038885,49.594491 L 84.953987,74.11679 a 87.063366,87.063366 0 0 1 62.895183,-22.009492 87.063366,87.063366 0 0 1 82.04646,91.807172 87.063366,87.063366 0 0 1 -28.91135,60.03696 l 21.91512,24.52231 A 119.95076,119.95076 0 0 0 262.73147,145.75792 119.95076,119.95076 0 0 0 149.69328,19.272117 Z M 22.829944,27.034778 V 85.324016 L 178.2666,266.66654 h 58.28857 L 139.73576,158.11109 204.17249,98.276965 H 145.8839 L 112.78432,127.89248 Z M 68.909239,167.14892 22.829944,208.37797 v 58.28857 L 95.98518,198.73706 Z'
const ARTWORK_VIEWBOX = '0 0 285.75 285.75'

/** Reading from the official gradient's origin to its end, in artwork units. */
const GRAD_X1 = 36.767647
const GRAD_Y1 = 56.696091
const GRAD_X2 = 191.60846
const GRAD_Y2 = 218.03406

/** Token stops, light mark (on ink) and ink mark (on paper). */
const STOPS = /** @type {Record<'paper'|'ink', [string, string]>} */ ({
  paper: [
    'rgb(var(--vyuh-paper-rgb))',
    'color-mix(in srgb, rgb(var(--vyuh-paper-rgb)) 72%, var(--color-ink))',
  ],
  ink: [
    'var(--color-ink)',
    'color-mix(in srgb, var(--color-ink) 70%, var(--color-paper-raised))',
  ],
})

/** Mark edge in px, and the wordmark classes that sit beside it. */
const SIZES = /** @type {Record<'sm'|'md'|'lg'|'xl', { px: number, name: string, micro: boolean }>} */ ({
  sm: { px: 20, name: 'text-sm', micro: false },
  md: { px: 26, name: 'text-lg', micro: false },
  lg: { px: 38, name: 'text-xl', micro: true },
  xl: { px: 72, name: 'text-3xl', micro: true },
})

/** @param {LogoProps} props */
export function Logo({ withName = true, tone = undefined, size = 'md', loading = false, to = null, className = '' }) {
  const reduced = usePrefersReducedMotion()
  // Context, not useTheme(): the mark must render even outside a provider
  // (isolated unit renders), where the document attribute is the fallback.
  const themeContext = useContext(ThemeContext)
  const themeFallback = typeof document === 'undefined' ? 'light' : document.documentElement.dataset.theme
  const resolved = themeContext?.resolved ?? (themeFallback === 'dark' ? 'dark' : 'light')
  const surface = tone ?? (resolved === 'dark' ? 'paper' : 'ink')

  const gradientId = useId()
  const { px, name, micro } = SIZES[size]
  const [stopFrom, stopTo] = STOPS[surface]
  const onInk = surface === 'paper'

  const mark = (
    <svg
      width={px}
      height={px}
      viewBox={ARTWORK_VIEWBOX}
      fillRule="evenodd"
      role={withName ? undefined : 'img'}
      aria-label={withName ? undefined : 'Vyuh'}
      aria-hidden={withName ? 'true' : undefined}
      className="shrink-0"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={GRAD_X1}
          y1={GRAD_Y1}
          x2={GRAD_X2}
          y2={GRAD_Y2}
        >
          <stop offset="0" style={{ stopColor: stopFrom }} />
          <stop offset="1" style={{ stopColor: stopTo }} />
        </linearGradient>
      </defs>
      <path d={ARTWORK_PATH} fill={`url(#${gradientId})`} fillRule="evenodd" />
    </svg>
  )

  const cells = (
    <motion.span
      className="inline-flex shrink-0"
      animate={loading && !reduced ? { opacity: [1, 0.5, 1] } : undefined}
      transition={loading && !reduced ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {mark}
    </motion.span>
  )

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {cells}
      {withName ? (
        <span className="leading-none">
          <span
            className={cn(
              'block font-display tracking-tightest',
              name,
              onInk ? 'text-paper' : 'text-heading',
            )}
            style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1, 'wght' 560" }}
          >
            Vyuh
          </span>
          {micro ? (
            <span
              className={cn(
                'mt-1.5 block font-mono uppercase leading-none tracking-[0.28em]',
                size === 'xl' ? 'text-[0.5625rem]' : 'text-[0.5rem]',
                onInk ? 'text-on-ink-label' : 'text-faint',
              )}
            >
              by MediXO
            </span>
          ) : null}
        </span>
      ) : null}
      {loading ? <span className="sr-only">Loading</span> : null}
    </span>
  )

  if (!to) return content

  return (
    <Link to={to} aria-label="Vyuh by MediXO — go to home" className="inline-flex rounded-xs">
      {content}
    </Link>
  )
}
