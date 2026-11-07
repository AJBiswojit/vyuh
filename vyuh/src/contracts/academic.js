/**
 * Academic structure: subjects, chapters, batches.
 *
 * @typedef {Object} Subject
 * @property {import('./ids.js').SubjectId} id
 * @property {string} name                  'Physics', 'Chemistry', 'Mathematics', 'Biology'.
 * @property {string} shortName             'PHY', 'CHE', 'MAT', 'BIO'.
 * @property {import('./user.js').Track} track
 * @property {number} chapterCount
 * @property {number} questionCount         Questions in the bank for this subject.
 *
 * @typedef {Object} Chapter
 * @property {import('./ids.js').ChapterId} id
 * @property {import('./ids.js').SubjectId} subjectId
 * @property {string} name
 * @property {number} weightage             Percent of the paper historically.
 * @property {number} mastery               0-100, student-scoped when returned by progress.
 *
 * @typedef {Object} Batch
 * @property {import('./ids.js').BatchId} id
 * @property {string} name                  'Prayas JEE 2027 — Morning'.
 * @property {import('./user.js').Track} track
 * @property {'class11'|'class12'|'dropper'} cohort
 * @property {number} studentCount
 * @property {string} facultyLead
 * @property {string} scheduleLabel         'Mon–Sat · 07:00–12:30'.
 * @property {import('./ids.js').SubjectId[]} subjectIds
 * @property {number} testCount             Tests scheduled this term.
 * @property {'active'|'archived'} status
 */

export {};
