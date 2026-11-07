import { Badge } from '@/shared/ui'

/**
 * A paper's state, said in words. The badge carries a shape as well as a tone so
 * a printed sheet survives greyscale, and the label is the state itself rather
 * than a synonym — "pending approval", not "in review".
 *
 * @param {{ status: import('@/contracts/faculty.js').FacultyExamStatus }} props
 */
export function ExamStatusBadge({ status }) {
  const spec = STATUS[status] ?? STATUS.draft
  return (
    <Badge tone={spec.tone} variant={spec.variant} shape={spec.shape} className="whitespace-nowrap">
      {spec.label}
    </Badge>
  )
}

const STATUS = {
  draft: { label: 'Draft', tone: /** @type {const} */ ('neutral'), variant: /** @type {const} */ ('outline'), shape: /** @type {const} */ ('hollow') },
  pending_approval: { label: 'Pending approval', tone: /** @type {const} */ ('review'), variant: /** @type {const} */ ('soft'), shape: /** @type {const} */ ('ring') },
  approved: { label: 'Approved', tone: /** @type {const} */ ('answer'), variant: /** @type {const} */ ('soft'), shape: /** @type {const} */ ('square') },
  scheduled: { label: 'Scheduled', tone: /** @type {const} */ ('info'), variant: /** @type {const} */ ('outline'), shape: /** @type {const} */ ('square') },
  live: { label: 'Live now', tone: /** @type {const} */ ('info'), variant: /** @type {const} */ ('solid'), shape: /** @type {const} */ ('dot') },
  completed: { label: 'Completed', tone: /** @type {const} */ ('idle'), variant: /** @type {const} */ ('outline'), shape: /** @type {const} */ ('hollow') },
}

/** Whether a paper can still be changed. Mirrors the service's own guard. */
export function isEditable(status) {
  return status !== 'live' && status !== 'completed'
}
