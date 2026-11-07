/** Tiny score sparkline. Uses currentColor so the parent owns the token. */
/** @param {{ values: number[], label: string }} props */
export function Sparkline({ values, label }) {
  if (values.length < 2) return <span className="font-mono text-2xs text-faint">—</span>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((/** @type {number} */ value, /** @type {number} */ index) => `${(index / (values.length - 1)) * 64},${18 - ((value - min) / span) * 16}`).join(' ')
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" role="img" aria-label={label} className="text-ember-press">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
