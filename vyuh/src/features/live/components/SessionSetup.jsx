import { useEffect, useState } from 'react'
import { Badge, Button, Input, Select } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

/** @param {import('@/contracts/liveStudio.js').StudioSetup} setup */
function toForm(setup) {
  return {
    title: setup.title, subjectName: setup.subjectName, batchName: setup.batchName,
    description: setup.description, recordingPreference: setup.recordingPreference ? 'on' : 'off',
  }
}

/** One comparable signature for both the shared setup and the local form. */
function signatureFrom(values) {
  const recording = values.recordingPreference === true || values.recordingPreference === 'on'
  return [values.title, values.subjectName, values.batchName, values.description, recording].join('\u0000')
}

/**
 * Faculty session setup. Saving writes a recorded `setup_saved` mock event; the
 * seeded catalogue state and the recorded studio lifecycle are shown separately
 * so neither is mistaken for a verified live status.
 *
 * R17: the success state is DERIVED from the saved signature, so the shared
 * state update produced by the save can no longer clear it. External/shared
 * setup changes are adopted only while the form is clean; unsaved typing is
 * never overwritten by another tab.
 * @param {{ setup: import('@/contracts/liveStudio.js').StudioSetup, status: string, send: (type:string,payload?:Object)=>void }} props
 */
export function SessionSetup({ setup, status, send }) {
  const [form, setForm] = useState(() => toForm(setup))
  const [savedSignature, setSavedSignature] = useState(null)
  const setupSignature = signatureFrom(setup)
  const formSignature = signatureFrom(form)
  const dirty = formSignature !== setupSignature
  const saved = savedSignature !== null && savedSignature === setupSignature && !dirty

  useEffect(() => {
    if (dirty) return
    setForm(toForm(setup))
  }, [setupSignature, dirty])

  /** @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>} event */
  const change = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
    setSavedSignature(null)
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-sm border border-hairline-on-ink bg-ink-raised p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!dirty) return
        send('setup_saved', {
          title: form.title, subjectName: form.subjectName, batchName: form.batchName,
          description: form.description, recordingPreference: form.recordingPreference === 'on',
        })
        setSavedSignature(formSignature)
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="rule-label text-on-ink-label">Session setup</p>
          <p className="mt-1 text-2xs leading-relaxed text-on-ink-muted">Prototype details saved to the shared classroom state.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="review" variant="soft">Catalogue: {setup.catalogueStatus} (seeded)</Badge>
          <Badge tone={status === 'live' ? 'answer' : status === 'ended' ? 'danger' : 'neutral'} variant="soft">
            Studio: {status === 'live' ? 'live' : status === 'ended' ? 'ended' : 'scheduled'} (recorded)
          </Badge>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        <Input label="Session title" name="title" value={form.title} onChange={change} maxLength={160} hint="Shown in the program monitor and Student Classroom." />
        <Input label="Subject" name="subjectName" value={form.subjectName} onChange={change} maxLength={80} />
        <Input label="Batch" name="batchName" value={form.batchName} onChange={change} maxLength={80} />
        <Select
          label="Simulated recording preference"
          name="recordingPreference"
          value={form.recordingPreference}
          onChange={change}
          options={[{ value: 'off', label: 'Off — no simulated recording' }, { value: 'on', label: 'On — simulated recording only' }]}
          hint="A preference only. No video is captured, stored or transmitted."
        />
        <label className="flex w-full flex-col gap-2 md:col-span-2 2xl:col-span-2">
          <span className="text-xs font-[560] tracking-tight text-heading">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            maxLength={500}
            rows={2}
            placeholder="What this session covers"
            className={cn(
              'min-h-[var(--spacing-touch)] w-full rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs text-heading',
              'placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
            )}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={!dirty}>Save setup</Button>
        <p role="status" aria-live="polite" className="text-2xs text-on-ink-muted">
          {saved ? 'Setup saved as a recorded mock event.' : dirty ? 'Unsaved changes.' : 'No unsaved changes.'}
        </p>
      </div>
    </form>
  )
}
