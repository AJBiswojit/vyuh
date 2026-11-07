import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Menu } from 'lucide-react'
import { Logo } from '@/shared/ui/Logo.jsx'
import { ThemeToggle } from '@/shared/ui/ThemeToggle.jsx'
import { IconButton } from '@/shared/ui/IconButton.jsx'
import { SectionLabel } from '@/shared/ui/SectionLabel.jsx'
import { Skeleton } from '@/shared/ui/Skeleton.jsx'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { Button } from '@/shared/ui/Button.jsx'
import { Sheet } from '@/shared/ui/Sheet.jsx'
import { durations, easeEntrance } from '@/shared/lib/motion.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'
import { useState } from 'react'
import { useLandingContent } from '../hooks/useLandingContent.js'
import { useInstituteProfile } from '../hooks/useInstituteProfile.js'
import { MockQuestionCard } from '../components/MockQuestionCard.jsx'
import { ExamTicker } from '../components/ExamTicker.jsx'
import { FeatureBento } from '../components/FeatureBento.jsx'
import { DifferentiatorStrip } from '../components/DifferentiatorStrip.jsx'
import { HowItWorks } from '../components/HowItWorks.jsx'
import { InstitutesSection } from '../components/InstitutesSection.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'

/**
 * Landing page — public homepage, built on Ink.
 *
 * It shows the product rather than a picture of it: the hero's right column is a
 * real NEET-style question with a marker walking the options and a timer running
 * on the paper's own clock, and each bento tile contains the surface it talks
 * about. Nothing here is a decorative mockup, which is why the page can carry no
 * screenshots.
 *
 * All copy comes from the landing service (mock-data/landing.js), so the page has
 * no sentences in it and no statistics it cannot source.
 *
 * Ember budget: one filled ember button, in the hero. Everything below the fold
 * uses ink, ghost or hairlines.
 */
export function LandingPage() {
  useDocumentTitle('Vyuh — Practice like the exam')
  const { data: content, isPending, isError, refetch } = useLandingContent()
  const { data: institute, isPending: institutePending } = useInstituteProfile()
  const reduced = usePrefersReducedMotion()
  const [navOpen, setNavOpen] = useState(false)

  if (isPending) return <LandingSkeleton />
  if (isError || !content) {
    return (
      <div className="flex min-h-dvh items-center bg-ink px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-[42rem]">
          {/* The error panel sits on Paper even though the page is Ink: it is a
              paper artefact (a sheet of state), and ErrorState is built for the
              paper scale. */}
          <div className="rounded-md bg-surface p-6">
            <ErrorState
              size="panel"
              code="E_LANDING"
              title="The page could not load"
              description="Its content did not arrive. Nothing is broken on your side — reload to try again."
              action={
                <Button variant="secondary" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          </div>
        </div>
      </div>
    )
  }

  const { nav, hero } = content
  const heroWords = hero.headline.flatMap((line, lineIndex) =>
    line.split(' ').map((word, wordIndex) => ({ word, lineIndex, wordIndex })),
  )
  let wordCounter = 0

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ── Nav ───────────────────────────────────────────────────────────
          Sits on the same Ink as the hero, with a hairline under it. The nav is
          not sticky: a marketing page whose header follows you is a page that
          keeps taking vertical space for no new information. */}
      <header className="border-b border-hairline-on-ink bg-ink">
        <div className="mx-auto flex h-[var(--spacing-topbar)] w-full max-w-[78rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo tone="paper" to="/" />
            <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
              {nav.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="inline-flex min-h-[var(--spacing-touch)] items-center rounded-xs px-2.5 text-xs text-(--color-on-ink-muted) transition-colors hover:text-paper"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle compact onInk className="mr-1 hidden sm:inline-flex" />
            <Link
              to={nav.signIn.to}
              className="inline-flex min-h-[var(--spacing-touch)] items-center rounded-xs px-2.5 text-xs text-(--color-on-ink-muted) transition-colors hover:text-paper"
            >
              {nav.signIn.label}
            </Link>
            {/*
              The nav repeats the hero's primary action, so it is deliberately the
              quieter of the two: a hairline on ink. Two ember fills in one
              viewport would split the eye and break the one-primary rule; the
              single ember belongs to the hero CTA, which is the bigger commitment.
            */}
            <Link
              to={nav.cta.to}
              className="hidden min-h-[var(--spacing-touch)] items-center gap-1.5 rounded-sm border border-hairline-on-ink-strong px-3.5 text-xs font-[560] text-paper transition-colors hover:border-paper sm:inline-flex"
            >
              {nav.cta.label}
              <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <IconButton
              icon={<Menu strokeWidth={1.5} />}
              label="Open section menu"
              variant="inverse"
              size="sm"
              onClick={() => setNavOpen(true)}
              className="lg:hidden"
            />
          </div>
        </div>
      </header>

      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title="Sections" side="right" size="sm">
        <nav aria-label="Sections" className="flex flex-col">
          {nav.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setNavOpen(false)}
              className="border-b border-line py-3 text-sm text-body hover:text-heading"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-5 flex flex-col gap-2">
            <Link
              to={nav.cta.to}
              className="inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-4 text-sm font-[560] text-paper"
            >
              {nav.cta.label}
            </Link>
            <Link
              to={nav.signIn.to}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-line-strong px-4 text-sm text-heading"
            >
              {nav.signIn.label}
            </Link>
          </div>
        </nav>
      </Sheet>

      <main id="main-content" tabIndex={-1} className="outline-none">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-paper grain">
        <div className="mx-auto grid w-full max-w-[78rem] grid-cols-1 items-center gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="min-w-0">
            <motion.p
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: durations.standard }}
              className="rule-label text-(--color-on-ink-label)"
            >
              {hero.eyebrow}
            </motion.p>

            {/* Words rise independently, 40ms apart. The heading stays one
                heading for assistive tech: the words are spans inside an h1. */}
            <h1 className="mt-5 max-w-[20ch] text-3xl leading-[1.02] tracking-tightest text-paper sm:text-4xl lg:text-5xl">
              {hero.headline.map((line, lineIndex) => (
                <span key={line} className="block">
                  {line.split(' ').map((word, wordIndex) => {
                    const delay = reduced ? 0 : wordCounter * 0.04
                    wordCounter += 1
                    return (
                      <span key={`${lineIndex}-${wordIndex}`} className="hero-word">
                        <motion.span
                          className="inline-block"
                          initial={reduced ? false : { opacity: 0, y: '0.42em' }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: durations.expressive, delay, ease: easeEntrance }}
                        >
                          {word}
                        </motion.span>
                        {wordIndex < line.split(' ').length - 1 ? '\u00a0' : ''}
                      </span>
                    )
                  })}
                </span>
              ))}
            </h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durations.standard, delay: reduced ? 0 : heroWords.length * 0.04, ease: easeEntrance }}
              className="mt-6 max-w-[48ch] text-sm leading-relaxed text-(--color-on-ink)"
            >
              {hero.supporting}
            </motion.p>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: durations.standard,
                delay: reduced ? 0 : heroWords.length * 0.04 + 0.08,
                ease: easeEntrance,
              }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {hero.actions.map((action) =>
                action.tone === 'ember' ? (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-ember px-5 text-sm font-[560] text-on-ember transition-colors hover:bg-ember-press"
                  >
                    {action.label}
                    <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                ) : (
                  <a
                    key={action.label}
                    href={action.to}
                    className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-hairline-on-ink-strong px-5 text-sm text-paper transition-colors hover:border-paper"
                  >
                    {action.label}
                  </a>
                ),
              )}
            </motion.div>

            <p className="mt-5 text-2xs text-(--color-on-ink-faint)">{hero.footnote}</p>
          </div>

          <div className="relative min-w-0">
            {/* Hairline column grid: the only ornament on the page, and it is the
                same grid the workspace uses. */}
            <div
              className="pointer-events-none absolute -inset-x-4 -inset-y-6 hairline-columns-on-ink opacity-40"
              aria-hidden="true"
            />
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: durations.expressive, delay: reduced ? 0 : 0.18, ease: easeEntrance }}
              className="relative"
            >
              <MockQuestionCard content={content} reduced={reduced} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Exam ticker ───────────────────────────────────────────────────
          This is the "Exams" anchor: the nav's promise is a list of the papers
          the platform runs, and this strip is that list. */}
      <div id="exams" className="scroll-mt-4">
        <ExamTicker label={content.ticker.label} exams={content.ticker.exams} reduced={reduced} />
      </div>

      {/* ── Feature bento ───────────────────────────────────────────────── */}
      <section id="product" aria-labelledby="product-heading" className="border-b border-line">
        <div className="mx-auto w-full max-w-[78rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel>{content.bento.eyebrow}</SectionLabel>
              <h2 id="product-heading" className="mt-4 max-w-[32ch] text-2xl leading-tight sm:text-3xl">
                {content.bento.headline}
              </h2>
            </div>
            <p className="max-w-[36ch] text-xs leading-relaxed text-muted">
              Every panel below is the product itself, at small size — the palette, the answer sheet,
              the roster, the recording.
            </p>
          </div>

          <FeatureBento content={content} reduced={reduced} />
        </div>
      </section>

      {/* ── Differentiators ─────────────────────────────────────────────── */}
      <DifferentiatorStrip content={content} />

      {/* ── How it works ────────────────────────────────────────────────── */}
      <HowItWorks content={content} />

      {/* ── For institutes ──────────────────────────────────────────────── */}
      <InstitutesSection content={content} />
      </main>

      <SiteFooter content={content} profile={institute} pending={institutePending} />
    </>
  )
}

/**
 * Loading state. Mirrors the hero's two columns and reserves the height the real
 * content occupies, so the page does not jump when the copy arrives.
 */
function LandingSkeleton() {
  return (
    <div className="bg-ink">
      <div className="border-b border-hairline-on-ink">
        <div className="mx-auto flex h-[var(--spacing-topbar)] w-full max-w-[78rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo tone="paper" to="/" />
          <Skeleton.Line className="skeleton-on-ink w-24" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[78rem] grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="space-y-4" role="status" aria-busy="true">
          <span className="sr-only">Loading the page</span>
          <Skeleton.Line className="skeleton-on-ink h-3 w-40" />
          <Skeleton.Line className="skeleton-on-ink h-14 w-full" />
          <Skeleton.Line className="skeleton-on-ink h-14 w-4/5" />
          <Skeleton.Lines lines={2} className="skeleton-on-ink mt-6 w-3/4" />
          <div className="flex gap-3 pt-4">
            <Skeleton.Block className="skeleton-on-ink h-12 w-40" />
            <Skeleton.Block className="skeleton-on-ink h-12 w-48" />
          </div>
        </div>
        <Skeleton.Block className="skeleton-on-ink h-[26rem] w-full" />
      </div>
    </div>
  )
}
