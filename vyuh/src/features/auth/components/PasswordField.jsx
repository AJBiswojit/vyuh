import { useId, useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { IconButton, Input } from '@/shared/ui'
import { passwordStrength } from '../lib/passwordStrength.js'
import { cn } from '@/shared/lib/cn.js'

/** @param {React.ComponentProps<typeof Input> & { strength?: boolean }} props */
export function PasswordField({ strength = false, ...props }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const value = String(props.value ?? '')
  const result = passwordStrength(value)
  return (
    <div className="flex flex-col gap-2.5">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        icon={<LockKeyhole strokeWidth={1.5} />}
        aria-describedby={strength ? `${id}-strength ${id}-requirements` : undefined}
        className="min-h-12 text-sm"
        trailing={<IconButton icon={visible ? <EyeOff strokeWidth={1.5} /> : <Eye strokeWidth={1.5} />} label={`${visible ? 'Hide' : 'Show'} ${props.label?.toLowerCase() ?? 'password'}`} aria-pressed={visible} onClick={() => setVisible((current) => !current)} disabled={props.disabled} />}
      />
      {strength ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 gap-1" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={result.score} aria-valuetext={result.label} aria-describedby={`${id}-requirements`}>
              {[1, 2, 3, 4].map((step) => <span key={step} className={cn('h-1 flex-1 rounded-full', step <= result.score ? result.score <= 2 ? 'bg-review' : 'bg-answer' : 'bg-line')} />)}
            </div>
            <span id={`${id}-strength`} className="min-w-16 text-right text-2xs font-[560] text-muted" aria-live="polite">{result.label}</span>
          </div>
          <p id={`${id}-requirements`} className="text-xs leading-relaxed text-muted">{result.hints.join(' ')}</p>
        </div>
      ) : null}
    </div>
  )
}
