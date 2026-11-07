/**
 * Zod schemas for every payload the API implementation accepts.
 *
 * Validation lives here and nowhere else: if a response fails a schema we throw
 * a ServiceError that names the endpoint, so a malformed payload surfaces as a
 * handled error state instead of a component blowing up three renders later.
 */
import { z } from 'zod'

const isoDate = z.string().min(1)
const isoDateTime = z.string().min(1)

export const roleSchema = z.enum(['student', 'faculty', 'admin'])
export const trackSchema = z.enum(['JEE', 'NEET', 'NTA'])
export const cohortSchema = z.enum(['class11', 'class12', 'dropper'])

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  initials: z.string().length(2),
  phone: z.string().optional(),
  joinedAt: isoDate,
})

export const authSessionSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
  expiresInSeconds: z.number().int().positive(),
})

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
  nextTest: testSchema.nullable(),
  liveNow: z.array(liveSessionSchema),
  lastReport: scoreReportSchema.nullable(),
  trend: z.array(trendPointSchema),
  resume: continueItemSchema.nullable(),
  announcements: z.array(announcementSchema),
  streakDays: z.number().int().nonnegative(),
  weeklyGoalPercent: z.number().min(0).max(100),
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

export const credentialsSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(1),
})
