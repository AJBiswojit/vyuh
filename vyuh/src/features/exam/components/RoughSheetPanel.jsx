import { useEffect, useRef } from 'react'
import { Button } from '@/shared/ui'
import { ToolPanel } from './ToolPanel.jsx'

/** @param {{ onClose: () => void, initial?: { x: number, y: number } }} props */
export function RoughSheetPanel({ onClose, initial }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null))
  const drawing = useRef(false)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    context.lineWidth = 2
    context.lineCap = 'round'
    context.strokeStyle = getComputedStyle(canvas).color
  }, [])
  /** @param {React.PointerEvent<HTMLCanvasElement>} event */
  function point(event) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height }
  }
  /** @param {React.PointerEvent<HTMLCanvasElement>} event */
  function down(event) {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const p = point(event)
    if (!canvas || !context || !p) return
    drawing.current = true
    canvas.setPointerCapture(event.pointerId)
    context.strokeStyle = getComputedStyle(canvas).color
    context.beginPath(); context.moveTo(p.x, p.y)
  }
  /** @param {React.PointerEvent<HTMLCanvasElement>} event */
  function move(event) {
    if (!drawing.current) return
    const context = canvasRef.current?.getContext('2d')
    const p = point(event)
    if (!context || !p) return
    context.lineTo(p.x, p.y); context.stroke()
  }
  function up() { drawing.current = false }
  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
  }
  return (
    <ToolPanel title="Rough sheet" onClose={onClose} initial={initial} width={380}>
      <div className="flex flex-col gap-3">
        <canvas ref={canvasRef} width={340} height={240} aria-label="Rough work canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="h-60 w-full touch-none rounded-sm border border-line bg-surface text-heading" />
        <Button variant="secondary" size="sm" onClick={clear}>Clear rough sheet</Button>
      </div>
    </ToolPanel>
  )
}
