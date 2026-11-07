import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { ErrorState } from '@/shared/ui/ErrorState.jsx'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js'

/**
 * 404. Kept inside the product's paper canvas rather than a bare error page, so
 * a mistyped URL does not look like the platform is down.
 */
export function NotFoundPage() {
  useDocumentTitle('Page not found')
  const location = useLocation()

  return (
    <div className="flex min-h-[50vh] items-start justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl">
          <p className="rule-label">404 · Not found</p>
          <h1 className="mt-3 text-3xl leading-tight tracking-tighter">That page is not part of this workspace.</h1>
          <div className="mt-6">
            <ErrorState
              code={`PATH ${location.pathname}`}
              icon={<Compass strokeWidth={1.5} />}
              title="Nothing lives at this address"
              description="The link may be from an older term, or the page may have been renamed. Your papers and marks are unaffected."
              action={
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-ink px-4 text-sm font-[560] text-paper transition-opacity hover:opacity-90"
                >
                  Back to the overview
                </Link>
              }
            />
          </div>
      </div>
    </div>
  )
}
