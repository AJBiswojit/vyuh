/**
 * People. One student per role fixture so each layout has something honest to
 * render, plus a roster for the faculty view in a later phase.
 *
 * @typedef {import('../contracts/user.js').User} User
 * @typedef {import('../contracts/user.js').Student} Student
 */

export const DEMO_PASSWORD = 'vyuh2026'
export const DEMO_OTP = '123456'
export const EXPIRED_DEMO_OTP = '000000'
export const DEMO_INSTITUTE_CODE = 'VYUH2026'
export const DEMO_INVITE_CODE = 'VYUH-FACULTY-2026'
export const LOCKED_DEMO_EMAIL = 'locked.student@vidyutacademy.in'
export const OFFLINE_DEMO_EMAIL = 'offline@vidyutacademy.in'


/**
 * The three seats offered on the sign-in screen in mock mode. One per role, so
 * the product can be judged from every chair without a password hunt.
 * @type {ReadonlyArray<{ email: string, role: import('../contracts/user.js').Role, label: string }>}
 */
export const DEMO_EMAILS = [
  { email: 'ananya.sahoo@vidyutacademy.in', role: 'student', label: 'Student · Ananya Sahoo' },
  { email: 'snehasish@vidyutacademy.in', role: 'faculty', label: 'Faculty · Dr. Snehasish Mohapatra' },
  { email: 'academic.office@vidyutacademy.in', role: 'admin', label: 'Admin · Pratibha Nayak' },
]

/** Public fixture credentials only. Never use these accounts for real data. */
export const demoScenarios = [
  { email: LOCKED_DEMO_EMAIL, label: 'Locked account', description: 'Preview the lockout message.' },
  { email: OFFLINE_DEMO_EMAIL, label: 'Network error', description: 'Preview a dropped connection without counting an attempt.' },
]

/** @type {Record<string, User>} */
export const users = {
  'stu-ananya': {
    id: 'stu-ananya',
    name: 'Ananya Sahoo',
    email: 'ananya.sahoo@vidyutacademy.in',
    role: 'student',
    initials: 'AS',
    phone: '+916742501181',
    joinedAt: '2025-06-09',
  },
  'fac-rituparna': {
    id: 'fac-rituparna', name: 'Rituparna Das', email: 'rituparna@vidyutacademy.in',
    role: 'faculty', initials: 'RD', joinedAt: '2026-11-07', instituteCode: DEMO_INSTITUTE_CODE,
  },
  'fac-snehasish': {
    id: 'fac-snehasish',
    name: 'Dr. Snehasish Mohapatra',
    email: 'snehasish@vidyutacademy.in',
    role: 'faculty',
    initials: 'SM',
    phone: '+916742501190',
    joinedAt: '2017-04-02',
  },
  'adm-pratibha': {
    id: 'adm-pratibha',
    name: 'Pratibha Nayak',
    email: 'academic.office@vidyutacademy.in',
    role: 'admin',
    initials: 'PN',
    phone: '+916742501180',
    joinedAt: '2014-11-18',
  },
}

/** @type {Student} */
export const currentStudent = {
  id: 'stu-ananya',
  name: 'Ananya Sahoo',
  rollNumber: 'VY-25-0187',
  initials: 'AS',
  batchId: 'bat-prayas-m',
  batchName: 'Prayas JEE 2027 — Morning',
  track: 'JEE',
  cohort: 'class11',
  avatarTone: 'glacier',
}

/** Sample batches offered during student signup. Archived batches are excluded. */
export const signupBatches = [
  { id: 'bat-prayas-m', name: 'Prayas JEE 2027 — Morning', track: 'JEE', scheduleLabel: 'Mon–Sat · 07:00–12:30' },
  { id: 'bat-aarambh-e', name: 'Aarambh JEE 2026 — Evening', track: 'JEE', scheduleLabel: 'Mon–Sat · 15:30–20:00' },
  { id: 'bat-shikhar', name: 'Shikhar Droppers — Full day', track: 'JEE', scheduleLabel: 'Mon–Sat · 09:00–17:00' },
  { id: 'bat-neet-12', name: 'Aarogyam NEET 2026 — Morning', track: 'NEET', scheduleLabel: 'Mon–Sat · 07:30–13:00' },
]

/** Invitation lookup fixtures. Acceptance is persisted by the mock service. */
export const facultyInvitations = [
  {
    code: DEMO_INVITE_CODE, userId: 'fac-rituparna', instituteName: 'Vidyut Academy',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
  {
    code: 'EXPIRED-INVITE', userId: 'fac-snehasish', instituteName: 'Vidyut Academy',
    expiresAt: Date.now() - 24 * 60 * 60 * 1000,
  },
]
