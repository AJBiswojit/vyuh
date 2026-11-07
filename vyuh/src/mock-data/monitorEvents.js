/**
 * Live-exam monitor fixture: the cohort sitting NEET Mock 07, their starting
 * palette state, and the scripted event feed. The service applies these events;
 * nothing in a component invents a count.
 *
 * @typedef {import('../contracts/faculty.js').MonitorStudent} MonitorStudent
 */

/** @type {{ id: string, name: string, rollNumber: string, initials: string }[]} */
export const monitorRoster = [
  { id: 'mon-01', name: 'Aditi Rath', rollNumber: 'VY-26-0401', initials: 'AR' },
  { id: 'mon-02', name: 'Rohan Mohanty', rollNumber: 'VY-26-0402', initials: 'RM' },
  { id: 'mon-03', name: 'Ishita Patnaik', rollNumber: 'VY-26-0403', initials: 'IP' },
  { id: 'mon-04', name: 'Meera Sahu', rollNumber: 'VY-26-0404', initials: 'MS' },
  { id: 'mon-05', name: 'Aarav Das', rollNumber: 'VY-26-0405', initials: 'AD' },
  { id: 'mon-06', name: 'Sasmita Behera', rollNumber: 'VY-26-0406', initials: 'SB' },
  { id: 'mon-07', name: 'Karan Jena', rollNumber: 'VY-26-0407', initials: 'KJ' },
  { id: 'mon-08', name: 'Priya Nayak', rollNumber: 'VY-26-0408', initials: 'PN' },
  { id: 'mon-09', name: 'Debasish Panda', rollNumber: 'VY-26-0409', initials: 'DP' },
  { id: 'mon-10', name: 'Nandini Mishra', rollNumber: 'VY-26-0410', initials: 'NM' },
  { id: 'mon-11', name: 'Sourav Samal', rollNumber: 'VY-26-0411', initials: 'SS' },
  { id: 'mon-12', name: 'Trupti Ghosh', rollNumber: 'VY-26-0412', initials: 'TG' },
  { id: 'mon-13', name: 'Ankit Bhoi', rollNumber: 'VY-26-0413', initials: 'AB' },
  { id: 'mon-14', name: 'Sneha Rout', rollNumber: 'VY-26-0414', initials: 'SR' },
  { id: 'mon-15', name: 'Bikash Nayak', rollNumber: 'VY-26-0415', initials: 'BN' },
  { id: 'mon-16', name: 'Ritika Mallick', rollNumber: 'VY-26-0416', initials: 'RM' },
  { id: 'mon-17', name: 'Omkar Sethi', rollNumber: 'VY-26-0417', initials: 'OS' },
  { id: 'mon-18', name: 'Lipsa Pradhan', rollNumber: 'VY-26-0418', initials: 'LP' },
  { id: 'mon-19', name: 'Harsh Vardhan', rollNumber: 'VY-26-0419', initials: 'HV' },
  { id: 'mon-20', name: 'Swagatika Dei', rollNumber: 'VY-26-0420', initials: 'SD' },
  { id: 'mon-21', name: 'Pratik Sahoo', rollNumber: 'VY-26-0421', initials: 'PS' },
  { id: 'mon-22', name: 'Jasmin Parida', rollNumber: 'VY-26-0422', initials: 'JP' },
  { id: 'mon-23', name: 'Nihar Ranjan', rollNumber: 'VY-26-0423', initials: 'NR' },
  { id: 'mon-24', name: 'Sagarika Das', rollNumber: 'VY-26-0424', initials: 'SD' },
  { id: 'mon-25', name: 'Rakesh Barik', rollNumber: 'VY-26-0425', initials: 'RB' },
  { id: 'mon-26', name: 'Ananya Tripathy', rollNumber: 'VY-26-0426', initials: 'AT' },
  { id: 'mon-27', name: 'Chinmay Ojha', rollNumber: 'VY-26-0427', initials: 'CO' },
  { id: 'mon-28', name: 'Rashmi Bal', rollNumber: 'VY-26-0428', initials: 'RB' },
  { id: 'mon-29', name: 'Siddharth Pani', rollNumber: 'VY-26-0429', initials: 'SP' },
  { id: 'mon-30', name: 'Mitali Nayak', rollNumber: 'VY-26-0430', initials: 'MN' },
  { id: 'mon-31', name: 'Papun Behera', rollNumber: 'VY-26-0431', initials: 'PB' },
  { id: 'mon-32', name: 'Sonali Mishra', rollNumber: 'VY-26-0432', initials: 'SM' },
]

/**
 * Starting palette state. The live exam has been running about 45 minutes, so
 * most candidates are part-way through; four have submitted and one has dropped.
 * @param {number} totalQuestions
 * @returns {MonitorStudent[]}
 */
export function seedMonitorStudents(totalQuestions) {
  return monitorRoster.map((student, index) => {
    const submitted = index === 26 || index === 27 || index === 28
    const notStarted = index === 0 || index === 1
    const disconnected = index === 29
    const fraction = 0.32 + ((index * 7) % 11) / 22
    const answeredCount = submitted ? totalQuestions : notStarted ? 0 : Math.min(totalQuestions, Math.round(totalQuestions * fraction))
    const reviewCount = notStarted || submitted ? 0 : index % 4
    const isDropped = disconnected || index === 12
    /** @type {import('../contracts/faculty.js').MonitorStudentStatus} */
    const status = submitted
      ? 'submitted'
      : notStarted
        ? 'not_started'
        : isDropped
          ? 'disconnected'
          : reviewCount > 0
            ? 'review'
            : index % 5 === 0
              ? 'in_progress'
              : 'answered'
    const flags = index === 5 ? 2 : index === 18 ? 1 : 0
    return {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      initials: student.initials,
      status,
      answeredCount,
      reviewCount,
      total: totalQuestions,
      integrityFlags: flags,
      integrityNotes:
        index === 5 ? ['Tab switched away from the hall (2)', 'Copy attempt blocked'] : index === 18 ? ['Fullscreen exited once'] : [],
      lastSeenAt: new Date(Date.now() - (index % 6) * 60_000).toISOString(),
      progressPercent: Math.round((answeredCount / Math.max(1, totalQuestions)) * 100),
    }
  })
}

/**
 * The event feed, cycled by the mock transport. Indices point into the roster.
 * @type {{ type: 'answer'|'review'|'submit'|'integrity'|'disconnect'|'reconnect'|'join', index: number, label: string, note?: string }[]}
 */
export const monitorScript = [
  { type: 'answer', index: 2, label: 'Answered one more question' },
  { type: 'integrity', index: 9, label: 'Integrity flag raised', note: 'Tab switched away from the hall' },
  { type: 'answer', index: 6, label: 'Answered two more questions' },
  { type: 'review', index: 10, label: 'Marked a question for review' },
  { type: 'submit', index: 23, label: 'Submitted the paper' },
  { type: 'disconnect', index: 14, label: 'Lost connection', note: 'Heartbeat missing for 40 seconds' },
  { type: 'answer', index: 3, label: 'Answered three more questions' },
  { type: 'reconnect', index: 14, label: 'Reconnected' },
  { type: 'answer', index: 19, label: 'Answered one more question' },
  { type: 'integrity', index: 21, label: 'Integrity flag raised', note: 'Copy attempt blocked inside the hall' },
  { type: 'review', index: 7, label: 'Marked two questions for review' },
  { type: 'submit', index: 24, label: 'Submitted the paper' },
  { type: 'answer', index: 11, label: 'Answered four more questions' },
  { type: 'answer', index: 16, label: 'Answered one more question' },
  { type: 'integrity', index: 5, label: 'Repeat integrity flag', note: 'Third tab switch logged' },
  { type: 'answer', index: 25, label: 'Answered two more questions' },
]

/** Copy for the monitor legend, so a tile and the feed describe a state alike. */
export const monitorStatusLabels = {
  not_started: 'Not started',
  in_progress: 'In progress',
  answered: 'Answering',
  review: 'Reviewing',
  submitted: 'Submitted',
  disconnected: 'Connection lost',
}
