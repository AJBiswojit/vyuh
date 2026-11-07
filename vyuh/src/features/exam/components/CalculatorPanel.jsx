import { useState } from 'react'
import { cn } from '@/shared/lib/cn.js'
import { calculateExpression, formatCalculatorResult } from '../lib/calculator.js'
import { ToolPanel } from './ToolPanel.jsx'

/** @param {{ onClose: () => void, initial?: { x: number, y: number } }} props */
export function CalculatorPanel({ onClose, initial }) {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState(/** @type {string | null} */ (null))
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [scientific, setScientific] = useState(false)
  const [angle, setAngle] = useState(/** @type {'deg'|'rad'} */ ('deg'))
  function evaluate() {
    try { setResult(formatCalculatorResult(calculateExpression(expression, angle))); setError(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not calculate'); setResult(null) }
  }
  /** @param {string} token */
  function insert(token) { setExpression((value) => `${value}${token}`); setError(null) }
  const basic = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '(', ')', '+', '^', '!', '%']
  const science = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt(', 'pi', 'e']
  return (
    <ToolPanel title="Calculator" onClose={onClose} initial={initial} width={360}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex rounded-sm border border-line p-0.5">
            {['basic', 'scientific'].map((mode) => (
              <button key={mode} type="button" aria-pressed={scientific === (mode === 'scientific')} onClick={() => setScientific(mode === 'scientific')} className={cn('min-h-9 rounded-xs px-2 text-2xs capitalize', scientific === (mode === 'scientific') ? 'bg-surface-sunken text-heading' : 'text-muted')}>{mode}</button>
            ))}
          </div>
          <button type="button" onClick={() => setAngle((value) => value === 'deg' ? 'rad' : 'deg')} className="min-h-9 rounded-sm border border-line px-2 font-mono text-2xs uppercase text-heading" aria-label={`Angle mode ${angle}`}>{angle}</button>
        </div>
        <input
          data-calculator-input
          aria-label="Calculator expression"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); evaluate() } }}
          className="min-h-12 rounded-sm border border-line-strong bg-surface px-3 font-mono text-sm text-heading outline-none focus-visible:border-ember"
          placeholder="Type an expression"
          autoComplete="off"
        />
        <output className="min-h-10 rounded-sm bg-surface-sunken px-3 py-2 font-mono text-sm tabular-nums text-heading" aria-live="polite">{error ?? result ?? 'Result appears here'}</output>
        {scientific ? <div className="grid grid-cols-4 gap-1.5">{science.map((token) => <button key={token} type="button" onClick={() => insert(token)} className="min-h-11 rounded-sm border border-line bg-surface font-mono text-2xs text-heading hover:bg-surface-sunken">{token.replace('(', '')}</button>)}</div> : null}
        <div className="grid grid-cols-4 gap-1.5">
          {basic.map((token) => <button key={token} type="button" onClick={() => insert(token)} className="min-h-11 rounded-sm border border-line bg-surface font-mono text-sm text-heading hover:bg-surface-sunken">{token}</button>)}
          <button type="button" onClick={() => { setExpression(''); setResult(null); setError(null) }} className="min-h-11 rounded-sm border border-line bg-surface text-2xs text-heading hover:bg-surface-sunken">AC</button>
          <button type="button" onClick={() => setExpression((value) => value.slice(0, -1))} className="min-h-11 rounded-sm border border-line bg-surface text-2xs text-heading hover:bg-surface-sunken">Back</button>
          <button type="button" onClick={evaluate} className="col-span-2 min-h-11 rounded-sm border border-heading bg-heading text-2xs font-[560] text-on-inverse">=</button>
        </div>
        <p className="text-2xs text-muted">Exam shortcuts pause while you type in this field.</p>
      </div>
    </ToolPanel>
  )
}
