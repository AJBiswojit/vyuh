import { AnimatePresence, motion } from 'framer-motion'
import { PresenceRing } from './PresenceRing.jsx'
import { VerdictChip } from './VerdictChip.jsx'
import { durations } from '@/shared/lib/motion.js'

/** @param {{ attendance: import('@/contracts/learning.js').LiveAttendanceState|null, policy: import('@/contracts/learning.js').AttendancePolicy }} props */
export function AttendanceStrip({ attendance, policy }) {
  const percent = attendance?.presencePercent ?? 0
  const verdict = attendance?.verdict ?? 'Absent'
  const delta = attendance?.lastDelta ?? 0
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-surface-raised px-4 py-3" data-testid="attendance-strip">
      <PresenceRing percent={percent} />
      <div className="min-w-0 flex-1">
        <p className="rule-label">Automatic attendance</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-[560] text-heading">
          <output data-testid="live-presence" aria-live="polite">{verdict}, {percent}%</output>
          <AnimatePresence>
            {delta !== 0 ? (
              <motion.span key={`${attendance?.updatedAt}-${delta}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: durations.micro }} className={delta > 0 ? 'font-mono text-2xs text-answer-fg' : 'font-mono text-2xs text-danger-fg'} aria-label={`Score changed by ${delta} points`}>
                {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </p>
      </div>
      <VerdictChip verdict={verdict} />
      <p className="w-full text-2xs leading-relaxed text-muted sm:w-auto sm:max-w-xs">Present at {policy.thresholdPercent}%+. First {policy.graceMinutes} min are grace. “Still here” +{policy.attentionReward}; missed −{policy.attentionPenalty}.</p>
    </div>
  )
}
