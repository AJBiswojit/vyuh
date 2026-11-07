/**
 * The composed payload the student home renders. Services assemble this from
 * the other fixtures; pages never fan out to four endpoints.
 *
 * @typedef {import('../contracts/dashboard.js').Announcement} Announcement
 * @typedef {import('../contracts/dashboard.js').ContinueItem} ContinueItem
 */

/** @type {Announcement[]} */
export const announcements = [
  {
    id: 'ann-1',
    title: 'Mock 04 timing moved to 09:00',
    body: 'Saturday’s full-syllabus mock now starts at 09:00 instead of 08:30 to avoid a clash with the Odisha state power shutdown. Reporting time is 08:45 at the Jaydev Vihar centre.',
    publishedAt: '2026-11-06T17:40:00+05:30',
    scope: 'institute',
    author: 'Academic office',
  },
  {
    id: 'ann-2',
    title: 'Rotational Motion test stays open until 21:00',
    body: 'The chapter test you began this morning can be resumed until 21:00 today. Marks are provisional until the window closes.',
    publishedAt: '2026-11-07T07:10:00+05:30',
    scope: 'batch',
    author: 'Dr. Snehasish Mohapatra',
  },
  {
    id: 'ann-3',
    title: 'Doubt-clearing hours added on Sunday',
    body: 'Mathematics doubt clearing runs 10:00–12:00 every Sunday from this week. Bring attempted problem sets, not blank pages.',
    publishedAt: '2026-11-04T12:00:00+05:30',
    scope: 'faculty',
    author: 'Anirban Patnaik',
  },
]

/** @type {ContinueItem} */
export const resumeItem = {
  kind: 'test',
  id: 'att-rot-inflight',
  title: 'Rotational Motion — chapter test',
  meta: 'Resumes in 41 min · 12 of 20 answered',
  progress: 60,
}
