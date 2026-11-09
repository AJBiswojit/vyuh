import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/ui'
import { useCountdown } from '@/features/auth/hooks/useCountdown.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'
import { durations, easeEntrance } from '@/shared/lib/motion.js'

/**
 * Non-modal attention check. Slides up, drains over the policy window, and is
 * operable by keyboard without trapping focus in the live room.
 * @param {{ challenge: import('@/contracts/learning.js').AttentionChallenge, onRespond: () => void, busy?: boolean }} props
 */
export function AttentionToast({ challenge, onRespond, busy }) {
  const remaining = useCountdown(Date.parse(challenge.expiresAt))
  const reduced = usePrefersReducedMotion()
  const buttonRef = useRef(/** @type {HTMLButtonElement|null} */ (null))
  useEffect(() => { buttonRef.current?.focus({ preventScroll: true }) }, [challenge.id])
  const fraction = Math.max(0, Math.min(1, remaining / challenge.windowSeconds))
  const circumference = 2 * Math.PI * 18
  return (
    <motion.section
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-label="Attention check"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.standard, ease: easeEntrance }}
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-4 rounded-md border border-info bg-surface-raised p-4 shadow-[var(--shadow-overlay)]"
      data-testid="attention-check"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="-rotate-90 shrink-0">
        <circle cx="24" cy="24" r="18" fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle cx="24" cy="24" r="18" fill="none" stroke="var(--color-info)" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fraction)} style={{ transition: reduced ? 'none' : 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-[560] text-heading">Still with us?</p>
        <p className="mt-0.5 text-2xs text-muted">Confirm within <span className="font-mono tabular-nums text-heading">{remaining}s</span> to keep your presence score.</p>
      </div>
      <Button ref={buttonRef} variant="secondary" size="sm" onClick={onRespond} loading={busy}>Still here</Button>
    </motion.section>
  )
}
