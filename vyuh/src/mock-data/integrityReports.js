/**
 * Phase 8 fixtures: integrity reports, one per paper that produced flags.
 *
 * A flag is a signal, not a verdict. Each session lists the reasons the room
 * raised, the evidence behind them with the time it happened, and the score the
 * candidate currently holds. The office's decision is what changes the record.
 *
 * @typedef {import('../contracts/admin.js').IntegrityReport} IntegrityReport
 * @typedef {import('../contracts/admin.js').IntegritySession} IntegritySession
 */

/** @type {Readonly<Record<'clear'|'warn'|'invalidate', string>>} */
export const integrityDecisionLabels = {
  clear: 'Cleared',
  warn: 'Warning issued',
  invalidate: 'Sitting invalidated',
}

/** @type {Readonly<Record<'clear'|'warn'|'invalidate', string>>} */
export const integrityDecisionDescriptions = {
  clear: 'No action against the candidate. The flag is recorded as reviewed and the score stands.',
  warn: 'The candidate and guardian receive a written warning. The score stands and the flag stays visible.',
  invalidate: 'The sitting is voided for this candidate. Their score is withdrawn and the batch average is recomputed.',
}

/** @type {Readonly<Record<string, string>>} */
export const evidenceKindLabels = {
  window: 'Window switch',
  focus: 'Focus lost',
  device: 'Second device',
  camera: 'Camera signal',
  audio: 'Audio signal',
}

/** @type {IntegrityReport[]} */
export const integrityReports = [
  {
    id: 'report-neet-06',
    examId: 'exam-neet-mock-06',
    examTitle: 'NEET Mock 06 — Full syllabus',
    batchId: 'bat-neet-12',
    batchName: 'Aarogyam NEET 2026 — Morning',
    satAt: '2026-11-06T09:00:00+05:30',
    proctoringLevel: 'strict',
    maxMarks: 240,
    sessions: [
      {
        id: 'int-0601', studentId: 'stu-0491', studentName: 'Piyush Hota', rollNumber: 'VY-25-2491',
        score: 188, maxMarks: 240, flaggedAt: '2026-11-06T10:12:00+05:30',
        reasons: ['Left the exam window six times', 'Focus lost for 4m 12s in total'],
        evidence: [
          { id: 'ev-0601a', kind: 'window', label: 'Window switch', detail: 'Left the tab at 09:42 and returned at 09:44.', at: '2026-11-06T09:42:00+05:30' },
          { id: 'ev-0601b', kind: 'focus', label: 'Focus lost', detail: 'Browser reported no focus for 2m 08s while the clock ran.', at: '2026-11-06T10:04:00+05:30' },
          { id: 'ev-0601c', kind: 'window', label: 'Window switch', detail: 'Returned from another window at 10:11.', at: '2026-11-06T10:11:00+05:30' },
        ],
      },
      {
        id: 'int-0602', studentId: 'stu-0512', studentName: 'Varsha Giri', rollNumber: 'VY-25-2512',
        score: 206, maxMarks: 240, flaggedAt: '2026-11-06T10:38:00+05:30',
        reasons: ['Second device signed in during the sitting'],
        evidence: [
          { id: 'ev-0602a', kind: 'device', label: 'Second device', detail: 'A second device joined the same attempt at 10:31 from the campus network.', at: '2026-11-06T10:31:00+05:30' },
        ],
      },
      {
        id: 'int-0603', studentId: 'stu-0538', studentName: 'Nandini Pradhan', rollNumber: 'VY-25-2538',
        score: 164, maxMarks: 240, flaggedAt: '2026-11-06T11:02:00+05:30',
        reasons: ['Window switches around question 43', 'Typing burst of 212 characters in 9s'],
        evidence: [
          { id: 'ev-0603a', kind: 'window', label: 'Window switch', detail: 'Three switches inside 40 seconds at 10:58.', at: '2026-11-06T10:58:00+05:30' },
          { id: 'ev-0603b', kind: 'focus', label: 'Focus lost', detail: 'Paste-sized input burst on a numerical answer.', at: '2026-11-06T10:59:00+05:30' },
        ],
      },
      {
        id: 'int-0604', studentId: 'stu-0555', studentName: 'Manas Panda', rollNumber: 'VY-26-2555',
        score: 142, maxMarks: 240, flaggedAt: '2026-11-06T11:20:00+05:30',
        reasons: ['Background voices detected'],
        evidence: [
          { id: 'ev-0604a', kind: 'audio', label: 'Audio signal', detail: 'Two distinct voices detected in three clips.', at: '2026-11-06T11:14:00+05:30' },
        ],
      },
    ],
  },
  {
    id: 'report-jee-10',
    examId: 'exam-jee-main-10',
    examTitle: 'JEE Main 10 — Full syllabus',
    batchId: 'bat-aarambh-e',
    batchName: 'Aarambh JEE 2026 — Evening',
    satAt: '2026-11-04T09:00:00+05:30',
    proctoringLevel: 'standard',
    maxMarks: 300,
    sessions: [
      {
        id: 'int-1001', studentId: 'stu-0102', studentName: 'Harshita Sethi', rollNumber: 'VY-25-1102',
        score: 231, maxMarks: 300, flaggedAt: '2026-11-04T10:20:00+05:30',
        reasons: ['Browser crashed and the attempt resumed mid-section'],
        evidence: [
          { id: 'ev-1001a', kind: 'window', label: 'Connection lost', detail: 'Heartbeat stopped for 3m 40s at 10:12; the attempt resumed in the same section.', at: '2026-11-04T10:12:00+05:30' },
        ],
      },
      {
        id: 'int-1002', studentId: 'stu-0128', studentName: 'Sagarika Mahapatra', rollNumber: 'VY-25-1128',
        score: 198, maxMarks: 300, flaggedAt: '2026-11-04T10:44:00+05:30',
        reasons: ['Focus lost repeatedly'],
        evidence: [
          { id: 'ev-1002a', kind: 'focus', label: 'Focus lost', detail: 'The browser lost focus four times in twelve minutes.', at: '2026-11-04T10:32:00+05:30' },
        ],
      },
      {
        id: 'int-1003', studentId: 'stu-0156', studentName: 'Omkar Rath', rollNumber: 'VY-26-1156',
        score: 176, maxMarks: 300, flaggedAt: '2026-11-04T11:05:00+05:30',
        reasons: ['Camera signal lost for 9 minutes'],
        evidence: [
          { id: 'ev-1003a', kind: 'camera', label: 'Camera signal', detail: 'Camera frames stopped at 10:50 and never resumed.', at: '2026-11-04T10:50:00+05:30' },
        ],
      },
    ],
  },
  {
    id: 'report-shikhar-21',
    examId: 'exam-shikhar-21',
    examTitle: 'Shikhar Weekly 21 — Mechanics',
    batchId: 'bat-shikhar',
    batchName: 'Shikhar Droppers — Full day',
    satAt: '2026-10-27T10:00:00+05:30',
    proctoringLevel: 'standard',
    maxMarks: 120,
    sessions: [
      {
        id: 'int-2101', studentId: 'stu-0203', studentName: 'Ishaan Giri', rollNumber: 'VY-25-1203',
        score: 78, maxMarks: 120, flaggedAt: '2026-10-27T10:52:00+05:30',
        reasons: ['Second device signed in during the sitting'],
        evidence: [
          { id: 'ev-2101a', kind: 'device', label: 'Second device', detail: 'A phone joined the same account at 10:48 and stayed for eleven minutes.', at: '2026-10-27T10:48:00+05:30' },
        ],
      },
      {
        id: 'int-2102', studentId: 'stu-0231', studentName: 'Lipsa Swain', rollNumber: 'VY-26-1231',
        score: 66, maxMarks: 120, flaggedAt: '2026-10-27T11:14:00+05:30',
        reasons: ['Left the exam window twice'],
        evidence: [
          { id: 'ev-2102a', kind: 'window', label: 'Window switch', detail: 'Two switches, 40 seconds each, in the last section.', at: '2026-10-27T11:04:00+05:30' },
        ],
      },
    ],
  },
]
