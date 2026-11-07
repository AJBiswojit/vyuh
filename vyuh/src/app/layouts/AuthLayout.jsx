import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Logo, ThemeToggle } from '@/shared/ui'
import { isMockMode } from '@/shared/lib/services.js'

/**
 * Ink brand pane / Paper task pane. The brand pane is always first in the DOM;
 * on a phone it becomes a compact header rather than disappearing context.
 * The form pane keeps its own surface in either theme.
 */
export function AuthLayout() {
  const location = useLocation()
  useEffect(() => {
    const target = /** @type {HTMLElement | null} */ (document.querySelector('main h1') ?? document.getElementById('main-content'))
    target?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <a href="#main-content" className="skip-link">Skip to form</a>
      <aside aria-label="About Vyuh" className="relative isolate overflow-hidden bg-ink text-paper grain lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-h-[44rem] lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16 xl:py-12">
        <div className="pointer-events-none absolute inset-0 -z-10 hairline-columns-on-ink opacity-40" aria-hidden="true" />
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-0 lg:py-0">
          <Logo to="/" tone="paper" size="md" />
          <span className="hidden font-mono text-2xs uppercase tracking-widest text-on-ink-label lg:block">A clearer way to prepare</span>
          <span className="font-mono text-2xs text-on-ink-muted lg:hidden">Exam preparation, precisely.</span>
        </div>

        <div className="relative hidden py-12 lg:block">
          <div className="mb-9 inline-flex rounded-md border border-hairline-on-ink bg-ink-raised p-5" aria-hidden="true">
            <Logo tone="paper" size="xl" withName={false} loading />
          </div>
          <p className="rule-label mb-5 text-on-ink-label">Practice. Understand. Progress.</p>
          <h2 className="max-w-[14ch] text-3xl leading-[1.08] tracking-tightest text-paper xl:text-4xl">
            Your preparation.<br />A little more<br /><span className="text-on-ink-muted">in focus.</span>
          </h2>
          <p className="mt-6 max-w-[35ch] text-sm leading-relaxed text-on-ink">
            One thoughtful workspace for your papers, your progress, and the people behind your preparation.
          </p>
          <div className="mt-10 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-ember" />
            <span className="font-mono text-2xs uppercase tracking-widest text-on-ink-label">Built for the next attempt</span>
          </div>
        </div>

        <div className="hidden border-t border-hairline-on-ink pt-6 lg:block">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-on-ink-muted" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-xs font-[560] text-paper">Your work belongs to you.</p>
              <p className="mt-1.5 max-w-[40ch] text-xs leading-relaxed text-on-ink-muted">No advertising identifiers. No attendance tracking beyond your classes. Just a clear view of what comes next.</p>
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between gap-4 font-mono text-2xs text-on-ink-label">
            <span>Vidyut Academy · Bhubaneswar</span><span>2026–27</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-[var(--spacing-topbar)] items-center justify-between gap-3 border-b border-line px-5 sm:px-8 lg:px-10">
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-xs text-xs text-muted transition-colors hover:text-heading">
            <ArrowUpRight className="size-3.5 rotate-[-135deg]" strokeWidth={1.5} aria-hidden="true" />Back to overview
          </Link>
          <div className="flex items-center gap-3">
            {isMockMode ? <span className="hidden rounded-xs border border-line px-2 py-1 font-mono text-2xs uppercase tracking-wider text-faint sm:inline-flex">Demo workspace</span> : null}
            <ThemeToggle compact />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex flex-1 items-start justify-center px-5 py-9 outline-none sm:px-8 sm:py-12 lg:items-center lg:px-10 lg:py-14 xl:px-16">
          <div className="w-full max-w-[28rem]"><Outlet /></div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-line px-5 py-3 text-2xs text-faint sm:px-8 lg:px-10">
          <span>Thoughtfully built for focused minds.</span>
          <Link to="/accessibility" className="inline-flex min-h-11 items-center rounded-xs underline decoration-line underline-offset-4 hover:text-heading">Accessibility</Link>
        </footer>
      </div>
    </div>
  )
}
