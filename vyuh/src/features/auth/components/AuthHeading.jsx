import { cn } from '@/shared/lib/cn.js'
/** @param {{ eyebrow: string, title: string, description?: React.ReactNode, children?: React.ReactNode, className?: string }} props */
export function AuthHeading({ eyebrow, title, description, children, className }) {
  return (
    <header className={cn('mb-7', className)}>
      <p className="rule-label flex items-center gap-2.5 text-faint"><span className="h-px w-5 bg-ember" aria-hidden="true" />{eyebrow}</p>
      <h1 tabIndex={-1} className="mt-4 outline-none text-2xl leading-[1.12] tracking-tighter text-heading sm:text-3xl">{title}</h1>
      {description ? <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-muted">{description}</p> : null}
      {children}
    </header>
  )
}
