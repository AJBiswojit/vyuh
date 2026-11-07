/**
 * Motion vocabulary. Every animation in the app names one of these instead of
 * inventing durations, so the timing story stays consistent and reduced motion
 * has a single switch.
 *
 * Entrances: cubic-bezier(0.16, 1, 0.3, 1).
 * Taps and status changes: spring, stiffness 500, damping 30.
 */

export const easeEntrance = /** @type {[number, number, number, number]} */ ([0.16, 1, 0.3, 1])
export const easeExit = /** @type {[number, number, number, number]} */ ([0.4, 0, 1, 1])
export const easeStandard = /** @type {[number, number, number, number]} */ ([0.2, 0, 0, 1])

export const durations = {
  micro: 0.175,
  standard: 0.325,
  expressive: 0.75,
}

export const spring = { type: 'spring', stiffness: 500, damping: 30 }

/** Page-level entrance. A short rise and fade, never a slide across the viewport. */
export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: durations.standard, ease: easeEntrance },
}

/** Staggered list container. Children use `listItem`. */
export const listContainer = (stagger = 0.045, delay = 0) => ({
  initial: 'hidden',
  animate: 'visible',
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  },
})

export const listItem = {
  variants: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: durations.standard, ease: easeEntrance } },
  },
}

/** Tap feedback for buttons and keypad keys. */
export const tapScale = {
  whileTap: { scale: 0.975 },
  transition: spring,
}

/** Drawer / sheet. Slides from its own edge only. */
export const sheetMotion = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { duration: durations.standard, ease: easeEntrance },
}

export const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: durations.micro, ease: easeStandard },
}
