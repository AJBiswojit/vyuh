import { useCallback, useState } from 'react'
import { FileText, ShieldCheck } from 'lucide-react'
import { Button, Checkbox, Dialog } from '@/shared/ui'
import { isMockMode } from '@/shared/lib/services.js'

/** @param {{ values: Record<string, unknown>, errors: Record<string, string>, setValue: (name: any, value: any) => void, onBlur: (name: any) => void, disabled?: boolean }} props */
export function ConsentFields({ values, errors, setValue, onBlur, disabled }) {
  const [termsOpen, setTermsOpen] = useState(false)
  const closeTerms = useCallback(() => setTermsOpen(false), [])
  return (
    <fieldset disabled={disabled} className="min-w-0 border-t border-line pt-5">
      <legend className="sr-only">Required agreements</legend>
      <div className="mb-4 flex items-start gap-2.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2 className="text-xs font-[600] text-heading">Your attendance, explained</h2>
          <p id="attendance-policy" className="mt-1.5 text-xs leading-relaxed text-muted">
            Vyuh records live-class join and leave times, attendance status, and the class and batch identifier.
            This helps your institute maintain attendance records and lets faculty follow up on missed classes.
            If you add a guardian email, it is used only for attendance summaries.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">No location, camera, microphone, or browsing activity is tracked for attendance.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <Checkbox id="termsConsent" name="termsConsent" label="I accept the Terms of Use (required)" checked={Boolean(values.termsConsent)} onChange={(event) => setValue('termsConsent', event.target.checked)} onBlur={() => onBlur('termsConsent')} error={errors.termsConsent} required aria-required="true" />
          <button type="button" onClick={() => setTermsOpen(true)} className="ml-8 inline-flex min-h-11 items-center gap-1.5 rounded-xs text-xs text-muted underline decoration-line-strong underline-offset-4 hover:text-heading"><FileText className="size-3.5" aria-hidden="true" />Read the Terms</button>
        </div>
        <Checkbox id="attendanceConsent" name="attendanceConsent" label="I agree to the attendance data policy (required)" description="I understand what is recorded, why it is needed, and how the optional guardian email is used." checked={Boolean(values.attendanceConsent)} onChange={(event) => setValue('attendanceConsent', event.target.checked)} onBlur={() => onBlur('attendanceConsent')} error={errors.attendanceConsent} aria-describedby="attendance-policy" required aria-required="true" />
      </div>
      {isMockMode ? <p className="mt-4 text-2xs leading-relaxed text-faint">Demo only: details stay in this browser. No email is sent and no attendance events are collected.</p> : null}
      <Dialog open={termsOpen} onClose={closeTerms} title="Terms of Use — demo summary" description="Please review before accepting.">
        <div className="space-y-3 text-xs leading-relaxed">
          <p>Use your own account and keep your password private. Your institute manages enrolment, batch membership, and academic records.</p>
          <p>Practice scores and attendance are available to you, your batch faculty, and the academic office. Do not upload another person’s personal information.</p>
          <p>Attendance collection is limited to the policy shown on the signup form. Ask your academic office about corrections, retention, or access to your records.</p>
          <p className="border-t border-line pt-3 text-muted">This is a demonstration summary, not a production legal agreement. A live deployment must replace it with the institute’s approved Terms.</p>
        </div>
        <Button className="mt-5" variant="secondary" onClick={closeTerms}>Back to signup</Button>
      </Dialog>
    </fieldset>
  )
}
