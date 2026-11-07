import '@testing-library/react'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { webcrypto } from 'node:crypto'

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.useRealTimers() })
vi.stubEnv('VITE_USE_MOCK', 'true')
vi.stubEnv('VITE_MOCK_ERRORS', 'false')
if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn((query) => ({ matches: query.includes('reduce'), media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) })
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
Element.prototype.scrollIntoView = vi.fn()

window.scrollTo = vi.fn()
