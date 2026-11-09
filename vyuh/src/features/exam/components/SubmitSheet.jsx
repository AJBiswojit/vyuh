import { motion } from 'framer-motion'
import { Button, Sheet } from '@/shared/ui'
import { durations } from '@/shared/lib/motion.js'

/** Clock-style readout from whole seconds. Tabular so the dialog does not
 * reflow between renders. @param {number} seconds */
function formatRemaining(seconds) {
  const value = Math.max(0, Math.floor(seconds))
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = value % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

/** @param {{ open: boolean, onClose: () => void, counts: import('@/contracts/exam.js').ExamSubmissionCounts, onSubmit: () => void, isPending: boolean, online: boolean, remainingSeconds?: number }} props */
export function SubmitSheet({ open, onClose, counts, onSubmit, isPending, online, remainingSeconds }) {
  const rows = [
    ['Answered', counts.answered],
    ['Not answered', counts.notAnswered],
    ['Marked for review', counts.review],
    ['Not visited', counts.notVisited],
  ]
  const hasUnanswered = counts.notAnswered > 0 || counts.notVisited > 0
  return (
    <Sheet open={open} onClose={onClose} title="Submit sheet" description="Check the receipt before final submission. Answered includes answers marked for review." side="bottom" size="lg">
      <div className="mx-auto max-w-lg">
        <motion.ol initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }} className="divide-y divide-dashed divide-line border-y border-line font-mono text-sm tabular-nums" data-testid="submit-counts" aria-label="Submission counts">
          {rows.map(([label, value]) => (
            <motion.li key={label} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: durations.micro } } }} className="flex items-center justify-between py-3">
              <span className="text-body">{label}</span><span className="text-heading">{value}</span>
            </motion.li>
          ))}
          <li className="flex items-center justify-between py-3 font-[560] text-heading"><span>Total</span><span data-testid="submit-total">{counts.total}</span></li>
          {typeof remainingSeconds === 'number' ? (
            <li className="flex items-center justify-between py-3"><span className="text-body">Time remaining</span><span data-testid="submit-remaining">{formatRemaining(remainingSeconds)}</span></li>
          ) : null}
        </motion.ol>
        {hasUnanswered ? (
          <p role="alert" className="mt-3 rounded-sm border border-review bg-[color-mix(in_oklab,var(--color-review)_18%,transparent)] px-3 py-2 text-xs leading-relaxed text-review-fg">
            {counts.notAnswered + counts.notVisited} question(s) have no saved response. Submitting now cannot be undone.
          </p>
        ) : null}
        <p className="mt-3 text-2xs text-muted">{online ? 'Final submission cannot be undone. The sheet locks the moment you confirm.' : 'You are offline. The sheet will be finalised on this device and synced when the connection returns.'}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="secondary" size="lg" full onClick={onClose} disabled={isPending}>Return to exam</Button>
          <Button variant="primary" size="lg" full onClick={onSubmit} loading={isPending}>Confirm submission</Button>
        </div>
      </div>
    </Sheet>
  )
}
