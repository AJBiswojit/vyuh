import { Link, Outlet } from 'react-router-dom'
import { Logo } from '@/shared/ui/Logo.jsx'
import { ThemeToggle } from '@/shared/ui/ThemeToggle.jsx'

/**
 * PublicLayout — the marketing surface. Paper canvas, hairline header, no rail
 * and no account chrome, because a visitor has no workspace yet.
 *
 * @param {{ children?: React.ReactNode }} props
 */
export function PublicLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--color-surface)_94%,transparent)] backdrop-blur-[2px]">
        <div className="mx-auto flex h-[var(--spacing-topbar)] w-full max-w-[78rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo to="/" />
          <nav aria-label="Primary" className="flex items-center gap-1">
            <Link
              to="/login"
              className="inline-flex min-h-[var(--spacing-touch)] items-center rounded-sm px-3 text-2xs font-[560] text-heading hover:bg-surface-sunken"
            >
              Sign in
            </Link>
            <ThemeToggle className="ml-1" compact />
            <Link
              to="/login"
              className="ml-1 hidden min-h-[var(--spacing-touch)] items-center rounded-sm border border-line-strong bg-surface-raised px-3 text-2xs font-[560] text-heading transition-colors hover:border-heading sm:inline-flex"
            >
              Open workspace
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children ?? <Outlet />}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[78rem] flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-2xs text-faint">
            Vyuh · Vidyut Academy, Bhubaneswar · term 2026–27 Session 2
          </p>
          <div className="flex items-center gap-4">
            <Link to="/design-preview" className="text-2xs text-muted hover:text-heading">
              Design preview
            </Link>
            <Link to="/accessibility" className="text-2xs text-muted hover:text-heading">
              Accessibility
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
