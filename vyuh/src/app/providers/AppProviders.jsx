import { MotionConfig } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient.js'
import { ThemeProvider } from './ThemeProvider.jsx'
import { ToastProvider } from '@/shared/ui/Toast.jsx'
import { useDensityEffect } from '@/shared/hooks/useTheme.js'

/**
 * Provider order matters, and it is deliberate:
 *
 *   MotionConfig  outermost, so every animation in the tree — including ones
 *                 inside dialogs portalled to <body> — inherits
 *                 reducedMotion="user" and the default entrance easing.
 *   ThemeProvider writes <html data-theme>, which tokens.css keys its semantic
 *                 aliases on. Everything below can use theme-aware utilities.
 *   QueryClient   the request cache. One per app instance.
 *   ToastProvider floating notices, rendered through a portal.
 *
 * Density is applied by an effect rather than a provider: it is a single
 * attribute and does not need to be in the React tree.
 *
 * @param {{ children: React.ReactNode }} props
 */
function DensityAttribute() {
  useDensityEffect()
  return null
}

export function AppProviders({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.325, ease: [0.16, 1, 0.3, 1] }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <DensityAttribute />
            {children}
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}
