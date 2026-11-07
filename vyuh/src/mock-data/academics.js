/**
 * Subjects, chapters and batches.
 * @typedef {import('../contracts/academic.js').Subject} Subject
 * @typedef {import('../contracts/academic.js').Chapter} Chapter
 * @typedef {import('../contracts/academic.js').Batch} Batch
 */

/** @type {Subject[]} */
export const subjects = [
  { id: 'sub-phy', name: 'Physics', shortName: 'PHY', track: 'JEE', chapterCount: 29, questionCount: 8460 },
  { id: 'sub-che', name: 'Chemistry', shortName: 'CHE', track: 'JEE', chapterCount: 30, questionCount: 7925 },
  { id: 'sub-mat', name: 'Mathematics', shortName: 'MAT', track: 'JEE', chapterCount: 27, questionCount: 9130 },
  { id: 'sub-bio', name: 'Biology', shortName: 'BIO', track: 'NEET', chapterCount: 38, questionCount: 11480 },
]

/** @type {Chapter[]} */
export const chapters = [
  { id: 'ch-rot', subjectId: 'sub-phy', name: 'Rotational Motion', weightage: 6.4, mastery: 42 },
  { id: 'ch-elec', subjectId: 'sub-phy', name: 'Electrostatics', weightage: 7.1, mastery: 58 },
  { id: 'ch-opt', subjectId: 'sub-phy', name: 'Ray Optics', weightage: 5.2, mastery: 71 },
  { id: 'ch-thermo', subjectId: 'sub-phy', name: 'Thermodynamics', weightage: 5.8, mastery: 36 },
  { id: 'ch-bond', subjectId: 'sub-che', name: 'Chemical Bonding', weightage: 6.0, mastery: 64 },
  { id: 'ch-org', subjectId: 'sub-che', name: 'Organic Reaction Mechanisms', weightage: 8.5, mastery: 31 },
  { id: 'ch-eq', subjectId: 'sub-che', name: 'Equilibrium', weightage: 5.0, mastery: 55 },
  { id: 'ch-calc', subjectId: 'sub-mat', name: 'Definite Integrals', weightage: 6.7, mastery: 47 },
  { id: 'ch-prob', subjectId: 'sub-mat', name: 'Probability', weightage: 5.4, mastery: 62 },
  { id: 'ch-vec', subjectId: 'sub-mat', name: 'Vectors & 3D geometry', weightage: 7.0, mastery: 39 },
]

/** @type {Batch[]} */
export const batches = [
  {
    id: 'bat-prayas-m',
    name: 'Prayas JEE 2027 — Morning',
    track: 'JEE',
    cohort: 'class11',
    studentCount: 148,
    facultyLead: 'Dr. Snehasish Mohapatra',
    scheduleLabel: 'Mon–Sat · 07:00–12:30',
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    testCount: 34,
    status: 'active',
  },
  {
    id: 'bat-aarambh-e',
    name: 'Aarambh JEE 2026 — Evening',
    track: 'JEE',
    cohort: 'class12',
    studentCount: 162,
    facultyLead: 'Rituparna Das',
    scheduleLabel: 'Mon–Sat · 15:30–20:00',
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    testCount: 41,
    status: 'active',
  },
  {
    id: 'bat-shikhar',
    name: 'Shikhar Droppers — Full day',
    track: 'JEE',
    cohort: 'dropper',
    studentCount: 96,
    facultyLead: 'Anirban Patnaik',
    scheduleLabel: 'Mon–Sat · 09:00–17:00',
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    testCount: 52,
    status: 'active',
  },
  {
    id: 'bat-neet-12',
    name: 'Aarogyam NEET 2026 — Morning',
    track: 'NEET',
    cohort: 'class12',
    studentCount: 134,
    facultyLead: 'Dr. Madhusmita Behera',
    scheduleLabel: 'Mon–Sat · 07:30–13:00',
    subjectIds: ['sub-phy', 'sub-che', 'sub-bio'],
    testCount: 38,
    status: 'active',
  },
  {
    id: 'bat-found-10',
    name: 'NTA Foundation — Class 10',
    track: 'NTA',
    cohort: 'class11',
    studentCount: 88,
    facultyLead: 'Sourav Mishra',
    scheduleLabel: 'Sat–Sun · 08:00–12:00',
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat', 'sub-bio'],
    testCount: 12,
    status: 'archived',
  },
]
