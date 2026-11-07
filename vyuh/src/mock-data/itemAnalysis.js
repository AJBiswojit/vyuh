/**
 * Item analysis for the NEET Practice 01 cohort sitting.
 *
 * Thirty-two candidates sat the forty-item physics-and-chemistry half of the
 * paper. Their responses are generated once, deterministically, from an ability
 * spread and a per-item difficulty — so the difficulty index, the discrimination
 * index, the Kuder–Richardson reliability and the post-fault score register are
 * all derived from the same matrix rather than typed in separately.
 *
 * Four items are deliberately flat: strong and weak candidates answer them at
 * the same rate, which is exactly the case the faculty screen must flag.
 *
 * @typedef {import('../contracts/faculty.js').ItemPoint} ItemPoint
 */
import { chapters } from './academics.js'
import { authoredSections, questions as authoredQuestions } from './questions.js'
import { clamp, round } from '../shared/lib/facultyMath.js'

export const ITEM_ANALYSIS_EXAM_ID = 'exam-neet-practice'
export const ITEM_ANALYSIS_MARKS = 4
export const ITEM_ANALYSIS_NEGATIVE = 1

/** Items analysed: the twenty physics and twenty chemistry questions. */
export const analysedQuestionIds = authoredQuestions
  .filter((question) => question.sectionId === 'sec-phy' || question.sectionId === 'sec-che')
  .map((question) => question.id)

/** @type {{ id: string, name: string, rollNumber: string }[]} */
export const analysisCohort = [
  { id: 'ia-01', name: 'Aditi Rath', rollNumber: 'VY-26-0401' },
  { id: 'ia-02', name: 'Rohan Mohanty', rollNumber: 'VY-26-0402' },
  { id: 'ia-03', name: 'Ishita Patnaik', rollNumber: 'VY-26-0403' },
  { id: 'ia-04', name: 'Meera Sahu', rollNumber: 'VY-26-0404' },
  { id: 'ia-05', name: 'Aarav Das', rollNumber: 'VY-26-0405' },
  { id: 'ia-06', name: 'Sasmita Behera', rollNumber: 'VY-26-0406' },
  { id: 'ia-07', name: 'Karan Jena', rollNumber: 'VY-26-0407' },
  { id: 'ia-08', name: 'Priya Nayak', rollNumber: 'VY-26-0408' },
  { id: 'ia-09', name: 'Debasish Panda', rollNumber: 'VY-26-0409' },
  { id: 'ia-10', name: 'Nandini Mishra', rollNumber: 'VY-26-0410' },
  { id: 'ia-11', name: 'Sourav Samal', rollNumber: 'VY-26-0411' },
  { id: 'ia-12', name: 'Trupti Ghosh', rollNumber: 'VY-26-0412' },
  { id: 'ia-13', name: 'Ankit Bhoi', rollNumber: 'VY-26-0413' },
  { id: 'ia-14', name: 'Sneha Rout', rollNumber: 'VY-26-0414' },
  { id: 'ia-15', name: 'Bikash Nayak', rollNumber: 'VY-26-0415' },
  { id: 'ia-16', name: 'Ritika Mallick', rollNumber: 'VY-26-0416' },
  { id: 'ia-17', name: 'Omkar Sethi', rollNumber: 'VY-26-0417' },
  { id: 'ia-18', name: 'Lipsa Pradhan', rollNumber: 'VY-26-0418' },
  { id: 'ia-19', name: 'Harsh Vardhan', rollNumber: 'VY-26-0419' },
  { id: 'ia-20', name: 'Swagatika Dei', rollNumber: 'VY-26-0420' },
  { id: 'ia-21', name: 'Pratik Sahoo', rollNumber: 'VY-26-0421' },
  { id: 'ia-22', name: 'Jasmin Parida', rollNumber: 'VY-26-0422' },
  { id: 'ia-23', name: 'Nihar Ranjan', rollNumber: 'VY-26-0423' },
  { id: 'ia-24', name: 'Sagarika Das', rollNumber: 'VY-26-0424' },
  { id: 'ia-25', name: 'Rakesh Barik', rollNumber: 'VY-26-0425' },
  { id: 'ia-26', name: 'Ananya Tripathy', rollNumber: 'VY-26-0426' },
  { id: 'ia-27', name: 'Chinmay Ojha', rollNumber: 'VY-26-0427' },
  { id: 'ia-28', name: 'Rashmi Bal', rollNumber: 'VY-26-0428' },
  { id: 'ia-29', name: 'Siddharth Pani', rollNumber: 'VY-26-0429' },
  { id: 'ia-30', name: 'Mitali Nayak', rollNumber: 'VY-26-0430' },
  { id: 'ia-31', name: 'Papun Behera', rollNumber: 'VY-26-0431' },
  { id: 'ia-32', name: 'Sonali Mishra', rollNumber: 'VY-26-0432' },
]

/** Ability spread: a bell-ish shape from the bottom of the batch to the top. */
const abilities = analysisCohort.map((_, index) => {
  const centred = index / (analysisCohort.length - 1)
  return 0.28 + (Math.sin(centred * Math.PI) * 0.24 + centred * 0.36)
})

/**
 * Per-item difficulty. Four items are flat by construction: half the cohort
 * answers them correctly, chosen without reference to ability, so strong and
 * weak candidates land on the same rate and the screen flags them.
 *
 * `q-neet-p03` is in this set on purpose: the published result sheet answers it
 * wrongly, so marking that item faulty visibly moves the student's score — the
 * acceptance path for the fault policy is demonstrable end to end.
 */
const flatQuestionIds = ['q-neet-p03', 'q-neet-p13', 'q-neet-c03', 'q-neet-c16']
const flatQuestionIdSet = new Set(flatQuestionIds)

/** @param {number} index */
function itemDifficulty(index) {
  const band = [0.28, 0.36, 0.46, 0.54, 0.63, 0.72]
  return band[index % band.length]
}

/** Candidates ordered strongest first — the axis every item is judged against. */
const orderedCohort = analysisCohort
  .map((student, index) => ({ ...student, ability: abilities[index] }))
  .sort((a, b) => b.ability - a.ability)

/**
 * Response matrix: correct, wrong or blank, per candidate per item.
 * Correctness is assigned from the ability order so the discrimination index is
 * a property of the cohort rather than of this module's random seed.
 * @type {Record<string, Record<string, 'correct'|'wrong'|'blank'>>}
 */
export const analysisResponses = Object.fromEntries(analysisCohort.map((student) => [student.id, {}]))

analysedQuestionIds.forEach((questionId, itemIndex) => {
  const total = orderedCohort.length
  const flat = flatQuestionIdSet.has(questionId)
  /** @type {Set<string>} */
  const correct = new Set()
  if (flat) {
    orderedCohort.forEach((student, rank) => {
      if ((rank + itemIndex) % 2 === 0) correct.add(student.id)
    })
  } else {
    const count = Math.round(itemDifficulty(itemIndex) * total)
    orderedCohort.slice(0, count).forEach((student) => correct.add(student.id))
    // Two realistic wobbles: the strongest candidates slip and two candidates
    // just below the cut make up for it. Without them the scatter would look
    // like a drawn curve rather than a cohort.
    // Three deterministic flips per item, so no item separates the cohort
    // perfectly and the total scores carry the noise a real sitting has. One of
    // the flips always lands in the bottom third: without that overlap the
    // discrimination index would read 1 on every easy item.
    const weakThird = orderedCohort.slice(Math.ceil(total * 0.73))
    for (let flip = 0; flip < 3; flip += 1) {
      const student = orderedCohort[(itemIndex * 7 + flip * 11 + 5) % total]
      if (!student) continue
      if (correct.has(student.id)) correct.delete(student.id)
      else correct.add(student.id)
    }
    correct.delete(orderedCohort[itemIndex % 3].id)
    correct.add(weakThird[(itemIndex * 5 + 1) % weakThird.length].id)
  }
  orderedCohort.forEach((student, rank) => {
    if (correct.has(student.id)) {
      analysisResponses[student.id][questionId] = 'correct'
    } else if (!flat && (rank * 7 + itemIndex * 13) % 11 === 0) {
      analysisResponses[student.id][questionId] = 'blank'
    } else {
      analysisResponses[student.id][questionId] = 'wrong'
    }
  })
})

/** @param {string} questionId */
function authoredQuestionById(questionId) {
  return authoredQuestions.find((question) => question.id === questionId) ?? null
}

/** @param {string} topicId */
function topicName(topicId) {
  return chapters.find((chapter) => chapter.id === topicId)?.name ?? topicId
}

/** Total score per candidate, used to define the strong and weak thirds. */
const totals = analysisCohort
  .map((student) => {
    const answers = analysisResponses[student.id]
    const score = Object.values(answers).reduce(
      (sum, outcome) => sum + (outcome === 'correct' ? ITEM_ANALYSIS_MARKS : outcome === 'wrong' ? -ITEM_ANALYSIS_NEGATIVE : 0),
      0,
    )
    return { studentId: student.id, score }
  })
  .sort((a, b) => b.score - a.score)

const third = Math.max(1, Math.round(totals.length * 0.27))
const strongIds = new Set(totals.slice(0, third).map((row) => row.studentId))
const weakIds = new Set(totals.slice(-third).map((row) => row.studentId))

/**
 * Base item points. `flagged` and `flagReason` are filled here; `faulty` is the
 * service's business, because only a confirmed mark makes an item faulty.
 * @type {ItemPoint[]}
 */
export const itemPoints = analysedQuestionIds.map((questionId, index) => {
  const question = authoredQuestionById(questionId)
  const answers = Object.entries(analysisResponses)
  const correct = answers.filter(([, outcomes]) => outcomes[questionId] === 'correct')
  const strong = answers.filter(([studentId]) => strongIds.has(studentId))
  const weak = answers.filter(([studentId]) => weakIds.has(studentId))
  const strongPercent = strong.length === 0 ? 0 : strong.filter(([, outcomes]) => outcomes[questionId] === 'correct').length / strong.length
  const weakPercent = weak.length === 0 ? 0 : weak.filter(([, outcomes]) => outcomes[questionId] === 'correct').length / weak.length
  const difficultyIndex = round(correct.length / Math.max(1, answers.length), 3)
  const discrimination = round(strongPercent - weakPercent, 3)
  const attempts = answers.length
  const subject = authoredSections.find((section) => section.id === question?.sectionId)
  const flat = flatQuestionIdSet.has(questionId)
  const flagReason =
    attempts < 5
      ? 'Too few responses to judge'
      : flat || discrimination < 0.1
        ? 'Strong and weak students perform the same'
        : difficultyIndex > 0.92
          ? 'Too easy to separate candidates'
          : difficultyIndex < 0.18
            ? 'Too hard: most candidates guessed'
            : null
  return {
    questionId,
    number: index + 1,
    subjectId: question?.subjectId ?? 'sub-phy',
    subjectName: subject?.name ?? 'Physics',
    topicId: question?.chapterId ?? 'ch-rot',
    topicName: topicName(question?.chapterId ?? 'ch-rot'),
    body: question?.body ?? '',
    difficultyIndex,
    discrimination,
    attempts,
    strongPercent: round(strongPercent * 100, 1),
    weakPercent: round(weakPercent * 100, 1),
    flagged: Boolean(flagReason),
    flagReason,
    faulty: false,
  }
})

/**
 * Re-teach suggestions per topic. Copy is specific on purpose: "re-teach" has to
 * mean something a faculty member can put in Thursday's slot.
 * @type {Record<string, { title: string, minutes: number, resources: { label: string, href?: string }[] }>}
 */
export const reteachPlans = {
  'ch-rot': {
    title: 'Rotational motion: pivot choice, then two worked ladder problems',
    minutes: 45,
    resources: [{ label: 'Recording · Torque & Equilibrium', href: '/student/recordings/rec-rot-b?t=12' }, { label: 'Ten-question drill' }],
  },
  'ch-elec': {
    title: 'Electrostatics: Gauss-law surfaces drawn before any algebra',
    minutes: 40,
    resources: [{ label: 'Worksheet · flux and enclosed charge' }],
  },
  'ch-opt': {
    title: 'Ray optics: sign convention on one page, then mirror/lens pairs',
    minutes: 35,
    resources: [{ label: 'Twelve mirror sums' }],
  },
  'ch-thermo': {
    title: 'Thermodynamics: process table (isothermal, adiabatic, isochoric)',
    minutes: 40,
    resources: [{ label: 'Process comparison sheet' }],
  },
  'ch-bond': {
    title: 'Chemical bonding: VSEPR shapes with lone-pair compression',
    minutes: 45,
    resources: [{ label: 'Recording · Bonding and shape', href: '/student/recordings/rec-org-m?t=16' }],
  },
  'ch-org': {
    title: 'Organic mechanisms: arrow pushing from electrons, never from charges',
    minutes: 50,
    resources: [{ label: 'Recording · Arrow Pushing', href: '/student/recordings/rec-org-m?t=0' }, { label: 'Mechanism bank' }],
  },
  'ch-eq': {
    title: 'Equilibrium: Le Chatelier in one live demonstration',
    minutes: 30,
    resources: [{ label: 'Demonstration notes' }],
  },
}

/**
 * Kuder–Richardson 20 on this sitting: item variances against the variance of
 * the candidates' total scores. Measured once here, displayed by the screen.
 */
export const itemReliability = (() => {
  const totals_ = Object.values(analysisResponses).map((answers) =>
    Object.values(answers).reduce((sum, outcome) => sum + (outcome === 'correct' ? ITEM_ANALYSIS_MARKS : outcome === 'wrong' ? -ITEM_ANALYSIS_NEGATIVE : 0), 0),
  )
  const mean = totals_.reduce((sum, value) => sum + value, 0) / Math.max(1, totals_.length)
  const totalVariance = totals_.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, totals_.length)
  // Item variances are in probability units; multiplying by marks² puts them on
  // the same scale as the total scores, which is what KR-20 compares.
  const itemVarianceSum =
    itemPoints.reduce((sum, point) => sum + point.difficultyIndex * (1 - point.difficultyIndex), 0) * ITEM_ANALYSIS_MARKS ** 2
  const n = itemPoints.length
  if (n < 2 || totalVariance <= 0) return 0
  return Math.max(0, Math.min(0.99, (n / (n - 1)) * (1 - itemVarianceSum / totalVariance)))
})()

/**
 * Per-item correct rate for the published example result sheet, reused where a
 * screen wants "how did the batch do on this item" without a second source.
 */
export const cohortItemAccuracy = Object.fromEntries(itemPoints.map((point) => [point.questionId, point.difficultyIndex]))
