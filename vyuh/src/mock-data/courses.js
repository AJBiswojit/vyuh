/**
 * Course catalogue contracts and fixtures.
 *
 * A course is the sellable unit the office manages: a batch is where a student
 * sits, a course is what they enrolled in. The two are joined by subjectIds and
 * by the term, not by duplication.
 *
 * @typedef {import('../contracts/course.js').Course} Course
 */

/** @type {Course[]} */
export const courses = [
  {
    id: 'crs-jee-2y',
    name: 'Two-year JEE Main + Advanced',
    track: 'JEE',
    durationMonths: 24,
    classLevel: 'Class 11 entry',
    seats: 180,
    enrolled: 148,
    feeInr: 186000,
    status: 'open',
  },
  {
    id: 'crs-jee-1y',
    name: 'One-year JEE Main + Advanced',
    track: 'JEE',
    durationMonths: 12,
    classLevel: 'Class 12 entry',
    seats: 180,
    enrolled: 162,
    feeInr: 142000,
    status: 'open',
  },
  {
    id: 'crs-jee-drop',
    name: 'Dropper intensive — JEE',
    track: 'JEE',
    durationMonths: 11,
    classLevel: 'Post Class 12',
    seats: 120,
    enrolled: 96,
    feeInr: 168000,
    status: 'open',
  },
  {
    id: 'crs-neet-1y',
    name: 'One-year NEET',
    track: 'NEET',
    durationMonths: 12,
    classLevel: 'Class 12 entry',
    seats: 150,
    enrolled: 134,
    feeInr: 158000,
    status: 'open',
  },
  {
    id: 'crs-nta-found',
    name: 'NTA foundation — weekends',
    track: 'NTA',
    durationMonths: 9,
    classLevel: 'Class 10',
    seats: 100,
    enrolled: 88,
    feeInr: 64000,
    status: 'closed',
  },
]
