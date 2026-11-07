import { Suspense, lazy } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Skeleton } from '@/shared/ui'
import { useSessionStore } from '@/shared/store/sessionStore.js'
import { useSessionBootstrap, useLogoutCleanup } from '@/features/auth/hooks/useSession.js'
import { GuestOnly, RequireAuth, RequireRole } from './guards.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { StudentLayout } from '../layouts/StudentLayout.jsx'
import { FacultyLayout } from '../layouts/FacultyLayout.jsx'
import { AdminLayout } from '../layouts/AdminLayout.jsx'

/**
 * Public auth flows, then three distinct protected workspaces. Student /app
 * addresses remain compatible bookmarks and redirect to /student after guards.
 * Every workspace route sits behind both RequireAuth and RequireRole.
 */
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage.jsx').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage.jsx').then((m) => ({ default: m.SignupPage })))
const VerifyOtpPage = lazy(() => import('@/features/auth/pages/VerifyOtpPage.jsx').then((m) => ({ default: m.VerifyOtpPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage.jsx').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage.jsx').then((m) => ({ default: m.ResetPasswordPage })))
const JoinInvitePage = lazy(() => import('@/features/auth/pages/JoinInvitePage.jsx').then((m) => ({ default: m.JoinInvitePage })))
const AccessDeniedPage = lazy(() => import('@/features/system/pages/AccessDeniedPage.jsx').then((m) => ({ default: m.AccessDeniedPage })))
const StudentHomePage = lazy(() => import('@/features/dashboard/pages/StudentHomePage.jsx').then((m) => ({ default: m.StudentHomePage })))
const FacultyHomePage = lazy(() => import('@/features/dashboard/pages/FacultyHomePage.jsx').then((m) => ({ default: m.FacultyHomePage })))
const FacultyBankPage = lazy(() => import('@/features/faculty/pages/FacultyBankPage.jsx').then((m) => ({ default: m.FacultyBankPage })))
const FacultyEvaluationPage = lazy(() => import('@/features/faculty/pages/FacultyEvaluationPage.jsx').then((m) => ({ default: m.FacultyEvaluationPage })))
const AdminFeesPage = lazy(() => import('@/features/admin/pages/AdminFeesPage.jsx').then((m) => ({ default: m.AdminFeesPage })))
const AdminBatchesPage = lazy(() => import('@/features/batches/pages/AdminBatchesPage.jsx').then((m) => ({ default: m.AdminBatchesPage })))
const StudentBatchPage = lazy(() => import('@/features/batches/pages/StudentBatchPage.jsx').then((m) => ({ default: m.StudentBatchPage })))
const ExamsPage = lazy(() => import('@/features/student/pages/ExamsPage.jsx').then((m) => ({ default: m.ExamsPage })))
const ExamDetailPage = lazy(() => import('@/features/exam/pages/ExamDetailPage.jsx').then((m) => ({ default: m.ExamDetailPage })))
const ExamInstructionsPage = lazy(() => import('@/features/exam/pages/ExamInstructionsPage.jsx').then((m) => ({ default: m.ExamInstructionsPage })))
const ExamHallPage = lazy(() => import('@/features/exam/pages/ExamHallPage.jsx').then((m) => ({ default: m.ExamHallPage })))
const ExamConfirmationPage = lazy(() => import('@/features/exam/pages/ExamConfirmationPage.jsx').then((m) => ({ default: m.ExamConfirmationPage })))
const ExamResultPage = lazy(() => import('@/features/analysis/pages/ExamResultPage.jsx').then((m) => ({ default: m.ExamResultPage })))
const TopicRevisionPage = lazy(() => import('@/features/analysis/pages/TopicRevisionPage.jsx').then((m) => ({ default: m.TopicRevisionPage })))
const PerformancePage = lazy(() => import('@/features/student/pages/PerformancePage.jsx').then((m) => ({ default: m.PerformancePage })))
const ProfilePage = lazy(() => import('@/features/student/pages/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage })))
const LiveClassesPage = lazy(() => import('@/features/student/pages/LiveClassesPage.jsx').then((m) => ({ default: m.LiveClassesPage })))
const RecordingsPage = lazy(() => import('@/features/student/pages/RecordingsPage.jsx').then((m) => ({ default: m.RecordingsPage })))
const DoubtsPage = lazy(() => import('@/features/student/pages/DoubtsPage.jsx').then((m) => ({ default: m.DoubtsPage })))
const StudyRoomsPage = lazy(() => import('@/features/student/pages/StudyRoomsPage.jsx').then((m) => ({ default: m.StudyRoomsPage })))
const AttendancePage = lazy(() => import('@/features/student/pages/AttendancePage.jsx').then((m) => ({ default: m.AttendancePage })))
const LiveRoomPage = lazy(() => import('@/features/learning/pages/LiveRoomPage.jsx').then((m) => ({ default: m.LiveRoomPage })))
const RecordingPlayerPage = lazy(() => import('@/features/learning/pages/RecordingPlayerPage.jsx').then((m) => ({ default: m.RecordingPlayerPage })))
const DoubtThreadPage = lazy(() => import('@/features/learning/pages/DoubtThreadPage.jsx').then((m) => ({ default: m.DoubtThreadPage })))
const StudyRoomPage = lazy(() => import('@/features/learning/pages/StudyRoomPage.jsx').then((m) => ({ default: m.StudyRoomPage })))
const AccountPage = lazy(() => import('@/features/account/pages/AccountPage.jsx').then((m) => ({ default: m.AccountPage })))
const NotFoundPage = lazy(() => import('@/features/system/pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })))
const AccessibilityPage = lazy(() => import('@/features/system/pages/AccessibilityPage.jsx').then((m) => ({ default: m.AccessibilityPage })))
const DesignPreviewPage = lazy(() => import('@/features/design-preview/pages/DesignPreviewPage.jsx').then((m) => ({ default: m.DesignPreviewPage })))

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[78rem] px-4 py-8 sm:px-6 lg:px-8" role="status" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div aria-hidden="true">
        <Skeleton.Line className="w-32" />
        <Skeleton.Block className="mt-4 h-9 w-[min(24rem,80%)]" />
        <Skeleton.Line className="mt-3 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-4"><Skeleton.Block className="h-32 rounded-md" /><Skeleton.Block className="h-52 rounded-md" /></div>
          <div className="space-y-4"><Skeleton.Block className="h-40 rounded-md" /><Skeleton.Block className="h-40 rounded-md" /></div>
        </div>
      </div>
    </div>
  )
}

function LegacySignInRedirect() {
  const location = useLocation()
  return <Navigate to={`/login${location.search}${location.hash}`} replace state={location.state} />
}
function LegacyStudentRedirect() {
  const location = useLocation()
  return <Navigate to={`${location.pathname.replace(/^\/app/, '/student')}${location.search}${location.hash}`} replace state={location.state} />
}
function RoleLayout() {
  const role = useSessionStore((state) => state.user?.role)
  if (role === 'faculty') return <FacultyLayout><Outlet /></FacultyLayout>
  if (role === 'admin') return <AdminLayout><Outlet /></AdminLayout>
  return <StudentLayout><Outlet /></StudentLayout>
}

export function AppRoutes() {
  useSessionBootstrap()
  useLogoutCleanup()
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<LegacySignInRedirect />} />

        {/* ── Authentication ─────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/join/:inviteCode" element={<JoinInvitePage />} />
        </Route>

        {/* ── Student workspace ──────────────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['student']} />}>
            {/* The hall drops workspace chrome; the rest of the journey keeps it. */}
            <Route path="/student/exams/:examId/hall" element={<ExamHallPage />} />
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentHomePage />} />
              <Route path="/student/exams" element={<ExamsPage />} />
              <Route path="/student/exams/:examId" element={<ExamDetailPage />} />
              <Route path="/student/exams/:examId/instructions" element={<ExamInstructionsPage />} />
              <Route path="/student/exams/:examId/confirmation" element={<ExamConfirmationPage />} />
              <Route path="/student/exams/:examId/result" element={<ExamResultPage />} />
              <Route path="/student/revision/:topicId" element={<TopicRevisionPage />} />
              <Route path="/student/papers" element={<ExamsPage />} />
              <Route path="/student/live" element={<LiveClassesPage />} />
              <Route path="/student/live/:sessionId" element={<LiveRoomPage />} />
              <Route path="/student/recordings" element={<RecordingsPage />} />
              <Route path="/student/recordings/:recordingId" element={<RecordingPlayerPage />} />
              <Route path="/student/performance" element={<PerformancePage />} />
              <Route path="/student/doubts" element={<DoubtsPage />} />
              <Route path="/student/doubts/:doubtId" element={<DoubtThreadPage />} />
              <Route path="/student/attendance" element={<AttendancePage />} />
              <Route path="/student/study-rooms" element={<StudyRoomsPage />} />
              <Route path="/student/study-rooms/:roomId" element={<StudyRoomPage />} />
              <Route path="/student/profile" element={<ProfilePage />} />
              <Route path="/student/account" element={<ProfilePage />} />
              <Route path="/student/batch" element={<StudentBatchPage />} />
              <Route path="*" element={<NotFoundPage />} />
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
              <Route path="*" element={<NotFoundPage />} />
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
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>

        {/* Mismatched roles keep their own chrome and an explicit escape link. */}
        <Route element={<RequireAuth />}>
          <Route element={<RoleLayout />}>
            <Route path="/access-denied" element={<AccessDeniedPage />} />
          </Route>
          <Route element={<RequireRole allow={['student']} />}>
            <Route path="/app" element={<LegacyStudentRedirect />} />
            <Route path="/app/*" element={<LegacyStudentRedirect />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/accessibility" element={<AccessibilityPage />} />
        </Route>
        <Route path="/design-preview" element={<DesignPreviewPage />} />
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
