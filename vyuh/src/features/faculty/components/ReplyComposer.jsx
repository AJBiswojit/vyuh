import { useId, useState } from 'react'
import { Send } from 'lucide-react'
import { Button, Select } from '@/shared/ui'

/**
 * The answer composer. A saved reply fills the box rather than sending itself:
 * the template is a starting point, and a faculty member almost always edits the
 * first line to name the student's own attempt.
 *
 * The send control is the view's one ember primary, so it sits alone in the
 * footer rather than alongside a second filled button.
 *
 * @param {Object} props
 * @param {import('@/contracts/faculty.js').ReplyTemplate[]} props.templates
 * @param {(body: string) => void} props.onSend
 * @param {boolean} [props.busy]
 * @param {string} [props.error]
 * @param {string} [props.placeholder]
 * @param {string} [props.sendLabel]
 */
export function ReplyComposer({ templates, onSend, busy = false, error, placeholder = 'Answer the doubt in plain words. Link a timestamp if it helps.', sendLabel = 'Send answer' }) {
  const [draft, setDraft] = useState('')
  const [templateId, setTemplateId] = useState('')
  const fieldId = useId()
  const errorId = useId()

  const insert = (id) => {
    setTemplateId(id)
    const template = templates.find((item) => item.id === id)
    if (!template) return
    setDraft((current) => (current.trim().length === 0 ? template.body : `${current.trim()}\n\n${template.body}`))
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (draft.trim().length < 4) return
        onSend(draft.trim())
        setDraft('')
        setTemplateId('')
      }}
    >
      <div className="sm:max-w-xs">
        <Select
          label="Saved replies"
          value={templateId}
          onChange={(event) => insert(event.target.value)}
          options={[{ value: '', label: 'Start from scratch' }, ...templates.map((template) => ({ value: template.id, label: template.label }))]}
          hint="Fills the box; it never sends on its own."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={fieldId} className="text-xs font-[560] tracking-tight text-heading">
          Your answer
        </label>
        <textarea
          id={fieldId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={5}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full resize-y rounded-sm border border-line-strong bg-surface-raised px-3 py-2 text-xs leading-relaxed text-heading placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-danger-fg">{error}</p>
        ) : (
          <p className="text-2xs text-muted">The student sees this in their thread and gets a notification.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-2xs tabular-nums text-faint">{draft.trim().length} characters</p>
        <Button type="submit" variant="primary" icon={<Send strokeWidth={1.5} />} loading={busy} disabled={draft.trim().length < 4}>
          {sendLabel}
        </Button>
      </div>
    </form>
  )
}
