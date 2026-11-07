import { useState } from 'react'
import { Dialog } from '@/shared/ui'

/**
 * The console's one confirmation shape, deliberately identical to the faculty
 * workspace's so the two seats ask the same questions in the same order.
 *
 * `detail` carries the consequence, not a threat: "the student's sheet moves
 * from 156 to 157", "the paper returns to Dr. Behera with your note attached".
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
