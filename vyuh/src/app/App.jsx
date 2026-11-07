import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders.jsx'
import { AppRoutes } from './routes/AppRoutes.jsx'

/**
 * Composition root. Providers wrap the router so that a route element can use
 * queries, motion and toasts without ordering constraints of its own.
 */
export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
