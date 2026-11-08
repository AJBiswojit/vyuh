/**
 * Phase 4 exam-flow contracts. The hall receives an answer-key-free paper;
 * authored answers/explanations stay in mock-data for Phase 5 evaluation.
 *
 * @typedef {import('./student.js').Exam} Exam
 * @typedef {import('./assessment.js').Question} Question
 * @typedef {import('./assessment.js').QuestionOption} QuestionOption
 * @typedef {import('./assessment.js').QuestionState} QuestionState
 * @typedef {import('./assessment.js').AnswerEntry} AnswerEntry
 *
 * @typedef {'sure'|'unsure'|'guessing'} Confidence
 * @typedef {'manual'|'timer_expired'} SubmitReason
 * @typedef {'tab_switch'|'copy_blocked'|'cut_blocked'|'context_menu_blocked'|'fullscreen_prompt'|'fullscreen_enter'|'fullscreen_exit'} IntegrityEventType
 *
 * @typedef {Object} IntegrityEvent
 * @property {IntegrityEventType} type
 * @property {string} at
 * @property {string} [questionId]
 *
 * @typedef {Object} ExamSection
 * @property {string} id
 * @property {string} subjectId
 * @property {string} name
 * @property {number} order
 * @property {string[]} questionIds
 *
 * @typedef {Question & { sectionId: string, numericTolerance?: number, unit?: string }} ExamQuestion
 *
 * @typedef {Object} ExamCandidate
 * @property {string} name
 * @property {string} rollNumber
 *
 * @typedef {Object} MarkingScheme
 * @property {number} correct
 * @property {number} incorrect
 * @property {number} unattempted
 *
 * @typedef {Object} ExamPaper
 * @property {Exam} exam
 * @property {ExamSection[]} sections
 * @property {ExamQuestion[]} questions
 * @property {ExamCandidate} candidate
 * @property {string} serverNow
 * @property {number} offsetMs
 * @property {number} durationSeconds
 * @property {string[]} rules
 * @property {MarkingScheme} markingScheme
 * @property {string} declaration
 *
 * @typedef {Object} ExamStartInput
 * @property {string} examId
 * @property {string} studentId
 * @property {boolean} declarationAccepted
 * @property {boolean} systemCheckPassed
 *
 * @typedef {Object} ExamStartReceipt
 * @property {string} attemptId
 * @property {string} examId
 * @property {string} studentId
 * @property {string} startedAt
 * @property {string} deadlineAt
 * @property {string} serverNow
 * @property {number} offsetMs
 * @property {number} durationSeconds
 * @property {boolean} resumed
 *
 * @typedef {Object} ExamStatusCounts
 * @property {number} answered
 * @property {number} not_answered
 * @property {number} review
 * @property {number} review_answered
 * @property {number} not_visited
 * @property {number} total
 *
 * @typedef {Object} ExamSubmissionCounts
 * @property {number} answered
 * @property {number} notAnswered
 * @property {number} review
 * @property {number} notVisited
 * @property {number} total
 *
 * @typedef {Object} QuestionVisit
 * @property {string} questionId
 * @property {string} enteredAt
 * @property {string | null} leftAt
 * @property {number} durationSeconds
 *
 * @typedef {Object} ExamSubmissionInput
 * @property {string} attemptId
 * @property {string} examId
 * @property {string} studentId
 * @property {string} submittedAt
 * @property {SubmitReason} reason
 * @property {number} remainingSeconds
 * @property {AnswerEntry[]} entries
 * @property {Record<string, Confidence | null>} confidences
 * @property {IntegrityEvent[]} integrityEvents
 * @property {QuestionVisit[]} [visits]
 *
 * @typedef {Object} ExamSubmissionReceipt
 * @property {string} attemptId
 * @property {string} examId
 * @property {string} examTitle
 * @property {string} studentId
 * @property {string} submittedAt
 * @property {SubmitReason} reason
 * @property {ExamSubmissionCounts} counts
 * @property {boolean} pendingSync
 *
 * @typedef {Object} ExamSyncInput
 * @property {string} attemptId
 * @property {number} revision
 * @property {AnswerEntry[]} entries
 * @property {Record<string, Confidence | null>} confidences
 * @property {IntegrityEvent[]} integrityEvents
 *
 * @typedef {Object} ExamSyncReceipt
 * @property {string} attemptId
 * @property {number} revision
 * @property {string} syncedAt
 *
 * ── Exam registry (Batch 1) ────────────────────────────────────────────────
 * One definition per seeded exam. `playable` is true only when a real authored
 * question set exists; ledger-only papers keep `questionSetId: null`.
 *
 * @typedef {Object} ExamDefinition
 * @property {string} id
 * @property {string} title
 * @property {import('./student.js').Exam['track']} track
 * @property {import('./student.js').Exam['kind']} kind
 * @property {import('./student.js').Exam['status']} status
 * @property {number} durationMinutes
 * @property {number} questionCount
 * @property {number} maxMarks
 * @property {number} negativeMarks
 * @property {string[]} subjectIds
 * @property {number} sectionCount
 * @property {string | null} scheduledFor
 * @property {string | null} endsAt
 * @property {string[]} instructions
 * @property {boolean} playable
 * @property {string | null} questionSetId
 * @property {'question_level'|'score_summary'|'unpublished'} resultMode
 * @property {string | null} unavailableReason
 */
export {}
