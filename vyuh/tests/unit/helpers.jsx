import { expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/app/providers/ThemeProvider.jsx'
import { ToastProvider } from '@/shared/ui/Toast.jsx'
import { AppRoutes } from '@/app/routes/AppRoutes.jsx'
import { useSessionStore } from '@/shared/store/sessionStore.js'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="route">{location.pathname + location.search + location.hash}</output>
}

export async function renderRoute(path = '/login', { session } = {}) {
  useSessionStore.getState().clear()
  if (session) useSessionStore.getState().setSession(session)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const user = userEvent.setup()
  const result = render(
    <MotionConfig reducedMotion="user"><ThemeProvider defaultMode="light"><QueryClientProvider client={queryClient}><ToastProvider>
      <MemoryRouter initialEntries={[path]}><AppRoutes /><LocationProbe /></MemoryRouter>
    </ToastProvider></QueryClientProvider></ThemeProvider></MotionConfig>,
  )
  await waitFor(() => expect(useSessionStore.getState().status).not.toBe('boot'))
  return { user, queryClient, ...result }
}
export { screen, waitFor, userEvent }
