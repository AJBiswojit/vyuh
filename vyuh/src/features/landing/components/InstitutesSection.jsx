import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { SectionLabel } from '@/shared/ui/SectionLabel.jsx'

/**
 * For institutes. The buyer here is an academic office, not a student, so the
 * section lists what the office can *do* — audit, timetable, roster — rather
 * than benefits. The CTA is a mailto because the office is reached by email;
 * sending someone to a demo form they then have to chase is worse.
 *
 * This is the only filled ink CTA on the page outside the hero, and it is ink,
 * not ember: the single ember fill belongs to the primary action, and a second
 * one would split the page's attention.
 *
 * @param {{ content: import('../../../contracts/landing.js').LandingContent }} props
 */
export function InstitutesSection({ content }) {
  const { institutes } = content

  return (
    <section id="institutes" aria-labelledby="institutes-heading" className="border-b border-line">
      <div className="mx-auto w-full max-w-[78rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-surface-raised p-6 sm:p-8">
            <SectionLabel>{institutes.eyebrow}</SectionLabel>
            <h2 id="institutes-heading" className="mt-4 max-w-[28ch] text-2xl leading-tight sm:text-3xl">
              {institutes.headline}
            </h2>
            <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-body">{institutes.body}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={institutes.cta.to}
                className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-ink px-5 text-sm font-[560] text-paper transition-opacity hover:opacity-90"
              >
                {institutes.cta.label}
                <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </a>
              <p className="text-xs text-muted">
                {institutes.ctaNote.split('sign in')[0]}
                <Link to="/sign-in" className="text-heading underline decoration-line-strong underline-offset-2 hover:decoration-ember">
                  sign in
                </Link>
                {institutes.ctaNote.split('sign in')[1]}
              </p>
            </div>
          </div>

          {/* What the office gets. A list, not a second row of cards. */}
          <div className="bg-surface-sunken p-6 sm:p-8">
            <p className="rule-label">What the academic office gets</p>
            <ul className="mt-4 space-y-3">
              {institutes.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-xs leading-relaxed text-body">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-answer-fg" strokeWidth={2} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>

            {/* The institute in this build, stated plainly so nobody wonders. */}
            <dl className="mt-6 space-y-2 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-2xs uppercase tracking-widest text-faint">Institute</dt>
                <dd className="text-xs text-heading">Vidyut Academy, Bhubaneswar</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-2xs uppercase tracking-widest text-faint">Term</dt>
                <dd className="text-xs text-heading">2026–27 · Session 2</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
