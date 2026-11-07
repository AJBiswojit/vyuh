import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn.js'
/**
 * A text link with a 44px hit area without adding 44px to the layout rhythm.
 * @param {import('react').ComponentProps<typeof Link> & { className?: string }} props
 */
export function AuthLink({ className = '', ...props }) {
  return <Link {...props} className={cn('inline-flex min-h-11 items-center rounded-xs text-xs font-[560] text-heading underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember', className)} />
}
