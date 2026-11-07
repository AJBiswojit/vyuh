import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'

/**
 * Accessibility statement. States what is implemented and what is measured,
 * with the specific numbers from the design system rather than a claim.
 */
const commitments = [
  {
    title: 'Contrast',
    body: 'Body text meets WCAG AA at 4.5:1 or better on both the paper and ink surfaces. The five semantic colours ship in a legible text variant for each surface, because the mid-tone fill alone is not a text colour.',
  },
  {
    title: 'Colour is never the only signal',
    body: 'Answered, marked for review, not answered and not visited each carry a fill, a numeral weight and a label. In the exam palette the four states differ in shape as well as hue.',
  },
  {
    title: 'Focus and keyboard',
    body: 'Every control is reachable by keyboard with a visible 2px ember focus ring. The exam palette, keypad and review sheet are fully operable from the keyboard, including question navigation by number.',
  },
  {
    title: 'Tap targets',
    body: '44px minimum for every control; the exam keypad uses 56px. Rows in tables and lists keep a 44px hit area even when the text is smaller.',
  },
  {
    title: 'Motion',
    body: 'The app respects prefers-reduced-motion. Movement becomes a fade, the one looping animation stops, and progress bars resolve instantly rather than animating.',
  },
  {
    title: 'Type and zoom',
    body: 'Body text never renders below 14px, and exam question text is 18–20px. Layouts hold at 200% zoom and reflow to a single column below 768px.',
  },
]

export function AccessibilityPage() {
  useDocumentTitle('Accessibility')
  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-12 sm:px-6">
        <p className="rule-label">Statement · Updated 7 November 2026</p>
        <h1 className="mt-3 text-3xl leading-tight tracking-tighter sm:text-4xl">Accessibility</h1>
        <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-muted">
          Vyuh is used under time pressure, by students in exam halls, on shared machines and on phones. These are
          the commitments the interface is built to, not aspirational targets.
        </p>
        <dl className="mt-10 divide-y divide-line border-y border-line">
          {commitments.map((item) => (
            <div key={item.title} className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-sm font-[580] tracking-tight text-heading">{item.title}</dt>
              <dd className="max-w-[60ch] text-sm leading-relaxed text-body">{item.body}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xs leading-relaxed text-muted">
          If something here blocks you, the academic office on +91 674 250 1180 can raise it with the platform team
          directly. Reports about the exam runner are treated as same-day.
        </p>
    </div>
  )
}
