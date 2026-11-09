import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'

/**
 * Minimal standalone prose pages, chrome-free (no workspace nav, no CTAs) so
 * they can be linked from the landing footer. Copy is short and plainly
 * marked as placeholder until legal reviews it.
 */

function StandaloneShell({ kicker, title, updated, children }) {
  return (
    <div className="min-h-dvh bg-cinema-paper text-cinema-ink">
      <header className="flex items-center justify-between border-b border-hairline-on-paper px-5 py-4 sm:px-8">
        <a href="/" className="font-display text-xl font-[520] tracking-tight text-cinema-ink no-underline" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
          Vyuh
        </a>
        <a href="/" className="font-mono text-[0.625rem] uppercase tracking-widest text-cinema-grey underline-offset-4 hover:underline">
          Back to the top
        </a>
      </header>
      <main className="mx-auto w-full max-w-[46rem] px-5 py-14 sm:px-8">
        <p className="font-mono text-[0.625rem] uppercase tracking-widest text-cinema-grey">{kicker} · Updated {updated}</p>
        <h1 className="mt-3 font-display text-4xl font-[500] leading-[1.02] tracking-tight text-cinema-ink sm:text-5xl">{title}</h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-cinema-ink/85">{children}</div>
      </main>
    </div>
  )
}

export function AboutPage() {
  useDocumentTitle('About — Vyuh by MediXO')
  return (
    <StandaloneShell kicker="About" title="The arrangement of practice." updated="9 November 2026">
      <p>
        Vyuh — from the Sanskrit for formation or arrangement — is built on a single conviction:
        students rarely fail for lack of effort. They fail for lack of sequence. Vyuh arranges
        deliberate practice into that sequence: real exam patterns, every answer explained,
        mistakes mapped in the open, and sittings that rebuild the week before it begins.
      </p>
      <p>
        Vyuh is built by MediXO, a small team that believes institutional-grade preparation should
        feel composed, not frantic — for the students, for the teachers, and for the institutes
        that carry both.
      </p>
      <p className="font-mono text-[0.625rem] uppercase leading-relaxed tracking-widest text-cinema-grey">
        Copy is placeholder — replace with reviewed institutional text before public launch.
      </p>
    </StandaloneShell>
  )
}

export function PrivacyPage() {
  useDocumentTitle('Privacy — Vyuh by MediXO')
  return (
    <StandaloneShell kicker="Privacy" title="What we collect, and why." updated="9 November 2026">
      <p>
        Vyuh stores the responses you write during practice and examinations, the artefacts your
        institute configures (rosters, batches, schedules), and the device state needed to keep a
        sitting running offline. That data exists for one purpose: to place the right question, in
        the right order, in front of the right student.
      </p>
      <p>
        Answers are kept locally on the device during a sitting and synced when the connection
        returns. Institute administrators see aggregate progress, never private ruminations.
        Nothing you practise is sold, brokered or repurposed for advertising.
      </p>
      <p>
        Questions to the academic office, or to the privacy desk via your institute. This page is
        placeholder text pending counsel review — it is not yet a final privacy policy.
      </p>
      <p className="font-mono text-[0.625rem] uppercase leading-relaxed tracking-widest text-cinema-grey">
        Placeholder legal copy — replace with reviewed policy text before public launch.
      </p>
    </StandaloneShell>
  )
}
