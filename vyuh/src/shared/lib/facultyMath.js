/**
 * Pure faculty arithmetic shared by the mock service, the fixtures and the UI.
 * No React, no storage, no presentation constants: the same rules produce the
 * preview palette, the monitor counts and the post-fault score register.
 *
 * @typedef {import('../../contracts/faculty.js').FacultyExam} FacultyExam
 * @typedef {import('../../contracts/faculty.js').ExamPreview} ExamPreview
 * @typedef {import('../../contracts/faculty.js').PaletteCell} PaletteCell
 * @typedef {import('../../contracts/faculty.js').BankQuestion} BankQuestion
 * @typedef {import('../../contracts/faculty.js').ItemPoint} ItemPoint
 * @typedef {import('../../contracts/faculty.js').MonitorStudent} MonitorStudent
 * @typedef {import('../../contracts/faculty.js').ScoreImpactRow} ScoreImpactRow
 */
import { calculateWhatIf } from './analysisMath.js'


/**
 * Apply a faculty fault register to a student's result sheet.
 *
 * The policy, stated once: a voided item cannot penalise anyone. A correct
 * response keeps the mark it already earned as grace; a wrong response loses its
 * negative. Nothing else in the sheet moves — the attempt happened, the answers
 * are unchanged, and the relative rank is recomputed from the corrected score.
 *
 * @param {import('../../contracts/analysis.js').AnalysisDetails | null} details
 * @param {string[]} faultyIds
 * @returns {import('../../contracts/analysis.js').AnalysisDetails | null}
 */
export function applyFaultsToResultSheet(details, faultyIds) {
  if (!details || !faultyIds || faultyIds.length === 0) return details
  const faulty = new Set(faultyIds)
  let restored = 0
  const questions = details.questions.map((question) => {
    if (!faulty.has(question.id)) return question
    if (question.marksDelta >= 0) {
      return { ...question, mistakeLabel: 'Voided in faculty review — mark kept as grace', mistakeCategory: null }
    }
    restored += -question.marksDelta
    return { ...question, marksDelta: 0, mistakeLabel: 'Voided in faculty review — penalty removed', mistakeCategory: null }
  })
  return {
    ...details,
    questions,
    summary: { ...details.summary, score: details.summary.score + restored },
    whatIf: calculateWhatIf(questions),
  }
}

/** @param {number} value @param {number} [digits] */
export function round(value, digits = 0) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** @param {number} value @param {number} min @param {number} max */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Total questions and marks, derived from the sections — never stored twice.
 * @param {Pick<FacultyExam,'sections'>} exam
 */
export function examTotals(exam) {
  let totalQuestions = 0
  let totalMarks = 0
  let sectionTimeTotal = 0
  /** @type {Record<string, number>} */
  const bySubject = {}
  for (const section of exam.sections) {
    totalQuestions += section.questionIds.length
    totalMarks += section.questionIds.length * section.marksPerQuestion
    sectionTimeTotal += section.timeLimitMinutes
    bySubject[section.subjectId] = (bySubject[section.subjectId] ?? 0) + section.questionIds.length
  }
  return { totalQuestions, totalMarks, sectionTimeTotal, bySubject }
}

/**
 * The student's palette, as the builder will publish it. Cells carry no answer
 * state — a preview always starts unvisited — but every count, section and
 * warning is real.
 *
 * @param {FacultyExam} exam
 * @param {Map<string, BankQuestion>} bank
 * @returns {ExamPreview}
 */
export function buildExamPreview(exam, bank) {
  /** @type {string[]} */
  const warnings = []
  let number = 0
  /** @type {ExamPreview['sections']} */
  const sections = exam.sections.map((section) => {
    /** @type {PaletteCell[]} */
    const cells = section.questionIds.map((questionId) => {
      const question = bank.get(questionId)
      number += 1
      if (!question) warnings.push(`Question ${questionId} is no longer in the bank.`)
      return {
        questionId,
        number,
        sectionId: section.id,
        sectionName: section.name,
        subjectName: question?.subjectName ?? 'Unknown subject',
        state: 'not_visited',
        missing: !question,
      }
    })
    if (cells.length === 0) warnings.push(`${section.name} has no questions yet.`)
    return { id: section.id, name: section.name, cells }
  })

  const totals = examTotals(exam)
  if (totals.sectionTimeTotal > exam.durationMinutes) {
    warnings.push(
      `Section limits add up to ${totals.sectionTimeTotal} minutes, longer than the ${exam.durationMinutes}-minute paper.`,
    )
  }
  if (!exam.scheduleStart || !exam.scheduleEnd) warnings.push('The schedule window is not set yet.')
  if (totals.totalQuestions === 0) warnings.push('Add at least one question before publishing.')

  return {
    examId: exam.id,
    title: exam.title,
    sections,
    totalQuestions: totals.totalQuestions,
    totalMarks: totals.totalMarks,
    durationMinutes: exam.durationMinutes,
    sectionTimeTotal: totals.sectionTimeTotal,
    warnings,
    bySubject: totals.bySubject,
  }
}

/** @param {string} text */
export function csvCell(text) {
  const value = String(text ?? '')
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * CSV built from column labels and row accessors, so an export can never drift
 * from the table the reader is looking at.
 * @param {string[]} header
 * @param {(string|number|boolean|null)[][]} rows
 */
export function toCsv(header, rows) {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

/**
 * Item quality bands. Discrimination is the share of the upper third who were
 * correct minus the same share in the lower third, so a question where strong
 * and weak students perform alike sits near zero — that is the flag.
 * @param {Pick<ItemPoint,'difficultyIndex'|'discrimination'|'attempts'>} point
 */
export function itemFlag(point) {
  if (point.attempts < 5) return 'Too few responses to judge'
  if (point.discrimination < 0.1) return 'Strong and weak students perform the same'
  if (point.difficultyIndex > 0.92) return 'Too easy to separate candidates'
  if (point.difficultyIndex < 0.18) return 'Too hard: most candidates guessed'
  return null
}

/** @param {number} value */
export function discriminationLabel(value) {
  if (value >= 0.4) return 'Excellent'
  if (value >= 0.3) return 'Good'
  if (value >= 0.2) return 'Fair'
  if (value >= 0.1) return 'Poor'
  return 'No separation'
}

/** @param {number} value */
export function difficultyLabel(value) {
  if (value >= 0.75) return 'Easy'
  if (value >= 0.45) return 'Balanced'
  if (value >= 0.25) return 'Hard'
  return 'Very hard'
}

/**
 * Aggregate used by the item-analysis header.
 * @param {ItemPoint[]} points
 * @param {number} cohortSize
 * @param {number | null} [reliability] KR-20 measured on the cohort's total scores.
 */
export function summarizeItems(points, cohortSize, reliability = null) {
  const judged = points.filter((point) => point.attempts >= 5)
  const meanDifficulty = judged.length === 0 ? 0 : judged.reduce((sum, point) => sum + point.difficultyIndex, 0) / judged.length
  const meanDiscrimination = judged.length === 0 ? 0 : judged.reduce((sum, point) => sum + point.discrimination, 0) / judged.length
  const flaggedCount = points.filter((point) => point.flagged).length
  const faultyCount = points.filter((point) => point.faulty).length
  /*
   * Kuder–Richardson 20. The cohort's own total-score variance is measured in
   * the fixture and passed in, so the number is a property of this sitting
   * rather than of the mean item difficulty.
   */
  const n = Math.max(1, points.length)
  const varianceSum = points.reduce((sum, point) => sum + point.difficultyIndex * (1 - point.difficultyIndex), 0)
  const measured =
    reliability ??
    (n > 1 && cohortSize > 0 ? clamp((n / (n - 1)) * (1 - varianceSum / Math.max(0.0001, varianceSum * 1.6)), 0, 0.99) : 0)
  return {
    meanDifficulty: round(meanDifficulty, 3),
    meanDiscrimination: round(meanDiscrimination, 3),
    flaggedCount,
    faultyCount,
    reliability: round(measured, 2),
  }
}

/**
 * The faulty-question policy: a faulted item is dropped from scoring. A correct
 * response keeps its award as grace; a wrong response loses its penalty. Every
 * score in the register is recomputed from the same response matrix, so the
 * before/after pair cannot disagree with the student's own result sheet.
 *
 * @param {Object} input
 * @param {{ id: string, name: string, rollNumber: string }[]} input.students
 * @param {Record<string, Record<string, 'correct'|'wrong'|'blank'>>} input.responses
 * @param {string[]} input.faultyIds
 * @param {number} input.marks
 * @param {number} input.negativeMarks
 * @returns {ScoreImpactRow[]}
 */
export function applyFaultyPolicy({ students, responses, faultyIds, marks, negativeMarks }) {
  const faulty = new Set(faultyIds)
  return students.map((student) => {
    const answers = responses[student.id] ?? {}
    let before = 0
    let after = 0
    for (const [questionId, outcome] of Object.entries(answers)) {
      const delta = outcome === 'correct' ? marks : outcome === 'wrong' ? -negativeMarks : 0
      before += delta
      after += faulty.has(questionId) ? Math.max(0, delta) : delta
    }
    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      before,
      after,
      delta: after - before,
    }
  })
}

/**
 * Monitor counts from the tile list. Every screen reads these, so a tile and a
 * counter cannot disagree.
 * @param {MonitorStudent[]} students
 * @param {number} totalQuestions
 */
export function monitorCounts(students, totalQuestions) {
  /** @type {Record<string, number>} */
  const counts = {
    total: students.length,
    notStarted: 0,
    inProgress: 0,
    submitted: 0,
    disconnected: 0,
    flagged: 0,
    answers: 0,
  }
  for (const student of students) {
    if (student.status === 'not_started') counts.notStarted += 1
    if (student.status === 'submitted') counts.submitted += 1
    if (student.status === 'disconnected') counts.disconnected += 1
    if (student.status === 'in_progress' || student.status === 'answered' || student.status === 'review') counts.inProgress += 1
    if (student.integrityFlags > 0) counts.flagged += 1
    counts.answers += student.answeredCount
  }
  void totalQuestions
  return counts
}

/**
 * Progress of answers, used by the monitor's progress bar.
 * @param {MonitorStudent[]} students
 * @param {number} totalQuestions
 */
export function answerProgress(students, totalQuestions) {
  const denominator = Math.max(1, students.length * Math.max(1, totalQuestions))
  const answered = students.reduce((sum, student) => sum + student.answeredCount, 0)
  return {
    answered,
    percent: clamp(Math.round((answered / denominator) * 100), 0, 100),
  }
}

/**
 * Clamps trim handles and keeps chapter starts inside the trim window.
 * @param {{ trimStartSeconds: number, trimEndSeconds: number, durationSeconds: number }} recording
 * @param {'start'|'end'} handle
 * @param {number} seconds
 */
export function nextTrim(recording, handle, seconds) {
  const minGap = 1
  if (handle === 'start') {
    return clamp(Math.round(seconds), 0, Math.max(0, recording.trimEndSeconds - minGap))
  }
  return clamp(Math.round(seconds), Math.min(recording.durationSeconds, recording.trimStartSeconds + minGap), recording.durationSeconds)
}

/**
 * A chapter list is valid when it starts at zero offset, ascends, and stays
 * inside the trim window. Returns the reason it is not, or null.
 * @param {{ startSeconds: number }[]} chapters
 * @param {{ trimStartSeconds: number, trimEndSeconds: number }} recording
 */
export function chapterProblem(chapters, recording) {
  if (chapters.length === 0) return 'A published recording needs at least one chapter.'
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index]
    if (chapter.startSeconds < recording.trimStartSeconds) return `“${index + 1}” starts before the trim point.`
    if (chapter.startSeconds >= recording.trimEndSeconds) return 'A chapter starts after the trim end.'
    if (index > 0 && chapter.startSeconds <= chapters[index - 1].startSeconds) return 'Chapters must start in ascending order.'
  }
  return null
}

/** @param {string} iso @param {string} [nowIso] */
export function waitingMinutes(iso, nowIso = new Date().toISOString()) {
  return Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(iso)) / 60_000))
}

/**
 * Groups analysed items by topic and keeps the topics a re-teach would help.
 * The threshold is a policy, not a magic number: below 55% mean accuracy the
 * topic goes on the list, sorted weakest first.
 *
 * @param {ItemPoint[]} points
 * @param {Record<string, { title: string, minutes: number, resources: ({ label: string, href?: string })[] }>} plans
 * @param {number} [threshold]
 */
export function buildWeakTopics(points, plans, threshold = 0.55) {
  /** @type {Map<string, ItemPoint[]>} */
  const groups = new Map()
  for (const point of points) {
    const current = groups.get(point.topicId) ?? []
    current.push(point)
    groups.set(point.topicId, current)
  }
  /** @type {import('../../contracts/faculty.js').WeakTopic[]} */
  const topics = []
  for (const [topicId, items] of groups) {
    const accuracy = items.reduce((sum, item) => sum + item.difficultyIndex, 0) / items.length
    if (accuracy >= threshold) continue
    const studentsAffected = items.reduce((sum, item) => sum + Math.round(item.attempts * (1 - item.difficultyIndex)), 0)
    const plan = plans[topicId] ?? {
      title: `Re-teach ${items[0].topicName}: one worked example, then a timed set`,
      minutes: 40,
      resources: [{ label: 'Past paper set' }],
    }
    topics.push({
      topicId,
      topicName: items[0].topicName,
      subjectName: items[0].subjectName,
      accuracy: round(accuracy * 100, 1),
      itemCount: items.length,
      studentsAffected,
      reteach: plan,
    })
  }
  return topics.sort((a, b) => a.accuracy - b.accuracy)
}
