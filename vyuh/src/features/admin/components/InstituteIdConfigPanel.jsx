import { useState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'
import { Button, Card, Input, useToast } from '@/shared/ui'
import { useConfigureInstituteIds, useInstituteIdConfig, useInstituteIdPreview } from '../hooks/useAdminOps.js'

/**
 * BATCH 3 (WS2 B) — Admin-only Institute ID year-token configuration.
 *
 * The token is supplied by the institute, not derived from the clock: Batch 2
 * ships `year: null` and student provisioning is blocked until it is set.
 * Saving it changes config only; issued IDs and the permanent, non-decreasing
 * counters are never rewritten. Faculty IDs carry no year token.
 */
export function InstituteIdConfigPanel() {
  const toast = useToast()
  const config = useInstituteIdConfig()
  const save = useConfigureInstituteIds()
  const studentPreview = useInstituteIdPreview('student')
  const facultyPreview = useInstituteIdPreview('faculty')
  const [year, setYear] = useState('')
  const configured = config.data?.year ?? null
  const blocked = config.data ? !config.data.studentCreationAvailable : false

  const submit = (event) => {
    event.preventDefault()
    const value = year.trim()
    if (value && !/^\d{2}$/.test(value)) {
      toast.error('Check the token', 'The institute year token is exactly two digits, for example 26.')
      return
    }
    save.mutate(
      { year: value || null },
      {
        onSuccess: (next) => {
          setYear('')
          toast.success('Institute ID settings saved', next.year ? `Year token ${next.year} is active.` : 'Student creation is blocked until a token is supplied.')
        },
        onError: (/** @type {Error} */ error) => toast.error('Not saved', error.message),
      },
    )
  }

  return (
    <Card
      eyebrow="Institute ID settings"
      title="Academic-year token"
      tone="paper"
      className="mb-4"
      action={<KeyRound className="size-4 text-muted" strokeWidth={1.5} aria-hidden="true" />}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {blocked ? (
            <div role="alert" className="flex gap-3 rounded-sm border border-danger/40 bg-danger/5 p-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger-fg" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-2xs leading-relaxed text-body">
                No year token is configured. Student creation and student rows in a CSV import are blocked until the
                institute supplies its two-digit token. Faculty accounts can still be created.
              </p>
            </div>
          ) : (
            <p className="text-2xs leading-relaxed text-muted">
              Year token <span className="font-mono text-heading">{configured}</span> is active. Student IDs are
              <span className="font-mono text-heading"> VYU-S-{configured}-NNNN</span>; faculty IDs are
              <span className="font-mono text-heading"> VYU-F-NNNN</span>. The token never rolls over automatically and
              no date is used to generate it. Existing issued IDs and counters are never changed or reused.
            </p>
          )}
          <p className="mt-3 font-mono text-2xs text-faint" role="status">
            Next student ID: {studentPreview.data?.ok ? studentPreview.data.instituteId : 'unavailable'}
            {' · '}Next faculty ID: {facultyPreview.data?.ok ? facultyPreview.data.instituteId : 'unavailable'}
          </p>
        </div>
        <form onSubmit={submit} className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-end lg:w-auto">
          <Input
            label="Institute-supplied year token"
            hint="Two digits, e.g. 26. Leave blank to clear."
            inputMode="numeric"
            maxLength={2}
            value={year}
            onChange={(event) => setYear(event.target.value.replace(/[^\d]/g, ''))}
            className="sm:w-52"
          />
          <Button type="submit" variant="secondary" loading={save.isPending}>
            Save token
          </Button>
        </form>
      </div>
    </Card>
  )
}
