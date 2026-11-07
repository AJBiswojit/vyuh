import { ArrowRight } from 'lucide-react'
import { SectionLabel } from '@/shared/ui/SectionLabel.jsx'

/**
 * How it works, as a ruled ledger.
 *
 * Four steps in a closed loop, drawn as an accounting ledger rather than a
 * four-card row: the steps are numbered, ruled, and the last column says what
 * the step *returns* — because the loop's whole claim is that step four feeds
 * step one. A circular diagram would say the same thing with less information.
 *
 * @param {{ content: import('../../../contracts/landing.js').LandingContent }} props
 */
export function HowItWorks({ content }) {
  const { howItWorks } = content

  return (
    <section id="how-it-works" aria-labelledby="loop-heading" className="border-b border-line bg-surface">
      <div className="mx-auto w-full max-w-[78rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel>{howItWorks.eyebrow}</SectionLabel>
            <h2 id="loop-heading" className="mt-4 max-w-[26ch] text-2xl leading-tight sm:text-3xl">
              {howItWorks.headline}
            </h2>
          </div>
          <p className="max-w-[38ch] text-xs leading-relaxed text-muted">{howItWorks.note}</p>
        </div>

        {/* The ledger. A table, because it is tabular: step, what happens, what
            comes back. Screen readers get the row headers for free. */}
        <div className="mt-8 overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              The study loop, four steps, and what each step produces for the next one
            </caption>
            <thead>
              <tr className="bg-surface-sunken">
                <th scope="col" className="rule-label w-14 px-4 py-2.5 font-normal">Step</th>
                <th scope="col" className="rule-label px-4 py-2.5 font-normal">What happens</th>
                <th scope="col" className="rule-label hidden px-4 py-2.5 font-normal sm:table-cell">Produces</th>
              </tr>
            </thead>
            <tbody>
              {howItWorks.steps.map((step, index) => {
                const isLast = index === howItWorks.steps.length - 1
                return (
                  <tr
                    key={step.step}
                    className={
                      isLast
                        ? 'border-t border-line bg-surface-sunken'
                        : 'border-t border-line bg-surface-raised'
                    }
                  >
                    <th scope="row" className="px-4 py-4 align-top">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-2xs tabular-nums text-faint">{step.step}</span>
                        {isLast ? (
                          <ArrowRight className="size-3 text-ember-press" strokeWidth={2} aria-hidden="true" />
                        ) : null}
                      </span>
                    </th>
                    <td className="px-4 py-4 align-top">
                      <span className="block text-sm font-[580] tracking-tight text-heading">{step.title}</span>
                      <span className="mt-1 block max-w-[52ch] text-xs leading-relaxed text-muted">
                        {step.body}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 align-top sm:table-cell">
                      <span className="font-mono text-2xs text-faint">
                        {isLast ? 'Back to step 01' : `Feeds step ${howItWorks.steps[index + 1].step}`}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
