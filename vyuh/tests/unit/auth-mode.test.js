import { afterEach, describe, expect, it, vi } from 'vitest'
import { safeReturnPath } from '@/shared/lib/roles.js'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('auth mode and return paths', () => {
  it('hides demo seats and selects the HTTP adapter when mocks are disabled', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false')
    vi.resetModules()
    const services = await import('@/shared/lib/services.js')
    const { apiServices } = await import('@/services/api/index.js')
    expect(services.isMockMode).toBe(false)
    expect(services.demoSeats).toEqual([])
    expect(services.services.auth).toBe(apiServices.auth)
  })

  it('rejects external, protocol-relative, backslash, and auth return paths', () => {
    for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/signup?x=1', '/join/CODE', null, 42]) {
      expect(safeReturnPath(value)).toBeNull()
    }
    expect(safeReturnPath('/student/papers?filter=live#top')).toBe('/student/papers?filter=live#top')
  })
})
