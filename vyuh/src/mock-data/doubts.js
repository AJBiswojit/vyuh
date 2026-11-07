/** @typedef {import('../contracts/learning.js').DoubtThreadDetail} DoubtThreadDetail */
const now = Date.now()
/** @param {number} hours */
function ago(hours) { return new Date(now - hours * 3_600_000).toISOString() }

/** @type {DoubtThreadDetail[]} */
export const doubts = [
  {
    id: 'doubt-torque-axis', title: 'Why can I choose any pivot for equilibrium?', status: 'answered', subjectName: 'Physics',
    recordingId: 'rec-rot-b', recordingTitle: 'Rotational Dynamics · Torque & Equilibrium', timeSeconds: 12,
    createdAt: ago(28), updatedAt: ago(25),
    messages: [
      { id: 'dm-1', author: 'Ananya Sahoo', role: 'student', body: 'At this timestamp you moved the pivot to the hinge. Is the torque equation valid for any pivot, or only the centre of mass?', createdAt: ago(28) },
      { id: 'dm-2', author: 'Dr. Snehasish Mohapatra', role: 'faculty', body: 'Any fixed pivot works when the body is in equilibrium. Choosing the hinge is a convenience: the unknown hinge force then has zero moment arm, so it drops out of the torque equation.', createdAt: ago(25) },
    ],
  },
  {
    id: 'doubt-rate-order', title: 'Order vs molecularity in a slow step', status: 'open', subjectName: 'Chemistry',
    recordingId: 'rec-org-m', recordingTitle: 'Organic Reaction Mechanisms · Arrow Pushing', timeSeconds: 24,
    createdAt: ago(5), updatedAt: ago(5),
    messages: [
      { id: 'dm-3', author: 'Ananya Sahoo', role: 'student', body: 'If the slow step has one molecule, why can the experimental order still be fractional?', createdAt: ago(5) },
    ],
  },
  {
    id: 'doubt-limits', title: 'Changing limits before substitution', status: 'open', subjectName: 'Mathematics',
    recordingId: null, recordingTitle: null, timeSeconds: null,
    createdAt: ago(2), updatedAt: ago(2),
    messages: [
      { id: 'dm-4', author: 'Ananya Sahoo', role: 'student', body: 'When I substitute t = a + b − x, do I change the limits before or after rewriting dx?', createdAt: ago(2) },
    ],
  },
]
