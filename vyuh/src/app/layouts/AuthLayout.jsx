import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/shared/ui/Logo.jsx'
import { ThemeToggle } from '@/shared/ui/ThemeToggle.jsx'

/**
 * AuthLayout — two panes on desktop, one on mobile.
 *
 * The left pane is the task (sign in, reset, accept invite). The right pane is
 * ink: it states what the account will and will not do with a student's data,
 * which is the one thing a person signing in under exam pressure actually wants
 * to know. On mobile the ink pane collapses to a single line of context.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface lg:grid-cols-[1fr_minmax(0,32rem)]">
      <div className="flex min-h-dvh flex-col">
        <header className="border-b border-line px-4 sm:px-6 lg:px-10">
          <div className="flex h-[var(--spacing-topbar)] items-center justify-between gap-3">
            <Logo to="/" />
            <div className="flex items-center gap-1">
              <ThemeToggle compact />
              <Link
                to="/"
                className="inline-flex min-h-[var(--spacing-touch)] items-center gap-1.5 rounded-sm px-2 text-2xs text-muted hover:text-heading"
              >
                <ArrowLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                Overview
              </Link>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex flex-1 items-start justify-center px-4 py-10 outline-none sm:px-6 lg:items-center lg:px-10">
          <div className="w-full max-w-[26rem]">{children ?? <Outlet />}</div>
        </main>
      </div>

      <aside
        aria-label="What this workspace covers"
        className="relative hidden flex-col justify-between overflow-hidden border-l border-line bg-ink px-10 py-12 text-paper grain lg:flex"
      >
        <div className="pointer-events-none absolute inset-0 hairline-columns-on-ink opacity-60" aria-hidden="true" />
        <div className="relative">
          <p className="rule-label text-(--color-on-ink-faint)">Term 2026–27 · Session 2</p>
          <h2 className="mt-4 max-w-[22ch] text-xl leading-tight text-paper">
            One account covers papers, marks and attendance.
          </h2>
          <ul className="mt-8 space-y-5">
            {[
              { title: 'Your papers', body: 'Timers run on server time. Answers survive a dropped connection for up to two seconds.' },
              { title: 'Your marks', body: 'Objective papers evaluate on submit. Reports publish the same evening with a per-subject split.' },
              { title: 'Your attendance', body: 'Live classes mark presence automatically. Absences reach the batch lead the same day.' },
            ].map((item, index) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-1 font-mono text-2xs tabular-nums text-ember">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-xs font-[560] text-paper">{item.title}</p>
                  <p className="mt-1 max-w-[36ch] text-2xs leading-relaxed text-(--color-on-ink-muted)">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 border-t border-hairline-on-ink pt-5">
          <p className="rule-label text-(--color-on-ink-label)">Privacy</p>
          <p className="mt-2 max-w-[38ch] text-2xs leading-relaxed text-(--color-on-ink-muted)">
            Marks are visible to you, your batch faculty and the academic office. Nothing is shared with third
            parties, and no advertising identifiers are set on this domain.
          </p>
        </div>
      </aside>
    </div>
  )
}
