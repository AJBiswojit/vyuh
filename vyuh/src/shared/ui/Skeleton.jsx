import { cn } from '@/shared/lib/cn.js'

/**
 * Skeleton primitives. A loading state must match the layout it stands in for:
 * the same columns, the same rhythm, the same number of blocks. A spinner is
 * never the main loading state in this product.
 *
 * `width` takes any CSS length so copy blocks can keep a believable ragged edge.
 *
 * @param {{ className?: string, width?: string }} props
 */
export function SkeletonLine({ className, width = '100%' }) {
  return <div className={cn('skeleton h-3', className)} style={{ width }} aria-hidden="true" />
}

/**
 * @param {{ lines?: number, className?: string, lastWidth?: string }} props
 */
export function SkeletonLines({ lines = 3, className, lastWidth = '62%' }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton h-3"
          style={{ width: index === lines - 1 ? lastWidth : `${96 - index * 4}%` }}
        />
      ))}
    </div>
  )
}

/**
 * @param {{ className?: string }} props
 */
export function SkeletonBlock({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

/**
 * @param {{ className?: string }} props
 */
export function SkeletonCircle({ className }) {
  return <div className={cn('skeleton rounded-full', className)} aria-hidden="true" />
}

/**
 * Wrapper that hides the skeleton tree from assistive tech and announces the wait
 * once, so a screen reader hears "Loading papers" and not forty empty blocks.
 *
 * @param {{ label: string, children: React.ReactNode, className?: string }} props
 */
export function SkeletonRegion({ label, children, className }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export const Skeleton = {
  Line: SkeletonLine,
  Lines: SkeletonLines,
  Block: SkeletonBlock,
  Circle: SkeletonCircle,
  Region: SkeletonRegion,
}
