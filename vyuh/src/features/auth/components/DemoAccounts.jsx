import { useState } from 'react'
import { ArrowRight, FlaskConical, GraduationCap, Presentation, ShieldCheck } from 'lucide-react'
import { demoSeats, demoScenarios, demoCredentials, isMockMode } from '@/shared/lib/services.js'
import { roleLabel } from '@/shared/lib/roles.js'

const ICONS = { student: GraduationCap, faculty: Presentation, admin: ShieldCheck }
/** @param {{ onSelect: (seat: { email: string, role: import('../../../contracts/user.js').Role }) => void, onScenario: (email: string) => void, disabled?: boolean }} props */
export function DemoAccounts({ onSelect, onScenario, disabled }) {
  const [showScenarios, setShowScenarios] = useState(false)
  // Never render demo credentials or a demo sign-in path in an API build.
  if (!isMockMode) return null
  return (
    <section aria-labelledby="demo-heading" className="mt-7 rounded-md border border-line bg-surface-sunken p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="demo-heading" className="flex items-center gap-2 text-xs font-[600] text-heading"><FlaskConical className="size-4 text-muted" strokeWidth={1.5} aria-hidden="true" />Demo accounts</h2>
        <span className="font-mono text-2xs uppercase tracking-wider text-faint">Mock only</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">Take a seat. These buttons sign you straight into a demo workspace.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {demoSeats.map((seat) => {
          const Icon = ICONS[seat.role]
          return (
            <button key={seat.role} type="button" className="inline-flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-sm border border-line bg-surface-raised px-2 text-heading transition-colors hover:border-heading hover:bg-surface disabled:cursor-not-allowed disabled:text-faint" onClick={() => onSelect(seat)} disabled={disabled} aria-label={`Quick demo login as ${roleLabel(seat.role)}`}>
              <Icon className="size-[1.125rem]" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-xs">{roleLabel(seat.role)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 font-mono text-2xs leading-relaxed text-faint">Demo password: <span className="select-all text-muted">{demoCredentials}</span> · Sessions last 8 hours.</p>
      <button type="button" onClick={() => setShowScenarios((value) => !value)} aria-expanded={showScenarios} aria-controls="demo-scenarios" className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-xs text-xs text-muted underline decoration-line-strong underline-offset-4 hover:text-heading">
        {showScenarios ? 'Hide' : 'Try'} error scenarios <ArrowRight className="size-3" aria-hidden="true" />
      </button>
      {showScenarios ? (
        <div id="demo-scenarios" className="border-t border-line pt-3">
          <p className="text-xs text-muted">Fill the form, then submit to see the message.</p>
          <div className="mt-1 flex flex-wrap gap-x-4">
            {demoScenarios.map((scenario) => <button key={scenario.email} type="button" disabled={disabled} onClick={() => onScenario(scenario.email)} className="min-h-11 rounded-xs text-xs font-[560] text-heading underline decoration-line-strong underline-offset-4 hover:decoration-ember">{scenario.label}</button>)}
          </div>
          {/* The retired invitation route is no longer linked from the demo panel. */}
          <p className="mt-2 text-2xs leading-relaxed text-faint">Institute accounts are issued by the academic office, not created here.</p>
        </div>
      ) : null}
    </section>
  )
}
