import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Circle, Delete, Maximize, Minus, PenLine, Plus, RotateCcw, Trash2, Type } from 'lucide-react'
import { Button, IconButton, Input } from '@/shared/ui'
import { cn } from '@/shared/lib/cn.js'

const TOOLS = [
  { id: 'pen', label: 'Pen', icon: PenLine },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'rect', label: 'Rectangle', icon: Maximize },
  { id: 'ellipse', label: 'Ellipse', icon: Circle },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'eraser', label: 'Eraser', icon: Delete },
]

/**
 * Resolve a REAL browser colour from scoped design tokens. A custom property
 * may still contain an unresolved `var(...)` reference, which is invalid for
 * strokeStyle/fillStyle. getComputedStyle(...).color is always concrete, so it
 * is the guaranteed fallback. No colour literal lives in this component.
 * @param {HTMLCanvasElement} canvas
 * @returns {string|null}
 */
function resolveInk(canvas) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return null
  const styles = window.getComputedStyle(canvas)
  /** @param {string} value */
  const validColour = (value) => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (!trimmed || trimmed.startsWith('var(')) return false
    return typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('color', trimmed)
  }
  const concrete = styles.getPropertyValue('color').trim()
  for (const token of ['--color-heading', '--color-body']) {
    const raw = styles.getPropertyValue(token).trim()
    if (!raw) continue
    if (!raw.startsWith('var(')) {
      if (validColour(raw)) return raw
      continue
    }
    const inner = raw.slice(4, -1).trim()
    const referenced = styles.getPropertyValue(inner.split(',')[0].trim()).trim()
    if (validColour(referenced)) return referenced
    const comma = inner.indexOf(',')
    if (comma !== -1 && validColour(inner.slice(comma + 1))) return inner.slice(comma + 1).trim()
  }
  return validColour(concrete) ? concrete : null
}

/** @param {unknown} value */
function coord(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(1000, Math.max(0, parsed)) : 0
}

/**
 * Paint normalized 0..1000 coordinates into the canvas' CSS pixel box. The ink
 * colour is read from the scoped design token, so a board inside either theme
 * stays legible without any hard-coded colour in source.
 */
function paint(canvas, shapes) {
  if (!canvas || typeof canvas.getContext !== 'function') return
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.clientWidth || 960
  const height = canvas.clientHeight || 540
  const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  canvas.width = Math.max(1, Math.round(width * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  /* Only assign a resolved colour. If neither a token nor `color` resolves
     (SSR / bare jsdom), keep the 2D context's own valid default colours rather
     than clearing the board and drawing nothing. */
  const ink = resolveInk(canvas)
  if (ink) {
    context.strokeStyle = ink
    context.fillStyle = ink
  }
  context.lineWidth = 3
  context.lineCap = 'round'
  context.font = '16px ui-sans-serif, system-ui, sans-serif'
  const sx = (value) => (value / 1000) * width
  const sy = (value) => (value / 1000) * height
  for (const shape of shapes) {
    const x = sx(Math.min(shape.x, shape.x2))
    const y = sy(Math.min(shape.y, shape.y2))
    const w = Math.abs(sx(shape.x2) - sx(shape.x))
    const h = Math.abs(sy(shape.y2) - sy(shape.y))
    context.beginPath()
    if (shape.type === 'rect') {
      context.rect(x, y, w, h)
    } else if (shape.type === 'ellipse') {
      context.ellipse(x + w / 2, y + h / 2, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2)
    } else if (shape.type === 'text' || shape.type === 'pen' || shape.type === 'line') {
      if (shape.type === 'text') {
        context.fillText(shape.text || 'Note', x, Math.max(18, y + 16))
      } else {
        context.moveTo(sx(shape.x), sy(shape.y))
        context.lineTo(sx(shape.x2), sy(shape.y2))
      }
    } else {
      continue
    }
    if (shape.type !== 'text') context.stroke()
  }
}

/** @param {React.PointerEvent<HTMLCanvasElement>} event @param {HTMLCanvasElement|null} canvas */
function point(event, canvas) {
  const rect = canvas?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return { x: 0, y: 0 }
  return {
    x: Math.min(1000, Math.max(0, ((event.clientX - rect.left) / rect.width) * 1000)),
    y: Math.min(1000, Math.max(0, ((event.clientY - rect.top) / rect.height) * 1000)),
  }
}

/**
 * Shared whiteboard. Pointer and touch produce recorded mock shape events; no
 * media capture is involved. R20 also exposes a fully keyboard-operable form
 * so drawing is not pointer-only, handles pointer cancellation, and resolves
 * its ink to a valid browser colour. `readOnly` renders the same board for the
 * Mirror and the Student Classroom.
 * @param {Object} props
 * @param {Array} props.shapes
 * @param {string} props.tool
 * @param {(type: string, payload: Object) => void} [props.onEvent]
 * @param {boolean} [props.readOnly]
 * @param {string} [props.className]
 */
export function Whiteboard({ shapes, tool, onEvent, readOnly = false, className }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement|null} */ (null))
  const startRef = useRef(/** @type {{x:number,y:number}|null} */ (null))
  const [textValue, setTextValue] = useState('')
  const [tick, setTick] = useState(0)
  const [coords, setCoords] = useState({ x: '100', y: '100', x2: '400', y2: '300' })
  const helpId = useId()

  useEffect(() => {
    paint(canvasRef.current, shapes)
  }, [shapes, tick])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return undefined
    const redraw = () => setTick((value) => value + 1)
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  }, [])

  const onPointerDown = useCallback((event) => {
    if (readOnly || !onEvent) return
    startRef.current = point(event, canvasRef.current)
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* unsupported */ }
    }
  }, [readOnly, onEvent])

  const onPointerUp = useCallback((event) => {
    if (readOnly || !onEvent || !startRef.current) return
    const start = startRef.current
    const end = point(event, canvasRef.current)
    startRef.current = null
    const box = { x: start.x, y: start.y, x2: end.x, y2: end.y }
    if (tool === 'eraser') {
      const padX = Math.abs(end.x - start.x) > 12 ? 0 : 22
      const padY = Math.abs(end.y - start.y) > 12 ? 0 : 22
      onEvent('whiteboard_erase', { ...box, x: Math.max(0, Math.min(start.x, end.x) - padX), y: Math.max(0, Math.min(start.y, end.y) - padY), x2: Math.min(1000, Math.max(start.x, end.x) + padX), y2: Math.min(1000, Math.max(start.y, end.y) + padY) })
    } else {
      onEvent('whiteboard_shape', { ...box, type: tool, text: tool === 'text' ? textValue : '' })
    }
  }, [readOnly, onEvent, tool, textValue])

  /* A cancelled touch/pen gesture must not leave a half-finished drag behind. */
  const onPointerCancel = useCallback(() => { startRef.current = null }, [])

  /** @param {React.ChangeEvent<HTMLInputElement>} event */
  const onCoordChange = (event) => {
    const { name, value } = event.target
    setCoords((previous) => ({ ...previous, [name]: value }))
  }

  /** @param {React.FormEvent<HTMLFormElement>} event */
  const onKeyboardSubmit = (event) => {
    event.preventDefault()
    if (readOnly || !onEvent) return
    const box = { x: coord(coords.x), y: coord(coords.y), x2: coord(coords.x2), y2: coord(coords.y2) }
    if (tool === 'eraser') onEvent('whiteboard_erase', box)
    else onEvent('whiteboard_shape', { ...box, type: tool, text: tool === 'text' ? textValue : '' })
  }

  return (
    <div className={cn('flex min-h-0 w-full flex-col gap-3', className)}>
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Whiteboard tools">
          {TOOLS.map((entry) => (
            <IconButton
              key={entry.id}
              label={entry.label}
              icon={<entry.icon />}
              variant="secondary"
              size="sm"
              pressed={tool === entry.id}
              onClick={() => onEvent?.('whiteboard_tool', { tool: entry.id })}
            />
          ))}
          <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
          <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={() => onEvent?.('whiteboard_undo', {})}>Undo</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 />} onClick={() => onEvent?.('whiteboard_clear', {})}>Clear</Button>
        </div>
      ) : null}
      {!readOnly && tool === 'text' ? (
        <Input label="Text to place" hint="Type here, then drag on the board or use the keyboard controls to position it." value={textValue} onChange={(event) => setTextValue(event.target.value)} maxLength={160} />
      ) : null}
      <canvas
        ref={canvasRef}
        data-testid="studio-whiteboard"
        role="img"
        aria-label={readOnly ? `Shared whiteboard, ${shapes.length} recorded actions` : 'Shared whiteboard drawing area. Use the keyboard whiteboard controls to add an action.'}
        aria-describedby={readOnly ? undefined : helpId}
        className={cn(
          'w-full min-h-[16rem] flex-1 rounded-sm border border-line bg-surface-raised',
          readOnly ? 'cursor-default' : 'cursor-crosshair touch-none',
        )}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
      {!readOnly ? (
        <form
          aria-label="Keyboard whiteboard controls"
          onSubmit={onKeyboardSubmit}
          className="flex flex-wrap items-end gap-2 rounded-sm border border-line bg-surface-raised p-3"
        >
          <p id={helpId} className="w-full text-2xs leading-relaxed text-muted">
            Keyboard alternative: set normalized coordinates (0–1000) and choose the action below. Pointer and touch drawing still work on the canvas above.
          </p>
          <Input label="Start X" name="x" type="number" min={0} max={1000} step={10} value={coords.x} onChange={onCoordChange} containerClassName="w-24" />
          <Input label="Start Y" name="y" type="number" min={0} max={1000} step={10} value={coords.y} onChange={onCoordChange} containerClassName="w-24" />
          <Input label="End X" name="x2" type="number" min={0} max={1000} step={10} value={coords.x2} onChange={onCoordChange} containerClassName="w-24" />
          <Input label="End Y" name="y2" type="number" min={0} max={1000} step={10} value={coords.y2} onChange={onCoordChange} containerClassName="w-24" />
          <Button type="submit" variant="secondary" size="sm" icon={<Plus />}>
            {tool === 'eraser' ? 'Erase area with keyboard' : 'Add board action with keyboard'}
          </Button>
        </form>
      ) : null}
      <p className="text-2xs leading-relaxed text-muted">
        {readOnly ? `${shapes.length} shared board action${shapes.length === 1 ? '' : 's'} (recorded mock events).` : 'Pointer, touch and keyboard actions are recorded mock shapes. No camera, screen capture or streaming is used.'}
      </p>
    </div>
  )
}
