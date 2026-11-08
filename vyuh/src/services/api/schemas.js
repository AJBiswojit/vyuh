/**
 * Zod schemas for every payload the API implementation accepts.
 *
 * Validation lives here and nowhere else: if a response fails a schema we throw
 * a ServiceError that names the endpoint, so a malformed payload surfaces as a
 * handled error state instead of a component blowing up three renders later.
 */
import { z } from 'zod'
import { userSchema } from '../authSchemas.js'

const isoDate = z.string().min(1)
const isoDateTime = z.string().min(1)

export { roleSchema, userSchema, authSessionSchema } from '../authSchemas.js'
export { loginSchema, signupSchema, otpSchema, forgotPasswordSchema, resetPasswordSchema, acceptInviteSchema, resetPasswordRequestSchema, acceptInviteRequestSchema, authChallengeSchema, resetRequestSchema, signupOptionsSchema, facultyInviteSchema } from '../authSchemas.js'
/* Batch 2 identity/setup validation, re-exported from the shared boundary. */
export { loginIdentifierSchema, instituteIdSchema, setupAccountSchema, instituteAccountInputSchema, accountStatusSchema, INSTITUTE_ID_PATTERNS } from '../authSchemas.js'
export const trackSchema = z.enum(['JEE', 'NEET', 'NTA'])
export const cohortSchema = z.enum(['class11', 'class12', 'dropper'])

export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  rollNumber: z.string(),
  initials: z.string().length(2),
  batchId: z.string(),
  batchName: z.string(),
  track: trackSchema,
  cohort: cohortSchema,
  avatarTone: z.string(),
})

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  track: trackSchema,
  chapterCount: z.number().int().nonnegative(),
  questionCount: z.number().int().nonnegative(),
})

export const batchSchema = z.object({
  id: z.string(),
  name: z.string(),
  track: trackSchema,
  cohort: cohortSchema,
  studentCount: z.number().int().nonnegative(),
  facultyLead: z.string(),
  scheduleLabel: z.string(),
  subjectIds: z.array(z.string()),
  testCount: z.number().int().nonnegative(),
  status: z.enum(['active', 'archived']),
})

export const batchPageSchema = z.object({
  items: z.array(batchSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
})

export const testSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(['mock', 'chapter', 'assignment', 'live']),
  status: z.enum(['draft', 'scheduled', 'live', 'closed']),
  track: trackSchema,
  durationMinutes: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  maxMarks: z.number().positive(),
  totalMarksApplied: z.number().nonnegative(),
  scheduledFor: isoDateTime.nullable(),
  subjectIds: z.array(z.string()),
  activeAttemptId: z.string().nullable(),
})

export const examSchema = testSchema.extend({
  sectionCount: z.number().int().positive(),
  negativeMarks: z.number().nonnegative(),
  endsAt: isoDateTime.nullable(),
  instructions: z.array(z.string()),
  // Registry read-model annotations supplied by the mock exam service.
  playable: z.boolean().optional(),
  resultMode: z.enum(['question_level', 'score_summary', 'unpublished']).optional(),
  unavailableReason: z.string().nullable().optional(),
})

export const subjectScoreSchema = z.object({
  subjectId: z.string(), subjectName: z.string(), scored: z.number(), max: z.number().positive(), accuracy: z.number(),
})
export const attemptSummarySchema = z.object({
  id: z.string(), examId: z.string(), title: z.string(), submittedAt: isoDateTime,
  score: z.number(), maxMarks: z.number().positive(), percentile: z.number(), accuracy: z.number(),
  sparkline: z.array(z.number()), subjects: z.array(subjectScoreSchema),
})
export const subjectStrengthSchema = z.object({
  subjectId: z.string(), name: z.string(), score: z.number().min(0).max(100), batchAverage: z.number().min(0).max(100),
  delta: z.number(), trend: z.array(z.number()),
})
export const recordingSchema = z.object({
  id: z.string(), title: z.string(), chapterName: z.string(), subjectName: z.string(), facultyName: z.string(),
  durationMinutes: z.number().int().positive(), progressPercent: z.number().min(0).max(100), lastWatchedAt: isoDateTime,
})
export const attendanceSummarySchema = z.object({
  present: z.number().int().nonnegative(), total: z.number().int().nonnegative(), percentage: z.number().min(0).max(100),
  periodLabel: z.string(), currentStreak: z.number().int().nonnegative(),
})
export const notificationPreferencesSchema = z.object({
  examReminders: z.boolean(), liveClassReminders: z.boolean(), resultPublished: z.boolean(), attendanceAlerts: z.boolean(), productUpdates: z.boolean(),
})
export const dataConsentPreferencesSchema = z.object({
  attendanceTracking: z.boolean(), performanceAnalytics: z.boolean(), guardianSummary: z.boolean(),
})
export const studentPreferencesSchema = z.object({ notifications: notificationPreferencesSchema, dataConsent: dataConsentPreferencesSchema })
export const studentNotificationSchema = z.object({
  id: z.string(), title: z.string(), body: z.string(), createdAt: isoDateTime, read: z.boolean(), kind: z.enum(['exam', 'class', 'result', 'institute']),
})
export const scoreReportSchema = z.object({
  attemptId: z.string(),
  score: z.number(),
  maxMarks: z.number().positive(),
  percentile: z.number(),
  rank: z.number().int().positive(),
  cohortSize: z.number().int().positive(),
  accuracy: z.number(),
  attempted: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  wrong: z.number().int().nonnegative(),
  unattempted: z.number().int().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  subjects: z.array(
    z.object({
      subjectId: z.string(),
      subjectName: z.string(),
      scored: z.number(),
      max: z.number().positive(),
      accuracy: z.number(),
    }),
  ),
})

export const trendPointSchema = z.object({
  label: z.string(),
  date: isoDate,
  score: z.number(),
  percentile: z.number(),
  cohortAverage: z.number(),
})

export const performanceSnapshotSchema = z.object({
  attempts: z.array(attemptSummarySchema), scoreTrend: z.array(trendPointSchema), subjects: z.array(subjectStrengthSchema),
})

export const courseSchema = z.object({
  id: z.string(),
  name: z.string(),
  track: trackSchema,
  durationMonths: z.number().int().positive(),
  classLevel: z.string(),
  seats: z.number().int().positive(),
  enrolled: z.number().int().nonnegative(),
  feeInr: z.number().int().nonnegative(),
  status: z.enum(['open', 'closed']),
})

export const questionOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  body: z.string().min(1),
})

export const questionSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  subjectId: z.string(),
  chapterId: z.string(),
  type: z.enum(['single', 'multiple', 'numeric']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  body: z.string().min(1),
  options: z.array(questionOptionSchema),
  marks: z.number().positive(),
  negativeMarks: z.number().nonnegative(),
})

export const examSectionSchema = z.object({
  id: z.string(), subjectId: z.string(), name: z.string(), order: z.number().int().nonnegative(), questionIds: z.array(z.string()),
})
export const examQuestionSchema = questionSchema.extend({
  sectionId: z.string(), numericTolerance: z.number().nonnegative().optional(), unit: z.string().optional(),
})
export const examPaperSchema = z.object({
  exam: examSchema,
  sections: z.array(examSectionSchema),
  questions: z.array(examQuestionSchema),
  candidate: z.object({ name: z.string(), rollNumber: z.string() }),
  serverNow: isoDateTime, offsetMs: z.number(), durationSeconds: z.number().int().positive(),
  rules: z.array(z.string()),
  markingScheme: z.object({ correct: z.number(), incorrect: z.number(), unattempted: z.number() }),
  declaration: z.string(),
})
export const examStartInputSchema = z.object({
  examId: z.string(), studentId: z.string(), declarationAccepted: z.boolean(), systemCheckPassed: z.boolean(),
})
export const examStartReceiptSchema = z.object({
  attemptId: z.string(), examId: z.string(), studentId: z.string(), startedAt: isoDateTime, deadlineAt: isoDateTime,
  serverNow: isoDateTime, offsetMs: z.number(), durationSeconds: z.number().int().positive(), resumed: z.boolean(),
})
export const answerEntrySchema = z.object({
  questionId: z.string(), state: z.enum(['answered', 'review', 'review_answered', 'not_answered', 'not_visited']),
  selected: z.array(z.string()), timeSpentSeconds: z.number().nonnegative(),
})
export const confidenceSchema = z.enum(['sure', 'unsure', 'guessing']).nullable()
export const integrityEventSchema = z.object({
  type: z.enum(['tab_switch', 'copy_blocked', 'cut_blocked', 'context_menu_blocked', 'fullscreen_prompt', 'fullscreen_enter', 'fullscreen_exit']),
  at: isoDateTime, questionId: z.string().optional(),
})
export const examSyncInputSchema = z.object({
  attemptId: z.string(), revision: z.number().int().nonnegative(), entries: z.array(answerEntrySchema),
  confidences: z.record(z.string(), confidenceSchema), integrityEvents: z.array(integrityEventSchema),
})
export const examSyncReceiptSchema = z.object({ attemptId: z.string(), revision: z.number().int().nonnegative(), syncedAt: isoDateTime })
export const questionVisitSchema = z.object({
  questionId: z.string(), enteredAt: isoDateTime, leftAt: isoDateTime.nullable(), durationSeconds: z.number().nonnegative(),
})
export const examSubmissionInputSchema = z.object({
  attemptId: z.string(), examId: z.string(), studentId: z.string(), submittedAt: isoDateTime,
  reason: z.enum(['manual', 'timer_expired']), remainingSeconds: z.number().int().nonnegative(),
  entries: z.array(answerEntrySchema), confidences: z.record(z.string(), confidenceSchema), integrityEvents: z.array(integrityEventSchema),
  visits: z.array(questionVisitSchema).optional(),
})
export const examSubmissionReceiptSchema = z.object({
  attemptId: z.string(), examId: z.string(), examTitle: z.string(), studentId: z.string(), submittedAt: isoDateTime,
  reason: z.enum(['manual', 'timer_expired']),
  counts: z.object({ answered: z.number().int().nonnegative(), notAnswered: z.number().int().nonnegative(), review: z.number().int().nonnegative(), notVisited: z.number().int().nonnegative(), total: z.number().int().positive() }),
  pendingSync: z.boolean(),
})

export const markingSchemeSchema = z.object({ correct: z.number(), incorrect: z.number(), unattempted: z.number() })
export const responseDistributionSchema = z.object({
  key: z.string(), label: z.string(), count: z.number().int().nonnegative(), percent: z.number().min(0).max(100), correct: z.boolean(), selectedByStudent: z.boolean(),
})
export const mistakeCategorySchema = z.enum(['conceptual', 'careless', 'time_pressure', 'misread', 'guess'])
export const questionAnalysisSchema = z.object({
  id: z.string(), number: z.number().int().positive(), sectionId: z.string(), sectionName: z.string(), subjectId: z.string(), topicId: z.string(), topicName: z.string(),
  question: examQuestionSchema, studentAnswer: z.array(z.string()), correctAnswer: z.array(z.string()), outcome: z.enum(['correct', 'wrong', 'skipped']),
  confidence: confidenceSchema, confidentMistake: z.boolean(), luckyGuess: z.boolean(), mistakeCategory: mistakeCategorySchema.nullable(), mistakeLabel: z.string(),
  marksDelta: z.number(), timeSpentSeconds: z.number().nonnegative(), cohortAverageSeconds: z.number().nonnegative(), cohortMedianSeconds: z.number().nonnegative(),
  difficultyIndex: z.number().min(0).max(100), responseDistribution: z.array(responseDistributionSchema), explanation: z.string(),
})
export const pacingPointSchema = z.object({
  questionNumber: z.number().int().positive(), questionId: z.string(), studentSeconds: z.number().nonnegative(), cohortAverageSeconds: z.number().nonnegative(),
  cohortMedianSeconds: z.number().nonnegative(), cohortBand: z.tuple([z.number().nonnegative(), z.number().nonnegative()]), flag: z.enum(['rushed', 'stalled']).nullable(),
})
export const attemptVisitSchema = z.object({ sequence: z.number().int().positive(), questionId: z.string(), questionNumber: z.number().int().positive(), sectionName: z.string(), enteredAt: isoDateTime, durationSeconds: z.number().nonnegative() })
export const mistakeDnaSliceSchema = z.object({ id: mistakeCategorySchema, label: z.string(), count: z.number().int().nonnegative(), percent: z.number().min(0).max(100), advice: z.string() })
export const heatmapCellSchema = z.object({ sectionId: z.string(), sectionName: z.string(), topicId: z.string(), topicName: z.string(), attempted: z.number().int().nonnegative(), correct: z.number().int().nonnegative(), accuracy: z.number().min(0).max(100) })
export const whatIfSummarySchema = z.object({ actualScore: z.number(), scoreWithoutNegative: z.number(), difference: z.number(), wrongCount: z.number().int().nonnegative(), negativeMarksLost: z.number().nonnegative() })
export const analysisSummarySchema = z.object({
  score: z.number(), maxMarks: z.number().nonnegative(), rank: z.number().int().positive(), cohortSize: z.number().int().positive(), percentile: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100), attempted: z.number().int().nonnegative(), correct: z.number().int().nonnegative(), wrong: z.number().int().nonnegative(), skipped: z.number().int().nonnegative(), durationSeconds: z.number().nonnegative(),
  cost: z.object({ negativeMarksLost: z.number().nonnegative(), timeOnWrongSeconds: z.number().nonnegative(), confidentMistakes: z.number().int().nonnegative() }),
})
export const analysisTrendPointSchema = z.object({ label: z.string(), date: isoDateTime, track: trackSchema, score: z.number(), maxMarks: z.number().positive(), scorePercent: z.number(), percentile: z.number(), cohortAveragePercent: z.number() })
export const analysisDetailsSchema = z.object({
  summary: analysisSummarySchema, questions: z.array(questionAnalysisSchema), pacing: z.array(pacingPointSchema), path: z.array(attemptVisitSchema),
  mistakeDna: z.array(mistakeDnaSliceSchema), dominantMistake: mistakeCategorySchema.nullable(), mistakeAdvice: z.string(), heatmap: z.array(heatmapCellSchema),
  whatIf: whatIfSummarySchema, attemptTrend: z.array(analysisTrendPointSchema), markingScheme: markingSchemeSchema,
})
export const releasePolicySchema = z.object({ released: z.boolean(), releaseAt: isoDateTime.nullable(), serverNow: isoDateTime, offsetMs: z.number(), rule: z.string() })
export const examScoreSummarySchema = z.object({
  score: z.number(), maxMarks: z.number().positive(), percentile: z.number(), accuracy: z.number(), submittedAt: isoDateTime,
  subjects: z.array(subjectScoreSchema),
})
export const examAnalysisSchema = z.object({
  examId: z.string(), examTitle: z.string(), attemptId: z.string(), studentId: z.string(), candidateName: z.string(), rollNumber: z.string(), submittedAt: isoDateTime,
  source: z.enum(['fixture', 'submission', 'unpublished']), release: releasePolicySchema, details: analysisDetailsSchema.nullable(),
  notice: z.string().nullable().optional(), scoreSummary: examScoreSummarySchema.nullable().optional(),
})
export const topicRevisionSchema = z.object({
  topicId: z.string(), topicName: z.string(), subjectName: z.string(), mastery: z.number().min(0).max(100), weightage: z.number().nonnegative(), advice: z.string(),
  questions: z.array(z.object({ id: z.string(), number: z.number().int().positive(), body: z.string(), correctAnswer: z.array(z.string()), explanation: z.string() })),
})

export const liveSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  facultyName: z.string(),
  status: z.enum(['scheduled', 'live', 'ended']),
  startsAt: isoDateTime,
  durationMinutes: z.number().int().positive(),
  attendingCount: z.number().int().nonnegative(),
  capacity: z.number().int().positive(),
  joinUrl: z.string(),
  resourcesAttached: z.boolean(),
  mode: z.enum(['interactive', 'broadcast']),
  batchId: z.string(),
  batchName: z.string(),
  mediaUrl: z.string(),
  recordingId: z.string().nullable().optional(),
})

export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  publishedAt: isoDateTime,
  scope: z.enum(['institute', 'batch', 'faculty']),
  author: z.string(),
})

export const continueItemSchema = z.object({
  kind: z.enum(['test', 'session', 'assignment']),
  id: z.string(),
  title: z.string(),
  meta: z.string(),
  progress: z.number().min(0).max(100),
})

export const dashboardSnapshotSchema = z.object({
  student: studentSchema,
  nextTest: examSchema.nullable(),
  liveNow: z.array(liveSessionSchema),
  lastReport: scoreReportSchema.nullable(),
  trend: z.array(trendPointSchema),
  resume: continueItemSchema.nullable(),
  announcements: z.array(announcementSchema),
  streakDays: z.number().int().nonnegative(),
  weeklyGoalPercent: z.number().min(0).max(100),
  studyLog: z.array(z.object({ day: z.string(), minutes: z.number().nonnegative(), target: z.number().nonnegative() })).length(7),
  recentAttempts: z.array(attemptSummarySchema),
  subjectStrength: z.array(subjectStrengthSchema),
  continueRecording: recordingSchema.nullable(),
  schedule: z.array(liveSessionSchema),
  attendance: attendanceSummarySchema,
})

export const instituteProfileSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  city: z.string(),
  state: z.string(),
  established: z.number().int(),
  tagline: z.string(),
  description: z.string(),
  term: z.string(),
  contact: z.object({ phone: z.string(), email: z.string(), address: z.string() }),
  stats: z.array(z.object({ label: z.string(), value: z.string() })),
})

const landingActionSchema = z.object({
  label: z.string(),
  to: z.string(),
  tone: z.enum(['ember', 'ghost']),
  kind: z.enum(['internal', 'anchor']),
})

const landingSampleQuestionSchema = z.object({
  exam: z.string(),
  subject: z.string(),
  number: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  scheme: z.string(),
  prompt: z.string(),
  equation: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.enum(['A', 'B', 'C', 'D']),
  remark: z.string(),
})

/**
 * Landing copy. Shape-checked rather than prose-checked: an empty string is a
 * missing section, and a missing section is a hole in the page.
 */
export const landingContentSchema = z.object({
  nav: z.object({
    links: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })),
    signIn: z.object({ label: z.string().min(1), to: z.string().min(1) }),
    cta: z.object({ label: z.string().min(1), to: z.string().min(1) }),
    skip: z.string().min(1),
  }),
  hero: z.object({
    eyebrow: z.string().min(1),
    headline: z.array(z.string().min(1)).min(1),
    supporting: z.string().min(1),
    actions: z.array(landingActionSchema).min(1).max(2),
    footnote: z.string(),
  }),
  samplePaper: z.object({
    questions: z.array(landingSampleQuestionSchema).min(1),
    timer: z.object({ minutes: z.number().int(), seconds: z.number().int(), label: z.string() }),
    paletteLabel: z.string(),
    legend: z.array(z.object({ label: z.string(), token: z.string() })),
    caption: z.string(),
  }),
  ticker: z.object({ label: z.string(), exams: z.array(z.string().min(1)).min(1) }),
  bento: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    tiles: z.array(
      z.object({ key: z.string(), eyebrow: z.string(), title: z.string(), body: z.string(), span: z.string() }),
    ),
  }),
  differentiators: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    items: z.array(z.object({ title: z.string(), body: z.string(), icon: z.string() })),
  }),
  howItWorks: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    note: z.string(),
    steps: z.array(z.object({ step: z.string(), title: z.string(), body: z.string() })),
  }),
  institutes: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    points: z.array(z.string()),
    cta: z.object({ label: z.string(), to: z.string() }),
    ctaNote: z.string(),
  }),
  footer: z.object({
    statementLabel: z.string(),
    statement: z.string(),
    columns: z.array(
      z.object({
        heading: z.string(),
        audience: z.string().optional(),
        links: z.array(z.object({ label: z.string(), to: z.string(), hint: z.string().optional() })),
      }),
    ),
  }),
})

export { loginSchema as credentialsSchema } from '../authSchemas.js'

export const studentProfileSchema = z.object({
  user: userSchema,
  student: studentSchema,
  batch: batchSchema,
  institute: instituteProfileSchema,
  preferences: studentPreferencesSchema,
})
export const doubtThreadSchema = z.object({ id: z.string(), title: z.string() })
export const studyRoomSchema = z.object({ id: z.string(), name: z.string() })

// ── Phase 6 learning ───────────────────────────────────────────────────────
export const attendancePolicySchema = z.object({
  thresholdPercent: z.number().min(0).max(100), graceMinutes: z.number().nonnegative(), attentionReward: z.number(), attentionPenalty: z.number(),
  checkMinMinutes: z.number().positive(), checkMaxMinutes: z.number().positive(), responseWindowSeconds: z.number().positive(),
})
export const attentionResponseSchema = z.object({ checkId: z.string(), outcome: z.enum(['answered', 'missed']), at: isoDateTime, delta: z.number() })
export const liveAttendanceStateSchema = z.object({
  sessionId: z.string(), studentId: z.string(), joinedAt: isoDateTime, leftAt: isoDateTime.nullable(), connected: z.boolean(), visible: z.boolean(), lastTickAt: isoDateTime,
  eligibleSeconds: z.number().nonnegative(), attendedSeconds: z.number().nonnegative(), attentionScore: z.number().min(0).max(100), presencePercent: z.number().min(0).max(100),
  verdict: z.enum(['Present', 'Partial', 'Absent']), lastDelta: z.number(), responses: z.array(attentionResponseSchema), activeCheckId: z.string().nullable(), updatedAt: isoDateTime,
})
export const attendanceRecordSchema = z.object({
  sessionId: z.string(), title: z.string(), subjectName: z.string(), batchName: z.string(), date: isoDateTime, presencePercent: z.number().min(0).max(100),
  verdict: z.enum(['Present', 'Partial', 'Absent']), attendedMinutes: z.number().nonnegative(), eligibleMinutes: z.number().nonnegative(), live: z.boolean(),
})
export const attendanceReportSchema = z.object({ studentId: z.string(), periodLabel: z.string(), policy: attendancePolicySchema, sessions: z.array(attendanceRecordSchema), summary: attendanceSummarySchema, defaulter: z.boolean(), explanation: z.string() })
export const chatMessageSchema = z.object({ id: z.string(), author: z.string(), role: z.enum(['student', 'faculty', 'system']), body: z.string(), sentAt: isoDateTime })
export const queueQuestionSchema = z.object({ id: z.string(), sessionId: z.string(), author: z.string(), studentId: z.string(), body: z.string(), status: z.enum(['pending', 'approved']), upvotes: z.number().int().nonnegative(), votedByMe: z.boolean(), createdAt: isoDateTime, approvedAt: isoDateTime.nullable() })
export const attentionChallengeSchema = z.object({ id: z.string(), issuedAt: isoDateTime, expiresAt: isoDateTime, windowSeconds: z.number().positive() })
export const liveRoomSchema = z.object({ session: liveSessionSchema, policy: attendancePolicySchema, chat: z.array(chatMessageSchema), queue: z.array(queueQuestionSchema), attendance: liveAttendanceStateSchema.nullable(), recordingId: z.string().nullable() })
export const playbackBookmarkSchema = z.object({ id: z.string(), timeSeconds: z.number().nonnegative(), label: z.string(), createdAt: isoDateTime })
export const playbackNoteSchema = z.object({ id: z.string(), timeSeconds: z.number().nonnegative(), text: z.string(), createdAt: isoDateTime })
export const playbackStateSchema = z.object({
  recordingId: z.string(), positionSeconds: z.number().nonnegative(), watchedThroughSeconds: z.number().nonnegative(), durationSeconds: z.number().positive(), progressPercent: z.number().min(0).max(100),
  speed: z.number().positive(), ended: z.boolean(), completedChapterIds: z.array(z.string()), bookmarks: z.array(playbackBookmarkSchema), notes: z.array(playbackNoteSchema), lastWatchedAt: isoDateTime,
})
export const recordingChapterSchema = z.object({ id: z.string(), title: z.string(), startSeconds: z.number().nonnegative(), endSeconds: z.number().positive() })
export const transcriptSegmentSchema = z.object({ id: z.string(), startSeconds: z.number().nonnegative(), endSeconds: z.number().positive(), text: z.string() })
export const practiceQuestionSchema = z.object({ id: z.string(), prompt: z.string(), options: z.array(z.object({ key: z.string(), text: z.string() })).min(2), correctKey: z.string(), explanation: z.string() })
export const practiceQuizSchema = z.object({ id: z.string(), title: z.string(), questions: z.array(practiceQuestionSchema).length(3) })
export const quizResultSchema = z.object({ quizId: z.string(), score: z.number().int().nonnegative(), total: z.number().int().positive(), answers: z.record(z.string(), z.string()), correctQuestionIds: z.array(z.string()), submittedAt: isoDateTime })
export const recordingDetailSchema = recordingSchema.extend({
  subjectId: z.string(), batchName: z.string(), description: z.string(), mediaUrl: z.string(), captionsUrl: z.string(), posterUrl: z.string(), durationSeconds: z.number().positive(), publishedAt: isoDateTime,
  chapters: z.array(recordingChapterSchema), transcript: z.array(transcriptSegmentSchema), quiz: practiceQuizSchema, playback: playbackStateSchema, quizResult: quizResultSchema.nullable(),
})
export const doubtMessageSchema = z.object({ id: z.string(), author: z.string(), role: z.enum(['student', 'faculty']), body: z.string(), createdAt: isoDateTime })
export const doubtThreadDetailSchema = z.object({
  id: z.string(), title: z.string(), status: z.enum(['open', 'answered']), subjectName: z.string(), recordingId: z.string().nullable(), recordingTitle: z.string().nullable(),
  timeSeconds: z.number().nonnegative().nullable(), createdAt: isoDateTime, updatedAt: isoDateTime, messages: z.array(doubtMessageSchema),
})
export const studyParticipantSchema = z.object({ id: z.string(), name: z.string(), initials: z.string(), presence: z.enum(['studying', 'speaking', 'away']), isSelf: z.boolean() })
export const studyRoomDetailSchema = z.object({ id: z.string(), name: z.string(), mode: z.literal('interactive'), topic: z.string(), subjectName: z.string(), batchName: z.string(), peerCount: z.number().int().nonnegative(), capacity: z.number().int().positive(), focusMinutes: z.number().int().positive(), joined: z.boolean(), participants: z.array(studyParticipantSchema) })
export const learningEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chat'), message: chatMessageSchema }),
  z.object({ type: z.literal('presence'), attendance: liveAttendanceStateSchema }),
  z.object({ type: z.literal('attention-challenge'), challenge: attentionChallengeSchema }),
  z.object({ type: z.literal('attention-resolved'), checkId: z.string() }),
  z.object({ type: z.literal('question'), question: queueQuestionSchema }),
  z.object({ type: z.literal('room-presence'), room: studyRoomDetailSchema }),
])
