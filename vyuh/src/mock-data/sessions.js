/**
 * Live classes for the current week.
 * @typedef {import('../contracts/live.js').LiveSession} LiveSession
 */

/** @type {LiveSession[]} */
export const liveSessions = [
  {
    id: 'ses-rot-b',
    title: 'Rotational Dynamics — problem set B',
    subjectId: 'sub-phy',
    subjectName: 'Physics',
    facultyName: 'Dr. Snehasish Mohapatra',
    status: 'live',
    startsAt: '2026-11-07T09:30:00+05:30',
    durationMinutes: 75,
    attendingCount: 132,
    capacity: 148,
    joinUrl: 'https://live.vidyutacademy.in/rot-b',
    resourcesAttached: true,
  },
  {
    id: 'ses-org-m',
    title: 'Organic mechanisms — reaction maps',
    subjectId: 'sub-che',
    subjectName: 'Chemistry',
    facultyName: 'Rituparna Das',
    status: 'scheduled',
    startsAt: '2026-11-07T11:15:00+05:30',
    durationMinutes: 60,
    attendingCount: 0,
    capacity: 148,
    joinUrl: 'https://live.vidyutacademy.in/org-m',
    resourcesAttached: true,
  },
  {
    id: 'ses-int-c',
    title: 'Definite integrals — substitution drills',
    subjectId: 'sub-mat',
    subjectName: 'Mathematics',
    facultyName: 'Anirban Patnaik',
    status: 'scheduled',
    startsAt: '2026-11-08T16:00:00+05:30',
    durationMinutes: 90,
    attendingCount: 0,
    capacity: 148,
    joinUrl: 'https://live.vidyutacademy.in/int-c',
    resourcesAttached: false,
  },
  {
    id: 'ses-elec-r',
    title: 'Electrostatics — revision, week 19',
    subjectId: 'sub-phy',
    subjectName: 'Physics',
    facultyName: 'Dr. Snehasish Mohapatra',
    status: 'ended',
    startsAt: '2026-11-05T09:30:00+05:30',
    durationMinutes: 75,
    attendingCount: 141,
    capacity: 148,
    joinUrl: 'https://live.vidyutacademy.in/elec-r',
    resourcesAttached: true,
  },
]

/** Seven-day study log: minutes against the student's daily target. */
export const studyLog = [
  { day: 'Mon', minutes: 268, target: 240 },
  { day: 'Tue', minutes: 225, target: 240 },
  { day: 'Wed', minutes: 302, target: 240 },
  { day: 'Thu', minutes: 184, target: 240 },
  { day: 'Fri', minutes: 246, target: 240 },
  { day: 'Sat', minutes: 312, target: 240 },
  { day: 'Sun', minutes: 96, target: 120 },
]
