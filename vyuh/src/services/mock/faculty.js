/**
 * Phase 7 mock service: the teaching workspace.
 *
 * Writes are real within the mock. A question saved in the editor is persisted,
 * appears in the bank on the next read, and can be added to a draft paper whose
 * preview shows it immediately. Marking an item faulty persists a register that
 * the student's own result sheet reads, so the score a candidate sees changes
 * with the faculty's decision.
 *
 * Realtime (the monitor feed and the host console's presence) runs on
 * `mock-data/realtime.js`'s injectable ticker, never on a raw service timer.
 *
 * @typedef {import('../types.js').FacultyService} FacultyService
 * @typedef {import('../../contracts/faculty.js').BankQuestion} BankQuestion
 * @typedef {import('../../contracts/faculty.js').FacultyExam} FacultyExam
 * @typedef {import('../../contracts/faculty.js').FacultyClass} FacultyClass
 * @typedef {import('../../contracts/faculty.js').FacultyRecording} FacultyRecording
 * @typedef {import('../../contracts/faculty.js').FacultyDoubt} FacultyDoubt
 * @typedef {import('../../contracts/faculty.js').HostConsole} HostConsole
 * @typedef {import('../../contracts/faculty.js').MonitorSnapshot} MonitorSnapshot
 * @typedef {import('../../contracts/faculty.js').ItemAnalysis} ItemAnalysis
 * @typedef {import('../../contracts/faculty.js').MonitorStudent} MonitorStudent
 */
import {
  questionBank, bankSubjects, bankTopics, subtopicsFor, topicById,
  questionKindLabels, difficultyLabels, sourceLabels,
  facultyExams, examPatterns, facultyDashboard, facultyProfile, facultyClasses, facultyRecordings,
  facultyDoubts, replyTemplates, attendanceRows, attendancePeriod, hostParticipants,
  seedChat, seedQuestions, monitorScript, seedMonitorStudents,
  itemPoints, analysisCohort, analysisResponses, reteachPlans, itemReliability,
  ITEM_ANALYSIS_EXAM_ID, ITEM_ANALYSIS_MARKS, ITEM_ANALYSIS_NEGATIVE,
  createMockTicker, simulate, clone,
} from '../../mock-data/index.js'
import {
  applyFaultyPolicy, buildExamPreview, buildWeakTopics, chapterProblem, examTotals,
  monitorCounts, summarizeItems, toCsv,
} from '../../shared/lib/facultyMath.js'
import { notFound, serviceError } from './errors.js'

const VERSION = 1
const DEFAULT_PAGE_SIZE = 25

/** @param {string} facultyId */
function storageKey(facultyId) {
  return `vyuh.mock.faculty.${facultyId || 'fac-snehasish'}.v${VERSION}`
}

/**
 * The fault register is mirrored outside the seat's own store so the student
 * result sheet can apply the same policy. It is a mock-only bridge between two
 * services: a real build would return the corrected score from the API.
 * @param {string} examId
 */
function faultsKey(examId) {
  return `vyuh.mock.faults.${examId}`
}

/** @param {string} examId @param {string[]} questionIds */
function mirrorFaults(examId, questionIds) {
  try {
    localStorage.setItem(faultsKey(examId), JSON.stringify(questionIds))
  } catch {
    // Storage unavailable: the seat's own register still drives the faculty view.
  }
}

/**
 * @typedef {Object} FacultyStore
 * @property {number} version
 * @property {{ created: BankQuestion[], updated: Record<string, Partial<BankQuestion>>, deleted: string[] }} questions
 * @property {{ created: FacultyExam[], saved: Record<string, Partial<FacultyExam>>, deleted: string[] }} exams
 * @property {Record<string, { questionIds: string[], updatedAt: string }>} faulty
 * @property {{ created: FacultyClass[], cancelled: string[] }} classes
 * @property {Record<string, { startedAt: string|null, endedAt: string|null, muted: string[], hiddenChat: string[], approved: string[], attention: { id: string, issuedAt: string, expiresAt: string, issued: number, responded: number } | null }>} host
 * @property {{ created: FacultyRecording[], saved: Record<string, Partial<FacultyRecording>>, deleted: string[] }} recordings
 * @property {{ replies: Record<string, import('../../contracts/faculty.js').FacultyDoubtMessage[]>, status: Record<string, 'open'|'answered'|'resolved'> }} doubts
 */

/** @returns {FacultyStore} */
function emptyStore() {
  return {
    version: VERSION,
    questions: { created: [], updated: {}, deleted: [] },
    exams: { created: [], saved: {}, deleted: [] },
    faulty: {},
    classes: { created: [], cancelled: [] },
    host: {},
    recordings: { created: [], saved: {}, deleted: [] },
    doubts: { replies: {}, status: {} },
  }
}

/** @param {string} facultyId @returns {FacultyStore} */
function readStore(facultyId) {
  try {
    const raw = localStorage.getItem(storageKey(facultyId))
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw)
    if (parsed?.version !== VERSION) return emptyStore()
    const base = emptyStore()
    return {
      ...base,
      ...parsed.data,
      questions: { ...base.questions, ...parsed.data?.questions },
      exams: { ...base.exams, ...parsed.data?.exams },
      classes: { ...base.classes, ...parsed.data?.classes },
      recordings: { ...base.recordings, ...parsed.data?.recordings },
      doubts: { ...base.doubts, ...parsed.data?.doubts },
    }
  } catch {
    return emptyStore()
  }
}

/** @param {string} facultyId @param {FacultyStore} store */
function writeStore(facultyId, store) {
  try {
    localStorage.setItem(storageKey(facultyId), JSON.stringify({ version: VERSION, data: store }))
  } catch {
    /* The session continues in memory; the demo is not blocked by storage. */
  }
}

/** @param {string} key */
function numericFlag(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : fallback
  } catch {
    return fallback
  }
}

/** @param {string} facultyId */
function facultyName(facultyId) {
  return facultyId === facultyProfile.id ? facultyProfile.name : 'Faculty member'
}

/* ── Questions ────────────────────────────────────────────────────────── */

/** @param {string} facultyId @returns {BankQuestion[]} */
function composeBank(facultyId) {
  const store = readStore(facultyId)
  const deleted = new Set(store.questions.deleted)
  /** @type {Map<string, BankQuestion>} */
  const map = new Map()
  for (const question of questionBank) map.set(question.id, question)
  for (const question of store.questions.created) map.set(question.id, question)
  for (const [id, patch] of Object.entries(store.questions.updated)) {
    const current = map.get(id)
    if (current) map.set(id, { ...current, ...patch })
  }
  const created = new Set(store.questions.created.map((question) => question.id))
  const values = [...map.values()].filter((question) => !deleted.has(question.id))
  // Newest authored item first, fixtures in code order after it: after a save the
  // author must be able to see what they just wrote without paging to the end.
  return [...values.filter((question) => created.has(question.id)), ...values.filter((question) => !created.has(question.id))]
}

/** @param {string} code @param {BankQuestion[]} bank */
function nextCode(code, bank) {
  const prefix = code.split('-').slice(0, 2).join('-')
  const highest = bank
    .filter((question) => question.code.startsWith(prefix))
    .reduce((max, question) => Math.max(max, Number(question.code.split('-').at(-1)) || 0), 0)
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`
}

/** @param {string} body @param {string} search */
function matchesSearch(question, search) {
  return [question.body, question.code, question.topicName, question.subtopic, question.source, ...question.tags]
    .join(' ')
    .toLowerCase()
    .includes(search)
}

/** @param {BankQuestion[]} bank @param {import('../../contracts/faculty.js').BankQuery} [query] */
function queryBank(bank, query = {}) {
  const search = (query.search ?? '').trim().toLowerCase()
  const filtered = bank.filter((question) => {
    if (search && !matchesSearch(question, search)) return false
    if (query.subjectId && question.subjectId !== query.subjectId) return false
    if (query.topicId && question.topicId !== query.topicId) return false
    if (query.difficulty && query.difficulty !== 'all' && question.difficulty !== query.difficulty) return false
    if (query.kind && query.kind !== 'all' && question.kind !== query.kind) return false
    if (query.source && query.source !== 'all' && question.source !== query.source) return false
    return true
  })
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? DEFAULT_PAGE_SIZE))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.max(1, Math.min(totalPages, query.page ?? 1))
  const subjectFacet = new Map(bankSubjects.map((subject) => [subject.id, 0]))
  const topicFacet = new Map()
  const difficultyFacet = new Map(Object.keys(difficultyLabels).map((key) => [key, 0]))
  const kindFacet = new Map(Object.keys(questionKindLabels).map((key) => [key, 0]))
  const sourceFacet = new Map(Object.keys(sourceLabels).map((key) => [key, 0]))
  for (const question of bank) {
    subjectFacet.set(question.subjectId, (subjectFacet.get(question.subjectId) ?? 0) + 1)
    topicFacet.set(question.topicId, (topicFacet.get(question.topicId) ?? 0) + 1)
    difficultyFacet.set(question.difficulty, (difficultyFacet.get(question.difficulty) ?? 0) + 1)
    kindFacet.set(question.kind, (kindFacet.get(question.kind) ?? 0) + 1)
    sourceFacet.set(question.source, (sourceFacet.get(question.source) ?? 0) + 1)
  }
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages,
    facets: {
      subjects: [...subjectFacet].filter(([, count]) => count > 0).map(([id, count]) => ({ value: id, label: bankSubjects.find((subject) => subject.id === id)?.name ?? id, count })),
      topics: [...topicFacet]
        .filter(([, count]) => count > 0)
        .map(([id, count]) => {
          const topic = bankTopics.find((item) => item.id === id)
          return { value: id, label: topic?.name ?? id, count, subjectId: topic?.subjectId ?? '' }
        }),
      difficulties: [...difficultyFacet].map(([value, count]) => ({ value, label: difficultyLabels[/** @type {keyof typeof difficultyLabels} */ (value)] ?? value, count })),
      kinds: [...kindFacet].map(([value, count]) => ({ value, label: questionKindLabels[/** @type {keyof typeof questionKindLabels} */ (value)] ?? value, count })),
      sources: [...sourceFacet].map(([value, count]) => ({ value, label: sourceLabels[/** @type {keyof typeof sourceLabels} */ (value)] ?? value, count })),
    },
  }
}

/** @param {import('../../contracts/faculty.js').QuestionInput} input @param {BankQuestion[]} bank @param {string} name */
function validateQuestion(input, bank, name) {
  if (!input.body || input.body.trim().length < 8) {
    throw serviceError('question_body_required', 'Write the question before saving. At least one full sentence is needed.')
  }
  const topic = topicById(input.topicId)
  if (!topic) throw serviceError('topic_required', 'Choose a topic for this question. The topic drives the blueprint and the analysis.')
  if (input.subjectId && topic.subjectId !== input.subjectId) {
    throw serviceError('topic_mismatch', 'That topic belongs to another subject. Pick a topic from the selected subject.')
  }
  if (['single', 'multi', 'image'].includes(input.kind)) {
    if (input.options.length < 2) throw serviceError('options_required', 'A choice question needs at least two options.')
    if (input.options.some((option) => !option.body || option.body.trim().length === 0)) {
      throw serviceError('option_empty', 'Every option needs text. Blank options cannot be published.')
    }
    if (input.correctOptions.length === 0) throw serviceError('key_required', 'Mark the correct answer before saving.')
    if (input.kind !== 'multi' && input.correctOptions.length > 1) {
      throw serviceError('single_key', 'A single-correct question takes exactly one answer. Switch the type to multi correct for several.')
    }
  }
  if (input.kind === 'numerical' && (input.correctNumeric === null || !Number.isFinite(input.correctNumeric))) {
    throw serviceError('numeric_key_required', 'Enter the numerical answer and its tolerance.')
  }
  if (input.kind === 'subjective' && (!input.explanation || input.explanation.trim().length < 10)) {
    throw serviceError('model_answer_required', 'A subjective question needs a model answer for evaluators.')
  }
  if (!input.explanation || input.explanation.trim().length < 8) {
    throw serviceError('explanation_required', 'Write the explanation. Students see it after the result is released.')
  }
  const timestamp = new Date().toISOString()
  const subject = bankSubjects.find((item) => item.id === topic.subjectId)
  return /** @type {BankQuestion} */ ({
    id: `qb-new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    code: nextCode(`${subject?.shortName ?? 'GEN'}-${topic.code}`, bank),
    kind: input.kind,
    subjectId: topic.subjectId,
    subjectName: subject?.name ?? 'General',
    topicId: topic.id,
    topicName: topic.name,
    subtopic: input.subtopic || topic.subtopics[0] || 'General',
    difficulty: input.difficulty,
    bloom: input.bloom,
    source: input.source,
    body: input.body.trim(),
    options: input.options.map((option, index) => ({
      key: /** @type {'A'|'B'|'C'|'D'} */ (['A', 'B', 'C', 'D'][index] ?? 'A'),
      body: option.body.trim(),
      ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
    })),
    correctOptions: [...input.correctOptions].sort(),
    correctNumeric: input.kind === 'numerical' ? input.correctNumeric : null,
    numericTolerance: input.numericTolerance,
    unit: input.unit,
    explanation: input.explanation.trim(),
    tags: input.tags.length > 0 ? input.tags : [topic.name, input.subtopic || topic.subtopics[0] || 'General'],
    marks: input.marks,
    negativeMarks: input.negativeMarks,
    status: 'published',
    authorName: name,
    createdAt: timestamp,
    updatedAt: timestamp,
    usageCount: 0,
    imageUrl: input.imageUrl ?? null,
    analysis: null,
  })
}

/* ── Exams ────────────────────────────────────────────────────────────── */

/** @param {string} facultyId @returns {FacultyExam[]} */
function composeExams(facultyId) {
  const store = readStore(facultyId)
  const deleted = new Set(store.exams.deleted)
  /** @type {Map<string, FacultyExam>} */
  const map = new Map()
  for (const exam of facultyExams) map.set(exam.id, exam)
  for (const exam of store.exams.created) map.set(exam.id, exam)
  for (const [id, patch] of Object.entries(store.exams.saved)) {
    const current = map.get(id)
    if (current) map.set(id, { ...current, ...patch })
  }
  return [...map.values()]
    .filter((exam) => !deleted.has(exam.id))
    .map((exam) => {
      const totals = examTotals(exam)
      return { ...exam, totalQuestions: totals.totalQuestions, totalMarks: totals.totalMarks }
    })
}

/** @param {string} facultyId @param {string} examId */
function findExam(facultyId, examId) {
  const exam = composeExams(facultyId).find((item) => item.id === examId)
  if (!exam) throw notFound('paper')
  return exam
}

/** @param {string} facultyId @param {string} examId @param {Partial<FacultyExam>} patch */
function saveExam(facultyId, examId, patch) {
  const store = readStore(facultyId)
  const created = store.exams.created.findIndex((exam) => exam.id === examId)
  if (created >= 0) {
    store.exams.created[created] = { ...store.exams.created[created], ...patch, updatedAt: new Date().toISOString() }
  } else {
    store.exams.saved[examId] = { ...(store.exams.saved[examId] ?? {}), ...patch, updatedAt: new Date().toISOString() }
  }
  writeStore(facultyId, store)
}

/** @param {string} presetId @param {string} title */
function newExam(presetId, title, facultyId) {
  const pattern = examPatterns.find((item) => item.id === presetId) ?? examPatterns.at(-1)
  const stamp = Date.now()
  return /** @type {FacultyExam} */ ({
    id: `exam-new-${stamp.toString(36)}`,
    title,
    preset: pattern?.id ?? 'CUSTOM',
    presetLabel: pattern?.label ?? 'Custom',
    ownerId: facultyId,
    ownerName: facultyName(facultyId),
    batchId: 'bat-prayas-m',
    batchName: 'Prayas JEE 2027 — Morning',
    status: 'draft',
    sections: (pattern?.sections ?? []).map((section, index) => ({
      id: `sec-${stamp.toString(36)}-${index + 1}`,
      name: section.name,
      subjectId: section.subjectId,
      marksPerQuestion: pattern?.marksPerQuestion ?? 4,
      negativeMarks: pattern?.negativeMarks ?? 1,
      timeLimitMinutes: section.timeLimitMinutes ?? 0,
      questionIds: [],
    })),
    durationMinutes: pattern?.durationMinutes ?? 90,
    scheduleStart: null,
    scheduleEnd: null,
    resultReleaseRule: 'after_window',
    resultReleaseAt: null,
    integrityMode: 'standard',
    integrity: { webcam: false, tabLock: true, copyBlock: true, ipLock: false, questionShuffle: true, optionShuffle: false },
    instructions: '',
    totalQuestions: 0,
    totalMarks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

const STATUS_FLOW = {
  draft: ['pending_approval', 'draft'],
  pending_approval: ['approved', 'scheduled', 'draft'],
  approved: ['scheduled', 'live', 'draft'],
  scheduled: ['live', 'completed', 'draft'],
  live: ['completed'],
  completed: [],
}

/* ── Monitor state ────────────────────────────────────────────────────── */

/**
 * Live monitor state per exam. Held in module memory: the feed is a running
 * simulation, not history, so a refresh resets the tiles to the seeded state but
 * never to something that contradicts the fixture.
 * @type {Map<string, { students: MonitorStudent[], feed: import('../../contracts/faculty.js').MonitorEvent[], cursor: number, ticker: ReturnType<typeof createMockTicker> | null, emitter: Set<(snapshot: MonitorSnapshot) => void> }>}
 */
const monitorStates = new Map()
/** @type {Map<string, { emitter: Set<(console_: HostConsole) => void>, ticker: ReturnType<typeof createMockTicker> | null }>} */
const hostStates = new Map()

/** @param {string} facultyId @param {string} examId */
function monitorState(facultyId, examId) {
  const key = `${facultyId}:${examId}`
  const existing = monitorStates.get(key)
  if (existing) return existing
  const exam = findExam(facultyId, examId)
  const created = {
    students: seedMonitorStudents(exam.totalQuestions),
    feed: /** @type {import('../../contracts/faculty.js').MonitorEvent[]} */ ([]),
    cursor: 0,
    ticker: /** @type {ReturnType<typeof createMockTicker> | null} */ (null),
    emitter: new Set(),
  }
  monitorStates.set(key, created)
  return created
}

/** @param {string} facultyId @param {string} examId @param {import('../../contracts/faculty.js').MonitorEvent} event */
function applyMonitorEvent(state, examId, event) {
  const student = state.students.find((item) => item.id === event.studentId)
  if (!student) return
  const total = student.total
  if (event.type === 'answer') {
    student.answeredCount = Math.min(total, student.answeredCount + 2)
    student.status = student.status === 'disconnected' ? 'disconnected' : 'answered'
  }
  if (event.type === 'review') {
    student.reviewCount = Math.min(total, student.reviewCount + 1)
    if (student.status !== 'submitted' && student.status !== 'disconnected') student.status = 'review'
  }
  if (event.type === 'submit') {
    if (student.status !== 'submitted') {
      student.answeredCount = Math.max(student.answeredCount, Math.round(total * 0.9))
      student.status = 'submitted'
    }
  }
  if (event.type === 'integrity') {
    student.integrityFlags += 1
    if (event.note) student.integrityNotes = [...student.integrityNotes, event.note].slice(-4)
  }
  if (event.type === 'disconnect') student.status = 'disconnected'
  if (event.type === 'reconnect' && student.status === 'disconnected') student.status = 'answered'
  if (event.type === 'join' && student.status === 'not_started') student.status = 'in_progress'
  student.lastSeenAt = event.at
  student.progressPercent = Math.round((student.answeredCount / Math.max(1, total)) * 100)
  state.feed = [event, ...state.feed].slice(0, 40)
  void examId
}

/** @param {string} facultyId @param {string} examId @returns {MonitorSnapshot} */
function buildMonitorSnapshot(facultyId, examId) {
  const exam = findExam(facultyId, examId)
  const state = monitorState(facultyId, examId)
  const students = clone(state.students)
  const counts = monitorCounts(students, exam.totalQuestions)
  const submitted = students.filter((student) => student.status === 'submitted').length
  return {
    examId,
    examTitle: exam.title,
    batchName: exam.batchName,
    startedAt: exam.scheduleStart ?? new Date().toISOString(),
    endsAt: exam.scheduleEnd ?? new Date().toISOString(),
    totalQuestions: exam.totalQuestions,
    counts: {
      total: counts.total,
      notStarted: counts.notStarted,
      inProgress: counts.inProgress,
      submitted: counts.submitted,
      disconnected: counts.disconnected,
      flagged: counts.flagged,
      answers: counts.answers,
    },
    progress: {
      submitted,
      total: students.length,
      percent: students.length === 0 ? 0 : Math.round((submitted / students.length) * 100),
    },
    students,
    feed: clone(state.feed),
    updatedAt: new Date().toISOString(),
  }
}

/* ── Item analysis ────────────────────────────────────────────────────── */

/** @param {string} facultyId @param {string} examId */
function buildItemAnalysis(facultyId, examId) {
  const exam = findExam(facultyId, examId)
  const store = readStore(facultyId)
  const faultyIds = store.faulty[examId]?.questionIds ?? []
  const faulty = new Set(faultyIds)
  const points = itemPoints.map((point) => ({ ...point, faulty: faulty.has(point.questionId) }))
  const summary = summarizeItems(points, analysisCohort.length, itemReliability)
  const scoreImpact = applyFaultyPolicy({
    students: analysisCohort,
    responses: analysisResponses,
    faultyIds,
    marks: ITEM_ANALYSIS_MARKS,
    negativeMarks: ITEM_ANALYSIS_NEGATIVE,
  })
  return {
    examId,
    examTitle: exam.title,
    batchName: exam.batchName,
    cohortSize: analysisCohort.length,
    maxMarks: 40 * ITEM_ANALYSIS_MARKS,
    points,
    summary,
    weakTopics: buildWeakTopics(points, reteachPlans),
    faultyQuestionIds: faultyIds,
    scoreImpact,
    updatedAt: store.faulty[examId]?.updatedAt ?? new Date().toISOString(),
  }
}

/**
 * The faulty register, read by the student result service too. Exported rather
 * than duplicated: there is exactly one answer to "which items are voided".
 * @param {string} examId
 * @returns {string[]}
 */
export function readFaultyQuestionIds(examId) {
  const candidateStores = (() => {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith('vyuh.mock.faculty.') && key.includes('.v'))
      return keys.map((key) => {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) ?? 'null')
          return parsed?.data ?? null
        } catch {
          return null
        }
      })
    } catch {
      return []
    }
  })()
  /** @type {Set<string>} */
  const ids = new Set()
  for (const data of candidateStores) {
    const list = data?.faulty?.[examId]?.questionIds ?? []
    for (const id of list) ids.add(id)
  }
  return [...ids]
}

/* ── Host console ─────────────────────────────────────────────────────── */

/** @param {string} facultyId @param {string} sessionId */
function findClass(facultyId, sessionId) {
  const store = readStore(facultyId)
  const all = [...facultyClasses, ...store.classes.created]
  const session = all.find((item) => item.id === sessionId)
  if (!session) throw notFound('class')
  return store.classes.cancelled.includes(sessionId) ? { ...session, status: /** @type {const} */ ('cancelled') } : session
}

/** @param {string} facultyId @param {string} sessionId @returns {HostConsole} */
function buildHostConsole(facultyId, sessionId) {
  const store = readStore(facultyId)
  const session = findClass(facultyId, sessionId)
  const host = store.host[sessionId] ?? { startedAt: null, endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
  const muted = new Set(host.muted)
  const approved = new Set(host.approved)
  const participants = hostParticipants.map((participant) => ({ ...participant, muted: muted.has(participant.id) }))
  const counts = {
    present: participants.filter((participant) => participant.state === 'present').length,
    idle: participants.filter((participant) => participant.state === 'idle').length,
    left: participants.filter((participant) => participant.state === 'left').length,
    muted: participants.filter((participant) => participant.muted).length,
    handRaised: participants.filter((participant) => participant.state === 'hand_raised').length,
    attentionOnTime: host.attention?.responded ?? 0,
    attentionMissed: host.attention ? Math.max(0, counts_present(participants) - (host.attention.responded ?? 0)) : 0,
  }
  const chat = seedChat.filter((message) => message.sessionId === sessionId)
  const queue = seedQuestions
    .filter((question) => question.sessionId === sessionId)
    .map((question) => ({
      id: question.id,
      sessionId: question.sessionId,
      author: question.author,
      studentId: question.studentId,
      body: question.body,
      status: /** @type {'pending'|'approved'} */ (approved.has(question.id) ? 'approved' : question.status),
      upvotes: question.upvotes,
      votedByMe: false,
      createdAt: question.createdAt,
      approvedAt: approved.has(question.id) ? new Date().toISOString() : question.approvedAt,
    }))
  return {
    session: { ...session, status: host.endedAt ? 'ended' : session.status },
    startedAt: host.startedAt,
    endedAt: host.endedAt,
    live: Boolean(host.startedAt && !host.endedAt),
    participants,
    counts,
    chat,
    hiddenChatIds: host.hiddenChat,
    queue,
    attentionCheck: host.attention,
    feed: buildHostFeed(session, participants, chat, queue),
    updatedAt: new Date().toISOString(),
  }
}

/** @param {HostConsole['participants']} participants */
function counts_present(participants) {
  return participants.filter((participant) => participant.state === 'present').length
}

/** @param {FacultyClass} session @param {HostConsole['participants']} participants @param {import('../../contracts/learning.js').ChatMessage[]} chat @param {HostConsole['queue']} queue */
function buildHostFeed(session, participants, chat, queue) {
  /** @type {import('../../contracts/faculty.js').HostEvent[]} */
  const feed = []
  const raised = participants.filter((participant) => participant.state === 'hand_raised')
  for (const participant of raised) {
    feed.push({ id: `hand-${participant.id}`, at: participant.lastSeenAt, type: 'presence', label: `${participant.name} raised a hand`, studentId: participant.id })
  }
  for (const message of chat.slice(-3)) {
    feed.push({ id: `chat-${message.id}`, at: message.sentAt, type: 'chat', label: `${message.author}: ${message.body}`, detail: message.role })
  }
  for (const question of queue) {
    feed.push({ id: `queue-${question.id}`, at: question.createdAt, type: 'queue', label: question.body, studentId: question.studentId, detail: question.status })
  }
  feed.push({ id: `session-${session.id}`, at: session.startsAt, type: 'host', label: `${session.title} · ${session.batchName}` })
  return feed.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 20)
}

/** @param {string} facultyId @param {string} sessionId */
function hostState(facultyId, sessionId) {
  const key = `${facultyId}:${sessionId}`
  const existing = hostStates.get(key)
  if (existing) return existing
  const created = { emitter: new Set(), ticker: /** @type {ReturnType<typeof createMockTicker> | null} */ (null) }
  hostStates.set(key, created)
  return created
}

/** @param {string} facultyId @param {string} recordingId @returns {FacultyRecording} */
function readRecording(facultyId, recordingId) {
  const store = readStore(facultyId)
  if (store.recordings.deleted.includes(recordingId)) throw notFound('recording')
  const all = [...store.recordings.created, ...facultyRecordings].map((item) =>
    store.recordings.saved[item.id] ? { ...item, ...store.recordings.saved[item.id] } : item,
  )
  const found = all.find((item) => item.id === recordingId)
  if (!found) throw notFound('recording')
  return found
}

/* ── The service ──────────────────────────────────────────────────────── */

/** @type {FacultyService} */
export const facultyService = {
  /* Dashboard */
  getDashboard(facultyId) {
    return simulate(() => {
      const bank = composeBank(facultyId)
      const exams = composeExams(facultyId)
      const dashboard = clone(facultyDashboard)
      return {
        ...dashboard,
        facultyId,
        facultyName: facultyName(facultyId),
        stats: {
          ...dashboard.stats,
          bankQuestions: bank.length,
          drafts: exams.filter((exam) => exam.status === 'draft').length,
          scheduled: exams.filter((exam) => exam.status === 'scheduled' || exam.status === 'live').length,
          awaitingApproval: exams.filter((exam) => exam.status === 'pending_approval').length,
        },
      }
    })
  },

  /* Question bank */
  listBankQuestions(facultyId, query) {
    return simulate(() => queryBank(composeBank(facultyId), query))
  },
  getBankQuestion(facultyId, questionId) {
    return simulate(() => {
      const question = composeBank(facultyId).find((item) => item.id === questionId)
      if (!question) throw notFound('question')
      return question
    })
  },
  createBankQuestion(facultyId, input) {
    return simulate(() => {
      const bank = composeBank(facultyId)
      const question = validateQuestion(input, bank, facultyName(facultyId))
      const store = readStore(facultyId)
      store.questions.created = [question, ...store.questions.created]
      writeStore(facultyId, store)
      return question
    })
  },
  updateBankQuestion(facultyId, questionId, input) {
    return simulate(() => {
      const bank = composeBank(facultyId)
      const existing = bank.find((item) => item.id === questionId)
      if (!existing) throw notFound('question')
      const question = validateQuestion(input, bank, existing.authorName)
      const store = readStore(facultyId)
      const createdIndex = store.questions.created.findIndex((item) => item.id === questionId)
      const merged = { ...existing, ...question, id: questionId, code: existing.code, createdAt: existing.createdAt, usageCount: existing.usageCount, analysis: existing.analysis }
      if (createdIndex >= 0) store.questions.created[createdIndex] = merged
      else store.questions.updated[questionId] = merged
      writeStore(facultyId, store)
      return merged
    })
  },
  deleteBankQuestion(facultyId, questionId) {
    return simulate(() => {
      const store = readStore(facultyId)
      const used = composeExams(facultyId).filter((exam) => exam.status !== 'completed' && exam.sections.some((section) => section.questionIds.includes(questionId)))
      if (used.length > 0) {
        throw serviceError(
          'question_in_use',
          `This question is in ${used.map((exam) => exam.title).join(', ')}. Remove it from those papers before deleting.`,
          409,
        )
      }
      store.questions.deleted = [...new Set([...store.questions.deleted, questionId])]
      store.questions.created = store.questions.created.filter((item) => item.id !== questionId)
      writeStore(facultyId, store)
      return { id: questionId, deletedAt: new Date().toISOString() }
    })
  },
  listBankFacets(facultyId) {
    return simulate(() => queryBank(composeBank(facultyId)).facets)
  },
  listSubtopics(facultyId, topicId) {
    return simulate(() => subtopicsFor(topicId, composeBank(facultyId)))
  },

  /* Exams */
  listExamPatterns() {
    return simulate(() => examPatterns)
  },
  listExams(facultyId) {
    return simulate(() => composeExams(facultyId))
  },
  getExam(facultyId, examId) {
    return simulate(() => findExam(facultyId, examId))
  },
  createExam(facultyId, input) {
    return simulate(() => {
      if (!input.title || input.title.trim().length < 4) throw serviceError('title_required', 'Give the paper a title before starting.')
      const exam = newExam(input.preset, input.title.trim(), facultyId)
      const store = readStore(facultyId)
      store.exams.created = [exam, ...store.exams.created]
      writeStore(facultyId, store)
      return exam
    })
  },
  saveExam(facultyId, examId, patch) {
    return simulate(() => {
      const exam = findExam(facultyId, examId)
      if (exam.status === 'completed') throw serviceError('exam_locked', 'A completed paper is read-only. Its analysis stays available.')
      if (exam.status === 'live' && (patch.sections || patch.durationMinutes)) {
        throw serviceError('exam_live', 'A live paper cannot be edited. Stop the sitting first.')
      }
      saveExam(facultyId, examId, patch)
      return findExam(facultyId, examId)
    })
  },
  addQuestionToExam(facultyId, examId, sectionId, questionId) {
    return simulate(() => {
      const exam = findExam(facultyId, examId)
      if (exam.status === 'completed' || exam.status === 'live') throw serviceError('exam_locked', 'This paper is not editable.')
      const question = composeBank(facultyId).find((item) => item.id === questionId)
      if (!question) throw notFound('question')
      const sections = exam.sections.map((section) => {
        if (section.id !== sectionId) return section
        if (section.questionIds.includes(questionId)) return section
        return { ...section, questionIds: [...section.questionIds, questionId] }
      })
      if (!sections.some((section) => section.id === sectionId)) throw notFound('section')
      saveExam(facultyId, examId, { sections })
      return findExam(facultyId, examId)
    })
  },
  removeQuestionFromExam(facultyId, examId, sectionId, questionId) {
    return simulate(() => {
      const exam = findExam(facultyId, examId)
      if (exam.status === 'completed' || exam.status === 'live') throw serviceError('exam_locked', 'This paper is not editable.')
      const sections = exam.sections.map((section) =>
        section.id === sectionId ? { ...section, questionIds: section.questionIds.filter((id) => id !== questionId) } : section,
      )
      saveExam(facultyId, examId, { sections })
      return findExam(facultyId, examId)
    })
  },
  setExamStatus(facultyId, examId, status) {
    return simulate(() => {
      const exam = findExam(facultyId, examId)
      if (!STATUS_FLOW[exam.status]?.includes(status)) {
        throw serviceError('invalid_transition', `A ${exam.status.replace('_', ' ')} paper cannot become ${status.replace('_', ' ')}.`, 409)
      }
      if (status === 'pending_approval' && exam.totalQuestions === 0) {
        throw serviceError('exam_empty', 'Add at least one question before sending the paper for approval.')
      }
      const timestamp = new Date().toISOString()
      const patch = { status }
      if (status === 'pending_approval') patch.submittedAt = timestamp
      if (status === 'approved' || status === 'scheduled') patch.approvedAt = timestamp
      saveExam(facultyId, examId, patch)
      return findExam(facultyId, examId)
    })
  },
  getExamPreview(facultyId, examId) {
    return simulate(() => {
      const exam = findExam(facultyId, examId)
      const bank = new Map(composeBank(facultyId).map((question) => [question.id, question]))
      return buildExamPreview(exam, bank)
    })
  },
  deleteExam(facultyId, examId) {
    return simulate(() => {
      const exam = findExam(facultyId, examId)
      if (exam.status === 'live') throw serviceError('exam_live', 'A live paper cannot be deleted. End the sitting first.')
      const store = readStore(facultyId)
      store.exams.created = store.exams.created.filter((item) => item.id !== examId)
      store.exams.deleted = [...new Set([...store.exams.deleted, examId])]
      delete store.exams.saved[examId]
      writeStore(facultyId, store)
      return { id: examId, deletedAt: new Date().toISOString() }
    })
  },

  /* Monitor */
  getMonitor(facultyId, examId) {
    return simulate(() => buildMonitorSnapshot(facultyId, examId), { min: 120, max: 320 })
  },
  subscribeMonitor(facultyId, examId, listener) {
    const state = monitorState(facultyId, examId)
    state.emitter.add(listener)
    if (!state.ticker) {
      const interval = numericFlag('vyuh.mock.monitorIntervalSeconds', 5)
      state.ticker = createMockTicker({
        intervalSeconds: interval,
        now: Date.now,
        onTick: (at) => {
          const event = monitorScript[state.cursor % monitorScript.length]
          state.cursor += 1
          const student = state.students[event.index]
          if (!student) return
          /** @type {import('../../contracts/faculty.js').MonitorEvent} */
          const record = {
            id: `ev-${state.cursor}-${Date.now().toString(36)}`,
            at,
            type: event.type,
            studentId: student.id,
            studentName: student.name,
            label: event.label,
            note: event.note,
          }
          applyMonitorEvent(state, examId, record)
          const snapshot = buildMonitorSnapshot(facultyId, examId)
          for (const emit of [...state.emitter]) emit(snapshot)
        },
      })
      state.ticker.start()
    }
    return () => {
      state.emitter.delete(listener)
      if (state.emitter.size === 0) {
        state.ticker?.stop()
        state.ticker = null
      }
    }
  },

  /* Item analysis */
  getItemAnalysis(facultyId, examId) {
    return simulate(() => buildItemAnalysis(facultyId, examId))
  },
  markQuestionFaulty(facultyId, examId, questionId) {
    return simulate(() => {
      findExam(facultyId, examId)
      if (!itemPoints.some((point) => point.questionId === questionId)) throw notFound('question in this sitting')
      const store = readStore(facultyId)
      const register = store.faulty[examId] ?? { questionIds: [], updatedAt: new Date().toISOString() }
      register.questionIds = [...new Set([...register.questionIds, questionId])]
      register.updatedAt = new Date().toISOString()
      store.faulty[examId] = register
      writeStore(facultyId, store)
      mirrorFaults(examId, register.questionIds)
      return buildItemAnalysis(facultyId, examId)
    })
  },
  restoreQuestion(facultyId, examId, questionId) {
    return simulate(() => {
      const store = readStore(facultyId)
      const register = store.faulty[examId]
      if (register) {
        register.questionIds = register.questionIds.filter((id) => id !== questionId)
        register.updatedAt = new Date().toISOString()
        store.faulty[examId] = register
        writeStore(facultyId, store)
        mirrorFaults(examId, register.questionIds)
      }
      return buildItemAnalysis(facultyId, examId)
    })
  },

  /* Classes */
  listClasses(facultyId) {
    return simulate(() => {
      const store = readStore(facultyId)
      const cancelled = new Set(store.classes.cancelled)
      return [...store.classes.created, ...facultyClasses].map((session) =>
        cancelled.has(session.id) ? { ...session, status: /** @type {const} */ ('cancelled') } : session,
      )
    })
  },
  createClass(facultyId, input) {
    return simulate(() => {
      if (!input.title || input.title.trim().length < 4) throw serviceError('title_required', 'Give the session a title students will recognise.')
      if (!input.batchId) throw serviceError('batch_required', 'Choose the batch this session belongs to.')
      if (Date.parse(input.startsAt) < Date.now() - 60_000) throw serviceError('start_in_past', 'Pick a start time in the future.')
      if (input.attendanceThresholdPercent < 0 || input.attendanceThresholdPercent > 100) {
        throw serviceError('threshold_invalid', 'The attendance threshold is a percentage between 0 and 100.')
      }
      const stamp = Date.now()
      const batchName =
        input.batchId === 'bat-prayas-m' ? 'Prayas JEE 2027 — Morning'
        : input.batchId === 'bat-shikhar' ? 'Shikhar Droppers — Full day'
        : input.batchId === 'bat-aarambh-e' ? 'Aarambh JEE 2026 — Evening'
        : 'Aarogyam NEET 2026 — Morning'
      const subject = bankSubjects.find((item) => item.id === input.subjectId) ?? bankSubjects[0]
      /** @type {FacultyClass} */
      const session = {
        id: `cls-new-${stamp.toString(36)}`,
        title: input.title.trim(),
        mode: input.mode,
        batchId: input.batchId,
        batchName,
        subjectId: subject.id,
        subjectName: subject.name,
        facultyId,
        facultyName: facultyName(facultyId),
        startsAt: input.startsAt,
        durationMinutes: input.durationMinutes,
        attendanceThresholdPercent: input.attendanceThresholdPercent,
        status: 'scheduled',
        mediaUrl: '/media/rotational-dynamics-sample.mp4',
        recordingId: 'rec-rot-b',
        resourcesAttached: input.resourcesAttached,
      }
      const store = readStore(facultyId)
      store.classes.created = [session, ...store.classes.created]
      writeStore(facultyId, store)
      return session
    })
  },
  cancelClass(facultyId, sessionId) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      const store = readStore(facultyId)
      store.classes.cancelled = [...new Set([...store.classes.cancelled, sessionId])]
      writeStore(facultyId, store)
      return { id: sessionId, cancelledAt: new Date().toISOString() }
    })
  },

  /* Host console */
  getHostConsole(facultyId, sessionId) {
    return simulate(() => buildHostConsole(facultyId, sessionId), { min: 150, max: 380 })
  },
  startSession(facultyId, sessionId) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      const store = readStore(facultyId)
      const host = store.host[sessionId] ?? { startedAt: null, endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
      host.startedAt = host.startedAt ?? new Date().toISOString()
      store.host[sessionId] = host
      writeStore(facultyId, store)
      return buildHostConsole(facultyId, sessionId)
    })
  },
  endSession(facultyId, sessionId) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      const store = readStore(facultyId)
      const host = store.host[sessionId] ?? { startedAt: new Date().toISOString(), endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
      host.endedAt = new Date().toISOString()
      store.host[sessionId] = host
      writeStore(facultyId, store)
      return buildHostConsole(facultyId, sessionId)
    })
  },
  triggerAttentionCheck(facultyId, sessionId) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      const store = readStore(facultyId)
      const host = store.host[sessionId] ?? { startedAt: new Date().toISOString(), endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
      const present = hostParticipants.filter((participant) => participant.state === 'present').length
      host.attention = {
        id: `check-${Date.now().toString(36)}`,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15_000).toISOString(),
        issued: (host.attention?.issued ?? 0) + 1,
        responded: Math.round(present * 0.86),
      }
      store.host[sessionId] = host
      writeStore(facultyId, store)
      return buildHostConsole(facultyId, sessionId)
    })
  },
  setParticipantMuted(facultyId, sessionId, studentId, muted) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      if (!hostParticipants.some((participant) => participant.id === studentId)) throw notFound('participant')
      const store = readStore(facultyId)
      const host = store.host[sessionId] ?? { startedAt: null, endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
      host.muted = muted ? [...new Set([...host.muted, studentId])] : host.muted.filter((id) => id !== studentId)
      store.host[sessionId] = host
      writeStore(facultyId, store)
      return buildHostConsole(facultyId, sessionId)
    })
  },
  hideChatMessage(facultyId, sessionId, messageId) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      const store = readStore(facultyId)
      const host = store.host[sessionId] ?? { startedAt: null, endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
      host.hiddenChat = [...new Set([...host.hiddenChat, messageId])]
      store.host[sessionId] = host
      writeStore(facultyId, store)
      return buildHostConsole(facultyId, sessionId)
    })
  },
  approveQueueQuestion(facultyId, sessionId, questionId) {
    return simulate(() => {
      findClass(facultyId, sessionId)
      const store = readStore(facultyId)
      const host = store.host[sessionId] ?? { startedAt: null, endedAt: null, muted: [], hiddenChat: [], approved: [], attention: null }
      host.approved = [...new Set([...host.approved, questionId])]
      store.host[sessionId] = host
      writeStore(facultyId, store)
      return buildHostConsole(facultyId, sessionId)
    })
  },
  subscribeHost(facultyId, sessionId, listener) {
    const state = hostState(facultyId, sessionId)
    state.emitter.add(listener)
    if (!state.ticker) {
      state.ticker = createMockTicker({
        intervalSeconds: numericFlag('vyuh.mock.hostTickSeconds', 6),
        onTick: () => {
          const console_ = buildHostConsole(facultyId, sessionId)
          for (const emit of [...state.emitter]) emit(console_)
        },
      })
      state.ticker.start()
    }
    return () => {
      state.emitter.delete(listener)
      if (state.emitter.size === 0) {
        state.ticker?.stop()
        state.ticker = null
      }
    }
  },

  /* Recordings */
  listRecordings(facultyId) {
    return simulate(() => {
      const store = readStore(facultyId)
      const deleted = new Set(store.recordings.deleted)
      /** @type {Map<string, FacultyRecording>} */
      const map = new Map()
      for (const recording of facultyRecordings) map.set(recording.id, recording)
      for (const recording of store.recordings.created) map.set(recording.id, recording)
      for (const [id, patch] of Object.entries(store.recordings.saved)) {
        const current = map.get(id)
        if (current) map.set(id, { ...current, ...patch })
      }
      return [...map.values()].filter((recording) => !deleted.has(recording.id))
    })
  },
  getRecording(facultyId, recordingId) {
    return simulate(() => readRecording(facultyId, recordingId))
  },
  createRecording(facultyId, input) {
    return simulate(() => {
      if (!input.fileName) throw serviceError('file_required', 'Choose a file to upload.')
      if (!input.title || input.title.trim().length < 4) throw serviceError('title_required', 'Name the recording before uploading.')
      const stamp = Date.now()
      const subject = bankSubjects.find((item) => item.id === input.subjectId) ?? bankSubjects[0]
      /** @type {FacultyRecording} */
      const recording = {
        id: `rec-new-${stamp.toString(36)}`,
        title: input.title.trim(),
        subjectId: subject.id,
        subjectName: subject.name,
        topicName: input.topicName,
        batchName: input.batchId === 'bat-prayas-m' ? 'Prayas JEE 2027 — Morning' : 'Aarogyam NEET 2026 — Morning',
        fileName: input.fileName,
        sizeBytes: input.sizeBytes,
        durationSeconds: input.durationSeconds,
        uploadProgress: 0,
        uploadState: 'uploading',
        trimStartSeconds: 0,
        trimEndSeconds: input.durationSeconds,
        chapters: [],
        transcript: [],
        published: false,
        ownerName: facultyName(facultyId),
        updatedAt: new Date().toISOString(),
        mediaUrl: '/media/rotational-dynamics-sample.mp4',
      }
      const store = readStore(facultyId)
      store.recordings.created = [recording, ...store.recordings.created]
      writeStore(facultyId, store)
      return recording
    })
  },
  saveRecording(facultyId, recordingId, patch) {
    return simulate(() => {
      const current = readRecording(facultyId, recordingId)
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
      if (patch.chapters) {
        const problem = chapterProblem(patch.chapters, next)
        if (next.published && problem) throw serviceError('chapters_invalid', problem)
      }
      if (patch.published === true && next.uploadState !== 'ready') {
        throw serviceError('upload_incomplete', 'Wait for the upload to finish before publishing.')
      }
      const store = readStore(facultyId)
      store.recordings.saved[recordingId] = { ...(store.recordings.saved[recordingId] ?? {}), ...patch, uploadState: next.uploadState, uploadProgress: next.uploadProgress }
      writeStore(facultyId, store)
      return next
    })
  },
  deleteRecording(facultyId, recordingId) {
    return simulate(() => {
      const store = readStore(facultyId)
      store.recordings.created = store.recordings.created.filter((item) => item.id !== recordingId)
      store.recordings.deleted = [...new Set([...store.recordings.deleted, recordingId])]
      delete store.recordings.saved[recordingId]
      writeStore(facultyId, store)
      return { id: recordingId, deletedAt: new Date().toISOString() }
    })
  },

  /* Attendance */
  getAttendanceReport(facultyId, filter) {
    return simulate(() => {
      const batchId = filter?.batchId ?? 'bat-neet-12'
      const rows = attendanceRows
        .filter((row) => !batchId || row.batchId === batchId)
        .filter((row) => (filter?.defaultersOnly ? row.defaulter : true))
      const base = rows
      const summaryBase = attendanceRows.filter((row) => !batchId || row.batchId === batchId)
      return {
        periodLabel: attendancePeriod.label,
        thresholdPercent: 75,
        batchId,
        batchName: base[0]?.batchName ?? 'Aarogyam NEET 2026 — Morning',
        rows,
        summary: {
          students: summaryBase.length,
          defaulters: summaryBase.filter((row) => row.defaulter).length,
          averagePercent: summaryBase.length === 0 ? 0 : Math.round((summaryBase.reduce((sum, row) => sum + row.percent, 0) / summaryBase.length) * 10) / 10,
          sessionsHeld: summaryBase[0]?.sessionsHeld ?? 42,
        },
        updatedAt: new Date().toISOString(),
      }
    })
  },
  exportAttendance(facultyId, filter) {
    return simulate(() => {
      const report = {
        rows: attendanceRows
          .filter((row) => !filter?.batchId || row.batchId === filter.batchId)
          .filter((row) => (filter?.defaultersOnly ? row.defaulter : true)),
      }
      void facultyId
      const header = ['Roll number', 'Name', 'Batch', 'Sessions held', 'Present', 'Percent', 'Attention average', 'Defaulter']
      const rows = report.rows.map((row) => [
        row.rollNumber, row.name, row.batchName, row.sessionsHeld, row.present, row.percent, row.attentionAverage, row.defaulter ? 'Yes' : 'No',
      ])
      return {
        fileName: `attendance-${(filter?.batchId ?? 'all')}-${new Date().toISOString().slice(0, 10)}.csv`,
        csv: toCsv(header, rows),
        generatedAt: new Date().toISOString(),
        rows: rows.length,
      }
    })
  },

  /* Doubts */
  listDoubts(facultyId, filter) {
    return simulate(() => {
      const store = readStore(facultyId)
      const doubts = facultyDoubts.map((doubt) => {
        const replies = store.doubts.replies[doubt.id] ?? []
        const status = store.doubts.status[doubt.id] ?? doubt.status
        return { ...doubt, messages: [...doubt.messages, ...replies], status }
      })
      const status = filter?.status ?? 'all'
      return doubts.filter((doubt) => (status === 'all' ? true : status === 'open' ? doubt.status !== 'resolved' : doubt.status === status))
    })
  },
  getDoubt(facultyId, doubtId) {
    return simulate(() => {
      const store = readStore(facultyId)
      const doubt = facultyDoubts.find((item) => item.id === doubtId)
      if (!doubt) throw notFound('doubt')
      return {
        ...doubt,
        messages: [...doubt.messages, ...(store.doubts.replies[doubtId] ?? [])],
        status: store.doubts.status[doubtId] ?? doubt.status,
      }
    })
  },
  replyDoubt(facultyId, doubtId, body) {
    return simulate(() => {
      if (!body || body.trim().length < 4) throw serviceError('reply_required', 'Write a reply before sending.')
      const store = readStore(facultyId)
      const messages = store.doubts.replies[doubtId] ?? []
      messages.push({
        id: `fd-reply-${Date.now().toString(36)}`,
        author: facultyName(facultyId),
        role: 'faculty',
        body: body.trim(),
        createdAt: new Date().toISOString(),
      })
      store.doubts.replies[doubtId] = messages
      store.doubts.status[doubtId] = 'answered'
      writeStore(facultyId, store)
      const doubt = facultyDoubts.find((item) => item.id === doubtId)
      if (!doubt) throw notFound('doubt')
      return { ...doubt, messages: [...doubt.messages, ...messages], status: /** @type {const} */ ('answered') }
    })
  },
  resolveDoubt(facultyId, doubtId) {
    return simulate(() => {
      const store = readStore(facultyId)
      store.doubts.status[doubtId] = 'resolved'
      writeStore(facultyId, store)
      const doubt = facultyDoubts.find((item) => item.id === doubtId)
      if (!doubt) throw notFound('doubt')
      return { ...doubt, messages: [...doubt.messages, ...(store.doubts.replies[doubtId] ?? [])], status: /** @type {const} */ ('resolved') }
    })
  },
  listReplyTemplates(facultyId) {
    return simulate(() => {
      void facultyId
      return replyTemplates
    })
  },
}

/** Item analysis and the NEET sitting share one exam id; re-exported for hooks. */
export { ITEM_ANALYSIS_EXAM_ID }
