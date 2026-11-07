/**
 * Landing page content contracts.
 *
 * The homepage is content, not hard-coded JSX: headings, the sample question and
 * the footer statement arrive through the same service boundary as every other
 * payload, so a real API can serve them later without touching a component.
 *
 * @typedef {Object} LandingNav
 * @property {{ label: string, href: string }[]} links
 * @property {{ label: string, to: string }} signIn
 * @property {{ label: string, to: string }} cta
 * @property {string} skip
 *
 * @typedef {Object} LandingHero
 * @property {string} eyebrow
 * @property {string[]} headline
 * @property {string} supporting
 * @property {{ label: string, to: string, tone: 'ember'|'ghost', kind: 'internal'|'anchor' }[]} actions
 * @property {string} footnote
 *
 * @typedef {Object} LandingSampleQuestion
 * @property {string} exam
 * @property {string} subject
 * @property {number} number
 * @property {number} total
 * @property {string} scheme
 * @property {string} prompt
 * @property {string} equation
 * @property {string[]} options
 * @property {'A'|'B'|'C'|'D'} answer
 * @property {string} remark
 *
 * @typedef {Object} LandingContent
 * @property {LandingNav} nav
 * @property {LandingHero} hero
 * @property {Object} samplePaper
 * @property {LandingSampleQuestion[]} samplePaper.questions
 * @property {{ minutes: number, seconds: number, label: string }} samplePaper.timer
 * @property {string} samplePaper.paletteLabel
 * @property {{ label: string, token: string }[]} samplePaper.legend
 * @property {string} samplePaper.caption
 * @property {{ label: string, exams: string[] }} ticker
 * @property {{ eyebrow: string, headline: string, tiles: { key: string, eyebrow: string, title: string, body: string, span: string }[] }} bento
 * @property {{ eyebrow: string, headline: string, items: { title: string, body: string, icon: string }[] }} differentiators
 * @property {{ eyebrow: string, headline: string, note: string, steps: { step: string, title: string, body: string }[] }} howItWorks
 * @property {{ eyebrow: string, headline: string, body: string, points: string[], cta: { label: string, to: string }, ctaNote: string }} institutes
 * @property {{ statementLabel: string, statement: string, columns: { heading: string, audience?: string, links: { label: string, to: string, hint?: string }[] }[] }} footer
 */

export {};
