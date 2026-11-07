import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'

/**
 * The Vyuh mark: a 3×3 grid of squares with exactly one ember cell.
 *
 * The grid is the product in miniature — nine positions, one signal — and it
 * states the colour ratio the whole system is built on. Cells are Ink on paper
 * and Paper on ink; the ember cell is the only accent.
 *
 * `loading` walks the lit cell around the nine positions in reading order. The
 * walk is a translation of one overlay cell, so the grid never re-flows. Under
 * reduced motion the same cell stays put and pulses in opacity instead.
 *
 * @typedef {Object} LogoProps
 * @property {boolean} [withName]
 * @property {'ink'|'paper'} [tone]   Cell colour for the surface it sits on.
 * @property {'sm'|'md'|'lg'} [size]
 * @property {boolean} [loading]
 * @property {string | null} [to]      Wraps the mark in a link when set.
 * @property {string} [className]
 */

/** Reading-order walk: a full lap, then a beat on the centre. */
const WALK = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [1, 2],
  [0, 2],
  [0, 1],
  [1, 1],
]

const SIZES = {
  sm: { cell: 4, gap: 2 },
  md: { cell: 5, gap: 2 },
  lg: { cell: 7, gap: 3 },
}

export function Logo({ withName = true, tone = 'ink', size = 'md', loading = false, to = null, className }) {
  const reduced = usePrefersReducedMotion()
  const { cell, gap } = SIZES[size]
  const nameSize = { sm: 'text-sm', md: 'text-lg', lg: 'text-xl' }[size]
  const track = cell + gap

  const cells = (
    <span
      className="relative grid shrink-0"
      style={{
        gridTemplateColumns: `repeat(3, ${cell}px)`,
        gridTemplateRows: `repeat(3, ${cell}px)`,
        gap: `${gap}px`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className={cn('rounded-[1px]', tone === 'ink' ? 'bg-ink' : 'bg-paper')}
          // The resting mark lights its top-right cell; the walking overlay takes
          // over while loading, so the underlying cell is suppressed.
          style={!loading && index === 2 ? { backgroundColor: 'var(--color-ember)' } : undefined}
        />
      ))}

      {loading ? (
        <motion.span
          className="absolute rounded-[1px] bg-ember"
          style={{ width: cell, height: cell, left: 0, top: 0 }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={
            reduced
              ? { opacity: [1, 0.45, 1] }
              : {
                  x: WALK.map(([col]) => col * track),
                  y: WALK.map(([, row]) => row * track),
                }
          }
          transition={
            reduced
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              : {
                  duration: WALK.length * 0.34,
                  times: WALK.map((_, index) => index / (WALK.length - 1)),
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
      ) : null}
    </span>
  )

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {cells}
      {withName ? (
        <span
          className={cn(
            'font-display leading-none tracking-tightest',
            nameSize,
            tone === 'ink' ? 'text-heading' : 'text-paper',
          )}
          style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1, 'wght' 560" }}
        >
          vyuh
        </span>
      ) : null}
      {loading ? <span className="sr-only">Loading</span> : null}
    </span>
  )

  if (!to) return content

  return (
    <Link to={to} aria-label="Vyuh — go to home" className="inline-flex rounded-xs">
      {content}
    </Link>
  )
}
