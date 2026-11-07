import { Link } from 'react-router-dom'
import { MapPin, ShieldCheck } from 'lucide-react'
import { Logo } from '@/shared/ui/Logo.jsx'
import { Skeleton } from '@/shared/ui/Skeleton.jsx'

/**
 * Landing footer.
 *
 * Three sign-in doors, one per seat, because a student and an academic office
 * arrive with different questions. Under them sits the statement that belongs in
 * a footer rather than behind a policy link: what happens to attendance data.
 * That sentence is copy, so it comes from mock-data like everything else.
 *
 * @param {{
 *   content: import('../../../contracts/landing.js').LandingContent,
 *   profile: import('../../../contracts/institute.js').InstituteProfile | undefined,
 *   pending: boolean,
 * }} props
 */
export function SiteFooter({ content, profile, pending }) {
  const { footer } = content

  return (
    <footer className="border-t border-hairline-on-ink bg-ink text-paper">
      <div className="mx-auto w-full max-w-[78rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo tone="paper" size="sm" />
            <p className="mt-3 max-w-[30ch] text-xs leading-relaxed text-(--color-on-ink-muted)">
              The examination platform for Vidyut Academy, Bhubaneswar. Established 2009.
            </p>
            <address className="mt-4 flex items-start gap-2 text-2xs not-italic leading-relaxed text-(--color-on-ink-faint)">
              <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              {pending ? (
                <Skeleton.Lines lines={2} className="w-40 opacity-30" />
              ) : (
                <span>{profile?.contact.address ?? 'Plot 214, Jaydev Vihar, Bhubaneswar 751013'}</span>
              )}
            </address>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="rule-label text-(--color-on-ink-label)">{column.heading}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    {/*
                      "Sign in" alone is the same accessible name three times
                      over. Each link therefore announces its seat: "Sign in as a
                      student". The visible label stays short because the column
                      heading already carries the seat.
                    */}
                    <Link
                      to={link.to}
                      aria-label={column.audience && link.label === 'Sign in' ? column.audience : undefined}
                      className="group inline-flex flex-col rounded-xs text-xs text-(--color-on-ink) transition-colors hover:text-paper"
                    >
                      <span className="underline decoration-hairline-on-ink underline-offset-2 group-hover:decoration-ember">
                        {link.label}
                      </span>
                      {link.hint ? (
                        <span aria-hidden="true" className="mt-0.5 text-[0.6875rem] text-(--color-on-ink-faint)">
                          {link.hint}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* The attendance statement. Deliberately not behind a link. */}
        <div className="mt-9 flex flex-col gap-3 border-t border-hairline-on-ink pt-5 sm:flex-row sm:items-start sm:gap-6">
          <p className="flex shrink-0 items-center gap-2 font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-label)">
            <ShieldCheck className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            {footer.statementLabel}
          </p>
          <p className="max-w-[82ch] text-2xs leading-relaxed text-(--color-on-ink-muted)">{footer.statement}</p>
        </div>
      </div>

      <div className="border-t border-hairline-on-ink">
        <div className="mx-auto flex w-full max-w-[78rem] flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-2xs text-(--color-on-ink-faint)">
            © 2026 Vidyut Academy. All marks and ranks are provisional until the term closes.
          </p>
          <p className="font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-label)">
            {pending ? '—' : (profile?.term ?? '2026–27 · Session 2')}
          </p>
        </div>
      </div>
    </footer>
  )
}
