import { Calculator, Contrast, Keyboard, Moon, PenLine, Sun, Type } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useTheme } from '@/shared/hooks/useTheme.js'

/** @param {{ openTool: 'calculator'|'rough'|'font'|null, onToggleTool: (tool: 'calculator'|'rough'|'font') => void, highContrast: boolean, onContrast: () => void, onShortcuts: () => void }} props */
export function ToolsDock({ openTool, onToggleTool, highContrast, onContrast, onShortcuts }) {
  const { resolved, setMode } = useTheme()
  const dark = resolved === 'dark'
  return (
    <div aria-label="Exam tools" className="flex items-center gap-1.5 overflow-x-auto border-b border-line bg-surface px-2 py-1.5 sm:px-3">
      <span className="rule-label mr-0.5 hidden shrink-0 sm:inline">Tools</span>
      <Button variant="secondary" size="sm" className="shrink-0" icon={<Calculator strokeWidth={1.5} />} aria-label="Calculator" aria-pressed={openTool === 'calculator'} onClick={() => onToggleTool('calculator')}><span className="max-sm:hidden">Calculator</span></Button>
      <Button variant="secondary" size="sm" className="shrink-0" icon={<PenLine strokeWidth={1.5} />} aria-label="Rough sheet" aria-pressed={openTool === 'rough'} onClick={() => onToggleTool('rough')}><span className="max-sm:hidden">Rough sheet</span></Button>
      <Button variant="secondary" size="sm" className="shrink-0" icon={<Type strokeWidth={1.5} />} aria-label="Font size" aria-pressed={openTool === 'font'} onClick={() => onToggleTool('font')}><span className="max-sm:hidden">Font size</span></Button>
      <Button variant="secondary" size="sm" className="shrink-0" icon={<Contrast strokeWidth={1.5} />} aria-label="Contrast" aria-pressed={highContrast} onClick={onContrast}><span className="max-sm:hidden">Contrast</span></Button>
      <Button variant="secondary" size="sm" className="shrink-0" icon={dark ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />} aria-label={dark ? 'Light mode' : 'Dark mode'} aria-pressed={dark} onClick={() => setMode(dark ? 'light' : 'dark')}><span className="max-sm:hidden">{dark ? 'Light mode' : 'Dark mode'}</span></Button>
      <Button variant="ghost" size="sm" className="shrink-0" icon={<Keyboard strokeWidth={1.5} />} aria-label="Shortcuts" onClick={onShortcuts}><span className="max-sm:hidden">Shortcuts</span></Button>
    </div>
  )
}
