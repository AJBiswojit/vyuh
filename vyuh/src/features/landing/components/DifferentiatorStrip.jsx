import { Dna, Gauge, WifiOff } from 'lucide-react'

/**
 * Three decisions, one line each. Not a feature list: each of these changes what
 * a mock is *for*, which is why they sit together and away from the bento.
 *
 * A strip rather than three cards — the shape says "these are one argument",
 * and three identical cards here would repeat the bento's rhythm one section
 * later.
 *
 * @param {{ content: import('../../../contracts/landing.js').LandingContent }} props
 */
const ICONS = { gauge: Gauge, dna: Dna, 'wifi-off': WifiOff }

export function DifferentiatorStrip({ content }) {
  const { differentiators } = content

  return (
    <section aria-labelledby="different-heading" className="border-b border-line bg-ink text-paper">
      <div className="mx-auto w-full max-w-[78rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-baseline lg:justify-between">
          <h2 id="different-heading" className="max-w-[30ch] text-xl leading-tight text-paper sm:text-2xl">
            {differentiators.headline}
          </h2>
          <p className="font-mono text-2xs uppercase tracking-widest text-(--color-on-ink-label)">
            {differentiators.eyebrow}
          </p>
        </div>

        <ul className="mt-7 grid grid-cols-1 divide-y divide-hairline-on-ink border-t border-hairline-on-ink sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {differentiators.items.map((item) => {
            const Icon = ICONS[item.icon] ?? Gauge
            return (
              <li key={item.title} className="flex gap-3 py-5 sm:px-5 sm:py-6 sm:first:pl-0 sm:last:pr-0">
                <Icon className="mt-0.5 size-4 shrink-0 text-ember" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-[580] tracking-tight text-paper">{item.title}</h3>
                  <p className="mt-1 max-w-[34ch] text-xs leading-relaxed text-(--color-on-ink-muted)">
                    {item.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
