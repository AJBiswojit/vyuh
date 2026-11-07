import { useId, useState } from 'react'
import { Button, Dialog } from '@/shared/ui'

/**
 * A decision that cannot be saved without a note.
 *
 * The requirement is not a formality: an integrity decision, a rejection or a
 * removed message is shown to a candidate, a faculty member or a guardian, and
 * the note is the sentence they are shown. So the primary stays disabled until
 * something has actually been written, and the dialog says who will read it.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.detail]
 * @param {string} props.noteLabel
 * @param {string} [props.noteHint]
 * @param {string} [props.placeholder]
 * @param {string} props.confirmLabel
 * @param {'danger'|'neutral'} [props.tone]
 * @param {boolean} [props.busy]
 * @param {number} [props.minLength]
 * @param {React.ReactNode} [props.extra]        Fields above the note (a schedule window, for example).
 * @param {(note: string) => void} props.onConfirm
 * @param {(open: () => void) => React.ReactNode} props.children
 */
export function RequireNoteDialog({
  title,
  description,
  detail,
  noteLabel = 'Note for the record',
  noteHint,
  placeholder = 'What happened, and why this is the right decision.',
  confirmLabel,
  tone = 'danger',
  busy = false,
  minLength = 4,
  onConfirm,
  children,
  extra = null,
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const fieldId = useId()
  const ready = note.trim().length >= minLength

  const close = () => {
    setOpen(false)
    setNote('')
  }

  return (
    <>
      {children(() => setOpen(true))}
      <Dialog
        open={open}
        onClose={close}
        title={title}
        description={description}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!ready || busy) return
            onConfirm(note.trim())
            setOpen(false)
            setNote('')
          }}
          className="space-y-4"
        >
          {detail}
          {extra}
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId} className="text-xs font-[560] tracking-tight text-heading">
              {noteLabel}
            </label>
            <textarea
              id={fieldId}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder={placeholder}
              aria-describedby={`${fieldId}-hint`}
              className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            />
            <p id={`${fieldId}-hint`} className="text-2xs leading-relaxed text-muted">
              {noteHint ?? 'This note is kept in the audit ledger and is what the other party reads.'}
            </p>
            <p className="font-mono text-2xs tabular-nums text-faint" aria-live="polite">
              {ready ? `${note.trim().length} characters · ready to save` : `At least ${minLength} characters`}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={busy}
              disabled={!ready}
            >
              {confirmLabel}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
