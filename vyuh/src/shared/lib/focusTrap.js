/**
 * Focus containment for modal layers (Dialog, Sheet).
 *
 * Not a library: a modal in this product needs four things and nothing else —
 * move focus in, keep Tab inside, close on Escape, give focus back. Keeping it
 * here means every floating layer behaves identically.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

/**
 * @param {HTMLElement | null} container
 * @returns {HTMLElement[]}
 */
export function focusableWithin(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (node) => !node.hasAttribute('inert') && node.getAttribute('aria-hidden') !== 'true',
  )
}

/**
 * Wires a container as a modal: traps Tab, closes on Escape, restores focus.
 * Returns the cleanup function.
 *
 * @param {HTMLElement | null} container
 * @param {{ onClose: () => void, initialFocusRef?: React.RefObject<HTMLElement | null> }} options
 * @returns {() => void}
 */
export function trapFocus(container, { onClose, initialFocusRef }) {
  const previouslyFocused = /** @type {HTMLElement | null} */ (document.activeElement)

  const target = initialFocusRef?.current ?? focusableWithin(container)[0] ?? container
  target?.focus({ preventScroll: true })

  /** @param {KeyboardEvent} event */
  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return

    const nodes = focusableWithin(container)
    if (nodes.length === 0) {
      event.preventDefault()
      return
    }

    const first = nodes[0]
    const last = nodes[nodes.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  document.addEventListener('keydown', onKeyDown, true)

  return () => {
    document.removeEventListener('keydown', onKeyDown, true)
    previouslyFocused?.focus({ preventScroll: true })
  }
}

/**
 * Locks page scroll while a modal is open, restoring on close. Compensates for
 * the scrollbar width so the layout behind does not jump.
 * @returns {() => void}
 */
export function lockScroll() {
  const { body } = document
  const previousOverflow = body.style.overflow
  const previousPadding = body.style.paddingRight
  const scrollbar = window.innerWidth - document.documentElement.clientWidth

  body.style.overflow = 'hidden'
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

  return () => {
    body.style.overflow = previousOverflow
    body.style.paddingRight = previousPadding
  }
}
