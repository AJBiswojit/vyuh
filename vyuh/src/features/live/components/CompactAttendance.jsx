import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { durations } from '@/shared/lib/motion.js'

/**
 * Compact automatic-attendance indicator — the one attendance signal a student
 * needs while class is running. The full policy and verdict history live in
 * the Attendance section; this strip never shows event counts or internals.
 *
 * @param {{ attendance: import('@/contracts/learning.js').LiveAttendanceState|null, loading?: boolean }} props
 */
export function CompactAttendance({ attendance, loading }) {
  const percent = attendance?.presencePercent ?? 0
  const verdict = attendance?.verdict ?? 'Absent'
  const delta = attendance?.lastDelta ?? 0

  return (
    <div
      data-testid="attendance-strip"
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-line bg-surface-raised px-3 py-2"
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={verdict === 'Present' ? 'size-2 rounded-full bg-answer' : verdict === 'Partial' ? 'size-2 rounded-full bg-review' : 'size-2 rounded-full bg-danger'}
        />
        <span className="text-xs font-[560] tracking-tight text-heading">
          <output data-testid="live-presence" aria-live="polite">{loading && !attendance ? 'Marking attendance…' : `${verdict} · ${percent}% attendance`}</output>
        </span>
      </span>
      <AnimatePresence>
        {delta !== 0 ? (
          <motion.span
            key={`${attendance?.updatedAt}-${delta}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.micro }}
            className={delta > 0 ? 'font-mono text-2xs text-answer-fg' : 'font-mono text-2xs text-danger-fg'}
            aria-label={`Score changed by ${delta} points`}
          >
            {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
          </motion.span>
        ) : null}
      </AnimatePresence>
      <span className="text-2xs text-muted">Automatic while this tab is visible</span>
      <Link to="/student/attendance" className="ml-auto text-2xs font-[560] text-heading underline underline-offset-2 hover:text-body">
        Attendance details
      </Link>
    </div>
  )
}
