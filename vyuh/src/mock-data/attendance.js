/**
 * Attendance policy and historical register. The active live session is merged
 * into this register by the service; no component invents a verdict.
 * @typedef {import('../contracts/learning.js').AttendancePolicy} AttendancePolicy
 * @typedef {import('../contracts/learning.js').AttendanceRecord} AttendanceRecord
 */

/** @type {AttendancePolicy} */
export const attendancePolicy = {
  thresholdPercent: 75,
  graceMinutes: 10,
  attentionReward: 2,
  attentionPenalty: 4,
  checkMinMinutes: 8,
  checkMaxMinutes: 15,
  responseWindowSeconds: 15,
}

const now = new Date()
const month = now.getMonth()
const year = now.getFullYear()
export const attendancePeriodLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
const percentages = [92, 88, 0, 76, 64, 100, 94, 81, 0, 90, 78, 96]
const titles = [
  ['Rotational Dynamics · Rolling Without Slipping', 'Physics'],
  ['Organic Mechanisms · SN1 and SN2', 'Chemistry'],
  ['Definite Integration · King Property', 'Mathematics'],
  ['Current Electricity · Kirchhoff Loops', 'Physics'],
  ['Chemical Bonding · Hybridisation', 'Chemistry'],
  ['Vectors · Dot and Cross Products', 'Mathematics'],
  ['Thermodynamics · First Law', 'Physics'],
  ['Electrochemistry · Conductance', 'Chemistry'],
  ['Probability · Bayes Theorem', 'Mathematics'],
  ['Optics · Lens Maker Formula', 'Physics'],
  ['Coordination Compounds · Isomerism', 'Chemistry'],
  ['Sequences · Telescoping Sums', 'Mathematics'],
]
const days = Math.min(12, now.getDate())

/** @type {AttendanceRecord[]} */
export const attendanceHistory = Array.from({ length: days }, (_, index) => {
  const day = now.getDate() - index
  const presencePercent = percentages[index % percentages.length]
  const eligibleMinutes = 65
  return {
    sessionId: `att-hist-${year}-${month + 1}-${day}`,
    title: titles[index % titles.length][0],
    subjectName: titles[index % titles.length][1],
    batchName: 'Prayas JEE 2027 — Morning',
    date: new Date(year, month, day, 9, 0, 0, 0).toISOString(),
    presencePercent,
    verdict: presencePercent >= attendancePolicy.thresholdPercent ? 'Present' : presencePercent > 0 ? 'Partial' : 'Absent',
    attendedMinutes: Math.round(eligibleMinutes * presencePercent / 100),
    eligibleMinutes,
    live: false,
  }
})

/** Demo seed for the currently live room: full time coverage, 84 attention. */
export const activeAttendanceSeeds = {
  'ses-rot-b': { attentionScore: 84, coveragePercent: 100, joinedAfterMinutes: 4 },
  'ses-chem-b': { attentionScore: 84, coveragePercent: 100, joinedAfterMinutes: 2 },
}
