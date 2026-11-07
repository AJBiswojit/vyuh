import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn.js'
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion.js'

/** @param {{ remaining: number, source?: 'worker'|'fallback' }} props */
export function ExamTimer({ remaining, source = 'worker' }) {
  const reduced = usePrefersReducedMotion()
  const total = Math.max(0, remaining)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const text = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const tone = total < 60 ? 'danger' : total < 300 ? 'review' : 'normal'
  return (
    <motion.div
      role="timer"
      aria-live="off"
      aria-label={`Time remaining ${hours} hours ${minutes} minutes ${seconds} seconds`}
      data-testid="exam-timer"
      data-tone={tone}
      data-timer-source={source}
      animate={!reduced && tone === 'review' ? { opacity: [1, 0.82, 1] } : { opacity: 1 }}
      transition={tone === 'review' && !reduced ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.175 }}
      className={cn('inline-flex items-center gap-0.5 rounded-sm px-3 py-2 font-mono text-lg font-[560] tabular-nums', tone === 'danger' ? 'bg-danger text-on-signal-inverse' : tone === 'review' ? 'bg-review text-on-signal' : 'bg-heading text-on-inverse')}
    >
      {text.split('').map((char, index) => char === ':' ? <span key={`colon-${index}`} className="px-0.5">:</span> : (
        <span key={index} className="relative inline-block h-[1.2em] w-[0.62em] overflow-hidden align-middle">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={char} initial={{ y: reduced ? 0 : '100%' }} animate={{ y: 0 }} exit={{ y: reduced ? 0 : '-100%' }} transition={{ duration: 0.175 }} className="absolute inset-0 flex items-center justify-center">
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </motion.div>
  )
}
