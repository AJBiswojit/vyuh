/**
 * Phase 8 fixtures: the institution as the academic office sees it — the people
 * on the platform, the attendance trend, the exam calendar, the alerts that need
 * a decision, the moderation queue and the shapes of the three reports.
 *
 * The roster is generated deterministically so that the dashboard's totals, the
 * per-batch member lists and the user table all count the same people. Nothing
 * here is random: the same build always produces the same 720 students.
 *
 * @typedef {import('../contracts/admin.js').AdminUser} AdminUser
 * @typedef {import('../contracts/admin.js').AttendanceTrendPoint} AttendanceTrendPoint
 * @typedef {import('../contracts/admin.js').CalendarExam} CalendarExam
 * @typedef {import('../contracts/admin.js').InstitutionAlert} InstitutionAlert
 * @typedef {import('../contracts/admin.js').ModerationItem} ModerationItem
 * @typedef {import('../contracts/admin.js').ReportDefinition} ReportDefinition
 */
import { adminBatches, facultyRoster } from './batchesAdmin.js'

/** The seat every office action is attributed to in the mock. */
export const ADMIN_ID = 'adm-pratibha'

export const adminProfile = {
  id: ADMIN_ID,
  name: 'Pratibha Nayak',
  initials: 'PN',
  email: 'academic.office@vidyutacademy.in',
  role: 'Academic office · Head of academics',
  office: 'Jaydev Vihar',
}

export const adminTerm = {
  label: '2026–27 · Session 2',
  centre: 'Jaydev Vihar campus',
  startsAt: '2026-06-01',
  endsAt: '2027-04-30',
  lastSyncedAt: '2026-11-07T08:40:00+05:30',
}

/** @type {Readonly<Record<'active'|'invited'|'suspended', string>>} */
export const userStatusLabels = { active: 'Active', invited: 'Invited', suspended: 'Suspended' }

/** @type {Readonly<Record<'student'|'faculty'|'admin', string>>} */
export const adminRoleLabels = { student: 'Student', faculty: 'Faculty', admin: 'Academic office' }

const firstNames = [
  'Ananya', 'Ayush', 'Bhavya', 'Chinmay', 'Debashish', 'Diksha', 'Esha', 'Gaurav', 'Harshita', 'Ishaan',
  'Jagannath', 'Kavya', 'Lipsa', 'Manas', 'Nandini', 'Omkar', 'Prateek', 'Ritika', 'Sambit', 'Trisha',
  'Udit', 'Varsha', 'Yash', 'Zoya', 'Aditya', 'Barsha', 'Chandan', 'Dyuti', 'Girish', 'Ipsita',
  'Krishna', 'Lopamudra', 'Mihir', 'Niharika', 'Piyush', 'Rakesh', 'Sagarika', 'Tejas', 'Vivek', 'Snigdha',
]

const lastNames = [
  'Sahoo', 'Mohapatra', 'Das', 'Patnaik', 'Behera', 'Pradhan', 'Nayak', 'Rout', 'Jena', 'Mohanty',
  'Swain', 'Panda', 'Acharya', 'Sethi', 'Padhi', 'Bhoi', 'Sahu', 'Mahapatra', 'Mishra', 'Rath',
  'Mallick', 'Pattanaik', 'Biswal', 'Choudhury', 'Dalai', 'Giri', 'Hota', 'Kar', 'Lenka', 'Muduli',
]

/** @param {number} index */
function nameAt(index) {
  const first = firstNames[index % firstNames.length]
  const last = lastNames[Math.floor(index / firstNames.length + index) % lastNames.length]
  return { first, last, name: `${first} ${last}`, initials: `${first[0]}${last[0]}`.toUpperCase() }
}

/** @param {number} index @returns {'active'|'invited'|'suspended'} */
function statusAt(index) {
  if (index % 29 === 0) return 'suspended'
  if (index % 17 === 0) return 'invited'
  return 'active'
}

/** @param {number} index */
function joinedAt(index) {
  const month = String((index % 12) + 1).padStart(2, '0')
  const day = String((index % 27) + 1).padStart(2, '0')
  const year = index % 4 === 0 ? '2025' : '2026'
  return `${year}-${month}-${day}`
}

/** @param {number} index */
function lastActiveAt(index, status) {
  if (status === 'invited') return null
  if (status === 'suspended') return '2026-10-12T11:20:00+05:30'
  const day = String((index % 6) + 1).padStart(2, '0')
  return `2026-11-${day}T${String(8 + (index % 10)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00+05:30`
}

/**
 * Students, distributed across the batches in fixture order so that each
 * batch's `studentCount` is exactly how many rows carry its id.
 * @type {AdminUser[]}
 */
const studentUsers = []
let studentIndex = 0
for (const batch of adminBatches) {
  for (let position = 0; position < batch.studentCount; position += 1) {
    const { first, last, name, initials } = nameAt(studentIndex * 3 + position)
    const status = statusAt(studentIndex)
    const serial = String(1000 + studentIndex)
    const isFirst = studentIndex === 0
    studentUsers.push({
      id: isFirst ? 'stu-ananya' : `stu-${String(studentIndex + 1).padStart(4, '0')}`,
      name: isFirst ? 'Ananya Sahoo' : name,
      initials: isFirst ? 'AS' : initials,
      email: isFirst
        ? 'ananya.sahoo@vidyutacademy.in'
        : `${first.toLowerCase()}.${last.toLowerCase()}${studentIndex + 1}@vidyutacademy.in`,
      phone: `+9167${String(42500000 + studentIndex * 37).slice(0, 8)}`,
      role: 'student',
      status,
      batchId: batch.id,
      batchName: batch.name,
      rollNumber: isFirst ? 'VY-25-0187' : `VY-${studentIndex % 3 === 0 ? '26' : '25'}-${serial}`,
      joinedAt: isFirst ? '2025-06-09' : joinedAt(studentIndex),
      lastActiveAt: lastActiveAt(studentIndex, status),
    })
    studentIndex += 1
  }
}

/** @type {AdminUser[]} */
const facultyUsers = facultyRoster.map((faculty) => ({
  id: faculty.id,
  name: faculty.name,
  initials: faculty.initials,
  email: faculty.email,
  phone: '+916742501190',
  role: 'faculty',
  status: 'active',
  batchId: null,
  batchName: null,
  rollNumber: null,
  joinedAt: faculty.joinedAt,
  lastActiveAt: '2026-11-07T07:55:00+05:30',
}))

/** @type {AdminUser[]} */
const officeUsers = [
  {
    id: 'adm-pratibha', name: 'Pratibha Nayak', initials: 'PN', email: 'academic.office@vidyutacademy.in',
    phone: '+916742501180', role: 'admin', status: 'active', batchId: null, batchName: null,
    rollNumber: null, joinedAt: '2014-11-18', lastActiveAt: '2026-11-07T08:52:00+05:30',
  },
  {
    id: 'adm-bikash', name: 'Bikash Mohapatra', initials: 'BM', email: 'exams.office@vidyutacademy.in',
    phone: '+916742501182', role: 'admin', status: 'active', batchId: null, batchName: null,
    rollNumber: null, joinedAt: '2019-03-04', lastActiveAt: '2026-11-06T18:30:00+05:30',
  },
  {
    id: 'adm-lopamudra', name: 'Lopamudra Biswal', initials: 'LB', email: 'compliance@vidyutacademy.in',
    phone: '+916742501184', role: 'admin', status: 'active', batchId: null, batchName: null,
    rollNumber: null, joinedAt: '2021-09-27', lastActiveAt: '2026-11-07T08:12:00+05:30',
  },
]

/** Every account the office can manage. @type {AdminUser[]} */
export const adminUsers = [...studentUsers, ...facultyUsers, ...officeUsers]

/** Total active batches — used by the dashboard and by policy impact. */
export const activeBatches = adminBatches.filter((batch) => batch.status === 'active')

/**
 * Attendance by week for the chart. `percent` is the share of present marks out
 * of the possible marks in that week's sessions.
 * @type {AttendanceTrendPoint[]}
 */
export const attendanceTrend = [
  { label: '17 Aug', weekStart: '2026-08-17', percent: 83.4, sessions: 38, present: 21640, possible: 25940 },
  { label: '24 Aug', weekStart: '2026-08-24', percent: 84.9, sessions: 41, present: 23810, possible: 28045 },
  { label: '31 Aug', weekStart: '2026-08-31', percent: 85.6, sessions: 40, present: 23290, possible: 27208 },
  { label: '07 Sep', weekStart: '2026-09-07', percent: 86.1, sessions: 42, present: 24780, possible: 28781 },
  { label: '14 Sep', weekStart: '2026-09-14', percent: 84.7, sessions: 39, present: 22410, possible: 26458 },
  { label: '21 Sep', weekStart: '2026-09-21', percent: 87.2, sessions: 43, present: 25890, possible: 29690 },
  { label: '28 Sep', weekStart: '2026-09-28', percent: 88.4, sessions: 41, present: 25020, possible: 28303 },
  { label: '05 Oct', weekStart: '2026-10-05', percent: 87.6, sessions: 40, present: 24110, possible: 27523 },
  { label: '12 Oct', weekStart: '2026-10-12', percent: 86.9, sessions: 38, present: 22640, possible: 26053 },
  { label: '19 Oct', weekStart: '2026-10-19', percent: 88.1, sessions: 42, present: 25480, possible: 28922 },
  { label: '26 Oct', weekStart: '2026-10-26', percent: 89.3, sessions: 43, present: 26210, possible: 29350 },
  { label: '02 Nov', weekStart: '2026-11-02', percent: 89.8, sessions: 41, present: 25190, possible: 28051 },
]

/** @type {Readonly<Record<'scheduled'|'live'|'awaiting'|'completed', string>>} */
export const calendarStatusLabels = {
  scheduled: 'Scheduled',
  live: 'Live now',
  awaiting: 'Awaiting approval',
  completed: 'Completed',
}

/** @type {CalendarExam[]} */
export const adminExamCalendar = [
  { id: 'cal-01', examId: 'exam-neet-mock-07', title: 'NEET Mock 07 — Full syllabus', date: '2026-11-07T09:00:00+05:30', batchIds: ['bat-neet-12'], batchNames: ['Aarogyam NEET 2026 — Morning'], subject: 'Physics · Chemistry · Biology', status: 'live', room: 'Hall D' },
  { id: 'cal-02', examId: 'exam-jee-main-11', title: 'JEE Main 11 — Full syllabus', date: '2026-11-09T09:00:00+05:30', batchIds: ['bat-prayas-m'], batchNames: ['Prayas JEE 2027 — Morning'], subject: 'Physics · Chemistry · Mathematics', status: 'awaiting', room: 'Hall A' },
  { id: 'cal-03', examId: 'exam-neet-mock-09', title: 'NEET Mock 09 — Biology focus', date: '2026-11-10T09:30:00+05:30', batchIds: ['bat-neet-12', 'bat-neet-13'], batchNames: ['Aarogyam NEET 2026 — Morning', 'Aarogyam NEET 2027 — Afternoon'], subject: 'Biology', status: 'awaiting', room: 'Hall D' },
  { id: 'cal-04', examId: 'exam-jee-adv-04', title: 'JEE Advanced 04 — Paper 1', date: '2026-11-11T14:00:00+05:30', batchIds: ['bat-aarambh-e'], batchNames: ['Aarambh JEE 2026 — Evening'], subject: 'Physics · Chemistry · Mathematics', status: 'scheduled', room: 'Hall B' },
  { id: 'cal-05', examId: 'exam-shikhar-22', title: 'Shikhar Weekly 22 — Mechanics', date: '2026-11-12T10:00:00+05:30', batchIds: ['bat-shikhar'], batchNames: ['Shikhar Droppers — Full day'], subject: 'Physics', status: 'scheduled', room: 'Hall C' },
  { id: 'cal-06', examId: 'exam-neet-13-03', title: 'Aarogyam 13 Unit Test 03 — Cell biology', date: '2026-11-13T13:30:00+05:30', batchIds: ['bat-neet-13'], batchNames: ['Aarogyam NEET 2027 — Afternoon'], subject: 'Biology', status: 'scheduled', room: 'Hall E' },
  { id: 'cal-07', examId: 'exam-prayas-18', title: 'Prayas Unit Test 18 — Organic chemistry', date: '2026-11-14T07:30:00+05:30', batchIds: ['bat-prayas-m'], batchNames: ['Prayas JEE 2027 — Morning'], subject: 'Chemistry', status: 'scheduled', room: 'Hall A' },
  { id: 'cal-08', examId: 'exam-jee-main-10', title: 'JEE Main 10 — Full syllabus', date: '2026-11-04T09:00:00+05:30', batchIds: ['bat-aarambh-e'], batchNames: ['Aarambh JEE 2026 — Evening'], subject: 'Physics · Chemistry · Mathematics', status: 'completed', room: 'Hall B' },
]

/**
 * Alerts are the office's to-do list. Each one names the thing, says why it is
 * on the list now, and links to the screen that resolves it.
 * @type {InstitutionAlert[]}
 */
export const adminAlerts = [
  {
    id: 'alert-01',
    tone: 'danger',
    title: '14 candidates flagged in NEET Mock 06',
    detail: 'Proctoring recorded repeated window switches. Decisions are pending on three of them.',
    at: '2026-11-06T19:05:00+05:30',
    action: { label: 'Open integrity reports', to: '/admin/integrity' },
  },
  {
    id: 'alert-02',
    tone: 'review',
    title: 'Two papers are waiting for approval',
    detail: 'JEE Main 11 sits on Monday. A paper without approval cannot be scheduled.',
    at: '2026-11-06T17:20:00+05:30',
    action: { label: 'Open the approval queue', to: '/admin/approvals' },
  },
  {
    id: 'alert-03',
    tone: 'review',
    title: 'Aarambh JEE 2026 attendance fell to 84.1% last week',
    detail: 'Below the 85% early-warning line. 23 students missed both weekly tests.',
    at: '2026-11-05T09:00:00+05:30',
    action: { label: 'Open attendance report', to: '/admin/reports' },
  },
  {
    id: 'alert-04',
    tone: 'info',
    title: 'Consent version 2026-2 is pending for 41 parents',
    detail: 'The version was published on 1 November. Imported accounts inherit it on first sign-in.',
    at: '2026-11-04T11:30:00+05:30',
    action: { label: 'Review policies', to: '/admin/policies' },
  },
  {
    id: 'alert-05',
    tone: 'info',
    title: 'Six accounts were imported from the office sheet',
    detail: 'Imported on 3 November by the academic office. Two invitations are still unaccepted.',
    at: '2026-11-03T15:12:00+05:30',
    action: { label: 'Open user management', to: '/admin/users' },
  },
]

/** @type {Readonly<Record<ModerationItem['kind'], string>>} */
export const moderationKindLabels = { doubt: 'Doubt', chat: 'Chat message' }

/** @type {Readonly<Record<ModerationItem['status'], string>>} */
export const moderationStatusLabels = {
  open: 'Awaiting review',
  removed: 'Content removed',
  dismissed: 'Dismissed',
  warned: 'Author warned',
}

/** @type {ModerationItem[]} */
export const moderationQueue = [
  {
    id: 'mod-01', kind: 'chat', reporterName: 'Nandini Pradhan', reporterRole: 'student',
    authorId: 'stu-0031', authorName: 'Rakesh Dalai', batchName: 'Aarambh JEE 2026 — Evening',
    reason: 'Abusive language', excerpt: 'This faculty cannot teach. Waste of my father’s money, honestly.',
    reportedAt: '2026-11-06T20:14:00+05:30', flags: 4, status: 'open', note: null, decidedAt: null,
  },
  {
    id: 'mod-02', kind: 'doubt', reporterName: 'Sambit Nayak', reporterRole: 'student',
    authorId: 'stu-0044', authorName: 'Kavya Jena', batchName: 'Prayas JEE 2027 — Morning',
    reason: 'Answer key spoiler', excerpt: 'The answer is option C for the whole set — check my screenshot, I marked it already.',
    reportedAt: '2026-11-06T16:42:00+05:30', flags: 2, status: 'open', note: null, decidedAt: null,
  },
  {
    id: 'mod-03', kind: 'chat', reporterName: 'Ipsita Padhi', reporterRole: 'faculty',
    authorId: 'stu-0108', authorName: 'Aditya Bhoi', batchName: 'Shikhar Droppers — Full day',
    reason: 'Off-topic spam', excerpt: 'Join my Telegram for leaked papers, first 50 free.',
    reportedAt: '2026-11-06T12:08:00+05:30', flags: 7, status: 'open', note: null, decidedAt: null,
  },
  {
    id: 'mod-04', kind: 'doubt', reporterName: 'Manas Panda', reporterRole: 'student',
    authorId: 'stu-0212', authorName: 'Trisha Acharya', batchName: 'Aarogyam NEET 2026 — Morning',
    reason: 'Personal attack', excerpt: 'If you cannot solve this, you should not be teaching NEET biology at all.',
    reportedAt: '2026-11-05T18:55:00+05:30', flags: 3, status: 'open', note: null, decidedAt: null,
  },
  {
    id: 'mod-05', kind: 'chat', reporterName: 'Harshita Sethi', reporterRole: 'student',
    authorId: 'stu-0311', authorName: 'Piyush Hota', batchName: 'Aarogyam NEET 2027 — Afternoon',
    reason: 'Exam rules', excerpt: 'Can we share the paper after the sitting? I have the PDF of Mock 09 already.',
    reportedAt: '2026-11-04T10:20:00+05:30', flags: 1, status: 'open', note: null, decidedAt: null,
  },
  {
    id: 'mod-06', kind: 'chat', reporterName: 'Snehasish Mohapatra', reporterRole: 'faculty',
    authorId: 'stu-0450', authorName: 'Gaurav Kar', batchName: 'Prayas JEE 2027 — Morning',
    reason: 'Abusive language', excerpt: 'Recordings are useless. Faculty does not know rotational motion.',
    reportedAt: '2026-11-03T19:44:00+05:30', flags: 5, status: 'dismissed',
    note: 'Reviewed with the batch mentor; the complaint is about teaching pace, not abuse.', decidedAt: '2026-11-04T09:12:00+05:30',
  },
  {
    id: 'mod-07', kind: 'doubt', reporterName: 'Rituparna Das', reporterRole: 'faculty',
    authorId: 'stu-0502', authorName: 'Varsha Giri', batchName: 'Aarambh JEE 2026 — Evening',
    reason: 'Answer key spoiler', excerpt: 'Answer leaked in the doubt thread before the paper closed.',
    reportedAt: '2026-11-02T15:02:00+05:30', flags: 6, status: 'removed',
    note: 'Removed within four minutes of report; the paper was still live.', decidedAt: '2026-11-02T15:06:00+05:30',
  },
  {
    id: 'mod-08', kind: 'chat', reporterName: 'Pooja Rath', reporterRole: 'faculty',
    authorId: 'stu-0577', authorName: 'Tejas Muduli', batchName: 'Shikhar Droppers — Full day',
    reason: 'Off-topic spam', excerpt: 'Selling my test series, DM for price.',
    reportedAt: '2026-11-01T11:40:00+05:30', flags: 2, status: 'warned',
    note: 'Author warned; the message stayed because it names no product.', decidedAt: '2026-11-01T16:20:00+05:30',
  },
]

/**
 * Report definitions. `build` is applied in the service, so the columns and the
 * rows always describe the same report.
 * @type {ReportDefinition[]}
 */
export const reportDefinitions = [
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'One row per batch: sessions held, present marks, percentage and defaulters against the policy threshold.',
    columns: [
      { key: 'batch', label: 'Batch' },
      { key: 'students', label: 'Students', align: 'right' },
      { key: 'sessions', label: 'Sessions', align: 'right' },
      { key: 'present', label: 'Present marks', align: 'right' },
      { key: 'percent', label: 'Attendance %', align: 'right' },
      { key: 'defaulters', label: 'Defaulters', align: 'right' },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    description: 'One row per paper sat in the range: candidates, mean score, highest, lowest and the pass share.',
    columns: [
      { key: 'paper', label: 'Paper' },
      { key: 'batch', label: 'Batch' },
      { key: 'satAt', label: 'Sat on' },
      { key: 'candidates', label: 'Candidates', align: 'right' },
      { key: 'mean', label: 'Mean', align: 'right' },
      { key: 'highest', label: 'Highest', align: 'right' },
      { key: 'passShare', label: 'Above 40%', align: 'right' },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    description: 'One row per batch: active accounts in the range, doubts asked, recordings watched and live-class minutes.',
    columns: [
      { key: 'batch', label: 'Batch' },
      { key: 'activeAccounts', label: 'Active accounts', align: 'right' },
      { key: 'doubts', label: 'Doubts asked', align: 'right' },
      { key: 'recordingHours', label: 'Recording hours', align: 'right' },
      { key: 'liveMinutes', label: 'Live minutes', align: 'right' },
      { key: 'attentionAverage', label: 'Attention avg', align: 'right' },
    ],
  },
]

/** @type {ReadonlyArray<{ value: string, label: string, available: boolean, note: string }>} */
export const reportFormats = [
  { value: 'csv', label: 'CSV', available: true, note: 'Comma separated, UTF-8 with a header row.' },
  { value: 'xlsx', label: 'XLSX', available: false, note: 'Not produced by the mock. The request is recorded; the file is CSV.' },
  { value: 'pdf', label: 'PDF', available: false, note: 'Not produced by the mock. The request is recorded; the file is CSV.' },
]

export const reportRange = { from: '2026-10-10', to: '2026-11-07' }

/** Branding and settings defaults. The colour system is deliberately absent. */
export const brandingDefaults = {
  instituteName: 'Vidyut Academy',
  shortName: 'Vidyut',
  tagline: 'Exam preparation, precisely.',
  logoFileName: null,
  logoMark: 'VA',
  logoUpdatedAt: null,
  colourSystem: 'locked',
}

/** @type {ReadonlyArray<{ name: string, token: string, usage: string }>} */
export const lockedColourSystem = [
  { name: 'Paper', token: 'paper', usage: 'The page itself. Warm off-white, never pure white.' },
  { name: 'Ink', token: 'ink', usage: 'Structure and type. Deep blue-black, never pure black.' },
  { name: 'Ember', token: 'ember', usage: 'The one accent. Actions and emphasis, never decoration.' },
]
