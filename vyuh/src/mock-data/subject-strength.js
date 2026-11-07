/** @typedef {import('../contracts/student.js').SubjectStrength} SubjectStrength */
/** @type {SubjectStrength[]} */
export const subjectStrength = [
  { subjectId: 'sub-phy', name: 'Physics', score: 68, batchAverage: 61, delta: 4, trend: [48, 52, 55, 58, 60, 62, 64, 68] },
  { subjectId: 'sub-che', name: 'Chemistry', score: 74, batchAverage: 66, delta: 2, trend: [56, 60, 63, 65, 66, 68, 72, 74] },
  { subjectId: 'sub-mat', name: 'Mathematics', score: 59, batchAverage: 63, delta: -3, trend: [68, 66, 65, 64, 64, 63, 62, 59] },
]
