/**
 * Landing page copy.
 *
 * Every string, link and sample question the homepage renders lives in this
 * file. Services read it through `getLandingContent()`; deleting it (and the
 * three lines that reference it in src/mock-data/index.js) is the whole removal
 * recipe, exactly like the rest of mock-data.
 *
 * HOUSE RULES FOR THIS FILE
 *   1. No number appears here unless it is a specification we control: a paper's
 *      question count, a duration, a marking scheme, a step count. No adoption
 *      figures, no percentages, no "students report…". If a claim needs a
 *      measurement we have not made, it is written as a mechanism instead — how
 *      the thing works, not how well it scored.
 *   2. Colour never carries a status on its own; every state here has a label.
 *   3. Copy is written for one reader: a 17-year-old three weeks before a paper,
 *      and the institute that enrolled them.
 */

/**
 * @typedef {Object} NavLink
 * @property {string} label
 * @property {string} href   In-page anchor ("#analysis") or route ("/login").
 *
 * @typedef {Object} HeroAction
 * @property {string} label
 * @property {string} to
 * @property {'ember'|'ghost'} tone
 * @property {'internal'|'anchor'} kind
 *
 * @typedef {Object} SampleOption
 * @property {'A'|'B'|'C'|'D'} key
 * @property {string} text   Plain text. Equations are written with ASCII so the
 *                           card needs no KaTeX; the maths renderer lands later.
 *
 * @typedef {Object} SampleQuestion
 * @property {string} exam
 * @property {string} subject
 * @property {number} number
 * @property {number} total
 * @property {string} scheme
 * @property {string} prompt
 * @property {string} equation
 * @property {string[]} options
 * @property {'A'|'B'|'C'|'D'} answer
 * @property {string} remark   Shown after the loop settles.
 */

export const landingContent = {
  nav: {
    /** @type {NavLink[]} */
    links: [
      { label: 'Product', href: '#product' },
      { label: 'Exams', href: '#exams' },
      { label: 'Analysis', href: '#analysis' },
      { label: 'Live classes', href: '#live-classes' },
      { label: 'For institutes', href: '#institutes' },
    ],
    signIn: { label: 'Sign in', to: '/login' },
    cta: { label: 'Start a mock', to: '/login' },
    skip: 'Skip to main content',
  },

  hero: {
    eyebrow: 'Vyuh · exam preparation, precisely',
    /** The headline is split into lines so each word can rise independently. */
    headline: ['Practice like the exam.', 'Understand every mark.'],
    supporting:
      'Full-length mocks on the real pattern, a report that names the chapter behind every lost mark, and live classes that record who was actually there.',
    /** @type {HeroAction[]} */
    actions: [
      { label: 'Start a mock', to: '/login', tone: 'ember', kind: 'internal' },
      { label: 'See how analysis works', to: '#analysis', tone: 'ghost', kind: 'anchor' },
    ],
    footnote: 'Sign-in is issued by your institute at enrolment.',
  },

  samplePaper: {
    /** @type {SampleQuestion[]} */
    questions: [
      {
        exam: 'NEET-UG',
        subject: 'Physics',
        number: 14,
        total: 45,
        scheme: '+4 / \u22121',
        prompt:
          'A uniform disc of mass m and radius R rolls without slipping down a plane inclined at 30 degrees. What is the linear acceleration of its centre of mass?',
        equation: 'a = g sin\u03b8 / (1 + I / mR\u00b2)',
        options: ['g / 3', '2g / 5', 'g / 2', '3g / 7'],
        answer: 'A',
        remark: 'Rolling needs the moment of inertia about the contact point, not the centre.',
      },
      {
        exam: 'NEET-UG',
        subject: 'Chemistry',
        number: 26,
        total: 45,
        scheme: '+4 / \u22121',
        prompt:
          'Which of these has the highest first ionisation enthalpy?',
        equation: 'IE\u2081 \u221d Z_eff / r\u00b2',
        options: ['Sodium', 'Magnesium', 'Aluminium', 'Silicon'],
        answer: 'D',
        remark: 'The trend breaks twice across period 3. Account for both before choosing.',
      },
      {
        exam: 'NEET-UG',
        subject: 'Biology',
        number: 118,
        total: 180,
        scheme: '+4 / \u22121',
        prompt:
          'In a dihybrid cross with independent assortment, what fraction of the F\u2082 progeny shows both recessive traits?',
        equation: 'AaBb \u00d7 AaBb \u2192 9 : 3 : 3 : 1',
        options: ['1 / 16', '3 / 16', '1 / 4', '9 / 16'],
        answer: 'A',
        remark: 'The 9:3:3:1 ratio is a consequence of independent assortment, not a rule of its own.',
      },
    ],
    /** Digits that roll in the timer strip. Always tabular, always mono. */
    timer: { minutes: 178, seconds: 42, label: 'Time remaining' },
    paletteLabel: 'Question palette',
    legend: [
      { label: 'Answered', token: 'answer' },
      { label: 'Marked for review', token: 'review' },
      { label: 'Not answered', token: 'danger' },
    ],
    caption:
      'A real NEET-UG paper: 180 questions, 200 minutes, +4 for a correct answer and \u22121 for a wrong one.',
  },

  ticker: {
    label: 'Exam patterns Vyuh runs',
    exams: ['JEE Main', 'NEET-UG', 'JEE Advanced', 'GATE', 'CAT', 'CUET'],
  },

  bento: {
    eyebrow: 'Product',
    headline: 'Four things the platform does that a question PDF does not.',
    /** @type {{key: string, eyebrow: string, title: string, body: string, span: string}[]} */
    tiles: [
      {
        key: 'hall',
        eyebrow: '01 · Exam hall',
        title: 'The paper behaves like the real one',
        body:
          'Server-held timer, the same palette, and the same marking scheme. A student who has sat twelve mocks on this screen has already met the interface they will face in the hall.',
        span: 'exam hall',
      },
      {
        key: 'analysis',
        eyebrow: '02 · Question-level analysis',
        title: 'Every mark has a source',
        body:
          'Correct, wrong, unattempted and time-per-question, recorded per question — so a score of 148 is a list of decisions, not a single number.',
        span: 'analysis',
      },
      {
        key: 'live',
        eyebrow: '03 · Live classes',
        title: 'Attendance that is a by-product, not a register',
        body:
          'The session records who joined and when they left. Nobody calls a roll at the end.',
        span: 'live',
      },
      {
        key: 'recordings',
        eyebrow: '04 · Recordings',
        title: 'Watch, then practise the same chapter',
        body:
          'A recording opens the chapter it covers, so a rewatch ends in a problem set rather than in a habit of rewatching.',
        span: 'recordings',
      },
    ],
  },

  differentiators: {
    eyebrow: 'What is different',
    headline: 'Three decisions that change what a mock is for.',
    /** @type {{title: string, body: string, icon: string}[]} */
    items: [
      {
        title: 'Confidence marking',
        body: 'Say how sure you were, and a lucky guess stops counting as understanding.',
        icon: 'gauge',
      },
      {
        title: 'Mistake DNA',
        body: 'A wrong answer is filed by cause — concept, calculation, misread, ran out of time.',
        icon: 'dna',
      },
      {
        title: 'Offline-first',
        body: 'The paper keeps accepting answers through a dropped connection and syncs when it returns.',
        icon: 'wifi-off',
      },
    ],
  },

  howItWorks: {
    eyebrow: 'The loop',
    headline: 'Learn, practise, diagnose, remediate.',
    note: 'Each paper closes its own loop. Nothing here is a one-off campaign.',
    /** @type {{step: string, title: string, body: string}[]} */
    steps: [
      {
        step: '01',
        title: 'Learn',
        body: 'A live class covers the chapter, and the recording keeps the same chapter attached.',
      },
      {
        step: '02',
        title: 'Practise',
        body: 'A chapter set or a full-length mock, on the real pattern and the real clock.',
      },
      {
        step: '03',
        title: 'Diagnose',
        body: 'Question-level report: what was confident, what was guessed, and what ran out of time.',
      },
      {
        step: '04',
        title: 'Remediate',
        body: 'Two named chapters and a set for each, queued for the next class.',
      },
    ],
  },

  institutes: {
    eyebrow: 'For institutes',
    headline: 'Your batches, your paper pattern, your record.',
    body:
      'Vyuh runs under an institute account: your centres, your batches, your faculty. Students sign in with the address you issued, and every paper is a record your office can audit.',
    /** What the academic office gets. Mechanisms, not adjectives. */
    points: [
      'A timetable across every batch, and who teaches what',
      'Attendance from live classes, without a manual register',
      'Paper-wise and chapter-wise performance for the whole institute',
      'Roster changes handled by the office, not by students',
    ],
    cta: { label: 'Talk to the academic office', to: 'mailto:office@vidyutacademy.in' },
    ctaNote: 'Or sign in with the account your institute issued.',
  },

  footer: {
    statementLabel: 'How attendance data is used',
    statement:
      'Joining and leaving a live class records attendance. That record goes to the faculty who taught the class and to the academic office, and nowhere else. It is not sold, not shared with advertisers, and not used to build a profile outside this institute.',
    /**
     * `audience` is the accessible name for the link: three links reading
     * "Sign in" are indistinguishable by voice, so each one names its seat.
     * @type {{heading: string, audience?: string, links: {label: string, to: string, hint?: string}[]}[]}
     */
    columns: [
      {
        heading: 'Students',
        audience: 'Sign in as a student',
        links: [
          { label: 'Sign in', to: '/login', hint: 'Papers, marks, recordings' },
        ],
      },
      {
        heading: 'Faculty',
        audience: 'Sign in as faculty',
        links: [
          { label: 'Sign in', to: '/login', hint: 'Batches, question bank, evaluation' },
        ],
      },
      {
        heading: 'Academic office',
        audience: 'Sign in as the academic office',
        links: [
          { label: 'Sign in', to: '/login', hint: 'Enrolment, fees, institute reports' },
        ],
      },
      {
        heading: 'Platform',
        links: [
          { label: 'Accessibility statement', to: '/accessibility' },
          { label: 'Design preview', to: '/design-preview' },
        ],
      },
    ],
  },
}
