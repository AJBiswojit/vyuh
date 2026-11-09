import { useState } from 'react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from '@/shared/ui'

/**
 * Stacked modals — the More options dialog hosts confirm dialogs (mute, hide,
 * reset) inside itself. Only the topmost layer may react to Escape or Tab.
 */
function Harness() {
  const [outerOpen, setOuterOpen] = useState(true)
  const [innerOpen, setInnerOpen] = useState(true)
  return (
    <>
      <Dialog open={outerOpen} onClose={() => setOuterOpen(false)} title="More options" description="Outer layer">
        <button type="button">Outer action</button>
      </Dialog>
      <Dialog open={innerOpen} onClose={() => setInnerOpen(false)} title="Mute Ananya?" description="Inner confirmation">
        <button type="button">Confirm mute</button>
      </Dialog>
    </>
  )
}

describe('stacked dialogs', () => {
  afterEach(cleanup)

  it('Escape closes only the topmost dialog, then the layer beneath', async () => {
    const user = userEvent.setup()
    render(createElement(Harness))

    expect(screen.getByRole('dialog', { name: 'More options' })).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Mute Ananya?' })).toBeTruthy()

    // First Escape dismisses the confirmation only — the background dialog stays.
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Mute Ananya?' })).toBeNull())
    expect(screen.getByRole('dialog', { name: 'More options' })).toBeTruthy()

    // Second Escape closes the dialog beneath it.
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'More options' })).toBeNull())
  })
})
