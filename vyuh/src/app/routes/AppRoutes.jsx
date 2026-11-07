import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Skeleton } from '@/shared/ui'
import { useSessionBootstrap } from '@/features/auth/hooks/useSession.js'
import { GuestOnly, RequireAuth, RequireRole } from './guards.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { StudentLayout } from '../layouts/StudentLayout.jsx'
import { FacultyLayout } from '../layouts/FacultyLayout.jsx'
import { AdminLayout } from '../layouts/AdminLayout.jsx'

/**
 * Route table.
 *
 * Layouts are the first thing a reader understands about their seat:
 *   PublicLayout    no account: landing, statements, the design preview
 *   AuthLayout      an account exists but is not signed in
 *   StudentLayout   /app        role: student
 *   FacultyLayout   /faculty    role: faculty
 *   AdminLayout     /admin      role: admin
 *
 * Every workspace route is behind RequireAuth and RequireRole, and each role's
 * home is its own path, so a link cannot quietly show the wrong chair.
 */

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage.jsx').then((m) => ({ default: m.LandingPage })))
const SignInPage = lazy(() => import('@/features/auth/pages/SignInPage.jsx').then((m) => ({ default: m.SignInPage })))
const StudentHomePage = lazy(() => import('@/features/dashboard/pages/StudentHomePage.jsx').then((m) => ({ default: m.StudentHomePage })))
const FacultyHomePage = lazy(() => import('@/features/dashboard/pages/FacultyHomePage.jsx').then((m) => ({ default: m.FacultyHomePage })))
const FacultyBankPage = lazy(() => import('@/features/faculty/pages/FacultyBankPage.jsx').then((m) => ({ default: m.FacultyBankPage })))
const FacultyEvaluationPage = lazy(() => import('@/features/faculty/pages/FacultyEvaluationPage.jsx').then((m) => ({ default: m.FacultyEvaluationPage })))
const AdminFeesPage = lazy(() => import('@/features/admin/pages/AdminFeesPage.jsx').then((m) => ({ default: m.AdminFeesPage })))
const AdminBatchesPage = lazy(() => import('@/features/batches/pages/AdminBatchesPage.jsx').then((m) => ({ default: m.AdminBatchesPage })))
const StudentBatchPage = lazy(() => import('@/features/batches/pages/StudentBatchPage.jsx').then((m) => ({ default: m.StudentBatchPage })))
const StudentPapersPage = lazy(() => import('@/features/dashboard/pages/StudentPapersPage.jsx').then((m) => ({ default: m.StudentPapersPage })))
const AccountPage = lazy(() => import('@/features/account/pages/AccountPage.jsx').then((m) => ({ default: m.AccountPage })))
const NotFoundPage = lazy(() => import('@/features/system/pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })))
const AccessibilityPage = lazy(() => import('@/features/system/pages/AccessibilityPage.jsx').then((m) => ({ default: m.AccessibilityPage })))
const DesignPreviewPage = lazy(() => import('@/features/design-preview/pages/DesignPreviewPage.jsx').then((m) => ({ default: m.DesignPreviewPage })))

/** Route-level loading surface: a page header and a two-column body, never blank. */
function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[78rem] px-4 py-8 sm:px-6 lg:px-8" role="status" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div aria-hidden="true">
        <Skeleton.Line className="w-32" />
        <Skeleton.Block className="mt-4 h-9 w-[min(24rem,80%)]" />
        <Skeleton.Line className="mt-3 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-4">
            <Skeleton.Block className="h-32 rounded-md" />
            <Skeleton.Block className="h-52 rounded-md" />
          </div>
          <div className="space-y-4">
            <Skeleton.Block className="h-40 rounded-md" />
            <Skeleton.Block className="h-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppRoutes() {
  useSessionBootstrap()

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ── Public ─────────────────────────────────────────────── */}
        {/*
          The homepage owns its chrome: it has a bespoke ink nav and a footer that
          carries the seat sign-ins and the attendance statement, so it does not
          sit inside PublicLayout (which would give the page two headers). The
          other public pages keep that shell.
        */}
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/accessibility" element={<AccessibilityPage />} />
          {/* Unknown addresses keep the site chrome, so a stale link still
              offers a way home rather than dumping the visitor on a bare page. */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/*
          Design preview sits outside every layout on purpose: it is a full-bleed
          specimen sheet and a dev tool, not a page a visitor navigates to. It
          brings its own minimal chrome.
        */}
        <Route path="/design-preview" element={<DesignPreviewPage />} />

        {/* ── Auth ───────────────────────────────────────────────── */}
        <Route element={<GuestOnly />}>
          <Route element={<AuthLayout />}>
            <Route path="/sign-in" element={<SignInPage />} />
          </Route>
        </Route>

        {/* ── Student workspace ──────────────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['student']} />}>
            <Route path="/app" element={<StudentLayout />}>
              <Route index element={<StudentHomePage />} />
              <Route path="/app/papers" element={<StudentPapersPage />} />
              <Route path="/app/batch" element={<StudentBatchPage />} />
              <Route path="/app/account" element={<AccountPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Faculty workspace ──────────────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['faculty']} />}>
            <Route path="/faculty" element={<FacultyLayout />}>
              <Route index element={<FacultyHomePage />} />
              <Route path="/faculty/account" element={<AccountPage />} />
              <Route path="/faculty/bank" element={<FacultyBankPage />} />
              <Route path="/faculty/evaluation" element={<FacultyEvaluationPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Academic office ────────────────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminBatchesPage />} />
              <Route path="/admin/batches" element={<AdminBatchesPage />} />
              <Route path="/admin/fees" element={<AdminFeesPage />} />
              <Route path="/admin/account" element={<AccountPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Fallbacks ──────────────────────────────────────────── */}
        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="/faculty/*" element={<Navigate to="/faculty" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  )
}
