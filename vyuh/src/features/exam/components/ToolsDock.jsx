import { Calculator, Contrast, Keyboard, Moon, PenLine, Sun, Type } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useTheme } from '@/shared/hooks/useTheme.js'

/** @param {{ openTool: 'calculator'|'rough'|'font'|null, onToggleTool: (tool: 'calculator'|'rough'|'font') => void, highContrast: boolean, onContrast: () => void, onShortcuts: () => void }} props */
export function ToolsDock({ openTool, onToggleTool, highContrast, onContrast, onShortcuts }) {
  const { resolved, setMode } = useTheme()
  const dark = resolved === 'dark'
  return (
    <div aria-label="Exam tools" className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-4 py-2">
      <span className="rule-label mr-1">Tools</span>
      <Button variant="secondary" size="sm" icon={<Calculator strokeWidth={1.5} />} aria-pressed={openTool === 'calculator'} onClick={() => onToggleTool('calculator')}>Calculator</Button>
      <Button variant="secondary" size="sm" icon={<PenLine strokeWidth={1.5} />} aria-pressed={openTool === 'rough'} onClick={() => onToggleTool('rough')}>Rough sheet</Button>
      <Button variant="secondary" size="sm" icon={<Type strokeWidth={1.5} />} aria-pressed={openTool === 'font'} onClick={() => onToggleTool('font')}>Font size</Button>
      <Button variant="secondary" size="sm" icon={<Contrast strokeWidth={1.5} />} aria-pressed={highContrast} onClick={onContrast}>Contrast</Button>
      <Button variant="secondary" size="sm" icon={dark ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />} aria-pressed={dark} onClick={() => setMode(dark ? 'light' : 'dark')}>{dark ? 'Light mode' : 'Dark mode'}</Button>
      <Button variant="ghost" size="sm" icon={<Keyboard strokeWidth={1.5} />} onClick={onShortcuts}>Shortcuts</Button>
    </div>
  )
}
