import { useEffect } from 'react'
import { useUiStore } from '@/shared/store/uiStore.js'

export { useTheme } from '@/app/providers/ThemeProvider.jsx'

/**
 * Applies density to <html data-density> so tokens and index.css can respond
 * without a React re-render of the tree. Theme is handled by ThemeProvider.
 */
export function useDensityEffect() {
  const density = useUiStore((state) => state.density)

  useEffect(() => {
    // Compact tightens rhythm only. It never shrinks type and never takes a
    // control below its 44px target, so the preference cannot break a11y.
    document.documentElement.dataset.density = density
  }, [density])
}
