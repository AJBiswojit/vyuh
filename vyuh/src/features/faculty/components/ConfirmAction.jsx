import { useState } from 'react'
import { Dialog } from '@/shared/ui'

/**
 * One confirmation shape for every destructive action in the workspace.
 *
 * The pattern is a render prop so the trigger keeps whatever shape the row
 * needs — a danger button, an icon button, a menu item — while the dialog, its
 * wording and its busy state stay identical everywhere:
 *
 *   <ConfirmAction title="Delete this question?" … onConfirm={…}>
 *     {(open) => <Button variant="danger" onClick={open}>Delete</Button>}
 *   </ConfirmAction>
 *
 * `detail` is where the consequence goes. "This cannot be undone" is not a
 * consequence; "twelve students' scores will be recalculated" is.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.detail]
 * @param {string} props.confirmLabel
 * @param {string} [props.cancelLabel]
 * @param {'danger'|'neutral'} [props.tone]
 * @param {boolean} [props.busy]
 * @param {() => void} props.onConfirm
 * @param {(open: () => void) => React.ReactNode} props.children
 */
export function ConfirmAction({
  title,
  description,
  detail,
  confirmLabel,
  cancelLabel = 'Keep it',
  tone = 'danger',
  busy = false,
  onConfirm,
  children,
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {children(() => setOpen(true))}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        tone={tone}
        busy={busy}
        onConfirm={() => {
          onConfirm()
          setOpen(false)
        }}
      >
        {detail}
      </Dialog>
    </>
  )
}
