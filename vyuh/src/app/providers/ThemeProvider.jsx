import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * ThemeProvider — light, dark and system, persisted.
 *
 * `mode` is the reader's choice and is what gets stored. `resolved` is the theme
 * actually painted: a `system` mode follows the OS and keeps following it, so a
 * laptop that flips to dark at sunset flips the app too, without a reload and
 * without losing the fact that the reader chose "system".
 *
 * The painted theme is applied to <html data-theme>, which is what tokens.css
 * keys its semantic aliases on. Nothing else in the app writes that attribute.
 *
 * @typedef {'light'|'dark'|'system'} ThemeMode
 * @typedef {'light'|'dark'} ResolvedTheme
 *
 * @typedef {Object} ThemeContextValue
 * @property {ThemeMode} mode
 * @property {ResolvedTheme} resolved
 * @property {(mode: ThemeMode) => void} setMode
 * @property {() => void} toggle            Flips the *resolved* theme, storing an explicit mode.
 * @property {boolean} followsSystem
 */

const STORAGE_KEY = 'vyuh.theme'
const MODES = /** @type {const} */ (['light', 'dark', 'system'])

/** @typedef {React.Context<ThemeContextValue | null>} ThemeContextType */
export const ThemeContext = createContext(/** @type {ThemeContextValue | null} */ (null))

/** @returns {ThemeMode} */
function readStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && MODES.includes(/** @type {any} */ (stored))) return /** @type {ThemeMode} */ (stored)
  } catch {
    // Private-mode browsers can throw on read. Fall through to the system value.
  }
  return 'system'
}

/** @returns {ResolvedTheme} */
function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * @param {{ children: React.ReactNode, defaultMode?: ThemeMode }} props
 */
export function ThemeProvider({ children, defaultMode }) {
  const [mode, setModeState] = useState(/** @type {ThemeMode} */ (defaultMode ?? readStoredMode()))
  const [system, setSystem] = useState(systemTheme)

  // Follow the OS for as long as the reader has not overridden it.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    /** @param {MediaQueryListEvent} event */
    const onChange = (event) => setSystem(event.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolved = mode === 'system' ? system : mode

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'dark' ? 'var(--color-ink)' : 'var(--color-paper)')
  }, [resolved])

  const setMode = useCallback((next) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage is a convenience, not a requirement. The session still works.
    }
  }, [])

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setMode])

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle, followsSystem: mode === 'system' }),
    [mode, resolved, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** @returns {ThemeContextValue} */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
