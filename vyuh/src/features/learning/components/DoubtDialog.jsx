import { useState } from 'react'
import { Dialog, Input } from '@/shared/ui'
import { formatClock } from '@/shared/lib/format.js'

/** @param {{ open: boolean, onClose: ()=>void, recordingTitle: string, timeSeconds: number, onSubmit: (input:{title:string,body:string})=>void, busy?: boolean, error?: string|null }} props */
export function DoubtDialog({ open, onClose, recordingTitle, timeSeconds, onSubmit, busy, error }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  return (
    <Dialog open={open} onClose={onClose} title="Ask about this moment" description={`${recordingTitle} · attached at ${formatClock(timeSeconds)}`} confirmLabel="Post doubt" busy={busy} onConfirm={() => { if (title.trim() && body.trim()) onSubmit({ title, body }) }}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (title.trim() && body.trim()) onSubmit({ title, body }) }}>
        <Input label="Doubt title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="What exactly is unclear?" required />
        <div className="space-y-2">
          <label htmlFor="doubt-body" className="text-xs font-[560] text-heading">Describe the step</label>
          <textarea id="doubt-body" value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={2000} required placeholder="Include what you tried and where the reasoning breaks…" className="w-full rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs text-heading placeholder:text-faint" />
        </div>
        {error ? <p role="alert" className="text-xs text-danger-fg">{error}</p> : null}
      </form>
    </Dialog>
  )
}
