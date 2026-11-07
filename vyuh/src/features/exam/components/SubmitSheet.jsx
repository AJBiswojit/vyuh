import { motion } from 'framer-motion'
import { Button, Sheet } from '@/shared/ui'
import { durations } from '@/shared/lib/motion.js'

/** @param {{ open: boolean, onClose: () => void, counts: import('@/contracts/exam.js').ExamSubmissionCounts, onSubmit: () => void, isPending: boolean, online: boolean }} props */
export function SubmitSheet({ open, onClose, counts, onSubmit, isPending, online }) {
  const rows = [
    ['Answered', counts.answered],
    ['Not answered', counts.notAnswered],
    ['Marked for review', counts.review],
    ['Not visited', counts.notVisited],
  ]
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
        </motion.ol>
        <p className="mt-3 text-2xs text-muted">{online ? 'Final submission cannot be undone.' : 'You are offline. The sheet will be finalised on this device and synced when the connection returns.'}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="secondary" size="lg" full onClick={onClose} disabled={isPending}>Cancel and return</Button>
          <Button variant="primary" size="lg" full onClick={onSubmit} loading={isPending}>Submit final answers</Button>
        </div>
      </div>
    </Sheet>
  )
}
