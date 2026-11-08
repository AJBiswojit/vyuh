import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { Whiteboard } from '../../src/features/live/components/Whiteboard.jsx'
import { createInitialState, reduce } from '../../src/services/mock/liveStudioReducer.js'
import { CANONICAL_STUDIO_SESSION_ID } from '../../src/mock-data/index.js'

const AT = '2026-11-07T10:00:00.000Z'
let counter = 0
/** @param {any} state @param {string} type @param {Object} payload */
function apply(state, type, payload) {
  counter += 1
  return reduce(state, { id: `board-${counter}`, type, at: AT, actor: { kind: 'faculty', id: 'faculty', label: 'Faculty' }, detail: type, payload })
}

function mount(props) {
  return render(createElement(Whiteboard, { shapes: [], tool: 'pen', ...props }))
}

describe('VYUH LIVE STUDIO — functional mock whiteboard', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('renders a labelled drawing surface without media capture', () => {
    mount({ onEvent: () => {} })
    expect(screen.getByTestId('studio-whiteboard')).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Whiteboard tools' })).toBeTruthy()
    expect(screen.getByText(/No camera, screen capture or streaming/)).toBeTruthy()
  })

  it('dispatches a recorded shape event on pointer down and up', () => {
    const onEvent = vi.fn()
    mount({ onEvent })
    const canvas = screen.getByTestId('studio-whiteboard')
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20, pointerId: 1 })
    fireEvent.pointerUp(canvas, { clientX: 40, clientY: 60, pointerId: 1 })
    expect(onEvent).toHaveBeenCalledWith('whiteboard_shape', expect.objectContaining({ type: 'pen' }))
  })

  it('dispatches an erase event when the eraser tool is active', () => {
    const onEvent = vi.fn()
    mount({ onEvent, tool: 'eraser' })
    const canvas = screen.getByTestId('studio-whiteboard')
    fireEvent.pointerDown(canvas, { clientX: 5, clientY: 5, pointerId: 2 })
    fireEvent.pointerUp(canvas, { clientX: 8, clientY: 8, pointerId: 2 })
    expect(onEvent).toHaveBeenCalledWith('whiteboard_erase', expect.any(Object))
  })

  it('exposes tool selection, undo and clear as real controls', () => {
    const onEvent = vi.fn()
    mount({ onEvent })
    fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }))
    expect(onEvent).toHaveBeenCalledWith('whiteboard_tool', { tool: 'rect' })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onEvent).toHaveBeenCalledWith('whiteboard_undo', {})
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onEvent).toHaveBeenCalledWith('whiteboard_clear', {})
  })

  it('offers a text field when the text tool is active', () => {
    mount({ onEvent: () => {}, tool: 'text' })
    expect(screen.getByLabelText('Text to place')).toBeTruthy()
  })

  it('renders read-only for the Mirror and the Student Classroom', () => {
    let state = createInitialState({ sessionId: CANONICAL_STUDIO_SESSION_ID, at: AT })
    state = apply(state, 'whiteboard_shape', { type: 'rect', x: 1, y: 2, x2: 3, y2: 4, text: '' })
    mount({ shapes: state.whiteboard.shapes, readOnly: true })
    expect(screen.queryByRole('toolbar', { name: 'Whiteboard tools' })).toBeNull()
    expect(screen.getByText(/1 shared board action/)).toBeTruthy()
  })

  it('does not dispatch when read-only', () => {
    const onEvent = vi.fn()
    mount({ onEvent, readOnly: true })
    const canvas = screen.getByTestId('studio-whiteboard')
    fireEvent.pointerDown(canvas, { clientX: 1, clientY: 1, pointerId: 3 })
    fireEvent.pointerUp(canvas, { clientX: 2, clientY: 2, pointerId: 3 })
    expect(onEvent).not.toHaveBeenCalled()
  })
})
