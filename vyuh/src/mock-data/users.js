/**
 * People. One student per role fixture so each layout has something honest to
 * render, plus a roster for the faculty view in a later phase.
 *
 * @typedef {import('../contracts/user.js').User} User
 * @typedef {import('../contracts/user.js').Student} Student
 */

export const DEMO_PASSWORD = 'vyuh2026'

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
