/**
 * Phase 8 fixtures: the audit ledger.
 *
 * Every office action appends one entry here — policy changes, approvals,
 * integrity decisions, moderation, imports, branding. Entries are immutable:
 * the service only ever prepends. The page is a record, not a dashboard.
 *
 * @typedef {import('../contracts/admin.js').AuditEntry} AuditEntry
 */

/**
 * Action vocabulary. The key is stored on the entry, the label is what the
 * ledger shows, and the tone decides the badge shape.
 * @type {Readonly<Record<string, { label: string, tone: 'neutral'|'info'|'answer'|'review'|'danger' }>>}
 */
export const AUDIT_ACTIONS = {
  'policy.update': { label: 'Policy changed', tone: 'review' },
  'approval.approve': { label: 'Paper approved', tone: 'answer' },
  'approval.reject': { label: 'Paper rejected', tone: 'danger' },
  'approval.schedule': { label: 'Schedule overridden', tone: 'review' },
  'integrity.clear': { label: 'Integrity flag cleared', tone: 'answer' },
  'integrity.warn': { label: 'Warning issued', tone: 'review' },
  'integrity.invalidate': { label: 'Sitting invalidated', tone: 'danger' },
  'moderation.remove': { label: 'Content removed', tone: 'danger' },
  'moderation.dismiss': { label: 'Report dismissed', tone: 'neutral' },
  'moderation.warn': { label: 'Author warned', tone: 'review' },
  'import.commit': { label: 'CSV import committed', tone: 'answer' },
  'report.export': { label: 'Report exported', tone: 'info' },
  'batch.faculty': { label: 'Faculty assignment changed', tone: 'info' },
  'settings.branding': { label: 'Branding saved', tone: 'info' },
  'user.invite': { label: 'Invitations sent', tone: 'info' },
}

/** @param {string} action */
export function auditActionLabel(action) {
  return AUDIT_ACTIONS[action]?.label ?? action
}

/**
 * The seeded ledger. `target` is what the action was applied to, `summary` is
 * the sentence an auditor reads first, and `note` is what the actor wrote.
 * @type {AuditEntry[]}
 */
export const auditSeed = [
  {
    id: 'aud-1001', at: '2026-11-07T08:52:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'policy.update', target: 'Attendance threshold · 75%', summary: 'Attendance threshold kept at 75% after the term review.',
    note: 'No change: the committee deferred the 80% proposal to January.', meta: { policyId: 'attendance-threshold', from: '75', to: '75' },
  },
  {
    id: 'aud-1002', at: '2026-11-06T19:12:00+05:30', actorId: 'adm-bikash', actorName: 'Bikash Mohapatra', actorRole: 'admin',
    action: 'integrity.warn', target: 'NEET Mock 06 · VY-25-2231', summary: 'Warning issued to a candidate with six window switches.',
    note: 'First occurrence; the candidate and guardian were informed by email.', meta: { examId: 'exam-neet-mock-06', sessionId: 'int-0603' },
  },
  {
    id: 'aud-1003', at: '2026-11-06T17:26:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'approval.approve', target: 'JEE Main 11 — Full syllabus', summary: 'Paper approved for the 9 November window.',
    note: 'Question mix reviewed against the syllabus map.', meta: { examId: 'exam-jee-main-11' },
  },
  {
    id: 'aud-1004', at: '2026-11-06T12:40:00+05:30', actorId: 'adm-lopamudra', actorName: 'Lopamudra Biswal', actorRole: 'admin',
    action: 'moderation.remove', target: 'Chat · Aarambh JEE 2026 — Evening', summary: 'Leaked-paper message removed from a live class chat.',
    note: 'Reported by three candidates; message stayed up for 90 seconds.', meta: { itemId: 'mod-03' },
  },
  {
    id: 'aud-1005', at: '2026-11-05T16:05:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'batch.faculty', target: 'Aarogyam NEET 2027 — Afternoon', summary: 'Rituparna Das added to the batch as mathematics faculty.',
    note: 'Covers the batch until the December allocation.', meta: { batchId: 'bat-neet-13', added: ['fac-rituparna'] },
  },
  {
    id: 'aud-1006', at: '2026-11-05T09:18:00+05:30', actorId: 'adm-bikash', actorName: 'Bikash Mohapatra', actorRole: 'admin',
    action: 'approval.reject', target: 'NEET Mock 08 — Draft', summary: 'Paper rejected: two sections exceeded the syllabus weighting.',
    note: 'Returned to Dr. Behera with the chapter weights attached.', meta: { examId: 'exam-neet-mock-08' },
  },
  {
    id: 'aud-1007', at: '2026-11-04T11:42:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'import.commit', target: 'office-roster-oct.csv', summary: '6 accounts created from a CSV import; 1 row skipped.',
    note: 'The skipped row had a duplicate roll number from the 2025 roster.', meta: { created: 6, skipped: 1 },
  },
  {
    id: 'aud-1008', at: '2026-11-04T09:10:00+05:30', actorId: 'adm-lopamudra', actorName: 'Lopamudra Biswal', actorRole: 'admin',
    action: 'moderation.dismiss', target: 'Chat · Prayas JEE 2027 — Morning', summary: 'Report dismissed: the message was a complaint about pace, not abuse.',
    note: 'Batch mentor will address the teaching-pace concern directly.', meta: { itemId: 'mod-06' },
  },
  {
    id: 'aud-1009', at: '2026-11-03T18:20:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'approval.schedule', target: 'JEE Advanced 04 — Paper 1', summary: 'Window moved from 12 November to 11 November, 14:00.',
    note: 'Clashes with the trust’s parent meeting on the 12th.', meta: { examId: 'exam-jee-adv-04' },
  },
  {
    id: 'aud-1010', at: '2026-11-03T15:12:00+05:30', actorId: 'adm-lopamudra', actorName: 'Lopamudra Biswal', actorRole: 'admin',
    action: 'settings.branding', target: 'Institute logo', summary: 'Logo updated for the 2026–27 circulars.',
    note: 'Same mark, higher-resolution file.', meta: { logoFileName: 'vidyut-mark-2026.svg' },
  },
  {
    id: 'aud-1011', at: '2026-11-02T15:06:00+05:30', actorId: 'adm-bikash', actorName: 'Bikash Mohapatra', actorRole: 'admin',
    action: 'moderation.remove', target: 'Doubt · Aarambh JEE 2026 — Evening', summary: 'Answer-key spoiler removed while the paper was still live.',
    note: 'Removed four minutes after the report; the sitting was unaffected.', meta: { itemId: 'mod-07' },
  },
  {
    id: 'aud-1012', at: '2026-11-02T10:30:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'integrity.clear', target: 'JEE Main 10 · VY-25-1409', summary: 'Flag cleared: the browser crash was reported before the sitting.',
    note: 'Office log confirms a support call at 09:04.', meta: { examId: 'exam-jee-main-10', sessionId: 'int-1002' },
  },
  {
    id: 'aud-1013', at: '2026-11-01T08:15:00+05:30', actorId: 'adm-lopamudra', actorName: 'Lopamudra Biswal', actorRole: 'admin',
    action: 'policy.update', target: 'Consent version · 2026-2', summary: 'Consent text 2026-2 published to 720 accounts.',
    note: 'Trust counsel approved the wording on 30 October.', meta: { policyId: 'consent-version', from: '2026-1', to: '2026-2' },
  },
  {
    id: 'aud-1014', at: '2026-10-31T17:20:00+05:30', actorId: 'adm-bikash', actorName: 'Bikash Mohapatra', actorRole: 'admin',
    action: 'integrity.invalidate', target: 'NEET Mock 05 · VY-26-3308', summary: 'Sitting invalidated: a second device was active for 41 minutes.',
    note: 'Device fingerprint matched a sibling’s account.', meta: { examId: 'exam-neet-mock-05', sessionId: 'int-0501' },
  },
  {
    id: 'aud-1015', at: '2026-10-30T14:05:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'user.invite', target: '18 faculty invitations', summary: 'Invitations sent for the December faculty intake.',
    note: 'Codes expire in seven days.', meta: { invited: 18 },
  },
  {
    id: 'aud-1016', at: '2026-10-28T11:30:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'policy.update', target: 'Attention-check frequency · Every 15 minutes', summary: 'Attention checks moved from 10 to 15 minutes.',
    note: 'Ten-minute checks were interrupting long derivations.', meta: { policyId: 'attention-check', from: 'every-10', to: 'every-15' },
  },
  {
    id: 'aud-1017', at: '2026-10-27T09:00:00+05:30', actorId: 'adm-bikash', actorName: 'Bikash Mohapatra', actorRole: 'admin',
    action: 'approval.approve', target: 'Shikhar Weekly 21 — Mechanics', summary: 'Weekly paper approved for the 27 October window.',
    note: 'Routine approval.', meta: { examId: 'exam-shikhar-21' },
  },
  {
    id: 'aud-1018', at: '2026-10-24T16:40:00+05:30', actorId: 'adm-lopamudra', actorName: 'Lopamudra Biswal', actorRole: 'admin',
    action: 'policy.update', target: 'Data retention period · 24 months', summary: 'Retention confirmed at 24 months for the term.',
    note: 'Audit committee reviewed the deletion schedule.', meta: { policyId: 'data-retention', from: '24', to: '24' },
  },
  {
    id: 'aud-1019', at: '2026-10-22T12:15:00+05:30', actorId: 'adm-pratibha', actorName: 'Pratibha Nayak', actorRole: 'admin',
    action: 'batch.faculty', target: 'Prayas JEE 2027 — Morning', summary: 'Dr. Snehasish Mohapatra confirmed as physics lead for the batch.',
    note: 'Rolled forward from Session 1.', meta: { batchId: 'bat-prayas-m', added: ['fac-snehasish'] },
  },
  {
    id: 'aud-1020', at: '2026-10-20T10:05:00+05:30', actorId: 'adm-bikash', actorName: 'Bikash Mohapatra', actorRole: 'admin',
    action: 'moderation.warn', target: 'Chat · Shikhar Droppers — Full day', summary: 'Author warned over repeated off-topic sales messages.',
    note: 'Second message from the same account in a week.', meta: { itemId: 'mod-08' },
  },
]
