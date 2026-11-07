import { Kbd, Sheet } from '@/shared/ui'

/** @param {{ open: boolean, onClose: () => void }} props */
export function ShortcutSheet({ open, onClose }) {
  const rows = /** @type {Array<{ keys: string[], label: string }>} */ ([
    { keys: ['1', '2', '3', '4'], label: 'Select option A–D' },
    { keys: ['N'], label: 'Save and next' },
    { keys: ['M'], label: 'Mark for review and next' },
    { keys: ['C'], label: 'Clear response' },
    { keys: ['P'], label: 'Previous question' },
    { keys: ['?'], label: 'Open this sheet' },
  ])
  return (
    <Sheet open={open} onClose={onClose} title="Keyboard shortcuts" description="Shortcuts pause while typing in the calculator, numerical answer field, or any input." side="bottom">
      <ul className="divide-y divide-line">
        {rows.map(({ keys, label }) => (
          <li key={label} className="flex items-center justify-between gap-4 py-3 text-xs text-body">
            <span>{label}</span>
            <span className="flex gap-1">{keys.map((key) => <Kbd key={key}>{key}</Kbd>)}</span>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
