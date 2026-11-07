/**
 * Phase 8 fixtures: the office's view of batches and the faculty roster that can
 * be assigned to them.
 *
 * These are deliberately separate records from `batches.js`: a student sees
 * "my batch" as a timetable, the office sees it as a roster, a room, a set of
 * subject commitments and a faculty allocation. Same ids, different question.
 *
 * @typedef {import('../contracts/admin.js').AdminBatch} AdminBatch
 * @typedef {import('../contracts/admin.js').RosterFaculty} RosterFaculty
 */

/** @type {Readonly<Record<'active'|'archived', string>>} */
export const batchStatusLabels = { active: 'Active', archived: 'Archived' }

/** @type {ReadonlyArray<{ value: 'JEE'|'NEET'|'NTA', label: string }>} */
export const batchTracks = [
  { value: 'JEE', label: 'JEE' },
  { value: 'NEET', label: 'NEET' },
  { value: 'NTA', label: 'Foundation' },
]

/** @type {Readonly<Record<'class11'|'class12'|'dropper', string>>} */
export const cohortLabels = { class11: 'Class 11', class12: 'Class 12', dropper: 'Dropper' }

/**
 * Faculty who can be assigned. `subjectIds` drives the "who teaches what this
 * batch needs" hint on the assignment panel; `designation` is what the office
 * calls them on a circular.
 * @type {RosterFaculty[]}
 */
export const facultyRoster = [
  { id: 'fac-snehasish', name: 'Dr. Snehasish Mohapatra', initials: 'SM', email: 'snehasish@vidyutacademy.in', subjectIds: ['sub-phy'], designation: 'Lead faculty · Physics', joinedAt: '2017-04-02', batchesTaught: 3, status: 'active' },
  { id: 'fac-rituparna', name: 'Rituparna Das', initials: 'RD', email: 'rituparna@vidyutacademy.in', subjectIds: ['sub-mat'], designation: 'Lead faculty · Mathematics', joinedAt: '2019-06-17', batchesTaught: 3, status: 'active' },
  { id: 'fac-madhusmita', name: 'Dr. Madhusmita Behera', initials: 'MB', email: 'madhusmita@vidyutacademy.in', subjectIds: ['sub-bio'], designation: 'Lead faculty · Biology', joinedAt: '2016-01-11', batchesTaught: 2, status: 'active' },
  { id: 'fac-anirban', name: 'Anirban Patnaik', initials: 'AP', email: 'anirban@vidyutacademy.in', subjectIds: ['sub-che'], designation: 'Lead faculty · Chemistry', joinedAt: '2018-07-23', batchesTaught: 2, status: 'active' },
  { id: 'fac-sourav', name: 'Sourav Mishra', initials: 'SM', email: 'sourav@vidyutacademy.in', subjectIds: ['sub-phy', 'sub-mat'], designation: 'Faculty · Physics & Mathematics', joinedAt: '2020-02-03', batchesTaught: 2, status: 'active' },
  { id: 'fac-pooja', name: 'Pooja Rath', initials: 'PR', email: 'pooja@vidyutacademy.in', subjectIds: ['sub-bio', 'sub-che'], designation: 'Faculty · Biology', joinedAt: '2021-05-19', batchesTaught: 1, status: 'active' },
  { id: 'fac-debasish', name: 'Debasish Nayak', initials: 'DN', email: 'debasish@vidyutacademy.in', subjectIds: ['sub-che'], designation: 'Faculty · Chemistry', joinedAt: '2022-08-01', batchesTaught: 1, status: 'active' },
  { id: 'fac-kalpana', name: 'Kalpana Sahu', initials: 'KS', email: 'kalpana@vidyutacademy.in', subjectIds: ['sub-mat'], designation: 'Faculty · Mathematics', joinedAt: '2023-04-10', batchesTaught: 1, status: 'active' },
]

const extraFaculty = [
  { name: 'Subrata Panda', subjects: ['sub-phy'], designation: 'Faculty · Physics' },
  { name: 'Ipsita Mohanty', subjects: ['sub-che'], designation: 'Faculty · Chemistry' },
  { name: 'Ranjan Behera', subjects: ['sub-mat'], designation: 'Faculty · Mathematics' },
  { name: 'Smita Patra', subjects: ['sub-bio'], designation: 'Faculty · Biology' },
  { name: 'Ayush Jena', subjects: ['sub-phy', 'sub-che'], designation: 'Visiting faculty' },
  { name: 'Namrata Das', subjects: ['sub-mat'], designation: 'Faculty · Mathematics' },
  { name: 'Bikash Rout', subjects: ['sub-bio'], designation: 'Faculty · Biology' },
  { name: 'Sasmita Pradhan', subjects: ['sub-che'], designation: 'Faculty · Chemistry' },
  { name: 'Tanmay Acharya', subjects: ['sub-phy'], designation: 'Faculty · Physics' },
  { name: 'Rashmi Nayak', subjects: ['sub-mat', 'sub-phy'], designation: 'Visiting faculty' },
  { name: 'Prasant Sahoo', subjects: ['sub-che'], designation: 'Faculty · Chemistry' },
  { name: 'Mitali Bhoi', subjects: ['sub-bio'], designation: 'Faculty · Biology' },
  { name: 'Dinesh Swain', subjects: ['sub-phy'], designation: 'Faculty · Physics' },
  { name: 'Ankita Mallick', subjects: ['sub-mat'], designation: 'Faculty · Mathematics' },
  { name: 'Soumya Ranjan Das', subjects: ['sub-che', 'sub-bio'], designation: 'Visiting faculty' },
  { name: 'Lopamudra Sethi', subjects: ['sub-bio'], designation: 'Faculty · Biology' },
  { name: 'Himanshu Padhi', subjects: ['sub-phy'], designation: 'Faculty · Physics' },
  { name: 'Chinmayee Rout', subjects: ['sub-mat'], designation: 'Faculty · Mathematics' },
]

extraFaculty.forEach((entry, index) => {
  const [first, ...rest] = entry.name.split(' ')
  const last = rest[rest.length - 1]
  const initials = `${first[0]}${last[0]}`.toUpperCase()
  facultyRoster.push({
    id: `fac-gen-${String(index + 1).padStart(2, '0')}`,
    name: entry.name,
    initials,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@vidyutacademy.in`,
    subjectIds: entry.subjects,
    designation: entry.designation,
    joinedAt: `20${20 + (index % 6)}-0${(index % 9) + 1}-1${index % 9}`,
    batchesTaught: 1,
    status: 'active',
  })
})

/**
 * Batches. `studentCount` is the roster size and must agree with the generated
 * users, so the dashboard, the user facets and this table never disagree.
 * @type {AdminBatch[]}
 */
export const adminBatches = [
  {
    id: 'bat-prayas-m',
    name: 'Prayas JEE 2027 — Morning',
    track: 'JEE',
    cohort: 'class11',
    status: 'active',
    studentCount: 148,
    capacity: 160,
    scheduleLabel: 'Mon–Sat · 07:00–12:30',
    room: 'Hall A · 2nd floor',
    startDate: '2026-06-15',
    endDate: '2027-04-30',
    facultyIds: ['fac-snehasish', 'fac-rituparna'],
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    attendancePercent: 91.2,
    examCount: 34,
    feeStatus: 'On track',
  },
  {
    id: 'bat-aarambh-e',
    name: 'Aarambh JEE 2026 — Evening',
    track: 'JEE',
    cohort: 'class12',
    status: 'active',
    studentCount: 162,
    capacity: 170,
    scheduleLabel: 'Mon–Sat · 15:30–20:00',
    room: 'Hall B · 1st floor',
    startDate: '2026-05-04',
    endDate: '2027-03-31',
    facultyIds: ['fac-anirban', 'fac-rituparna'],
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    attendancePercent: 87.6,
    examCount: 41,
    feeStatus: '2 instalments due',
  },
  {
    id: 'bat-shikhar',
    name: 'Shikhar Droppers — Full day',
    track: 'JEE',
    cohort: 'dropper',
    status: 'active',
    studentCount: 96,
    capacity: 110,
    scheduleLabel: 'Mon–Sat · 09:00–17:00',
    room: 'Hall C · 3rd floor',
    startDate: '2026-05-18',
    endDate: '2027-04-15',
    facultyIds: ['fac-sourav', 'fac-snehasish'],
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat'],
    attendancePercent: 84.1,
    examCount: 52,
    feeStatus: 'On track',
  },
  {
    id: 'bat-neet-12',
    name: 'Aarogyam NEET 2026 — Morning',
    track: 'NEET',
    cohort: 'class12',
    status: 'active',
    studentCount: 134,
    capacity: 140,
    scheduleLabel: 'Mon–Sat · 07:30–13:00',
    room: 'Hall D · 2nd floor',
    startDate: '2026-05-04',
    endDate: '2027-03-31',
    facultyIds: ['fac-madhusmita', 'fac-snehasish'],
    subjectIds: ['sub-phy', 'sub-che', 'sub-bio'],
    attendancePercent: 89.8,
    examCount: 38,
    feeStatus: 'On track',
  },
  {
    id: 'bat-neet-13',
    name: 'Aarogyam NEET 2027 — Afternoon',
    track: 'NEET',
    cohort: 'class11',
    status: 'active',
    studentCount: 92,
    capacity: 120,
    scheduleLabel: 'Mon–Sat · 13:30–18:00',
    room: 'Hall E · 1st floor',
    startDate: '2026-06-22',
    endDate: '2027-05-15',
    facultyIds: ['fac-madhusmita', 'fac-rituparna'],
    subjectIds: ['sub-phy', 'sub-che', 'sub-bio'],
    attendancePercent: 90.3,
    examCount: 12,
    feeStatus: 'On track',
  },
  {
    id: 'bat-found-10',
    name: 'NTA Foundation — Class 10',
    track: 'NTA',
    cohort: 'class11',
    status: 'archived',
    studentCount: 88,
    capacity: 90,
    scheduleLabel: 'Sat–Sun · 08:00–12:00',
    room: 'Hall A · 2nd floor',
    startDate: '2025-08-11',
    endDate: '2026-03-29',
    facultyIds: ['fac-sourav'],
    subjectIds: ['sub-phy', 'sub-che', 'sub-mat', 'sub-bio'],
    attendancePercent: 82.4,
    examCount: 12,
    feeStatus: 'Closed',
  },
]

/** @type {Readonly<Record<string, string>>} */
export const batchRoomOptions = {
  'bat-prayas-m': 'Hall A · 2nd floor',
  'bat-aarambh-e': 'Hall B · 1st floor',
  'bat-shikhar': 'Hall C · 3rd floor',
  'bat-neet-12': 'Hall D · 2nd floor',
  'bat-neet-13': 'Hall E · 1st floor',
  'bat-found-10': 'Hall A · 2nd floor',
}
