/** @typedef {import('../contracts/academic.js').Batch} Batch */
/** @type {Batch[]} */
export const batches = [
  { id: 'bat-prayas-m', name: 'Prayas JEE 2027 — Morning', track: 'JEE', cohort: 'class11', studentCount: 148, facultyLead: 'Dr. Snehasish Mohapatra', scheduleLabel: 'Mon–Sat · 07:00–12:30', subjectIds: ['sub-phy', 'sub-che', 'sub-mat'], testCount: 34, status: 'active' },
  { id: 'bat-aarambh-e', name: 'Aarambh JEE 2026 — Evening', track: 'JEE', cohort: 'class12', studentCount: 162, facultyLead: 'Rituparna Das', scheduleLabel: 'Mon–Sat · 15:30–20:00', subjectIds: ['sub-phy', 'sub-che', 'sub-mat'], testCount: 41, status: 'active' },
  { id: 'bat-shikhar', name: 'Shikhar Droppers — Full day', track: 'JEE', cohort: 'dropper', studentCount: 96, facultyLead: 'Anirban Patnaik', scheduleLabel: 'Mon–Sat · 09:00–17:00', subjectIds: ['sub-phy', 'sub-che', 'sub-mat'], testCount: 52, status: 'active' },
  { id: 'bat-neet-12', name: 'Aarogyam NEET 2026 — Morning', track: 'NEET', cohort: 'class12', studentCount: 134, facultyLead: 'Dr. Madhusmita Behera', scheduleLabel: 'Mon–Sat · 07:30–13:00', subjectIds: ['sub-phy', 'sub-che', 'sub-bio'], testCount: 38, status: 'active' },
  { id: 'bat-found-10', name: 'NTA Foundation — Class 10', track: 'NTA', cohort: 'class11', studentCount: 88, facultyLead: 'Sourav Mishra', scheduleLabel: 'Sat–Sun · 08:00–12:00', subjectIds: ['sub-phy', 'sub-che', 'sub-mat', 'sub-bio'], testCount: 12, status: 'archived' },
]
export const studentBatchId = 'bat-prayas-m'
