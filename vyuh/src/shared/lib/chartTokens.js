/**
 * Recharts needs concrete colour strings; the design system forbids colour
 * literals outside tokens.css. So the chart reads the computed custom properties
 * off the document instead of duplicating values.
 *
 * Custom properties resolve to their *specified* value via getPropertyValue, so
 * the semantic aliases (which are var() references) need following once. That is
 * exactly what `readVar` does.
 */

/** @param {string} name @returns {string} */
function readVar(name) {
  if (typeof window === 'undefined') return ''
  const root = getComputedStyle(document.documentElement)
  const value = root.getPropertyValue(name).trim()
  if (value.startsWith('var(')) {
    const inner = value.slice(4, -1).trim()
    return root.getPropertyValue(inner).trim()
  }
  return value
}

/**
 * A palette for one chart, resolved for the current theme.
 * @returns {{ surface: string, grid: string, axisText: string, ember: string, idle: string, ink: string }}
 */
export function readChartTokens() {
  return {
    surface: readVar('--color-surface'),
    grid: readVar('--color-line'),
    axisText: readVar('--color-faint'),
    ember: readVar('--color-ember'),
    idle: readVar('--color-idle'),
    ink: readVar('--color-ink'),
  }
}
