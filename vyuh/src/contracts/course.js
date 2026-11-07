/**
 * Course contracts. A course is what a student enrols in; a batch is where they
 * sit it. One course can seed several batches across a term.
 *
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} name
 * @property {import('./user.js').Track} track
 * @property {number} durationMonths
 * @property {string} classLevel        'Class 11 entry', 'Post Class 12'.
 * @property {number} seats
 * @property {number} enrolled
 * @property {number} feeInr            Whole rupees; formatted at render time.
 * @property {'open'|'closed'} status
 */

export {};
