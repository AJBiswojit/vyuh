import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderRoute, screen, waitFor } from './helpers.jsx'
import { authService } from '@/services/mock/auth.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { safeReturnPath } from '@/shared/lib/roles.js'

vi.mock('../../src/mock-data/latency.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, simulate: (produce) => Promise.resolve().then(produce).then((value) => structuredClone(value)) }
})

const SEATS = [
  { role: 'student', email: 'ananya.sahoo@vidyutacademy.in', home: '/student', other: '/faculty' },
  { role: 'faculty', email: 'snehasish@vidyutacademy.in', home: '/faculty', other: '/admin' },
  { role: 'admin', email: 'academic.office@vidyutacademy.in', home: '/admin', other: '/student' },
]

const expectRoute = async (path, session, expected) => {
  await renderRoute(path, session ? { session } : undefined)
  await waitFor(() => expect(screen.getByTestId('route').textContent).toBe(expected))
}

beforeEach(() => {
  localStorage.clear()
  useSessionStore.getState().clear()
})

describe('Batch 2 guard matrix (RequireAuth → RequireRole → RequirePasswordChange)', () => {
  for (const seat of SEATS) {
    describe(`${seat.role} workspace`, () => {
      it('anonymous visitors are sent to /login with the deep link preserved', async () => {
        await expectRoute(`${seat.home}/account`, null, '/login')
      })

      it('a correctly-roled account reaches its own dashboard', async () => {
        const session = await authService.login({ email: seat.email, password: 'vyuh2026' })
        await expectRoute(seat.home, session, seat.home)
      })

      it('an incorrectly-roled account still gets /access-denied, never another role\'s UI', async () => {
        const other = SEATS.find((entry) => entry.role !== seat.role)
        const session = await authService.login({ email: other.email, password: 'vyuh2026' })
        await expectRoute(seat.home, session, '/access-denied')
      })

      it('an account with a temporary credential cannot reach a dashboard by direct URL', async () => {
        const session = await authService.login({ email: seat.email, password: 'vyuh2026' })
        const gated = {
          ...session,
          mustChangePassword: true,
          user: { ...session.user, mustChangePassword: true, instituteId: 'VYU-F-0043' },
        }
        await expectRoute(`${seat.home}/account`, gated, '/setup-account')
      })
    })
  }

  it('orders the three guards as RequireAuth → RequireRole → RequirePasswordChange', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/routes/AppRoutes.jsx'), 'utf8')
    for (const marker of ['Student workspace', 'Faculty workspace', 'Academic office']) {
      const branch = source.slice(source.indexOf(marker), source.indexOf(marker) + 2500)
      const auth = branch.indexOf('<RequireAuth />')
      const role = branch.indexOf('<RequireRole')
      const setup = branch.indexOf('<RequirePasswordChange />')
      expect(auth).toBeGreaterThan(-1)
      expect(role).toBeGreaterThan(auth)
      expect(setup).toBeGreaterThan(role)
    }
  })

  it('does not loop: /setup-account stays reachable and /login sends gated users there', async () => {
    const session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    const gated = { ...session, mustChangePassword: true, user: { ...session.user, mustChangePassword: true } }
    const first = await renderRoute('/setup-account', { session: gated })
    expect(screen.getByTestId('route').textContent).toBe('/setup-account')
    expect(await screen.findByRole('heading', { name: 'Choose your own password.', level: 1 })).toBeTruthy()
    first.unmount()
    await expectRoute('/login', gated, '/setup-account')
    /* /setup-account is never used as a return destination. */
    expect(safeReturnPath('/setup-account')).toBeNull()
    expect(safeReturnPath('/setup-account?next=/student')).toBeNull()
  })

  it('keeps the preserved return path free of the setup page on a finished session', async () => {
    const session = await authService.login({ email: 'ananya.sahoo@vidyutacademy.in', password: 'vyuh2026' })
    await expectRoute('/login', session, '/student')
    expect(safeReturnPath('/student/exams')).toBe('/student/exams')
  })
})
