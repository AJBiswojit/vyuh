/**
 * Phase 8 fixtures: institution policy. Six settings the office owns, each with
 * the bounds it may move between and the population it touches.
 *
 * `scope` is not decoration — it is what the change dialog counts when it says
 * "this affects 5 batches and 632 students". The service resolves it against the
 * live roster, so the sentence and the data cannot disagree.
 *
 * @typedef {import('../contracts/admin.js').PolicyDefinition} PolicyDefinition
 * @typedef {import('../contracts/admin.js').PolicyChange} PolicyChange
 */

/** @type {Readonly<Record<'batches'|'students'|'exams', string>>} */
export const policyScopeLabels = {
  batches: 'Active batches',
  students: 'Students on the platform',
  exams: 'Papers sat this term',
}

/** @type {PolicyDefinition[]} */
export const adminPolicies = [
  {
    id: 'attendance-threshold',
    label: 'Attendance threshold',
    description: 'A student below this share of sessions is a defaulter. The line is printed on the register and drives the office’s warning letters.',
    kind: 'number',
    value: 75,
    min: 50,
    max: 95,
    step: 1,
    unit: '%',
    scope: 'batches',
    updatedAt: '2026-07-14T10:20:00+05:30',
    updatedBy: 'Pratibha Nayak',
  },
  {
    id: 'grace-period',
    label: 'Attendance grace period',
    description: 'Sessions a student may miss before the threshold starts counting. Used when a family informs the office in advance.',
    kind: 'number',
    value: 3,
    min: 0,
    max: 10,
    step: 1,
    unit: 'sessions',
    scope: 'batches',
    updatedAt: '2026-07-14T10:24:00+05:30',
    updatedBy: 'Pratibha Nayak',
  },
  {
    id: 'proctoring-level',
    label: 'Proctoring level',
    description: 'What the exam room watches during a sitting. Changing it affects papers that have not yet been approved.',
    kind: 'enum',
    value: 'standard',
    options: [
      { value: 'open', label: 'Open book — no proctoring signals' },
      { value: 'standard', label: 'Standard — focus and window signals' },
      { value: 'strict', label: 'Strict — focus, window, camera and audio' },
    ],
    scope: 'exams',
    updatedAt: '2026-08-02T15:10:00+05:30',
    updatedBy: 'Bikash Mohapatra',
  },
  {
    id: 'attention-check',
    label: 'Attention-check frequency',
    description: 'How often a live class asks candidates to confirm they are present. Shorter intervals raise the count on the attendance report.',
    kind: 'enum',
    value: 'every-15',
    options: [
      { value: 'every-10', label: 'Every 10 minutes' },
      { value: 'every-15', label: 'Every 15 minutes' },
      { value: 'every-20', label: 'Every 20 minutes' },
      { value: 'manual', label: 'Only when the host asks' },
    ],
    scope: 'batches',
    updatedAt: '2026-06-19T09:40:00+05:30',
    updatedBy: 'Pratibha Nayak',
  },
  {
    id: 'data-retention',
    label: 'Data retention period',
    description: 'How long answers, recordings and result sheets are kept after a term ends. Shorter retention deletes evidence the integrity queue may still need.',
    kind: 'number',
    value: 24,
    min: 6,
    max: 60,
    step: 6,
    unit: 'months',
    scope: 'students',
    updatedAt: '2026-05-30T12:00:00+05:30',
    updatedBy: 'Lopamudra Biswal',
  },
  {
    id: 'consent-version',
    label: 'Consent version',
    description: 'The consent text every candidate and guardian accepts before their first paper. Publishing a new version re-prompts accounts that have not accepted it.',
    kind: 'enum',
    value: '2026-2',
    options: [
      { value: '2026-1', label: '2026-1 · April 2026 (superseded)' },
      { value: '2026-2', label: '2026-2 · November 2026 (current)' },
      { value: '2027-1', label: '2027-1 · Draft, not yet published' },
    ],
    scope: 'students',
    updatedAt: '2026-11-01T08:15:00+05:30',
    updatedBy: 'Lopamudra Biswal',
  },
]

/**
 * What changed before this build. The audit log carries the full record; this
 * short list is what the policy screen shows beside each setting.
 * @type {PolicyChange[]}
 */
export const policyHistory = [
  { id: 'pol-01', policyId: 'consent-version', from: '2026-1', to: '2026-2', at: '2026-11-01T08:15:00+05:30', actorName: 'Lopamudra Biswal', note: 'Annual consent refresh approved by the trust.' },
  { id: 'pol-02', policyId: 'proctoring-level', from: 'strict', to: 'standard', at: '2026-08-02T15:10:00+05:30', actorName: 'Bikash Mohapatra', note: 'Camera checks were blocking candidates on shared devices.' },
  { id: 'pol-03', policyId: 'attendance-threshold', from: '70', to: '75', at: '2026-07-14T10:20:00+05:30', actorName: 'Pratibha Nayak', note: 'Term committee raised the line after the July review.' },
  { id: 'pol-04', policyId: 'data-retention', from: '18', to: '24', at: '2026-05-30T12:00:00+05:30', actorName: 'Lopamudra Biswal', note: 'Board retention requirement is two years from the last sitting.' },
]
