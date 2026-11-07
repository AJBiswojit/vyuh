import { ToolPanel } from './ToolPanel.jsx'

/** @param {{ fontSize: number, onChange: (value: number) => void, onClose: () => void, initial?: { x: number, y: number } }} props */
export function FontSizePanel({ fontSize, onChange, onClose, initial }) {
  return (
    <ToolPanel title="Question font size" onClose={onClose} initial={initial} width={300}>
      <label className="flex flex-col gap-3 text-xs text-heading">
        <span className="flex justify-between"><span>Reading size</span><span className="font-mono tabular-nums">{fontSize}px</span></span>
        <input type="range" min={16} max={28} step={1} value={fontSize} onChange={(event) => onChange(Number(event.target.value))} aria-label="Question font size" className="accent-ember" />
      </label>
      <p className="mt-3 text-2xs text-muted">Applies to question text and options. The timer and keypad stay fixed.</p>
    </ToolPanel>
  )
}
