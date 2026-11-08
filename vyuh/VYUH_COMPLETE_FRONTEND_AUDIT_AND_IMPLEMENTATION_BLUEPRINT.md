# VYUH — Complete Frontend Audit & Implementation Blueprint

> **Status:** AUDIT ONLY. No application source file was modified. No fixes were implemented. No backend, no new dependency, no seeded data or asset was removed.
> **Date:** 2026-11-07 (UTC)
> **Branch:** `arena/1763b46c-vyuh` at `ced5403` (`ced54030c336bb1041454fd8780f56f423af19f8`)
> **Project root:** `/home/user/vyuh/vyuh` (the Git checkout root is `/home/user/vyuh`; the Vite app and all existing documentation live one directory down)
> **Product principle:** complete what exists, build what is missing, connect everything through realistic mock data; one verified batch at a time.

---

## How this audit was performed (evidence base)

| Method | What was actually done |
|---|---|
| Repository read | All 313 files under `src/`, all 13 unit test files, all 7 e2e spec files, `package.json`, `vite.config.js`, `vitest.config.js`, `playwright.config.js`, `scripts/check-architecture.mjs`, `index.html`, `src/styles/tokens.css`, `README.md`, `PHASE-0.md` … `PHASE-8.md`, `src/mock-data/README.md`. |
| Build | `npm ci` (existing lockfile only), then `npm run build` — **passed**. |
| Unit tests | `npm test` (`vitest run`) — **87/88 passed; 1 failed**. |
| Lint / architecture | `npm run lint` — **passed**; `npx oxlint src tests` — **38 warnings, 0 errors**. |
| Route rendering | A **temporary** jsdom harness (deleted after the run) rendered **82 concrete URLs** across all three authenticated roles and the anonymous state, with `console.error`/`console.warn` spies. **0 thrown exceptions, 0 app-generated console errors.** Full log: `/tmp/vyuh-route-smoke3.log` (outside the repository). |
| E2E | `npx playwright test --list` — **56 tests in 7 files** collected. `npm run test:e2e` — **could not execute**: Chromium binary absent and `npx playwright install chromium` failed with `ECONNRESET` to `cdn.playwright.dev` (network-restricted sandbox). |
| Not verified | Real-browser layout at 390/768/1440 px, real camera/microphone permissions, real cross-tab behaviour, real `HTMLMediaElement` playback, visual screenshots, axe runs in a real browser, TypeScript `checkJs` (TypeScript is not a project dependency). |

**Important framing correction.** The directive states that the student examination hall and the faculty live-class studio "have not been completed". The repository tells a different story, and the directive explicitly asks us to inspect the implementation rather than trust the specification:

* A **full NTA-style examination hall already exists** at `/student/exams/:examId/hall` (`src/features/exam/pages/ExamHallPage.jsx`), with a worker timer, persisted attempt state, five-state palette, calculators, rough sheet, submit sheet and result handoff. It is substantially complete. It is **not** a blank page to be rebuilt.
* A **faculty host console** exists at `/faculty/classes/:sessionId/host`, but it has **no camera, microphone, video stage, Go Live control or studio**. The studio is genuinely missing.
* The repository's own specification (`README.md`, `PHASE-0.md` … `PHASE-8.md`) describes a **v1 product** with `/student`, `/faculty`, `/admin` routes, email login, and public student signup. **No v2 spec file exists in the repository.** The route list in this directive (`/s`, `/f`, `/a`, `/setup-account`, Institute IDs) is therefore a *new target spec*, not a description of current code. This drift is Finding D-01.

**Status vocabulary used throughout:** `Implemented` (renders + primary interactions wired), `Partial` (renders, some primary/secondary interactions or data missing), `Broken` (throws or produces a wrong result), `Missing` (no route/component), `Legacy` (redirect or compatibility wrapper), `Unverified` (could not be exercised without a real browser).

---

# Section 1 — Executive Summary

## 1.1 Current repository health

The prototype is in **good structural health** and is considerably more complete than the brief assumes.

* `npm run build` passes: architecture guard `313 files, 312 colour-free, no boundary or token violations`; Vite 8.3.6 transforms 3296 modules in ~1.63 s.
* The service boundary is real and enforced by `scripts/check-architecture.mjs`: no file under `src/features`, `src/shared` or `src/app` imports `src/mock-data` or `src/services/mock` directly. The only stylistic inconsistency is that 5 hooks import `@/services` directly instead of `@/shared/lib/services.js` (D-17).
* 68 `<Route path=...>` declarations, 65 distinct path patterns, 3 index routes. 63 page components (5 are compatibility re-exports).
* All 82 concrete URLs exercised in jsdom rendered a real page (or the intended NotFound/redirect) with **no runtime exception and no app-generated console error**. This includes the exam hall with a seeded attempt, the submission confirmation with a seeded submission, the result sheet after that submission, both live rooms, every faculty screen and every admin screen.
* Design identity is intact and enforced: Ink `#0B0D10`, Paper `#FBF8F2`, Ember `#E4572E`, Fraunces / Bricolage Grotesque / JetBrains Mono, semantic status colours with shape+label, dark mode via `[data-theme='dark']`, no off-palette gradients (`src/styles/tokens.css`, `index.html`).

## 1.2 Overall implementation status

| Area | Status | Summary |
|---|---|---|
| Public landing, auth shell, 404, accessibility | Implemented | Landing, login, signup, OTP, reset, invite, 404, accessibility, design preview all render. **But** public signup contradicts the v2 product rule. |
| Role guards & layouts | Implemented | `RequireAuth`, `RequireRole`, `RoleLayout` for `/access-denied`, three distinct shells, mobile nav/drawer/More sheet. |
| Student workspace | Implemented | Dashboard, exams ledger/detail, live schedule/room, recordings, performance, doubts, attendance, study rooms, profile. |
| Examination hall | **Mostly implemented** | Full-screen chrome-less hall, 60-question seeded paper, worker timer, refresh recovery, offline queue, keyboard shortcuts, palette, tools, submit/confirmation, result integration. Gaps: only one paper, only one result sheet, dock is sticky not floating, integrity indicators limited to tab-switch count. |
| Result analysis | Partial | Rich sheet for `exam-neet-practice`; `analysis_unavailable` error for every other exam. |
| Faculty workspace | Implemented | Bank, editor, exam builder, monitor, item analysis, classes, host console, recordings, attendance, doubts, account. |
| Faculty live studio | **Missing** | No camera/mic, no `/studio` route, no pre-live/on-air workflow, no stream health, no end-of-class summary. |
| Student live viewer | Partial | Looping sample video, attendance strip, chat, question queue, attention checks, ended class state. Missing volume/fullscreen/PiP/theater, countdown, waiting/reconnecting states, connected faculty state. |
| Admin console | Implemented (v1) | Overview, users, CSV import, batches, approvals, policies, integrity, reports, moderation, audit, settings, account. |
| Admin-created accounts / Institute IDs / first login | **Missing** | No Create User, no credential sheet, no `/setup-account`, no Institute IDs, no temporary passwords, no password-request tab, no per-row account operations. |
| Mock architecture | Good but fragmented | One barrel, one chooser, one latency helper, one realtime emitter, many separate localStorage stores. Cross-role workflows are not connected. |
| Tests | Partial baseline | 88 unit tests (1 failing), 56 Playwright tests collected but not runnable here. No coverage for the v2 workflows. |

## 1.3 Major missing features

1. **v2 route namespace** (`/s`, `/f`, `/a`) and its named pages, especially `/setup-account`, `/f/live/:sessionId/studio`, `/a/people`, `/a/exams`, `/a/compliance`.
2. **Admin-only account creation** with generated Institute IDs (`VYU-S-26-0231`, `VYU-F-0042`), temporary passwords, a one-time credentials sheet, Copy / Download CSV, and hiding the password after the sheet closes.
3. **First-login password change + data-policy acknowledgement** and the guard that enforces it before any role dashboard.
4. **Faculty live-class studio**: camera/mic selection, preview, permissions, readiness checklist, Go Live, on-air controls, viewer/peak counts, stream health, screen share, attention check, moderation (pin/remove/timeout, upvotes/approve/answered), end-class workflow and session summary.
5. **Student live-class viewer parity**: scheduled countdown, waiting state, YouTube-style controls (volume/mute, fullscreen, PiP, theater), reconnection, replay availability, attendance info — sharing one session state with the studio.
6. **Cross-tab linked studio/viewer mock state**. There is **no `BroadcastChannel` anywhere in `src/`**; the "realtime" transport is an in-memory emitter.
7. **Multi-exam lifecycle**: only `exam-neet-practice` can be sat or graded; every other seeded paper is a ledger-only surface.
8. **Recording, attendance and doubt lifecycles that agree across student / faculty / admin.**

## 1.4 Critical broken functionality

* `npm test` fails on `tests/unit/learning-math.test.js:74` (`groupSessionsByDay … Tomorrow`): a real timezone/calendar bug in `src/mock-data/liveSessions.js:10` (`dayAt` uses local `setHours`) plus `src/shared/lib/learningMath.js:112` (`now + 86_400_000` for "tomorrow").
* `/student/exams/:examId/result` for any non-NEET paper renders `E_ANALYSIS` with `analysis_unavailable` (smoke harness: `/student/exams/exam-mock-09/result`, 491 chars, error state visible).
* `/student/exams/:examId/instructions|hall` for any non-NEET paper fails with `paper_unavailable` (`src/services/mock/examFlow.js:45-52`).
* Faculty "End session" only writes `endedAt` into `vyuh.mock.faculty.<id>.v1`; it does **not** create a recording, finalize attendance, notify viewers or produce a summary (`src/services/mock/faculty.js:973-981`).
* Ended live classes always link to `/student/recordings/rec-rot-b`, regardless of the actual session (`LiveRoomPage.jsx:38`, `LiveSchedulePage.jsx:45`, `learning.js:235`).
* Public `/signup` + `/login` "Create your account" link is a live self-registration flow (`LoginPage.jsx:86`), contradicting the fundamental product rule.
* `/access-denied` is declared behind `RequireAuth` (`AppRoutes.jsx:210-213`), so an anonymous visit redirects to `/login` rather than showing a public access-denied page.

## 1.5 Recommended implementation strategy

1. **Do not rebuild.** Keep `/student`, `/faculty`, `/admin` as canonical internal routes; add a thin **v2 alias layer** that maps `/s/*`, `/f/*`, `/a/*` onto the same page components and guards. This preserves ~60 working pages, all deep links, `HOME_FOR_ROLE`, `safeReturnPath`, tests and the design system. Route renames are a Batch-1 mechanical change, not a redesign.
2. **Fix the baseline first** (Batch 1): the failing unit test, the alias layer, the exam/result single-paper restriction, and the confirmation page's silent redirect. Establish a green `npm test` + `npm run build` before feature work.
3. **Build the identity/account layer next** (Batch 2) because every other workflow needs a user, a role and a session: extend the mock auth contract, add `/setup-account`, retire public signup, add admin Create User + credentials sheet + password requests.
4. **Build one shared live-session state service** (Batch 5/6) *before* the studio and viewer UI. Both interfaces must read the same `LiveSessionState`; use a `BroadcastChannel` + `localStorage` state plane, with a local sample video as the mock video plane. This is the smallest mock-only solution that supports a same-device, two-tab demonstration without a backend or new dependency.
5. **Complete the exam hall by extension**, not replacement: multi-paper seeds, multi-select support, floating dock, richer integrity indicators, and tests.
6. **Connect lifecycles last** (Batches 8–10), then run the responsive/accessibility regression sweep (Batch 11) in a real browser.
7. Keep `VITE_USE_MOCK=true`. `src/services/api/index.js:83,114` explicitly states faculty and admin HTTP endpoints do not exist; switching to `VITE_USE_MOCK=false` would intentionally break those screens. No backend is to be created.

---

# Section 2 — Complete Route Inventory

## 2.1 Expected v2 reference routes vs the repository

Legend for `Implementation Status`: **`Mapped`** = functional equivalent exists under a different path; **`Missing`** = no route and no component; **`Partial`** = route exists but named/functional scope differs.

| Route (v2 reference) | Role | Page (repo counterpart) | Implementation Status | Problems | Priority |
|---|---|---|---|---|---|
| `/` | Public | `LandingPage` (`src/features/landing/pages/LandingPage.jsx`) | Implemented | None found; renders 5470 chars of content in jsdom. | — |
| `/login` | Public | `LoginPage` | Partial | Email-only login; no Institute ID; links to `/signup`; no first-login redirect. | Critical |
| `/forgot-password` | Public | `ForgotPasswordPage` | Implemented | Email-based mock reset inbox; no Institute-ID or password-request-tab integration. | High |
| `/setup-account` | Public | — | **Missing** | No component, no guard, no password-change/policy-ack flow. Smoke: 404 NotFound. | Critical |
| `/access-denied` | Public | `AccessDeniedPage` behind `RequireAuth` | Partial | Declared at `AppRoutes.jsx:210-213` inside `RequireAuth`; anonymous visit → `/login`. | Medium |
| `*` | Public | `NotFoundPage` in `PublicLayout` | Implemented | Headline "That page is not part of this workspace." even on public 404. | Low |
| `/s` | Student | `StudentHomePage` at `/student` | Mapped | `/s` itself → public 404 (verified). | Critical |
| `/s/exams` | Student | `ExamsPage` at `/student/exams` | Mapped | Needs alias; ledger has functional tabs/search/detail links. | Critical |
| `/s/exams/:examId` | Student | `ExamDetailPage` at `/student/exams/:examId` | Mapped | `playerReady` false for all but NEET practice. | Critical |
| `/s/exams/:examId/hall` | Student | `ExamHallPage` at `/student/exams/:examId/hall` | Mapped | **Already substantial**; only one paper; dock sticky; see Section 4.1. | Critical |
| `/s/exams/:examId/result` | Student | `ExamResultPage` at `/student/exams/:examId/result` | Partial (mapped) | `analysis_unavailable` for non-NEET exams. | High |
| `/s/live` | Student | `LiveSchedulePage` at `/student/live` | Mapped | No countdown; ended rows hardcode `rec-rot-b`. | Critical |
| `/s/live/:sessionId` | Student | `LiveRoomPage` at `/student/live/:sessionId` | Partial (mapped) | No volume/fullscreen/PiP/theater/reconnect; not linked to faculty state. | Critical |
| `/s/recordings` | Student | `RecordingsPage` at `/student/recordings` | Mapped | Library reads `recordings.js`, not faculty recordings. | High |
| `/s/recordings/:recordingId` | Student | `RecordingPlayerPage` at `/student/recordings/:recordingId` | Mapped | Good player (resume, chapters, transcript, quiz); no PiP/theater. | Medium |
| `/s/doubts` | Student | `DoubtsPage` at `/student/doubts` | Mapped | Student doubt store is separate from faculty doubt store. | Medium |
| `/s/profile` | Student | `ProfilePage` at `/student/profile` | Mapped | Preferences only; identity read-only; no Institute ID shown. | Medium |
| `/f` | Faculty | `FacultyDashboardPage` at `/faculty` | Mapped | `/f` → public 404 (verified). | Critical |
| `/f/live` | Faculty | nearest: `FacultyClassesPage` at `/faculty/classes` | Partial | No `/faculty/live` route; classes page is a scheduler + list, not a live hub. | High |
| `/f/live/:sessionId/studio` | Faculty | nearest: `FacultyHostPage` at `/faculty/classes/:sessionId/host` | **Missing** | No camera/mic/studio. Smoke: `/f/live/ses-rot-b/studio` → 404. | Critical |
| `/f/questions` | Faculty | `FacultyBankPage` at `/faculty/bank` | Mapped | Bank is implemented; alias needed. | High |
| `/f/exams` | Faculty | `FacultyExamsPage` at `/faculty/exams` | Mapped | Implemented. | High |
| `/f/exams/:examId` | Faculty | `FacultyExamBuilderPage` at `/faculty/exams/:examId` | Mapped | Implemented. | High |
| `/f/exams/:examId/monitor` | Faculty | `FacultyExamMonitorPage` | Mapped | Implemented with mock ticker. | Medium |
| `/f/recordings` | Faculty | `FacultyRecordingsPage` | Mapped | Implemented; separate store from student library. | High |
| `/f/recordings/:recordingId` | Faculty | `FacultyRecordingEditorPage` | Mapped | Implemented; publish flag does not affect student library. | High |
| `/f/analytics` | Faculty | `FacultyAnalysisPage` at `/faculty/analysis` | Mapped | Implemented. | Medium |
| `/f/doubts` | Faculty | `FacultyDoubtsPage` | Mapped | Implemented; separate store from student doubts. | Medium |
| `/f/profile` | Faculty | `AccountPage` at `/faculty/account` | Mapped | Theme/density only; no faculty profile details. | Low |
| `/a` | Admin | `AdminDashboardPage` at `/admin` | Mapped | `/a` → public 404 (verified). | Critical |
| `/a/people` | Admin | `AdminUsersPage` at `/admin/users` | Partial (mapped) | Read-only ledger; no three tabs, no Create User, no row actions. | Critical |
| `/a/people/import` | Admin | `AdminImportPage` at `/admin/users/import` | Mapped | 4-step CSV wizard with row validation; imported accounts get no credentials. | High |
| `/a/batches` | Admin | `AdminBatchesPage` | Mapped | Implemented. | Medium |
| `/a/batches/:batchId` | Admin | `AdminBatchDetailPage` | Mapped | Members/subjects/faculty assignment; no student batch move from a user row. | Medium |
| `/a/exams` | Admin | nearest: `AdminApprovalsPage` at `/admin/approvals` | Partial | No exam register; approvals covers only pending papers. | High |
| `/a/policies` | Admin | `AdminPoliciesPage` | Mapped | Implemented with impact counts and audit trail. | Low |
| `/a/reports` | Admin | `AdminReportsPage` | Mapped | Implemented with mock CSV export. | Low |
| `/a/compliance` | Admin | nearest: `AdminIntegrityPage`, `AdminModerationPage`, `AdminAuditPage` | Partial | Compliance is split across three screens with no unified route. | Medium |
| `/a/settings` | Admin | `AdminSettingsPage` | Mapped | Implemented; colour system deliberately locked. | Low |

**Count:** 39 reference path strings (including `*`); 3 exact matches (`/`, `/login`, `/forgot-password`), 1 accessible-but-scoped differently (`/access-denied`), 1 catch-all, **2 wholly missing route families** (`/setup-account`, `/f/live/:sessionId/studio`), 1 partial admin route (`/a/exams`), 1 partial compliance route, and **all 33 role-prefixed paths use a different namespace**.

## 2.2 Every discovered route in the repository

`Page` names are the lazy-loaded components in `src/app/routes/AppRoutes.jsx`. `L/E/R` = loading / empty / error-state primitives present in the page (verified statically). `Nav` = reachable from the workspace rail or an in-page link. `Resp` = responsive classes present (verified statically; **not** measured in a real browser). `T` = covered by an existing unit or e2e test (test collection inspected, not executed for e2e).

| Route | Role | Page | Implementation Status | Problems | Priority |
|---|---|---|---|---|---|
| `/` | Public | `LandingPage` | Implemented (L/E/R partial, Nav, Resp, T) | Heavy single page (33 KB chunk). | Low |
| `/sign-in` | Public | `LegacySignInRedirect` → `/login` | Legacy | Preserves search/hash only. | Low |
| `/login` | Public | `LoginPage` | Implemented (L/R, Nav, Resp, T) | Email-only; public signup link; no Institute ID; no first-login gate. | Critical |
| `/signup` | Public | `SignupPage` | Implemented but **product-invalid** | Self-registration with institute code `VYUH2026` + OTP. Contradicts admin-only rule. | Critical |
| `/verify-otp` | Public | `VerifyOtpPage` | Implemented (L/R, T) | Belongs to the self-signup/reset flow to be retired. | High |
| `/forgot-password` | Public | `ForgotPasswordPage` | Implemented (L, T) | Generic reset; no admin password-request integration. | Medium |
| `/reset-password` | Public | `ResetPasswordPage` | Implemented (L, T) | Token from mock inbox; no first-login reuse. | Medium |
| `/join/:inviteCode` | Public | `JoinInvitePage` | Implemented but **product-invalid** | Faculty sets own password from an invite; accounts should be admin-created. | High |
| `/accessibility` | Public | `AccessibilityPage` in `PublicLayout` | Implemented | Static statement. | Low |
| `/design-preview` | Public | `DesignPreviewPage` | Implemented (internal tool) | Publicly reachable specimen sheet, contains deliberate `E_SNAPSHOT` specimen. | Low |
| `/access-denied` | Auth (any role) | `AccessDeniedPage` in `RoleLayout` | Implemented (T) | Not public; `RequireAuth` redirects anonymous users. | Medium |
| `/app` | Student | `LegacyStudentRedirect` → `/student` | Legacy | Guarded by `RequireRole student`. | Low |
| `/app/*` | Student | `LegacyStudentRedirect` | Legacy | Rewrites `/app` prefix only. | Low |
| `*` (public) | Public | `NotFoundPage` in `PublicLayout` | Implemented | Headline wording is workspace-oriented. | Low |
| `*` (student shell) | Student | `NotFoundPage` in `StudentLayout` | Implemented | Keeps student chrome. | Low |
| `*` (faculty shell) | Faculty | `NotFoundPage` in `FacultyLayout` | Implemented | Keeps faculty chrome. | Low |
| `*` (admin shell) | Admin | `NotFoundPage` in `AdminLayout` | Implemented | Keeps admin chrome. | Low |
| `/student` (index) | Student | `StudentHomePage` | Implemented (L/R, Nav, Resp, T) | Dashboard cards read several services; no empty-state for all cards simultaneously. | Low |
| `/student/exams` | Student | `ExamsPage` | Implemented (L/E/R, Nav, Resp, T) | Tabs/search work; only NEET practice is playable. | High |
| `/student/exams/:examId` | Student | `ExamDetailPage` | Implemented (L/R, T) | `playerReady` gated to `NEET_PRACTICE_EXAM_ID`; other papers show Phase-3 notice. | High |
| `/student/exams/:examId/instructions` | Student | `ExamInstructionsPage` | Implemented (L/R, T) | `getPaper` rejects non-NEET exams → `E_PAPER`. | High |
| `/student/exams/:examId/hall` | Student | `ExamHallPage` | **Mostly implemented** (L/R, T) | Chrome-less; see Section 4.1 for exact gaps. | High |
| `/student/exams/:examId/confirmation` | Student | `ExamConfirmationPage` | Implemented, conditional | Redirects silently to `/student/exams` without a submitted attempt; no L/E/R. | Medium |
| `/student/exams/:examId/result` | Student | `ExamResultPage` | Partial (L/R, T) | `analysis_unavailable` for all non-NEET exams. | High |
| `/student/revision/:topicId` | Student | `TopicRevisionPage` | Implemented (L/R, T) | `notFound('topic')` for unknown topics. | Low |
| `/student/papers` | Student | `ExamsPage` (alias) | Legacy | Query-compatible. | Low |
| `/student/live` | Student | `LiveClassesPage` → `LiveSchedulePage` | Implemented (L/E/R, Nav, Resp, T) | Timezone test failure; hardcode `rec-rot-b`. | High |
| `/student/live/:sessionId` | Student | `LiveRoomPage` | Partial (L/E/R, Nav, Resp, T) | See Section 4.3. | Critical |
| `/student/recordings` | Student | `RecordingsPage` (learning) via wrapper | Implemented (L/E/R, Nav, Resp, T) | Grid/ledger toggle, search, subject filter. | Medium |
| `/student/recordings/:recordingId` | Student | `RecordingPlayerPage` | Implemented (L/R, Nav, Resp, T) | Resume/chapters/transcript/quiz; no PiP/theater/volume slider. | Medium |
| `/student/performance` | Student | `PerformancePage` | Implemented (L/E/R, Nav, Resp, T) | Trend + table toggles. | Low |
| `/student/doubts` | Student | `DoubtsPage` (learning) via wrapper | Implemented (L/E/R, Nav, Resp, T) | Separate store from faculty inbox. | Medium |
| `/student/doubts/:doubtId` | Student | `DoubtThreadPage` | Implemented (L/R, T) | Timestamp deep link back to recording. | Medium |
| `/student/attendance` | Student | `AttendancePage` (learning) via wrapper | Implemented (L/R, Nav, Resp, T) | Real presence arithmetic; disconnected from faculty/admin registers. | Medium |
| `/student/study-rooms` | Student | `StudyRoomsPage` (learning) via wrapper | Implemented (L/E/R, Nav, Resp, T) | Mock participants. | Low |
| `/student/study-rooms/:roomId` | Student | `StudyRoomPage` | Implemented (L/R, T) | Local focus timer. | Low |
| `/student/profile` | Student | `ProfilePage` | Implemented (L/R, Nav, Resp, T) | Notification/data-consent preferences persisted. | Medium |
| `/student/account` | Student | `ProfilePage` (alias) | Legacy | Same page as profile. | Low |
| `/student/batch` | Student | `StudentBatchPage` | Implemented (L/R, T) | Read-only batch view. | Low |
| `/faculty` (index) | Faculty | `FacultyDashboardPage` | Implemented (L/R, Nav, Resp, T) | Today/queues/cohort. | Low |
| `/faculty/bank` | Faculty | `FacultyBankPage` | Implemented (L/E/R, Nav, Resp, T) | Split ledger + preview; filters live. | Low |
| `/faculty/bank/new` | Faculty | `FacultyQuestionEditorPage` | Implemented (L/R, Nav, T) | Five types; saves to faculty store. | Medium |
| `/faculty/bank/:questionId` | Faculty | `FacultyQuestionEditorPage` | Implemented (L/R, T) | Unknown ID → `ErrorState`; real ID `qb-001` renders. | Low |
| `/faculty/exams` | Faculty | `FacultyExamsPage` | Implemented (L/R, Nav, Resp, T) | Create from preset; status flow. | Low |
| `/faculty/exams/:examId` | Faculty | `FacultyExamBuilderPage` | Implemented (L/R, Nav, T) | Sections, rules, live palette preview; 516 lines. | Low |
| `/faculty/exams/:examId/monitor` | Faculty | `FacultyExamMonitorPage` | Implemented (L/R, Nav, T) | Mock ticker with 5 s default. | Low |
| `/faculty/analysis` | Faculty | `FacultyAnalysisPage` | Implemented (L/R, Nav, T) | Item scatter + fault policy bridged to student result. | Low |
| `/faculty/classes` | Faculty | `FacultyClassesPage` | Implemented (L/R, Nav, Resp, T) | Scheduler + list; no `/faculty/live` equivalent. | High |
| `/faculty/classes/:sessionId/host` | Faculty | `FacultyHostPage` | Implemented but **not a studio** (L/R, Nav, T) | Presence, chat hide, question approve, attention check, end. No media. | Critical |
| `/faculty/recordings` | Faculty | `FacultyRecordingsPage` | Implemented (L/R, Nav, Resp, T) | Upload simulation; separate store. | Medium |
| `/faculty/recordings/:recordingId` | Faculty | `FacultyRecordingEditorPage` | Implemented (L/R, Nav, T) | Trim/chapters/publish. Publish does not reach students. | Medium |
| `/faculty/attendance` | Faculty | `FacultyAttendancePage` | Implemented (L/R, Nav, Resp, T) | Register + CSV export; fixture-based. | Medium |
| `/faculty/doubts` | Faculty | `FacultyDoubtsPage` | Implemented (L/R, Nav, Resp, T) | Reply/resolve in faculty store. | Medium |
| `/faculty/doubts/:doubtId` | Faculty | `FacultyDoubtThreadPage` | Implemented (L/R, Nav, T) | Templates + timestamp link. | Low |
| `/faculty/account` | Faculty | `AccountPage` | Implemented (Nav, Resp) | Theme/density/logout; identity read-only. | Low |
| `/admin` (index) | Admin | `AdminDashboardPage` | Implemented (L/R, Nav, Resp, T) | Figures, trend, calendar, alerts. | Low |
| `/admin/users` | Admin | `AdminUsersPage` | Partial (L/E/R, Nav, Resp, T) | Only "Import a CSV"; no Create User / tabs / row actions. | Critical |
| `/admin/users/import` | Admin | `AdminImportPage` | Implemented (L/R, Nav, Resp, T) | 4-step wizard, row-level validation, audit entry. Committed accounts are `invited` with **no login credentials**. | High |
| `/admin/batches` | Admin | `AdminBatchesPage` | Implemented (L/E/R, Nav, Resp, T) | Track/status filters. | Low |
| `/admin/batches/:batchId` | Admin | `AdminBatchDetailPage` | Implemented (L/E/R, Nav, Resp, T) | Members/subjects/faculty; `seededFor` guard. oxlint `set-state-in-effect` warning at line 56. | Low |
| `/admin/approvals` | Admin | `AdminApprovalsPage` | Implemented (L/E/R, Nav, Resp, T) | Approve/reject/override. | Low |
| `/admin/policies` | Admin | `AdminPoliciesPage` | Implemented (L/R, Nav, Resp, T) | Impact counts + change history. | Low |
| `/admin/integrity` | Admin | `AdminIntegrityPage` | Implemented (L/E/R, Nav, Resp, T) | Decisions require a note. | Low |
| `/admin/reports` | Admin | `AdminReportsPage` | Implemented (L/E/R, Nav, Resp, T) | Mock CSV export. | Low |
| `/admin/moderation` | Admin | `AdminModerationPage` | Implemented (L/E/R, Nav, Resp, T) | Dismiss/warn/remove with notes. | Low |
| `/admin/audit` | Admin | `AdminAuditPage` | Implemented (L/E/R, Nav, Resp, T) | Read-only ledger. | Low |
| `/admin/settings` | Admin | `AdminSettingsPage` | Implemented (L/R, Nav, Resp, T) | Branding; locked palette. | Low |
| `/admin/account` | Admin | `AccountPage` | Implemented (Nav, Resp) | Theme/density/logout. | Low |

**Additional routes not in the v2 reference:** `/sign-in`, `/signup`, `/verify-otp`, `/reset-password`, `/join/:inviteCode`, `/accessibility`, `/design-preview`, `/app`, `/app/*`, `/student/exams/:examId/instructions`, `/student/exams/:examId/confirmation`, `/student/revision/:topicId`, `/student/papers`, `/student/account`, `/student/performance`, `/student/attendance`, `/student/study-rooms`, `/student/study-rooms/:roomId`, `/student/doubts/:doubtId`, `/student/batch`, `/faculty/bank`, `/faculty/bank/new`, `/faculty/bank/:questionId`, `/faculty/classes`, `/faculty/classes/:sessionId/host`, `/faculty/attendance`, `/faculty/doubts/:doubtId`, `/faculty/account`, `/admin/approvals`, `/admin/integrity`, `/admin/moderation`, `/admin/audit`, `/admin/account`. These are **not to be deleted**; several are needed by the working prototype and by existing tests.

**Quality-flag summary (static):** 58 of 63 page components contain a loading/skeleton or pending branch; 20 contain `EmptyState`; 55 contain `ErrorState` or an `isError` branch. The five compatibility wrappers (`src/features/student/pages/{Attendance,Doubts,LiveClasses,Recordings,StudyRooms}Page.jsx`) delegate everything to `src/features/learning/pages/*` and therefore show no flags themselves — this is expected, not a defect.

---

# Section 3 — Page-by-Page Audit

**Shared quality baseline for workspace pages** (applies unless a page overrides it): `PageHeader` from `src/app/layouts/WorkspaceLayout.jsx`, `StudentShell`/`WorkspaceLayout` responsive chrome (desktop rail `lg:`, tablet/mobile drawer, student bottom nav `md:hidden`), TanStack Query via feature hooks, `Skeleton` for pending, `ErrorState` with retry, `useDocumentTitle`, token-only colours, 44 px touch targets, `aria-label`/`aria-pressed` on icon buttons. All 82 smoke-tested URLs rendered without exception. **Real-browser responsive widths, visual spacing and axe results are Unverified** (no Chromium binary). Existing Playwright specs cover desktop/tablet/mobile for auth, student shell and exam hall but were not executed.

Each entry below answers: **Current / Components / Works / Broken / Missing / Mock / Integrations / Changes / Acceptance**.

## 3.1 Public and authentication

- **`/` — `LandingPage`** (`src/features/landing/pages/LandingPage.jsx`). **Current:** long-form marketing page, 5470 chars rendered. **Components:** `ExamTicker`, `FeatureBento`, `HowItWorks`, `DifferentiatorStrip`, `InstitutesSection`, `SiteFooter`, `MockQuestionCard`. **Works:** `landingService.getContent` via `useLandingContent`, `useInstituteProfile`, theme toggle, sign-in links. **Broken:** none observed. **Missing:** no v2 "no public signup" messaging. **Mock:** `landing.js`, `institute.js`. **Integrations:** `PublicLayout`, `ThemeToggle`. **Changes:** remove any copy that implies self-registration when signup is retired. **Acceptance:** renders at 390/768/1440, no horizontal overflow, all links resolve, no console errors.
- **`/login` — `LoginPage`** (`src/features/auth/pages/LoginPage.jsx`). **Current:** email+password with Zod, five-attempt lockout, demo seats, forgot-password link. **Components:** `AuthHeading`, `PasswordField`, `DemoAccounts`, `AuthLink`, `AuthErrorNotice`. **Works:** `AuthService.login`, `useCommitSession`, `homeRouteFor`, deep-link return, `unlockDemo`. **Broken:** no Institute ID field; no first-login redirect; `LoginPage.jsx:86` invites self-registration. **Missing:** `mustChangePassword` handling, policy acknowledgement. **Mock:** `users.js`, `mock/auth.js` (`vyuh.mock.auth.v1`). **Integrations:** `AuthService`, `useSessionStore`, guards. **Changes:** accept Institute ID *or* demo email; add `RequirePasswordChange` redirect; remove signup link. **Acceptance:** temporary password → `/setup-account`; wrong ID/password → distinct errors; five failures lock; deep link preserved; axe clean.
- **`/signup` — `SignupPage`**. **Current:** full self-service student registration (name, email, institute code, batch, password, consents, OTP). **Components:** `ConsentFields`, `PasswordField`, `Select`. **Works:** `AuthService.signup`, `getSignupOptions`, `verifyOtp`. **Broken:** **product-invalid** under v2 rules. **Missing:** n/a. **Mock:** `signupBatches`, `DEMO_INSTITUTE_CODE`. **Integrations:** `AuthService`. **Changes:** unregister the route from `AppRoutes.jsx` (keep the file and its tests until Batch 2 regression tests are rewritten); reuse `ConsentFields.jsx` for the first-login policy acknowledgement. **Acceptance:** `/signup` no longer reachable; no link on `/login`; no regression in the retained auth unit tests.
- **`/verify-otp` — `VerifyOtpPage`**. **Current:** six-digit OTP with paste/auto-advance/resend. **Works:** `getChallenge`, `verifyOtp`, `resendOtp`. **Broken:** part of the retired signup flow. **Changes:** keep for mock password-reset OTP if reset flow retains OTP, otherwise unregister. **Acceptance:** no orphan navigation to this route from visible UI.
- **`/forgot-password` — `ForgotPasswordPage`**. **Current:** email reset request with mock inbox shortcut. **Works:** `requestReset`. **Missing:** Institute-ID lookup, admin password-request queue integration. **Changes:** optionally accept Institute ID; emit a `PasswordResetRequest` into the admin mock store. **Acceptance:** generic message for unknown accounts; admin tab shows the request.
- **`/reset-password` — `ResetPasswordPage`**. **Current:** token + new password + confirm, strength meter. **Works:** `resetPassword`, `setPassword` (salted SHA-256 in mock DB). **Missing:** reuse for first-login change. **Changes:** extract shared password-change form or point `/setup-account` at the same `PasswordField`/strength helpers. **Acceptance:** invalid/expired token handled; new password persists in mock state.
- **`/join/:inviteCode` — `JoinInvitePage`**. **Current:** faculty invitation acceptance that sets a password. **Works:** `getInvite`, `acceptInvite`. **Broken:** **product-invalid** (self-service password creation). **Changes:** convert to an admin-issued-credential notice that redirects to `/setup-account`, or unregister. **Acceptance:** no path exists for a person to create their own account.
- **`/access-denied` — `AccessDeniedPage`** inside `RoleLayout`. **Current:** role-mismatched chrome with escape link. **Works:** `RequireRole` redirects here with `from` state. **Broken:** anonymous users get `/login` instead. **Changes:** decide with client whether it must be public; if so move outside `RequireAuth` and render `RoleLayout` with a fallback shell. **Acceptance:** both anonymous and authenticated mismatched-role cases show an explanatory screen.
- **`/accessibility` — `AccessibilityPage`**. **Current:** static statement in `PublicLayout`. **Changes:** none needed. **Acceptance:** renders, links resolve.
- **`/design-preview` — `DesignPreviewPage`**. **Current:** internal design-system specimen (744 lines) rendered outside any layout. **Works:** token specimens, primitive states, deliberate `E_SNAPSHOT` error specimen (this caused a false-positive in the harness). **Broken:** none. **Missing:** no access control. **Changes:** keep for design QA; consider hiding from production nav. **Acceptance:** not linked from client-facing pages.
- **`*` — `NotFoundPage`**. **Current:** "That page is not part of this workspace." with a home link. **Changes:** reword for public 404; keep role-specific variants. **Acceptance:** every unknown URL renders a branded 404, never a blank page.

## 3.2 Student workspace

- **`/student` — `StudentHomePage`** (`src/features/dashboard/pages/StudentHomePage.jsx`). **Components:** `NextUpCard`, `ExamCountdown`, `RecentResultsCard`, `SubjectStrengthCard`, `StreakSquares`, `ContinueWatchingCard`, `TodayScheduleCard`, `AttendanceSummaryCard`, `DashboardSkeleton`. **Works:** `useStudentHome`, command palette, notifications, empty-attempts scenario. **Broken:** none observed. **Missing:** no Institute ID display (belongs on `/setup-account` completion + profile). **Mock:** `dashboard.js`, `assessments.js`, `attempts.js`, `student-extras.js`, `subject-strength.js`, `recordings.js`. **Integrations:** `CommandPalette`, `StudentShell`. **Changes:** after multi-exam support, ensure "Next Up" only enables papers with a playable definition; surface the new account ID in the seat line. **Acceptance:** all cards read service data; empty scenario; 390/768/1440 no overflow; axe clean.
- **`/student/exams` — `ExamsPage`**. **Components:** `PatternChips`, `Tabs`, `EmptyState`, `ErrorState`, `Skeleton`. **Works:** upcoming/live/past tabs, `?exam=` rules panel, `?tab=` deep links, detail/result links. **Broken:** `Result sheet` button appears on every NEET-track row but errors for non-practice papers. **Missing:** search/filter by subject, attempt status. **Mock:** `exams.js`, `attempts.js`. **Integrations:** `useExams`, `useAttempts`, `studentExams` query key. **Changes:** gate result/enter actions on `examFlow.isPlayable(examId)`; add per-exam attempt badges. **Acceptance:** every row action leads to a rendered, non-error page; counts match rows.
- **`/student/exams/:examId` — `ExamDetailPage`**. **Components:** `PatternChips`, `Card`. **Works:** pattern chips, schedule, negative marking, instructions, resume/enter. **Broken:** `playerReady` is hard-coded to the NEET practice id; other papers show a Phase-3 notice and a disabled primary. **Missing:** result-release policy display. **Changes:** derive readiness from the new exam-definition service. **Acceptance:** any seeded exam with an authored question set can enter instructions/hall.
- **`/student/exams/:examId/instructions` — `ExamInstructionsPage`**. **Components:** `Checkbox`, `Card`, `ErrorState`. **Works:** rules, marking scheme, four system checks (network/storage/worker/viewport), declaration, `startAttempt`. **Broken:** `getPaper` rejects non-NEET exams → `E_PAPER`. **Missing:** camera/mic readiness (not required for the exam hall). **Changes:** extend `getPaper`; keep the existing checks. **Acceptance:** declaration + checks gate entry; resume path works after refresh.
- **`/student/exams/:examId/hall` — `ExamHallPage`**. **See Section 4.1 for the full blueprint.** **Current:** chrome-less full-screen hall, 1151 chars rendered with a seeded attempt. **Components:** `ExamHallHeader`, `ExamTimer`, `SectionTabs`, `QuestionPanel`, `NumericKeypad`, `QuestionPalette`, `StatusShape`, `ToolsDock`, `ToolPanel`, `CalculatorPanel`, `RoughSheetPanel`, `FontSizePanel`, `SubmitSheet`, `ShortcutSheet`, `MathText`. **Works:** answer/clear/review/navigation/keyboard/confidence/font/contrast/dark mode, worker timer, persisted refresh recovery, offline sync, auto-submit, submit sheet. **Broken:** none observed in jsdom. **Missing:** multi-paper support, multi-select option semantics, floating (draggable) dock, richer integrity indicators. **Mock:** `questions.js`, `examFlow` service, `vyuh.exam.flow.v1`. **Integrations:** `analysisService` through stored submissions. **Changes:** extension only. **Acceptance:** see Section 4.1.9.
- **`/student/exams/:examId/confirmation` — `ExamConfirmationPage`**. **Current:** receipt with counts, sync badge, result-sheet handoff; rendered correctly after a seeded submission. **Broken:** with no submitted attempt it `return null` and redirects to `/student/exams` — a silent state with no loading/error/empty explanation. **Missing:** retry of a failed sync, explicit expired-attempt message. **Changes:** add `ErrorState`/`EmptyState` with "Start the paper again" action; keep `useExamSubmissionSync`. **Acceptance:** direct URL without an attempt explains why; after submit, "View result sheet" enabled only when `pendingSync` is false.
- **`/student/exams/:examId/result` — `ExamResultPage`**. **Components:** `ResultSummary`, `ReleaseLock`, `QuestionLedger`, `QuestionDrawer`, `ChartFrame`, `DataTable`, `PacingChart`, `AttemptPathChart`, `MistakeDnaChart`, `AccuracyHeatmap`, `AttemptTrendChart`, `WhatIfPanel`. **Works:** published fixture or stored-submission grading, release lock countdown, filters, drawer focus return, table alternatives, what-if scoring, faculty fault policy. **Broken:** renders `E_ANALYSIS / analysis_unavailable` for `exam-mock-09` (verified). **Missing:** question-level sheets for other exams; integrity log surfacing. **Mock:** `analysis.js`, `attempts.js`, `readStoredSubmissions()`. **Changes:** generalise `getAnalysis` to any authored paper. **Acceptance:** every submitted exam produces a graded sheet; filters/chart tables agree.
- **`/student/revision/:topicId` — `TopicRevisionPage`**. **Works:** `buildTopicRevision`, question list, back link. **Missing:** none material. **Acceptance:** unknown topic → labelled not-found; known topic renders authored questions.
- **`/student/live` — `LiveSchedulePage`** (wrapper `LiveClassesPage`). **Components:** `PageHeader`, mode filter chips, day groups. **Works:** `useLiveSchedule`, group-by-IST-day, relative labels, join/watching links. **Broken:** `Today/Tomorrow` grouping fails around UTC midnight (failing unit test); ended rows hardcode `/student/recordings/rec-rot-b`. **Missing:** live countdown timer. **Changes:** fix `dayAt`/calendar math; use `session.recordingId`; add `LiveCountdown`. **Acceptance:** every group label matches the IST calendar day; ended row links to its own recording.
- **`/student/live/:sessionId` — `LiveRoomPage`**. **See Section 4.3.** **Components:** `AttendanceStrip`, `LiveStage`, `LiveRail`, `AttentionToast`, `PresenceRing`, `VerdictChip`. **Works:** live/ended/scheduled states, attendance join/leave/visibility, scripted chat, question upvotes, attention checks. **Broken:** no faculty-state connection; hardcoded ended recording link. **Missing:** countdown, waiting, reconnect, volume, fullscreen, PiP, theater, replay info. **Mock:** `liveSessions.js`, `attendance.js`, `realtime.js`, `vyuh.mock.learning.<student>.v1`. **Changes:** connect to shared `LiveSessionState`; add controls. **Acceptance:** Section 4.3.
- **`/student/recordings` — `RecordingsPage`** (learning). **Works:** grid/ledger toggle, search, subject filter, progress strips. **Broken:** none. **Missing:** recordings created by "End class" do not appear. **Changes:** read from the shared recording service. **Acceptance:** a class ended in the studio produces a published recording visible here.
- **`/student/recordings/:recordingId` — `RecordingPlayerPage`**. **Components:** `RecordingPlayer`, `RecordingSidePanel`, `LectureToPractice`, `ChapterRail`. **Works:** `useVideoPlayback` (resume, speed, mute, captions, fullscreen, bookmark, keyboard), chapters, transcript, notes, end quiz, `?t=` deep link, `DoubtDialog`. **Broken:** none. **Missing:** volume slider (only mute toggle), PiP, theater mode. **Changes:** extract `useVideoPlayback` for the live viewer; add PiP/theater where required. **Acceptance:** resume persists; deep link seeks; quiz appears only after natural end.
- **`/student/performance` — `PerformancePage`**. **Works:** score/subject trends, `ChartFrame` table toggles, empty-attempts scenario, result-sheet link. **Broken:** none. **Changes:** include newly graded exams in trend. **Acceptance:** trend agrees with `attempts.js` and stored submissions.
- **`/student/doubts` and `/student/doubts/:doubtId` — `DoubtsPage` / `DoubtThreadPage`**. **Works:** open/answered filters, timestamp links, replies, `DoubtDialog` creation from player. **Broken:** replies are written to `vyuh.mock.learning.<student>.v1`; faculty replies are written to `vyuh.mock.faculty.<faculty>.v1` — the two threads do not sync. **Changes:** unify on one doubt service. **Acceptance:** a faculty answer appears in the student thread after the shared state is refreshed.
- **`/student/attendance` — `AttendancePage`** (learning). **Works:** monthly summary, per-session register, plain-words policy, defaulter warning, live attendance strip. **Broken:** none arithmetically (unit tests pass). **Missing:** faculty/admin registers do not include this student's live ticks. **Changes:** shared attendance ledger. **Acceptance:** one session produces Present/Partial/Absent consistently in all three roles.
- **`/student/study-rooms`, `/student/study-rooms/:roomId` — `StudyRoomsPage` / `StudyRoomPage`**. **Works:** interactive-only list, peer counts, join/leave, focus timer, mock presence channel. **Broken:** none. **Missing:** out of v2 scope; do not expand. **Acceptance:** no regression from shared realtime refactor.
- **`/student/profile` — `ProfilePage`**. **Works:** details, batch, institute, notification and data-consent preferences with save toast. **Missing:** Institute ID display; password change (belongs in `/setup-account`); account status. **Changes:** add Institute ID and first-login acknowledgement date (read-only). **Acceptance:** preferences persist; identity comes from admin mock.
- **`/student/batch` — `StudentBatchPage`**. **Works:** batch details, subjects, faculty. **Missing:** none material. **Acceptance:** renders from `useBatches`.
- **`/student/papers`, `/student/account` — aliases.** **Works:** render `ExamsPage` / `ProfilePage`. **Changes:** include in v2 alias map only if bookmarks must survive. **Acceptance:** redirects preserve query/hash.

## 3.3 Faculty workspace

- **`/faculty` — `FacultyDashboardPage`**. **Works:** today's sessions, doubt queue, papers needing a decision, cohort snapshot. **Missing:** "Go to studio" action. **Changes:** add a primary action to `/faculty/live/:sessionId/studio` for the current live session. **Acceptance:** one click reaches pre-live studio.
- **`/faculty/bank` — `FacultyBankPage`** with `BankFilterBar`, `QuestionTable`, `QuestionPreview`, `AddToExamDialog`. **Works:** search/subject/topic/difficulty/type/source filters, split view, add-to-exam. **Broken:** none. **Changes:** alias `/f/questions`; ensure bank questions can feed multi-exam paper definitions. **Acceptance:** filter count announced; scroll/selection preserved.
- **`/faculty/bank/new`, `/faculty/bank/:questionId` — `FacultyQuestionEditorPage`** with `QuestionEditorForm`, `QuestionPreview`. **Works:** five types, live KaTeX, readiness list, discard confirmation, save into faculty store. **Broken:** none; `q-bank-p01` (invented) correctly errors, `qb-001` renders. **Missing:** multi-correct questions cannot be answered correctly in the current hall (`QuestionPanel` always replaces selection). **Changes:** either exclude `multiple` from playable papers or add multi-select support (Section 4.1.3). **Acceptance:** every authored type round-trips into a playable paper.
- **`/faculty/exams` — `FacultyExamsPage`**. **Works:** ledger, create from preset, status. **Changes:** connect status changes to the student exam ledger via a shared exam registry. **Acceptance:** a faculty-approved paper appears in `/student/exams`.
- **`/faculty/exams/:examId` — `FacultyExamBuilderPage`** with `ExamSectionEditor`, `BankPicker`, `PalettePreview`. **Works:** presets, sections/marks/limits, add-from-bank, live palette preview, rules, delete confirmation, enforced status flow. **Broken:** none. **Changes:** publish builder output as the exam definition consumed by `examFlowService`; keep `PalettePreview` as the shared palette contract. **Acceptance:** a built paper is immediately sat by a student in mock mode.
- **`/faculty/exams/:examId/monitor` — `FacultyExamMonitorPage`** with `MonitorBoard`, `MonitorFeed`. **Works:** tile wall, counts, feed via `subscribeMonitor`. **Missing:** no link to real student attempts (tiles are scripted). **Changes:** optional: seed monitor tiles from `vyuh.exam.flow.v1` attempts for the same device. **Acceptance:** counts derive from tiles.
- **`/faculty/analysis` — `FacultyAnalysisPage`** with `ItemScatter`, `ScoreImpactTable`, `WeakTopicList`. **Works:** item analysis, faulty-item confirmation, score recalculation mirrored to student result sheet. **Broken:** none. **Changes:** generalise to the new exam registry. **Acceptance:** faults still move the student's sheet.
- **`/faculty/classes` — `FacultyClassesPage`**. **Works:** scheduler, session list, cancel, host link, attendance threshold. **Missing:** `/faculty/live` hub and studio entry. **Changes:** add `/faculty/live` (and `/f/live` alias) as a live-session hub reusing this page or a thin wrapper; add "Open studio" action. **Acceptance:** studio reachable from the list and dashboard.
- **`/faculty/classes/:sessionId/host` — `FacultyHostPage`** with `HostPanels` (`ParticipantList`, `ChatModeration`, `QuestionQueue`), `ConfirmAction`. **Works:** start/end session, presence counts, attention check, participant mute (student-side mute, not faculty mic), hide chat, approve question, 6 s host ticker, room log, end confirmation. **Broken:** end does not create a recording/finalize attendance/notify; no faculty media. **Missing:** all studio capabilities (Section 4.2). **Changes:** keep as a **control-panel component** inside the new studio rather than deleting it. **Acceptance:** studio reuses these panels and all their existing tests still pass.
- **`/faculty/recordings` / `/faculty/recordings/:recordingId` — `FacultyRecordingsPage` / `FacultyRecordingEditorPage`** with `RecordingEditors`. **Works:** upload simulation, trim handles, chapters, transcript preview, publish/unpublish/delete confirmations, persistence in faculty store. **Broken:** publishing does not change the student library. **Missing:** recording created from a live class. **Changes:** shared recording service. **Acceptance:** end-class → draft recording → publish → student library.
- **`/faculty/attendance` — `FacultyAttendancePage`** with `AttendanceTable`. **Works:** defaulter filter, CSV export of visible rows, summary from unfiltered batch. **Missing:** live session attendance from the student's presence ticks. **Changes:** shared attendance ledger. **Acceptance:** export rows match on-screen rows.
- **`/faculty/doubts` / `/faculty/doubts/:doubtId` — `FacultyDoubtsPage` / `FacultyDoubtThreadPage`** with `ReplyComposer`. **Works:** longest-wait ordering, status filter, reply/resolve, six templates, timestamp link. **Broken:** thread state separated from student side. **Changes:** shared doubt service. **Acceptance:** one thread, two role views.
- **`/faculty/account` — `AccountPage`**. **Works:** theme, density, logout, read-only identity. **Missing:** faculty ID. **Changes:** display Institute ID. **Acceptance:** no self-service identity edit.

## 3.4 Academic office

- **`/admin` — `AdminDashboardPage`** with `StatBlock`, `AttendanceTrendChart`, `ChartFrame`. **Works:** figures, 12-week trend with table alternative, exam calendar, alerts that link to resolving screens. **Missing:** credential/account alerts. **Changes:** add "pending first logins" and "password requests" alert rows. **Acceptance:** alerts resolve to real screens.
- **`/admin/users` — `AdminUsersPage`**. **Current:** search/role/batch/status facets, paged 25-row ledger, one primary action "Import a CSV". **Works:** all filters + paging + empty state. **Broken:** none technically. **Missing:** the entire v2 People workflow: three tabs (Students / Faculty / Password requests), Create User, generated credentials sheet, Copy, Download CSV, secure-sharing note, one-time password visibility, suspend/reactivate/reset/unlock/edit/move-batch actions. **Mock:** `institution.js` `adminUsers`, `vyuh.mock.admin.v1`. **Integrations:** currently read-only; `AdminService` has no mutating user methods. **Changes:** Section 4.4/4.5. **Acceptance:** Section 4.4.8.
- **`/admin/users/import` — `AdminImportPage`** with `Stepper`. **Works:** upload/paste → column mapping → row validation with inline fixes and skip → commit with audit entry. **Broken:** none. **Missing:** committed rows have `status: 'invited'` but no credentials and cannot log in. **Changes:** on commit, optionally generate the same credential set as Create User and offer the credentials CSV; keep row validation unchanged. **Acceptance:** a clean import produces accounts that can complete `/setup-account`.
- **`/admin/batches` / `/admin/batches/:batchId` — `AdminBatchesPage` / `AdminBatchDetailPage`**. **Works:** track/status filters, capacity, members/subjects/faculty assignment, `seededFor` guard. **Broken:** none. **Missing:** move-student-between-batches action from a user row. **Changes:** add a `moveStudentBatch` service method and a confirm dialog; reuse the batch detail's faculty assignment store. **Acceptance:** move updates both rosters and writes an audit entry.
- **`/admin/approvals` — `AdminApprovalsPage`**. **Works:** pending/all tabs, approve/reject/override with notes. **Missing:** full exam register expected by `/a/exams`. **Changes:** add an all-papers register view (reuse `facultyExams` + student `exams`), keep approvals as a tab. **Acceptance:** `/a/exams` lists every paper with status.
- **`/admin/policies` — `AdminPoliciesPage`**. **Works:** six policies, impact counts, validation, confirmation, history. **Changes:** add a read-only "consent version" acknowledgement count from the new first-login state. **Acceptance:** a first-login acknowledgement increments the count.
- **`/admin/integrity` — `AdminIntegrityPage`**. **Works:** reports by paper/candidate, three decisions, `RequireNoteDialog`, service-side note validation. **Changes:** include exam-hall integrity events from `vyuh.exam.flow.v1`. **Acceptance:** a tab-switch/copy-block event appears as evidence.
- **`/admin/reports` — `AdminReportsPage`**. **Works:** date range, format, preview, mock CSV export, audit entry. **Missing:** credential download (belongs in People). **Changes:** no redesign; add an attendance/results source switch if the shared ledger changes shape. **Acceptance:** preview rows equal exported rows.
- **`/admin/moderation` — `AdminModerationPage`**. **Works:** reported doubts/chat, dismiss/warn/remove with notes. **Changes:** connect to shared live chat/question state so a removed message disappears in the room. **Acceptance:** moderation decision visible in studio and viewer.
- **`/admin/audit` — `AdminAuditPage`**. **Works:** search/facets/date range/paging, read-only. **Changes:** append every new account/credential/live-session action through the existing `recordAudit` helper. **Acceptance:** no state-changing call lacks an audit entry.
- **`/admin/settings` — `AdminSettingsPage`**. **Works:** institute name/short name/tagline, mock logo upload, deliberately locked colour system. **Changes:** none; this is the correct place to store the Institute ID prefix/counter seed for credential generation. **Acceptance:** changing branding does not alter tokens.
- **`/admin/account` — `AccountPage`**. **Works:** theme/density/logout. **Missing:** admin ID. **Changes:** display Institute ID. **Acceptance:** no self-service identity edit.

## 3.5 System / shared

- **`guards.jsx`** — `RequireAuth`, `RequireRole`, `GuestOnly`, `BootScreen`. **Works:** deep-link preservation, role mismatch → `/access-denied`, guest-only login/signup, boot skeleton. **Missing:** `RequirePasswordChange`, `RequirePolicyAcknowledgement`. **Changes:** Batch 2. **Acceptance:** no authenticated user with `mustChangePassword: true` can reach a dashboard.
- **`AppProviders` / `ThemeProvider` / `queryClient`** — **Works:** QueryClient defaults (30 s stale, 2 retries, focus/reconnect refetch), stable key factory, light/dark/system theme. **Changes:** add query keys for `admin.credentials`, `live.sessionState`, `studio.media`, `account.setup`. **Acceptance:** invalidation is exact; no stale cross-tab state.

---

# Section 4 — Critical Missing Workflows

## 4.1 Student live examination hall (complete-by-extension)

### 4.1.1 Existing examination components (all reusable — do not rebuild)

| File | Capability |
|---|---|
| `src/features/exam/pages/ExamHallPage.jsx` | Chrome-less composition; attempt lookup; submit/auto-submit; tool state; error/loading states. |
| `components/ExamHallHeader.jsx` | Logo, title, candidate + roll, timer, tab-switch count, status legend, "Review and submit". |
| `components/ExamTimer.jsx` | `HH:MM:SS` rolling digits; `<60 s` danger/oxblood, `<300 s` review/marigold pulse; reduced-motion aware; `role="timer"`. |
| `components/SectionTabs.jsx` | Section tabs with completion meters and `role="progressbar"`. |
| `components/QuestionPanel.jsx` | KaTeX stem, four options, numeric field, confidence chips (Sure/Unsure/Guessing), `+4 / −1` marks. |
| `components/NumericKeypad.jsx` | 56 px keys, backspace/clear/sign/decimal/`=`. |
| `components/QuestionPalette.jsx`, `StatusShape.jsx`, `lib/examStatus.js` | Five shapes + labels + counts + ember current-question outline. |
| `components/ToolsDock.jsx`, `ToolPanel.jsx` | Basic/scientific calculator (safe parser in `lib/calculator.js`), rough canvas, font size, contrast, dark mode, shortcuts; draggable non-modal panels. |
| `components/SubmitSheet.jsx`, `ShortcutSheet.jsx` | Answered / not answered / review / not visited / total; cancel + final; shortcut list. |
| `hooks/useExamFlow.js` | `useExamPaper`, `useStartExam`, `useExamTimer` (worker + jsdom fallback), `useExamSync`, `useSubmitExam`, `useExamSubmissionSync`, `useExamShortcuts`. |
| `hooks/useExamIntegrity.js` | Tab-switch counting, copy/cut/context-menu blocking, fullscreen prompt/log. |
| `store/examStore.js` | Persisted Zustand attempt under `vyuh.exam.flow.v1`; `answer`, `review`, `saveAndNext`, `previous`, `finalize`, `updateReceipt`, sync state. |
| `lib/examState.js` | Pure `createAttemptState`, `countStatuses`, `submissionCounts`, `stateAfterResponse`, `visitQuestion`, `setAnswer`, `clearAnswer`, `markReview`, `remainingSeconds`, numeric validation, visits log. |
| `workers/examTimer.worker.js` | 250 ms tick from an absolute server-corrected deadline; stops at zero. |
| `services/mock/examFlow.js` | `getPaper`, `startAttempt`, `syncAttempt`, `submitAttempt`, `readStoredSubmissions`. |
| `mock-data/questions.js` | 60 authored NEET questions (3 sections × 20), correct keys, numeric tolerances, explanations, LaTeX. |

### 4.1.2 Existing functional capabilities (verified in code and by the jsdom render)

Full-screen chrome-less route outside `StudentLayout`; header with title/timer/candidate; section tabs; single-choice and numeric questions; four options; numeric keypad; answer/clear/previous/next/save-and-next/mark-for-review; palette jump; five distinguishable states by shape+label+colour; current question outlined; confidence chips; keyboard shortcuts `1–4`, `N`, `M`, `C`, `P`, `?` (paused for inputs/textarea/select/contenteditable, including the calculator); accurate worker countdown with `<5 min` and `<1 min` tones; auto-submit at zero via `onExpire → submit('timer_expired')`; refresh recovery via persisted `deadlineAt`, `entries`, `confidences`, `fontSize`, `highContrast`, `currentIndex`, tool prefs; offline queue + reconnect sync; basic/scientific calculator, rough sheet, font-size, contrast, dark mode; submit sheet with counts/cancel/final; confirmation receipt; result sheet consumes stored submissions (`analysisService.getAnalysis` → `buildAnalysisFromSubmission`) — **the smoke harness confirmed the result sheet renders after a seeded submission**.

### 4.1.3 Missing capabilities / broken interactions (precise)

1. **Only one playable paper.** `src/services/mock/examFlow.js:45-52` `findExam()` throws `paper_unavailable` unless `examId === NEET_PRACTICE_EXAM_ID`. `src/services/mock/analysis.js:72` throws `analysis_unavailable` for every other result sheet. Verified: `/student/exams/exam-mock-09/result` renders `E_ANALYSIS`.
2. **Multiple-correct questions are not answerable correctly.** `QuestionPanel.jsx` uses `role="radiogroup"` and `onAnswer([option.key])` for every non-numeric question; `useExamShortcuts` also selects one option. `questionBank.js` authors `multiple` questions. Either render checkboxes + accumulate `selected[]` or exclude `multiple` from playable papers.
3. **Integrity event indicators are incomplete.** `ExamHallHeader` shows only `tabSwitches`; `integrityEvents` (`copy_blocked`, `cut_blocked`, `context_menu_blocked`, `fullscreen_enter/exit/prompt`) are logged but never surfaced.
4. **Tools dock is a sticky bottom bar, not a floating dock.** `ExamHallPage.jsx` renders `<ToolsDock>` inside `<div className="sticky bottom-0 …">`. Only the tool *panels* are draggable (`ToolPanel.jsx`).
5. **Confirmation page has no loading/empty/error state** and silently redirects when no submitted attempt exists.
6. **Result sheet for other exams, topic revision for other papers, and the exam monitor** are not connected to real attempts.
7. **No student-facing "attempt history / re-attempt" model** beyond the single stored submission per paper.
8. **Header does not show the current section name** (it is carried by `SectionTabs`); the brief asks for "current section" in the header.
9. **Refresh recovery for background-tab behaviour is implemented** but was **not verified in a real browser** here (no Chromium). Existing e2e `exam.spec.js:130` claims coverage.

### 4.1.4 Required mock-data structures

* `mock-data/examDefinitions.js` (new): one record per seeded exam: `{ id, title, track, kind, status, window:{startsAt,endsAt}, durationSeconds, sections:[{id,name,subjectId,marksPerQuestion,negativeMarks,timeLimitMinutes,questionIds}], markingScheme, rules[], declaration, resultReleaseRule, integrityMode, questionSetId }`.
* `mock-data/questions.js` → `questionSets: Record<string, AuthoredQuestion[]>`; keep the existing 60 NEET questions as `exam-neet-practice`; add smaller authored sets (e.g. 12–20 questions) for `exam-mock-09`, `exam-rot-live`, `exam-org-12`, `exam-mock-08`. Every question keeps `correctOptions`/`correctNumeric`, `numericTolerance`, `explanation`, `marks`, `negativeMarks`, `sectionId`, `chapterId`.
* `mock-data/attempts.js` + `vyuh.mock.exam.submissions`: keep historical summaries but ensure ids match `examDefinitions`.
* `mock-data/analysis.js`: replace the single `analysisFixture` with `analysisByExam` or derive all sheets from `buildAnalysisFromSubmission`; keep `releasePolicy` per exam.
* `contracts/exam.js`: add `ExamDefinition`, `QuestionSet`, `ExamAttemptSummary`, `IntegrityIndicator`, `PlayableExam`, `MultiSelectQuestion`; extend `ExamQuestion.type` with `'multiple'` semantics.
* `contracts/analysis.js`: `ExamAnalysis.examId` already exists; allow any registered exam.

### 4.1.5 Required service methods

```
examFlow.listPlayableExams(studentId) -> PlayableExam[]
examFlow.getPaper(examId, studentId) -> ExamPaper          // generalise findExam
examFlow.startAttempt(input) -> ExamStartReceipt
examFlow.syncAttempt(input) -> ExamSyncReceipt
examFlow.submitAttempt(input) -> ExamSubmissionReceipt
examFlow.readStoredSubmissions() -> Record<attemptId, {input, receipt}>
examFlow.getAttemptHistory(studentId) -> ExamAttemptSummary[]
analysis.getAnalysis(examId, studentId, attemptId?) -> ExamAnalysis   // generalise
analysis.getRevision(studentId, topicId) -> TopicRevision
faculty.publishExam(examId) -> ExamDefinition                       // bridge builder → registry
```

### 4.1.6 Component-level implementation plan

1. `src/services/mock/examFlow.js`: replace `findExam` hard gate with a lookup in `examDefinitions`; build paper from `questionSets[examId]`; strip answer keys/explanations as today; keep duration/offset demo flags (`vyuh.mock.examDurationSeconds`, `vyuh.mock.examOffsetMs`, `VITE_EXAM_QUESTION_COUNT`).
2. `src/services/mock/analysis.js`: remove `analysis_unavailable`; `buildAnalysisFromSubmission` for any authored set; fall back to a per-exam published fixture only when no submission exists; keep `releasePolicy` and fault mirror.
3. `src/features/exam/pages/ExamDetailPage.jsx`, `src/features/student/pages/ExamsPage.jsx`: replace `playerReady`/`track === 'NEET'` checks with `playable` from `examFlow.listPlayableExams`.
4. `src/features/exam/components/QuestionPanel.jsx`: branch on `question.type === 'multiple'` → `role="group"`, `aria-checked` checkboxes, accumulate/deselect `selected[]`; keep single/numeric unchanged. Update `useExamShortcuts` to toggle rather than replace for multi-select.
5. `src/features/exam/components/ExamHallHeader.jsx`: add `Current section: <name>` and a compact integrity strip derived from `attempt.integrityEvents` (counts by type, always shape+label+number; no colour-only meaning).
6. `src/features/exam/components/ToolsDock.jsx` + new `FloatingToolsDock.jsx`: extract existing buttons into a presentational component; render inside a draggable `ToolPanel`-style container (reuse `useDragControls`) with a collapse/expand control; keep the sticky bottom fallback for <768 px. Do not restyle tokens.
7. `src/features/exam/pages/ExamConfirmationPage.jsx`: add `Skeleton` while store hydrates, `EmptyState`/`ErrorState` for a missing/expired attempt, and a "Back to exams / Start again" action.
8. `src/app/providers/queryClient.js`: add `examDefinitions`, `attemptHistory` keys; invalidate on submit.
9. Keep `ExamTimer`, `SubmitSheet`, `QuestionPalette`, `StatusShape`, `SectionTabs`, `NumericKeypad`, calculators, rough sheet, font/contrast/dark, worker and store **unchanged**.

### 4.1.7 Acceptance criteria

* Every exam in the student ledger with an authored question set can be opened → instructions → hall → submit → confirmation → result. Non-playable exams show an explicit, labelled "not available yet" state instead of a dead button.
* All six palette states (including current) distinguishable by shape + label + semantic colour; `aria-label` states the status; counts always equal paper total.
* Timer accurate after backgrounding; `<5 min` marigold pulse, `<1 min` oxblood; auto-submit exactly once at zero; refresh restores question, answers, confidence, tool prefs and remaining time.
* Keyboard shortcuts work and pause inside the calculator/rough-sheet inputs; `1–4` toggles multi-select correctly.
* Submit sheet shows answered / unanswered / marked / not-visited / total; Cancel returns; Final and Auto both produce a receipt and a graded result.
* Hall has no student sidebar, is usable at 1280/768, shows the "best on larger screen" notice on phones, and passes axe A/AA.
* Result sheet numbers trace to the stored attempt and the authored key; no component invents a score.

### 4.1.8 Required test cases

`tests/unit/exam-flow.test.js` (extend), plus new `tests/unit/exam-multi-paper.test.js` and `tests/e2e/exam-multi-paper.spec.js`:
1. `getPaper` for each registered exam returns answer-key-free questions and contiguous sections.
2. `submitAttempt` + `getAnalysis` grade each paper using its own key, marks and negative marking.
3. Multi-select answer state machine (select A, add C, remove A, clear → `not_answered`).
4. Timer: fake-clock zero → exactly one `timer_expired` submission; 299 s and 59 s tone flags.
5. Refresh recovery: persist store → remount → same `currentIndex`, `entries`, `confidences`, `fontSize`, `remainingSeconds` from `deadlineAt`.
6. Offline queue → `online` event → `syncState: 'synced'`, `pendingSync: 0`.
7. Shortcut `n` inside calculator input does not advance.
8. Submit sheet counts equal palette counts; cancel returns; final navigates.
9. Integrity: tab switch / blocked copy / fullscreen exit each increments the visible indicator.
10. Responsive: 390/768/1440 no horizontal overflow; keypad keys ≥56 px; axe clean.

## 4.2 Faculty live-class studio

### 4.2.1 Audit of the existing live-class implementation

`FacultyHostPage` (`/faculty/classes/:sessionId/host`) is a **control console with no media**. It already has: presence list with attention scores and mute/unmute of *participants*, chat moderation ("hide", behind a confirmation), question queue ("Approve → On screen"), an attention check that opens a 15-second window, a room log, counts (present/idle/left/muted/hands/check-on-time/check-missed), a `Live` badge, an "updated …" timestamp, and an `End session` confirmation. `services/mock/faculty.js` persists `host[sessionId] = {startedAt, endedAt, muted[], hiddenChat[], approved[], attention}` in `vyuh.mock.faculty.<id>.v1` and pushes snapshots through `subscribeHost` with `createMockTicker` (default 6 s).

There is **no** `getUserMedia`, `mediaDevices`, `MediaStream`, `MediaRecorder`, `getDisplayMedia`, camera/mic selector, preview, audio-level meter, permission state, stream health, on-air duration, viewer/peak counts, faculty mic/camera toggle, screen share, pinned messages, removed messages, timeout students, question upvotes/answered states, track cleanup, viewer notification, attendance finalization, recording creation or session summary anywhere in `src/` (verified by repository-wide grep).

### 4.2.2 A. Pre-live studio (to build)

**Route:** `/faculty/live/:sessionId/studio` canonical; `/f/live/:sessionId/studio` alias. Reuse `FacultyLayout`/`WorkspaceLayout` chrome or a dedicated studio shell; keep the Ink/Paper/Ember tokens.

**New components** under `src/features/faculty/studio/`:
* `StudioHeader` — session title, batch, subject, scheduled start, `SessionStateBadge`, on-air duration.
* `DeviceSetup` — `enumerateDevices()` lists for `videoinput`/`audioinput`; mirrored `<video>` preview (`scaleX(-1)` on the video element only); `getUserMedia({video:{deviceId},audio:{deviceId}})`; permission states `prompt|granted|denied|unsupported`; explicit Retry button; fallback to `DemoSource` (looping `/media/rotational-dynamics-sample.mp4` + poster) when denied.
* `MicLevelMeter` — `AudioContext` + `AnalyserNode` + `requestAnimationFrame` RMS; a labelled meter (shape+number, not colour only); stop the audio context on unmount.
* `ReadinessChecklist` — camera, microphone, network (`navigator.onLine`), session title/batch/subject, scheduled window, attendance threshold, recording consent copy. `Go Live` disabled until required checks pass.
* `StudioGoLive` — one filled ember primary; calls `live.startSession`.

### 4.2.3 B/C. On-air studio and faculty control panel

* `LiveVideoStage` — `<video srcObject={stream}>` with on-air dot, session duration (absolute `startedAt`), viewer count + peak viewer count, `StreamHealth` (mock bitrate/fps/dropped frames derived from a ticker; shape+label+number).
* `OnAirControls` — faculty mic mute/unmute (`track.enabled`), camera on/off, `getDisplayMedia()` screen share with stop, `Attention check`, `End class`.
* Reuse `HostPanels.jsx` as the control-panel base; extend `ParticipantList` with "Timeout student" (timed mute with `expiresAt`), `ChatModeration` with Pin / Remove (not just hide) and `pinnedMessageId`, `QuestionQueue` with upvote counts, Approve and Mark answered.
* `StudioSummary` (post-class) — duration, peak viewers, questions answered, chat removed, attention checks, attendance summary, recording id, link to recording editor.

### 4.2.4 D. End-class workflow

`ConfirmAction` dialog → `live.endSession(sessionId, summaryInput)` → stop every `MediaStreamTrack` (`video.stop()`, `audio.stop()`, screen-share track), close `AudioContext`, publish `session.ended` to viewers, finalize `AttendanceRecord[]` from viewer presence, create a `FacultyRecording` draft (`status: 'processing' → 'ready'`, pointing at the demo media), write one audit entry, invalidate `faculty.classes`, `faculty.recordings`, `learning.liveSchedule`, `learning.attendanceReport`, then show `StudioSummary`.

### 4.2.5 E. Streaming architecture for the prototype — investigation result

**Finding: there is no `BroadcastChannel` in this repository.** `grep -RIn "BroadcastChannel|getUserMedia|MediaStream|…" src` returns zero media/transport matches. The mock transport is `src/mock-data/realtime.js`:
* `createEventEmitter()` — an **in-memory `Set` of listeners per module instance**;
* `createMockClassChannel()` / `createMockRoomChannel()` / `createMockTicker()` — injectable timers for scripted events;
* `services/mock/learning.js` — per-student `localStorage` store `vyuh.mock.learning.<student>.v1`;
* `services/mock/faculty.js` — per-faculty `localStorage` store `vyuh.mock.faculty.<faculty>.v1`;
* the only `storage` listener in the app is `useSession.js:63`, and it watches only `vyuh.session`.

Therefore **the existing transport cannot support a same-device, two-tab demonstration**: a faculty tab and a student tab have separate JS heaps, separate emitters and separate localStorage keys. A `MediaStream` also cannot be structured-cloned through `BroadcastChannel`, so raw camera frames cannot be sent that way.

**Smallest practical mock-only solution (no backend, no new dependency):**
1. Add `createCrossTabChannel(name)` in `src/mock-data/realtime.js` (or a new `src/services/mock/liveSessionBus.js` if the architecture guard prefers the service layer): `new BroadcastChannel('vyuh.live.<sessionId>')` with a `window.addEventListener('storage', …)` fallback for browsers without it. Messages are small JSON envelopes `{type, sessionId, revision, at, payload}`.
2. Add a single shared state record `localStorage['vyuh.mock.liveSession.<sessionId>.v1']` owned by a **new `liveSessionService`**: `{sessionId, facultyId, batchId, subjectName, state:'scheduled'|'prelive'|'live'|'reconnecting'|'ended', startedAt, endedAt, viewerIds[], peakViewers, chat[], questions[], pinnedMessageId[], timeouts[], streamHealth, mediaMode:'camera'|'demo'|'screen', recordingId, attendance[]}`. Every mutation writes the record, increments `revision`, and broadcasts the envelope. Every tab hydrates from localStorage on mount, then applies messages with `revision > current`.
3. **State/control plane:** studio and viewer publish/consume `go_live`, `chat`, `question`, `upvote`, `approve`, `answered`, `pin`, `remove`, `timeout`, `attention_check`, `attention_response`, `end_class`, `viewer_join/leave`, `stream_health`. This gives a genuinely connected demo in two tabs of the same browser.
4. **Video plane (mock):** the studio shows the **real local camera preview** via `getUserMedia` (same tab). The viewer plays a local sample MP4 from `/public/media/` in a live-styled player with the LIVE badge; the shared state carries `mediaMode` and `startedAt`, not pixels. This is honest: it is a frontend prototype, no streaming server. Optional stretch (only if the client insists on seeing the same camera pixels): `canvas.captureStream()` + `MediaRecorder` → `Blob` chunks → `BroadcastChannel` → `MediaSource`/object URL in the viewer; note this is materially more complex, has seconds of latency, and is still not production streaming. Do **not** introduce WebRTC/RTCPeerConnection, a signalling server or a media server.
5. Permissions: `getUserMedia`/`getDisplayMedia` require a secure context; `localhost` and the Arena HTTPS preview host both qualify. Denied/unsupported → `DemoSource` with a visible "Demo source" chip; never a blank stage.
6. Future-real-streaming design: keep all UI behind `liveSessionService` and a `StreamHandle` interface (`attach(videoEl)`, `stop()`), so a future WebRTC/HLS adapter can replace the mock transport without touching components.

### 4.2.6 Required mock entities and service methods

```
LiveSessionState, Viewer, StudioMediaState, StreamHealth, PinnedMessage,
RemovedMessage, ViewerTimeout, StudioQuestion (upvotes, approved, answered),
SessionSummary, MockRecordingDraft

live.getSessionState(sessionId) -> LiveSessionState
live.subscribeSession(sessionId, listener) -> unsubscribe   // BroadcastChannel + storage fallback
live.startSession(sessionId, {mediaMode}) -> LiveSessionState
live.endSession(sessionId, summary) -> {state, recording, attendance, summary}
live.setMediaState(sessionId, {micOn, cameraOn, screenSharing}) -> LiveSessionState
live.sendChat / removeChat / pinChat / timeoutViewer
live.askQuestion / upvoteQuestion / approveQuestion / answerQuestion
live.triggerAttentionCheck / respondAttentionCheck
live.reportStreamHealth(sessionId, snapshot)
faculty.createRecordingFromSession(sessionId) -> FacultyRecording
```

Add `queryKeys.live.sessionState(sessionId)` and `queryKeys.faculty.studio(facultyId, sessionId)`.

### 4.2.7 Acceptance criteria

* Pre-live: camera/mic selection changes the preview; mirrored preview; mic meter moves with input; denied permission shows the labelled demo source; checklist blocks Go Live until required items pass.
* On-air: LIVE badge, duration from `startedAt`, viewer/peak counts, mic/camera/screen toggles change `MediaStreamTrack.enabled` and shared state; attention check reaches viewers; stream health shows numbers with labels.
* Control panel: viewer list, pin/remove/timeout, question upvotes/approve/answered all update both tabs within one tick with no reload.
* End: confirmation → all tracks stopped → viewers see "Class ended" → mock attendance finalized → draft recording visible in `/faculty/recordings` → summary shows correct counts.
* No backend, no new npm dependency, no production streaming infrastructure; `VITE_USE_MOCK=true` remains the default.

### 4.2.8 Required tests

Unit: device-permission fallback matrix; `createCrossTabChannel` envelope ordering/revision; `endSession` track cleanup (mocked `MediaStreamTrack`); question upvote/approve/answered state machine; viewer/peak arithmetic; stream-health labels; summary counts. E2E (two browser contexts/pages in the same context): Go Live in faculty tab → student tab shows LIVE; chat/pin/remove/upvote sync; End class → both tabs show ended and the recording appears. axe on pre-live and on-air; responsive 390/768/1440.

## 4.3 Student live-class viewer

### 4.3.1 Current state (verified)

`LiveRoomPage` renders live, scheduled-not-open and ended states. Live: `AttendanceStrip` (presence ring, verdict, attention ticks), `LiveStage` (16:9 looping sample MP4 with a Glacier LIVE dot, play/pause, interactive-only mic/camera/raise-hand local UI-state buttons, watching count, Leave), `LiveRail` (Chat tab + Question queue tab, send/ask/upvote, scripted incoming messages and scheduled approval), `AttentionToast` with a 15-second window. `useLiveRealtime` subscribes to the in-memory class channel. Ended state links to `/student/recordings/rec-rot-b` unconditionally.

### 4.3.2 Missing vs the intended experience

| Requirement | Current |
|---|---|
| Scheduled class screen / countdown | "This room is not open yet" with `formatDateTime`; **no ticking countdown**. Schedule page has `formatRelative`, no countdown. |
| Live waiting state | None; a session is either `live` or not. |
| Live video playback | Looping local sample MP4; **not connected to faculty camera**. |
| Video controls | Play/pause only. |
| Volume and mute | **Absent** (`<video autoPlay muted loop>`; no volume control). |
| Fullscreen / PiP / Theater | **Absent** in `LiveStage`; fullscreen exists only in `RecordingPlayer`. |
| Chat / Questions / Upvotes / Raise hand | Present (chat, queue, upvote, raise-hand local UI only). |
| Reconnection state | **Absent**; `connected` exists in attendance state but is not surfaced. |
| Ended class state | Present, but hardcoded replay link. |
| Replay availability | Hardcoded `rec-rot-b`; not derived from `LiveSessionState.recordingId`. |
| Attendance information | Present via `AttendanceStrip` and `/student/attendance`. |
| Shared mock session state | **Absent**; separate `vyuh.mock.learning.*` vs `vyuh.mock.faculty.*`. |

### 4.3.3 Implementation blueprint

1. `src/features/learning/pages/LiveRoomPage.jsx`: read `useLiveSessionState(sessionId)` (new shared service) alongside `useLiveRoom`; derive `state` (`scheduled | waiting | live | reconnecting | ended`) from `LiveSessionState`, not only `session.status`.
2. New `LiveCountdown` component (reuse `useCountdown.js` pattern from auth): shows `startsAt - now` with hours/minutes/seconds in JetBrains Mono; switches to "Waiting for faculty" when the window opens but `state !== 'live'`.
3. Replace `LiveStage` with a `LivePlayer` built by **extracting** `useVideoPlayback.js` capabilities into a shared `useMediaControls` hook: play/pause, seek (disabled for live), volume slider + mute, captions, fullscreen, `requestPictureInPicture()`, theater mode (a container class that widens the stage and collapses the rail), keyboard (Space/K, M, F, T, P). Keep `RecordingPlayer` working by refactoring, not rewriting.
4. `LiveWaiting`, `LiveReconnecting`, `LiveEnded` states: waiting shows faculty/batch/subject and countdown; reconnecting shows a retry action and preserves attendance; ended shows `recordingId` from shared state, attendance verdict, and a "Watch replay" button that is disabled until the mock recording is `ready`.
5. `LiveRail`: keep tabs; route chat/questions/upvotes through `liveSessionService` so faculty and students see the same messages; honour `pinnedMessageId`, removed message ids and viewer timeouts (a timed-out student's composer is disabled with an explanatory label and expiry).
6. Raise hand: publish `viewer_hand` to shared state so it appears in the faculty `counts.handRaised`.
7. Attendance: keep `useLiveAttendance` arithmetic (`learningMath.js` is pure and unit-tested); on `end_class`, use the shared `attendance[]` record so student / faculty / admin agree.
8. Two-tab acceptance: faculty Go Live in tab A → tab B transitions from waiting to live without reload; End class in tab A → tab B shows ended + replay.

### 4.3.4 Acceptance criteria and tests

All 15 viewer states/controls above demonstrable; no console errors; no horizontal overflow at 390/768/1440; captions/fullscreen/PiP degrade gracefully with a labelled fallback when the browser refuses; axe clean. Tests: countdown reaches zero and flips state; volume/mute/fullscreen/PiP/theater toggles; chat/pin/remove/question/upvote cross-tab sync; ended state uses the correct recording id; attendance verdict identical across roles; reconnect preserves the presence register.

## 4.4 Admin-created student accounts

### 4.4.1 Expected workflow vs current

Spec: People Management → three tabs (Students / Faculty / Password requests) → Create User → choose student/faculty → generate `VYU-S-26-0231` / `VYU-F-0042` + temporary password → credentials sheet with Copy + Download CSV + secure-sharing note + "password change on first login" → password never visible again after the sheet closes → first login forced to change password + acknowledge data policy → role dashboard.

Current: `/admin/users` is a read-only paged ledger with one "Import a CSV" action. `AdminService` (`src/services/types.js:191-213`) has **no** `createUser`, `suspendUser`, `reactivateUser`, `resetPassword`, `unlockUser`, `moveStudent`, `editUser`, `listPasswordRequests` or `resolvePasswordRequest`. `commitImport` (`src/services/mock/admin.js:436-495`) creates `invited` rows with `id`, `rollNumber`, `email`, `role`, `batchId`, `status` — and **no password or Institute ID**, so those accounts cannot authenticate. Public `/signup` is the only way to create a login today.

### 4.4.2 Specification gap requiring client confirmation

The directive says "Temporary passwords must be generated using the existing specification" and gives ID examples, but **no specification for the password algorithm, ID counter source, academic-year token (`26`) or reset-request policy exists in this repository**. `README.md`/`PHASE-*.md` only document demo email seats and `DEMO_PASSWORD = 'vyuh2026'`. **Batch 2 must obtain client confirmation** of: (a) ID format and counter scope (per institute / per year / per role), (b) temporary password alphabet/length/expiry, (c) whether the credentials CSV includes the plaintext password, (d) password-request approval rules. Until then, implement the examples literally with a documented mock generator and a `TODO` in the contract — do not invent hidden business rules.

### 4.4.3 Required mock entities

`src/mock-data/accounts.js` (new): `instituteIdCounter` (`{student: 231, faculty: 42, year: '26'}`), `credentialPolicy` (proposed, pending confirmation), `passwordRequests[]`, `passwordRequestStatusLabels`, `accountStatusLabels` (reuse `institution.js`), `firstLoginPolicy` version. Extend `contracts/user.js`/`contracts/admin.js`:

```
InstituteAccount {
  id, instituteId, role, name, email, phone?, batchId?, batchName?,
  status: 'active'|'invited'|'suspended'|'locked',
  mustChangePassword: boolean,
  temporaryPasswordIssuedAt: string|null,
  acknowledgedPolicyVersion: string|null,
  createdAt, lastActiveAt, suspendedAt?, lockedUntil?,
  credentialDelivery: 'pending'|'shown'|'delivered'
}
CredentialSheetRow { instituteId, temporaryPassword, role, name, batchName, mustChangePassword }
PasswordRequest { id, instituteId, name, role, requestedAt, status:'open'|'approved'|'declined'|'resolved', note, resolvedAt?, resolvedBy? }
```

Persist to `localStorage['vyuh.mock.accounts.v1']` (single source shared by auth + admin + CSV import), with the existing `vyuh.mock.auth.v1` retaining only password hashes/lockouts/challenges. Keep `vyuh.session` as the session envelope; extend `authSessionSchema` in `src/services/authSchemas.js` with optional `mustChangePassword`, `acknowledgedPolicyVersion`, `instituteId`.

### 4.4.4 Required service methods

```
auth.login({ instituteId | email, password }) -> AuthSession  // demo seats unchanged
auth.changePasswordWithSetup({ newPassword, policyVersion, consent }) -> AuthSession
admin.createUser(adminId, {role, name, email?, phone?, batchId?}) -> {account, credentials}
admin.listAccounts(adminId, {tab, query}) -> AccountPage
admin.listPasswordRequests(adminId) -> PasswordRequest[]
admin.resolvePasswordRequest(adminId, id, {decision:'approve'|'decline', note}) -> PasswordRequest
admin.suspendAccount / reactivateAccount / unlockAccount / resetPassword / editAccount / moveStudentBatch
admin.issueCredentialsCsv(rows) -> Blob/CSV string        // client-side download, no server
admin.audit(...) appends through the existing recordAudit()
```

### 4.4.5 UI blueprint

`AdminUsersPage` → `PeopleTabs` (`Students`, `Faculty`, `Password requests`) + `CreateUserDialog` (role radio, name, batch, contact; generated ID preview) + `CredentialsSheet` (Institute ID, temporary password, Copy button per value, "Download credentials CSV", secure-sharing copy, "Password change required on first login", explicit one-time visibility note) + `AccountRowActions` (Suspend/Reactivate, Reset password, Unlock, Edit, Move batch) each behind `ConfirmAction`/`RequireNoteDialog` where destructive. `PasswordRequestsTab` with approve/decline and reason. On sheet close: clear the plaintext from component state and from `admin` query cache; persist only `temporaryPasswordIssuedAt` and a hash in the mock auth store; a re-opened account row must show `••••••••` and "Password was shown once".

### 4.4.6 Acceptance criteria

* No public signup or self-registration path remains.
* Creating a student yields `VYU-S-26-0231`-shaped ID; faculty yields `VYU-F-0042`-shaped ID; counters increment without collisions across CSV import and Create User.
* Credentials sheet shows both values, Copy works, CSV downloads with the same rows, and closing it removes the plaintext from the normal interface and from the query cache.
* The new account can log in with Institute ID + temporary password and is forced to `/setup-account`.
* Suspend blocks login; reactivate restores; unlock clears lockout; reset generates a new one-time credential; edit/move update both rosters and write audit entries; CSV import accounts also become loginable.
* Every mutation appears in `/admin/audit`.

### 4.4.7 Required tests

Unit: ID generator uniqueness across roles/years/import; password hash never returned by `listAccounts`; `mustChangePassword` gate; suspend/login failure; reset request lifecycle; CSV row equality; plaintext cache invalidation. E2E: admin creates student → copy/download → close sheet → log in as student → forced setup → dashboard; admin suspends → student login fails; password request approve → new credential. axe on dialog/sheet; mobile table overflow.

## 4.5 Admin-created faculty accounts

Same workflow as 4.4 with role `faculty`; differences: no batch requirement, subject/designation fields, `VYU-F-0042` counter, faculty roster in `batchesAdmin.js` must be updated so `/admin/batches/:batchId` assignment sees the new teacher, and `/faculty` dashboard must resolve `useFacultyId()` for the new session. Retire `/join/:inviteCode` as a self-service password-setting route (keep the file until tests are rewritten). Acceptance: a newly created faculty can log in, is forced through `/setup-account`, lands on `/faculty`, sees their own classes/bank/recordings keyed by their new `facultyId`, and appears in the faculty roster. Tests mirror 4.4.7 with role=faculty.

## 4.6 First-login password change

**Route:** `/setup-account` (new, public in the router but only meaningful with a session). **Guard:** `RequirePasswordChange` in `guards.jsx` — any authenticated user with `session.user.mustChangePassword === true` (or `acknowledgedPolicyVersion !== currentPolicyVersion`) is redirected to `/setup-account` from every protected route; `GuestOnly` must not bounce them back to their dashboard. **Page:** reuse `AuthLayout`, `AuthHeading`, `PasswordField` (strength meter), `ConsentFields.jsx` (Terms + attendance data policy), `newPasswordSchema`, and `Checkbox`; show Institute ID read-only; submit `auth.changePasswordWithSetup`. **Mock:** `setPassword(email|instituteId, newPassword)` already exists in `mock/auth.js`; add `mustChangePassword=false`, `acknowledgedPolicyVersion`, `acknowledgedAt`, and a `policy.acknowledged` audit entry. **Redirect:** `homeRouteFor(user.role)` → `/student`, `/faculty`, `/admin`. **Session restore:** `authSessionSchema` must carry the flags so a refresh enforces the gate. **Acceptance:** temporary password rejected after change; new password accepted; skipping via URL is impossible; acknowledgement recorded once; refresh mid-setup retains the gate; demo seats remain unaffected. **Tests:** unit guard matrix for all 3 roles; e2e full first-login journey; axe.

## 4.7 Examination lifecycle

**Current chain:** faculty `facultyExams.js` (5 papers) → `FacultyExamBuilderPage` → `setExamStatus` (draft → pending_approval → approved → scheduled → live → completed) → `AdminApprovalsPage` (`approvals.js`) → student `exams.js` ledger → `examFlowService` (only NEET practice) → `vyuh.exam.flow.v1` → `submitAttempt` → `analysisService` (only NEET practice) → `ExamResultPage`. **Three registries disagree:** `facultyExams.js` ids (`exam-neet-mock-07`, `exam-jee-main-11`, …) vs `exams.js` ids (`exam-neet-practice`, `exam-mock-09`, `exam-rot-live`, …) vs `approvals.js` ids (`exam-jee-main-11`, `exam-neet-mock-09`, `exam-shikhar-22`, …). Only `exam-neet-practice` appears in both faculty and student fixtures.

**Blueprint:** introduce `mock-data/examDefinitions.js` as the single registry (Section 4.1.4). `facultyExams.js`, `exams.js`, `approvals.js`, `itemAnalysis.js` should re-export or reference it rather than duplicate ids. Add `examRegistry.getForStudent(studentId)`, `examRegistry.getForFaculty(facultyId)`, `examRegistry.getForAdmin()`, and `examRegistry.transition(examId, next, actor, note)` with the existing `STATUS_FLOW`. Wire `AdminApprovalsPage.decideApproval`, `FacultyExamBuilderPage.setExamStatus`, `ExamsPage` grouping, `ExamDetailPage.playerReady`, `ExamHallPage.getPaper`, `ExamResultPage.getAnalysis`, and `FacultyAnalysisPage` to that registry. Keep the existing fault-policy bridge (`vyuh.mock.faults.<examId>`). **Acceptance:** one paper created in the builder → approved in admin → appears live in the student ledger → sat → graded → appears in faculty item analysis and admin reports, with the same id and title throughout. **Tests:** status transition matrix; cross-role id/title consistency; schedule window enforcement; result release rule; registry invalidation.

## 4.8 Recording lifecycle

**Current:** student `mock-data/recordings.js` (`rec-rot-b`, `rec-org-m`, `rec-int-c`, chapters/transcript/quizzes, playback in `vyuh.mock.learning.<student>.v1`); faculty `facultyWorkspace.js` `facultyRecordings` (`rec-rot-b`, `rec-gauss-new`, `rec-organic-new`) with upload/trim/publish in `vyuh.mock.faculty.<faculty>.v1`; `LiveRoomPage`/`LiveSchedulePage` hardcode `rec-rot-b` for ended classes; `endSession` creates nothing. **Blueprint:** one `mock-data/recordingLibrary.js` + `recordingService` with states `processing → ready → published → unpublished`, `sourceSessionId`, `mediaUrl` (demo MP4), chapters, transcript, publish flag, owner faculty, batch, subject, duration. `endSession` creates a draft from the live session; `FacultyRecordingEditorPage` trims/chapters/publishes; the student library lists `published` recordings; `RecordingPlayerPage` reads the shared record; ended live states link to `recordingId` from `LiveSessionState`. **Acceptance:** end class → draft in faculty library → publish → appears in student library → plays → doubt timestamp deep link resolves → unpublish removes it. **Tests:** state transition matrix; publish visibility; ended-session link; playback resume unaffected; CSV/report row counts.

## 4.9 Attendance lifecycle

**Current:** student `learningMath.js` + `vyuh.mock.learning.<student>.v1` computes real presence (grace, visible-time coverage, attention checks, 75% threshold); faculty `attendanceRows` in `facultyWorkspace.js` is a static register; admin `attendanceTrend` in `institution.js` is a static 12-week series; `endSession` does not finalize attendance. **Blueprint:** one `attendanceService` with `AttendanceSessionRecord {sessionId, studentId, joinedAt, leftAt, attendedSeconds, eligibleSeconds, attentionScore, presencePercent, verdict, settledAt}` written by `live.endSession` from viewer presence, readable by student `/student/attendance`, faculty `/faculty/attendance`, admin `/admin/reports` and `AdminDashboardPage` trend. Keep `learningMath.js` as the pure arithmetic source (already unit-tested). **Acceptance:** one class produces the same verdict in all three roles; defaulter filter, CSV export and dashboard trend derive from the same records; grace and attention rules unchanged. **Tests:** arithmetic regression (existing 4 tests), cross-role equality, threshold change via `/admin/policies` recomputes defaulters, export rows equal visible rows.

---

# Section 5 — Mock Data and Service Assessment

## 5.1 Current architecture (healthy parts to preserve)

* `src/mock-data/index.js` is the sole fixture barrel; every mock service imports from it (`scripts/check-architecture.mjs` enforces this).
* `src/services/index.js` chooses `mockServices` or `apiServices` from `VITE_USE_MOCK`; `src/shared/lib/services.js` is the documented hook-facing surface; `src/services/AuthService.js` is the auth facade.
* `src/services/types.js` is the JSDoc contract for every service; `src/contracts/*` hold domain typedefs; `src/services/mock/errors.js` normalises `ServiceError`.
* `src/mock-data/latency.js` `simulate()` gives 200–800 ms latency, ~3% modelled failures (`VITE_MOCK_ERRORS`), and deep clones; session restore is exempt.
* `src/mock-data/realtime.js` owns all scheduled live events with injectable clock/RNG/timers; unit tests drive it with fake timers.
* Persistence keys in use: `vyuh.session`, `vyuh.mock.auth.v1`, `vyuh.mock.exam.submissions`, `vyuh.mock.exam.sync`, `vyuh.exam.flow.v1`, `vyuh.mock.learning.<student>.v1`, `vyuh.mock.faculty.<faculty>.v1`, `vyuh.mock.faults.<examId>`, `vyuh.mock.admin.v1`, `vyuh.student.preferences`, `vyuh.student.notifications.read`, plus theme/density keys.
* `README.md` and `src/mock-data/README.md` document a one-line removal recipe for the mock layer. **Do not break it.**

**Boundary verification:** `npm run lint` → `Architecture check passed: 313 files, 312 colour-free, no boundary or token violations.` No presentation file imports `mock-data` or `services/mock`. **Minor inconsistency (D-17):** `useAdmin.js`, `useAdminOps.js`, `useFaculty.js`, `useFacultyLive.js`, `useLearning.js` import `{ services } from '@/services'` instead of `@/shared/lib/services.js`; functionally identical (same module) but it bypasses the documented single import surface. Standardise when those hooks are touched.

**HTTP adapter caveat:** `src/services/api/index.js:83,114` explicitly rejects all faculty and admin methods with 501 `faculty_api_unavailable` / `admin_api_unavailable`. This is deliberate and supports "no backend"; keep `VITE_USE_MOCK=true`. Do not extend the HTTP adapter during frontend work.

## 5.2 Missing mock entities

| Entity | Why needed | Suggested location |
|---|---|---|
| `InstituteAccount`, `CredentialSheetRow`, `PasswordRequest`, `FirstLoginPolicy` | Admin-only accounts and setup | `contracts/user.js`, `contracts/admin.js`, `mock-data/accounts.js` |
| `ExamDefinition`, `QuestionSet`, `PlayableExam`, `AttemptHistory` | Multi-exam hall + result sheets | `contracts/exam.js`, `mock-data/examDefinitions.js` |
| `LiveSessionState`, `Viewer`, `StudioMediaState`, `StreamHealth`, `SessionSummary` | Studio/viewer parity | `contracts/live.js`, `mock-data/liveSessionState.js` |
| `PinnedMessage`, `RemovedMessage`, `ViewerTimeout`, `StudioQuestion` | Moderation panel | `contracts/live.js` |
| `SharedRecording`, `RecordingLifecycleState` | End-class → library → student | `contracts/learning.js`, `mock-data/recordingLibrary.js` |
| `AttendanceSessionRecord` (cross-role) | Single source of truth | `contracts/learning.js`, `mock-data/attendanceLedger.js` |
| `SharedDoubtThread` | Student/faculty thread parity | `contracts/learning.js`, `mock-data/doubtLedger.js` |
| `CredentialAuditEvent` | Audit trail for account actions | extend `AUDIT_ACTIONS` in `auditLog.js` |

## 5.3 Inconsistent data relationships (evidence)

| Relationship | Files | Problem |
|---|---|---|
| Faculty classes ↔ student live sessions | `facultyWorkspace.js` `facultyClasses` (`ses-rot-b`, `cls-optics-2`, `cls-current-3`, `cls-elec-4`, `cls-modern-5`) vs `liveSessions.js` (`ses-rot-b`, `ses-chem-b`, `ses-org-m`, `ses-int-c`, `ses-elec-r`, `ses-rot-rec`) | Only `ses-rot-b` exists on both sides. Studio/viewer cannot share state by id. |
| Faculty recordings ↔ student recordings | `facultyWorkspace.js` vs `recordings.js` | Only `rec-rot-b` overlaps; publish flag is invisible to students. |
| Student doubts ↔ faculty doubts | `doubts.js` vs `facultyWorkspace.js` `facultyDoubts` | Same ids for three threads, but replies persist in two different localStorage stores. |
| Admin users ↔ auth users | `institution.js` `adminUsers` vs `users.js` | Separate rosters; imported/created admin users cannot log in. |
| Admin batches ↔ student batches | `batchesAdmin.js` vs `batches.js` | Overlapping ids with independently maintained capacity/member data. |
| Exam registries | `exams.js`, `facultyExams.js`, `approvals.js`, `itemAnalysis.js`, `questions.js`, `analysis.js` | Different id sets; only `exam-neet-practice` bridges hall and result. |
| Attendance sources | `attendance.js`, `facultyWorkspace.js` `attendanceRows`, `institution.js` `attendanceTrend` | Three unrelated series; no shared session records. |
| Live chat/questions | `liveSessions.js` `seedChat`/`seedQuestions` (student) vs `monitorEvents.js`/`facultyWorkspace.js` (faculty) | Faculty moderation hides messages in its own store; student chat is unaffected. |

**Duplicate seed data:** `liveSessions.js` is re-exported by `sessions.js`; `assessments.js` re-exports `attempts.js`; `mock-data/index.js` exports `recordingPlaybackSeeds` from `recordings.js` in a second statement. These are harmless barrel duplications, but the class/recording/doubt/user duplications above are real workflow breaks.

## 5.4 Missing service methods (grouped)

```
auth:        loginByInstituteId, changePasswordWithSetup, acknowledgePolicy, getAccountStatus
admin:       createUser, listAccounts, listPasswordRequests, resolvePasswordRequest,
             suspendAccount, reactivateAccount, unlockAccount, resetPassword,
             editAccount, moveStudentBatch, issueCredentialsCsv
examFlow:    listPlayableExams, getAttemptHistory     (generalise getPaper/submitAttempt)
analysis:    getAnalysis for every registered exam    (remove analysis_unavailable)
faculty:     publishExam, createRecordingFromSession, getStudioState
live (new):  getSessionState, subscribeSession, startSession, endSession, setMediaState,
             sendChat, removeChat, pinChat, timeoutViewer, askQuestion, upvoteQuestion,
             approveQuestion, answerQuestion, triggerAttentionCheck, respondAttentionCheck,
             reportStreamHealth
recording:   createFromSession, publish, unpublish, listPublished
attendance:  finalizeSession, listForStudent, listForBatch, listForAdmin
doubt:       create, reply, resolve, listForStudent, listForFaculty   (one store)
```

## 5.5 Incorrect mock state transitions

* `faculty.endSession` writes `endedAt` only; no `session.status` change visible to students, no recording, no attendance, no viewer notification.
* `admin.commitImport` creates `invited` accounts with no credentials; `auth.findAccount` never sees them.
* `auth.signup` creates a `pending` account, `verifyOtp` clears it and returns a full session — bypasses the Institute ID rule.
* `learning.getLiveRoom` sets `recordingId: 'rec-rot-b'` for **any** ended session.
* `examFlow.findExam` and `analysis.getAnalysis` are hard gates, not state transitions.
* `FacultyExamBuilderPage` status flow is enforced in the faculty store, but the admin approval queue and student ledger are not updated by it (three independent statuses).
* `groupSessionsByDay` "Tomorrow" uses `now + 86_400_000` rather than an IST calendar-day increment; `dayAt` uses the host's local `setHours` (UTC here) while grouping uses `Asia/Kolkata` — this is why the unit test fails at 18:39 UTC on 2026-11-07.

## 5.6 Data that cannot currently support the intended UI

* No user record carries `instituteId`, `mustChangePassword`, `temporaryPassword`, `acknowledgedPolicyVersion`, `suspendedAt`, `lockedUntil` (lockouts live in `vyuh.mock.auth.v1` only).
* No `LiveSession` carries `viewerIds`, `peakViewers`, `streamHealth`, `mediaMode`, `recordingId` (only a hardcoded join URL / static `attendingCount`).
* No `FacultyClass` carries camera/mic/permission state or an on-air duration.
* No `Exam` except `exam-neet-practice` has a question set, answer key, sections or result evaluator.
* No `Recording` links a live session to a faculty draft and a student library entry.
* No `AttendanceRecord` is shared across roles.
* No `ChatMessage` has `pinned`/`removed`/`moderatedAt`, and no `QueueQuestion` has `answered`/`approvedBy` visible to students.

---

# Section 6 — UI/UX and Responsive Audit

## 6.1 Design system

**Preserved and correct.** `src/styles/tokens.css` defines Ink `#0b0d10`, Paper `#fbf8f2`, Ember `#e4572e`, semantic Lichen/Marigold/Oxblood/Glacier/Dust with text-safe variants, Fraunces/Bricolage/JetBrains Mono, type scale, 44 px touch targets, 56 px keypad, dark-mode aliases. `scripts/check-architecture.mjs` bans hex literals, off-brand Tailwind palettes, emoji, TypeScript, >1 filled ember primary per view, and unlabelled icon buttons. `npm run build` confirms 312/313 colour-free files. No purple gradients, no generic glassmorphism, no generic illustrations or repetitive card dashboards were found. **Do not restyle.**

## 6.2 Page-by-page visual / interaction findings

| Area | Finding | Severity |
|---|---|---|
| All workspace pages | `WorkspaceLayout`/`StudentShell` provide desktop rail (`lg:`), tablet/mobile drawer (`lg:hidden`), student bottom nav (`md:hidden`), sticky topbar with 2 px backdrop blur (mild, within identity). Static breakpoints are consistent. **Real widths not measured** — see Limitations. | Unverified |
| `/` | Long landing page with ticker, bento, how-it-works, institutes, footer. No broken chart. | Low |
| Auth pages | `AuthLayout` ink brand pane collapses to compact header on phones; focus moves to `h1`; demo seats only in mock mode. `LoginPage` still advertises "New student? Create your account". | Critical (product) |
| `/student` | Dashboard cards use real data; empty-attempts scenario has explicit empty states. Charts in jsdom log `width(0) and height(0)` warnings — a jsdom measurement artifact, **not** a browser defect; recheck with axe/e2e. | Low |
| `/student/exams` | Ruled ledger, `PatternChips`, tabs. Result-sheet buttons on non-practice NEET rows lead to `E_ANALYSIS`. | High |
| Exam hall | `md:hidden` "Best on a larger screen" notice is intentional. Palette grid `grid-cols-6 sm:grid-cols-8 lg:grid-cols-5`. Tools dock is a sticky bar, not floating; tool panels are draggable. Timer is the only high-contrast mono block. | Medium |
| `/student/live/:sessionId` | `LiveStage` has no volume, fullscreen, PiP or theater control; interactive mic/camera/raise-hand are local UI-state only (explicitly documented in the component comment) — they look functional but do not touch media. | High |
| `/student/live`, `LiveRoomPage` | Ended rows/state hardcode `rec-rot-b`; no countdown; no waiting/reconnecting. | Medium |
| `/student/recordings/:recordingId` | `RecordingPlayer` has mute toggle (no volume slider), speed select, captions, bookmark, fullscreen, keyboard. No PiP/theater. | Low |
| Faculty pages | Denser ledger-first layout, split bank preview, filter bars, confirmation dialogs. `FacultyHostPage` has seven count cells and three panels; no media stage, so the "Live" badge is misleading relative to the v2 studio. | High |
| Admin pages | Consistent ruled tables, `StatBlock`, `Stepper`, `RequireNoteDialog`, `ChartFrame` table alternatives. `AdminUsersPage` has no row actions → visually looks like a read-only report. | High |
| `/admin/batches/:batchId` | `oxlint` warns `Avoid calling setState() directly within an effect` at line 56; functional, but a React Compiler bail-out. | Low |
| Dialogs/drawers | `Dialog`/`Sheet` have focus trap, Escape, focus return; `QuestionDrawer` e2e covers focus return. No broken dialog found in jsdom. | Low |
| Charts | `ChartFrame` always offers "View as table"; `DataTable` fed from the same rows. Recharts logs size warnings only in jsdom. | Low |
| Navigation | `StudentLayout` `CRUMBS` matches exact paths only, so detail routes fall back to `Dashboard → Student`; `FacultyLayout`/`AdminLayout` use prefix rules with correct labels. | Low |
| Dead buttons | Static review found no `onClick={() => {}}` / permanently disabled controls. The only "dead-ish" controls are the interactive-room mic/camera/hand (documented local UI state) and export/report actions that produce client-side CSV (intended). Full interaction sweep requires a real browser. | Medium |
| Loading / empty / error | Almost all data pages have `Skeleton`/`isPending` + `ErrorState` retry. `ExamConfirmationPage`, `AccountPage`, `AccessDeniedPage`, `AccessibilityPage` lack one or more; `AdminDashboardPage`, `AdminImportPage`, `AdminPoliciesPage`, `AdminSettingsPage`, `ExamResultPage`, `TopicRevisionPage`, `ProfilePage` and several faculty pages have no dedicated `EmptyState`. | Medium |
| `/design-preview` | Public internal specimen includes a deliberate `E_SNAPSHOT` error card; harmless but should not be surfaced in a client demo. | Low |

## 6.3 Responsive verification status

Existing Playwright specs claim coverage: `student.spec.js` (desktop sidebar collapse, tablet drawer, mobile More sheet + no overflow on all nine student routes, axe at three widths), `auth.spec.js` (mobile auth pages, keyboard login), `exam.spec.js:205` (1280/768 hall, phone notice, 56 px keypad), plus axe checks in `student.spec.js:150-166`. **None of these ran here** because the Chromium binary is unavailable. Therefore desktop/tablet/mobile behaviour is **Unverified** for every route in this audit; the static class review above is not a substitute. All 82 jsdom renders were at jsdom's default 1024 px width.

---

# Section 7 — Technical Debt and Defect Register

| ID | Severity | Description | Affected route(s) | File path | Evidence | Impact | Recommended resolution |
|---|---|---|---|---|---|---|---|
| D-01 | **Critical** | v2 route namespace `/s`, `/f`, `/a` does not exist; all 33 role routes use `/student`, `/faculty`, `/admin`. | all role routes | `src/app/routes/AppRoutes.jsx:115-227` | Smoke: `/s`, `/f`, `/a`, `/s/exams`, `/f/live`, `/a/people` all render public NotFound (`chars≈360-374`). No v2 spec file in repo. | Every URL in the client reference standard fails; bookmarks/links unusable. | Add a thin alias layer in `AppRoutes.jsx` (explicit `<Route>` declarations or one `V2Alias` component using `generatePath`), preserve `RequireAuth`/`RequireRole`, update `HOME_FOR_ROLE`/`safeReturnPath` only if canonical paths change. |
| D-02 | **Critical** | Public self-registration is live and linked from login. | `/signup`, `/login`, `/verify-otp`, `/join/:inviteCode` | `LoginPage.jsx:86`, `SignupPage.jsx`, `mock/auth.js` signup/acceptInvite | `/signup` renders 2046 chars with institute code, batch, consents, OTP. | Violates the fundamental product rule "no public signup"; undermines all Institute ID work. | Unregister signup/invite routes, remove the login link, convert invite to an admin-issued notice; keep files/tests until Batch 2 regression tests are rewritten. |
| D-03 | **Critical** | No admin Create User, credential generation, credentials sheet, Copy/Download CSV, or one-time password visibility. | `/admin/users`, `/a/people` | `AdminUsersPage.jsx:65,83`; `services/types.js:191-213`; `mock/admin.js:436-495` | Only "Import a CSV" action; `AdminService` has no mutating user methods; imported accounts are `invited` with no password. | Students/faculty cannot be onboarded as specified. | Section 4.4/4.5 blueprint. |
| D-04 | **Critical** | No `/setup-account`, no `mustChangePassword`, no first-login policy acknowledgement. | `/setup-account`, all protected routes | `guards.jsx`, `authSchemas.js` `authSessionSchema`, `sessionPersistence.js` | Smoke: `/setup-account` → public 404. `LoginPage` navigates straight to `homeRouteFor`. | Temporary passwords cannot be rotated; data-policy acknowledgement not recorded. | Section 4.6 blueprint. |
| D-05 | **Critical** | Faculty live-class studio is entirely missing (no camera/mic/preview/Go Live/on-air/summary). | `/f/live/:sessionId/studio`, `/faculty/classes/:sessionId/host` | `FacultyHostPage.jsx`, `HostPanels.jsx`, `faculty.js:962-1035` | Repo-wide grep: 0 matches for `getUserMedia`, `MediaStream`, `mediaDevices`, `getDisplayMedia`, `MediaRecorder`. | The second headline feature cannot be demonstrated. | Section 4.2 blueprint; reuse HostPanels. |
| D-06 | **Critical** | No cross-tab mock transport; faculty and student live state are disconnected. | `/faculty/classes/:sessionId/host`, `/student/live/:sessionId` | `mock-data/realtime.js:13`, `services/mock/learning.js`, `services/mock/faculty.js`, `useSession.js:63` | 0 `BroadcastChannel` matches in `src`; emitters are per-tab `Set`s; stores are per-role localStorage keys; only `vyuh.session` has a `storage` listener. | Studio and viewer cannot behave as one product. | `createCrossTabChannel` + one `LiveSessionState` record (Section 4.2.5). |
| D-07 | High | Student live viewer lacks volume/mute control, fullscreen, PiP, theater, countdown, waiting and reconnecting states. | `/student/live/:sessionId`, `/student/live` | `LiveStage.jsx`, `LiveRoomPage.jsx`, `LiveSchedulePage.jsx`, `useVideoPlayback.js` | `LiveStage` has play/pause + local mic/camera/hand only; no `requestPictureInPicture`/`requestFullscreen` in learning live code. | Not a YouTube-style experience. | Extract `useMediaControls` from `useVideoPlayback`; add states (Section 4.3). |
| D-08 | High | Only one playable exam paper. | `/student/exams/:examId/instructions`, `/hall` | `services/mock/examFlow.js:45-52` | `findExam` throws `paper_unavailable` unless `examId === NEET_PRACTICE_EXAM_ID`. | Most exam rows cannot be sat. | `examDefinitions.js` registry (Section 4.1.4/4.7). |
| D-09 | High | Result sheets available for one paper only. | `/student/exams/:examId/result` | `services/mock/analysis.js:72`; `ExamResultPage.jsx:62` | Smoke: `/student/exams/exam-mock-09/result` → `E_ANALYSIS` / `analysis_unavailable`. | Incomplete exam lifecycle. | Generalise `getAnalysis` over authored question sets. |
| D-10 | High | `npm test` fails 1/88: `groupSessionsByDay … 'Tomorrow'`. | `/student/live` (+ tests) | `tests/unit/learning-math.test.js:74`, `mock-data/liveSessions.js:10-16`, `shared/lib/learningMath.js:108-113` | `AssertionError: expected false to be true` at 18:39 UTC 2026-11-07; `dayAt(1,9)` uses local hours while grouping uses `Asia/Kolkata`; "tomorrow" = `now + 86400000`. | Red baseline; wrong schedule labels near IST midnight. | Compute day keys with an IST calendar-day increment (setUTCDate on an IST-anchored date or `Intl` arithmetic), seed `dayAt` relative to IST noon, add a midnight regression test. |
| D-11 | High | `endSession` does not create a recording, finalize attendance, notify viewers or show a summary. | `/faculty/classes/:sessionId/host` | `services/mock/faculty.js:973-981`; `FacultyHostPage.jsx` confirm text | Method only sets `host.endedAt` and returns `buildHostConsole`. UI copy claims "the recording is queued for editing" — not implemented. | Misleading end-of-class workflow; broken recording/attendance lifecycles. | Section 4.2.4, 4.8, 4.9. |
| D-12 | High | Duplicate/inconsistent seed registries across roles. | many | `facultyWorkspace.js`, `liveSessions.js`, `recordings.js`, `doubts.js`, `institution.js`, `users.js`, `exams.js`, `facultyExams.js`, `approvals.js` | Only `ses-rot-b` and `rec-rot-b` overlap between student and faculty fixtures; three exam id sets. | Cross-role workflows cannot agree. | Single registry per domain (Section 5.3/4.7). |
| D-13 | High | Admin pages expected by v2 are missing or split: `/a/exams`, `/a/compliance`, People tabs, password requests. | `/admin/*` | `AdminLayout.jsx` `ADMIN_NAV`, `AppRoutes.jsx:190-205` | No `/admin/exams` or `/admin/compliance`; compliance is spread over integrity/moderation/audit. | Client reference routes incomplete. | Add thin aggregate pages reusing existing screens (Batch 9). |
| D-14 | Medium | Student/faculty doubt threads and chat/questions do not synchronise. | `/student/doubts*`, `/faculty/doubts*`, live rooms | `services/mock/learning.js` store vs `services/mock/faculty.js` store | Same thread ids (`doubt-torque-axis`) but different `localStorage` keys. | Replies/pins/removals invisible across roles. | Shared doubt/chat service (Batches 6–8). |
| D-15 | Medium | `ExamHallPage` tools dock is sticky, not floating; integrity indicators show only tab switches; header lacks current section. | `/student/exams/:examId/hall` | `ExamHallPage.jsx` sticky `<div>`, `ExamHallHeader.jsx`, `useExamIntegrity.js` | `integrityEvents` logs 7 event types; header renders `tabSwitches` only. | Partial compliance with the hall brief. | Section 4.1.6 items 5–6. |
| D-16 | Medium | `QuestionPanel` cannot answer `multiple` type correctly. | exam hall, faculty bank | `QuestionPanel.jsx`, `useExamShortcuts` | Always `onAnswer([option.key])`; `questionBank.js` authors `multiple`. | Faculty-authored multi-correct papers would be unanswerable. | Multi-select branch or exclude from playable sets. |
| D-17 | Medium | Five hooks bypass the documented `@/shared/lib/services.js` import surface. | admin/faculty/learning hooks | `useAdmin.js:2`, `useAdminOps.js:2`, `useFaculty.js:3`, `useFacultyLive.js:3`, `useLearning.js:3` | `import { services } from '@/services'`; architecture guard still passes. | Two import surfaces; removal recipe is less obvious. | Standardise to `@/shared/lib/services.js` when touched. |
| D-18 | Medium | `ExamConfirmationPage` silently redirects without a submitted attempt and has no L/E/R states. | `/student/exams/:examId/confirmation` | `ExamConfirmationPage.jsx` | `useEffect(() => { if (!attempt) navigate('/student/exams') })`; `return null` when no receipt. | Confusing direct navigation / refresh after storage clear. | Add `EmptyState`/`ErrorState` + retry/start actions. |
| D-19 | Medium | Hardcoded replay link `rec-rot-b` for every ended class. | `/student/live`, `/student/live/:sessionId` | `LiveRoomPage.jsx:38`, `LiveSchedulePage.jsx:45`, `learning.js:235` | `recordingId: session.status === 'ended' ? 'rec-rot-b' : null`. | Wrong replay for non-default sessions. | Derive from `LiveSessionState.recordingId`. |
| D-20 | Medium | `/access-denied` is behind `RequireAuth`, so anonymous visitors see `/login`. | `/access-denied` | `AppRoutes.jsx:210-213` | `<Route element={<RequireAuth />}>` wraps `RoleLayout` + access-denied. | Public reference route behaves differently. | Move outside `RequireAuth` with a fallback shell, or confirm with client that auth is required. |
| D-21 | Medium | Faculty/admin HTTP adapters are deliberate 501 stubs. | all faculty/admin routes when `VITE_USE_MOCK=false` | `services/api/index.js:83,114` | `faculty_api_unavailable`, `admin_api_unavailable`. | Any non-mock build breaks half the app. Intentional, but must be documented. | Keep `VITE_USE_MOCK=true` for all frontend work; no backend. |
| D-22 | Medium | No responsive/axe/interaction verification possible in this sandbox. | all | `playwright.config.js`, `/tmp/vyuh-e2e.log` | 56 tests collected; every run fails `browserType.launch: Executable doesn't exist …/chromium_headless_shell-1254/…`; `npx playwright install chromium` → `ECONNRESET cdn.playwright.dev`. | Completion cannot be certified until a browser is available. | Install Chromium in an environment with network access; run `npm run test:e2e` before Batch 11 sign-off. |
| D-23 | Low | `DesignPreviewPage` is publicly reachable and contains a deliberate error specimen. | `/design-preview` | `DesignPreviewPage.jsx:589`, `PublicLayout` footer | Harness flagged its `E_SNAPSHOT` specimen (false positive). | Internal tooling visible to clients. | Keep for QA; hide from public nav or gate behind a demo flag. |
| D-24 | Low | `StudentLayout` breadcrumbs fall back to generic "Student" on detail routes. | student detail routes | `StudentLayout.jsx:20-23` | `CRUMBS` uses exact-path map only. | Minor hierarchy inconsistency vs faculty/admin prefix rules. | Add prefix rules like `facultyCrumbs`. |
| D-25 | Low | `oxlint` reports 38 warnings / 0 errors (mostly `set-state-in-effect`, React Compiler bail-outs). | app-wide | `AdminBatchDetailPage.jsx:56` and others | `npx oxlint src tests` output. | No runtime failure; future React Compiler optimisation blocked. | Fix opportunistically in touched files; keep 0 errors. |
| D-26 | Low | `NotFoundPage` headline is workspace-oriented even on the public catch-all. | `*`, `/s`, `/f`, `/a` | `NotFoundPage.jsx` | "That page is not part of this workspace." | Slightly misleading public 404. | Use role-aware copy. |
| D-27 | Medium | No account status operations (suspend/reactivate/reset/unlock/edit/move batch) or password-request queue. | `/admin/users` | `AdminUsersPage.jsx`, `services/types.js` | Table has 6 columns and no action column. | Admin cannot manage accounts after creation. | Section 4.4.5. |
| D-28 | Medium | CSV import produces accounts that cannot log in. | `/admin/users/import` | `mock/admin.js:455-480` | `status:'invited'`, no `passwordHash`, no `instituteId`; `mock/auth.js` never reads `vyuh.mock.admin.v1`. | Import workflow is a dead end for authentication. | Bridge commit to the new shared account store + credential generator. |
| D-29 | Medium | Exam monitor tiles, admin integrity evidence and attendance registers are scripted, not derived from student attempts. | `/faculty/exams/:examId/monitor`, `/admin/integrity`, `/faculty/attendance` | `monitorEvents.js`, `integrityReports.js`, `facultyWorkspace.js` | No reads from `vyuh.exam.flow.v1` or `vyuh.mock.learning.*`. | Cross-role analytics are demonstrations, not connected data. | Optional Batch 10 bridge; keep seeded fallbacks. |
| D-30 | Low | `VITE_MOCK_ERRORS=true` injects 3% failures into all data calls; some pages have no empty state for a partially failed dashboard. | all | `latency.js`, page audit in Section 6 | By design; error states exist on most pages but not all. | Some cards may show retry instead of content. | Add empty states where missing; verify with `VITE_MOCK_ERROR_RATE=1`. |

---

# Section 8 — Implementation Dependency Map

## 8.1 Service → page dependencies (current)

| Service | Hooks | Pages that depend on it |
|---|---|---|
| `auth` | `useSession`, `useLogin`, `useZodForm` | `/`, `/login`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/join/*`, all protected routes (guards) |
| `landing`, `institute` | `useLandingContent`, `useInstituteProfile` | `/`, footer, `/login` signup options |
| `students`, `dashboard`, `academics`, `assessments` | `useStudentWorkspace`, `useStudentHome`, `useBatches` | `/student`, `/student/exams`, `/student/performance`, `/student/profile`, `/student/batch`, `/student/recordings` (legacy), `/student/doubts` (legacy) |
| `examFlow` | `useExamFlow`, `useExamStore` | exam detail, instructions, hall, confirmation |
| `analysis` | `useAnalysis` | `/student/exams/:examId/result`, `/student/revision/:topicId`, `/student/performance` |
| `learning` | `useLearning`, `useVideoPlayback`, `realtime.js` | `/student/live`, `/student/live/:sessionId`, `/student/recordings*`, `/student/doubts*`, `/student/attendance`, `/student/study-rooms*` |
| `faculty` | `useFaculty`, `useFacultyLive` | all `/faculty/*` pages |
| `admin` | `useAdmin`, `useAdminOps` | all `/admin/*` pages |
| `courses`, `questions`, `live` (v1) | legacy hooks | mostly superseded by Phase 6/7 services; keep for compatibility |

Shared UI used by nearly every page: `src/shared/ui/*` (`Button`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Input`, `Checkbox`, `Badge`, `EmptyState`, `ErrorState`, `Skeleton`, `Toast`, `Kbd`, `StatusDot`, `ThemeToggle`), `src/app/layouts/WorkspaceLayout.jsx` (`PageHeader`, `Breadcrumb`), `src/shared/lib/format.js`, `chartTokens.js`, `motion.js`, `cn.js`, `useDocumentTitle`, `useMediaQuery`, `usePrefersReducedMotion`.

## 8.2 Blocking chain (what must come first)

```
Batch 0 (this audit + baseline)
   └─ Batch 1: green unit baseline (D-10) + v2 alias layer (D-01) + exam/result registry skeleton (D-08/D-09)
        └─ Batch 2: shared account store + auth contract + /setup-account + retire signup (D-02/03/04)
             ├─ Batch 3: admin People UI, credentials sheet, CSV bridge, password requests (D-27/28)
             │    └─ Batch 9: admin aggregate pages, policies/reports/audit links
             ├─ Batch 4: multi-exam hall + multi-select + floating dock + integrity indicators (D-15/16/18)
             │    └─ Batch 5: faculty builder → exam registry bridge (D-08/09/12)
             └─ Batch 6: LiveSessionState + cross-tab bus (D-06)  ← MUST precede both studio and viewer UI
                  ├─ Batch 7: faculty studio (D-05/11)  ── uses HostPanels + shared state
                  └─ Batch 8: student viewer (D-07/19) ── uses useVideoPlayback + shared state
                       └─ Batch 8b: recording / attendance / doubt lifecycles (D-11/12/14)
                            └─ Batch 10: analytics + final integrations (D-29)
                                 └─ Batch 11: real-browser responsive/axe/regression (D-22)
```

## 8.3 Independent tasks (can run in parallel with the chain)

* `DesignPreviewPage` visibility (D-23), `NotFoundPage` copy (D-26), `StudentLayout` breadcrumbs (D-24).
* `oxlint` warning cleanup in untouched-by-batches files (D-25) — but never in the same commit as a feature batch.
* Import surface standardisation (D-17) in hooks not being rewritten.
* Authoring new question sets for additional exams (pure `mock-data` work, no UI dependency).
* Writing unit tests for `createCrossTabChannel` and the credential generator before UI exists.
* Updating this blueprint's checklists as each batch closes.

## 8.4 Reusable components (do not rebuild)

`ExamHallPage` and all 14 exam components; `StatusShape`/`QuestionPalette`; `SubmitSheet`; `useExamTimer` + worker; `useExamStore`; `useVideoPlayback`/`RecordingPlayer`; `HostPanels` (`ParticipantList`, `ChatModeration`, `QuestionQueue`); `ConfirmAction`, `RequireNoteDialog`, `Stepper`, `StatBlock`, `ChartFrame`/`DataTable`; `ConsentFields`, `PasswordField`, `OtpInput`, `DemoAccounts`; `Dialog`/`Sheet`/`Tabs`/`Toast` focus traps; `WorkspaceLayout`/`StudentShell`; `learningMath.js`, `analysisMath.js`, `facultyMath.js`, `adminMath.js`; `realtime.js` emitter/ticker (extend, do not replace); `tokens.css`.

## 8.5 Services needing extension

`auth` (Institute ID + setup), `admin` (account lifecycle + credentials), `examFlow` + `analysis` (multi-paper), `faculty` (studio/recording-from-session), **new `liveSession`**, **new `recording`**, **new `attendance`**, **new `doubt`** shared services. `landing`, `institute`, `courses`, `questions` need no changes.

---

# Section 9 — Prioritized Implementation Batches

> Every batch is mock-only, preserves the design system, and must leave `npm run build`, `npm run lint` and `npm test` green. No backend, no new npm dependency, no deletion of seeded data/assets.

## Batch 0 — Audit and baseline

* **Objective:** this document; record the true baseline.
* **Affected routes:** none (read-only).
* **Relevant files:** this document; `/tmp/vyuh-build.log`, `/tmp/vyuh-unit.log`, `/tmp/vyuh-route-smoke3.log`, `/tmp/vyuh-e2e.log` (outside the repo).
* **Dependencies:** none.
* **Scope:** **COMPLETE.** `npm ci`, `npm run build`, `npm test`, `npm run lint`, `npx oxlint src tests`, `npx playwright test --list`, `npm run test:e2e` (attempted), 82-URL jsdom smoke harness (temporary file removed).
* **Mock-data changes:** none.
* **Acceptance criteria:** this document exists; no app source modified; results recorded honestly.
* **Regression tests:** none executed against modified code.
* **Completion definition:** `git status --short` clean except this Markdown file. **Achieved.**

## Batch 1 — Broken baseline, route aliases, exam registry skeleton

* **Objective:** green test baseline and a navigable v2 URL surface without touching working pages.
* **Affected routes:** `/s/*`, `/f/*`, `/a/*` aliases; `/student/exams/:examId/instructions|hall|result`; `/student/live`.
* **Relevant files:** `src/app/routes/AppRoutes.jsx`, `src/shared/lib/roles.js`, `src/mock-data/liveSessions.js`, `src/shared/lib/learningMath.js`, `tests/unit/learning-math.test.js`, `src/mock-data/examDefinitions.js` (new), `src/contracts/exam.js`, `src/mock-data/index.js`, `src/services/mock/examFlow.js`, `src/services/mock/analysis.js`, `src/app/providers/queryClient.js`, `src/features/exam/pages/ExamConfirmationPage.jsx`.
* **Dependencies:** Batch 0.
* **Exact scope:** (1) fix D-10 with IST calendar-day math and a midnight regression test; (2) add explicit alias routes for all 39 v2 paths, each wrapped in the same `RequireAuth`/`RequireRole` guards, preserving params/query/hash; do **not** rename canonical routes; (3) create `examDefinitions.js` with one record per seeded exam, initially pointing non-NEET papers at authored question sets or a labelled `not_playable` reason; remove the two hard gates by registry lookup; (4) generalise `getAnalysis` to any registered exam; (5) add `EmptyState`/`ErrorState` to the confirmation page; (6) fix hardcoded ended-session recording links to use `session.recordingId`.
* **Mock-data changes:** new `examDefinitions.js`; `questionSets` in `questions.js`; `liveSessions.js` `recordingId`; barrel exports; no fixture deletions.
* **Acceptance criteria:** `npm test` 88/88 (or more); every v2 alias renders the same page as its canonical route; no `paper_unavailable` or `analysis_unavailable` for registered exams; unregistered exams show a labelled unavailable state; all existing unit tests still pass.
* **Regression tests:** `auth-flow`, `student-shell`, `exam-flow`, `learning-math`, `learning-service`, `analysis-data`, plus new alias-route unit tests.
* **Completion definition:** build + lint + unit green; alias matrix documented; no working page redesigned.

## Batch 2 — Authentication and admin-controlled identity foundation

* **Objective:** make the Institute ID / temporary password / first-login rule real in mock state, and remove self-registration.
* **Affected routes:** `/login`, `/setup-account` (new), `/signup` (retired), `/join/:inviteCode` (retired/redirect), all protected routes (guard).
* **Relevant files:** `src/contracts/user.js`, `src/contracts/auth.js`, `src/services/authSchemas.js`, `src/services/types.js`, `src/services/mock/auth.js`, `src/mock-data/accounts.js` (new), `src/mock-data/index.js`, `src/shared/store/sessionStore.js`, `src/shared/lib/sessionPersistence.js`, `src/features/auth/hooks/useSession.js`, `src/app/routes/guards.jsx`, `src/app/routes/AppRoutes.jsx`, `src/features/auth/pages/LoginPage.jsx`, `src/features/auth/pages/SetupAccountPage.jsx` (new), `src/features/auth/components/ConsentFields.jsx`, `src/features/auth/hooks/useZodForm.js`.
* **Dependencies:** Batch 1; **client confirmation of ID/password algorithm (Section 4.4.2)**.
* **Exact scope:** extend session schema with `instituteId`, `mustChangePassword`, `acknowledgedPolicyVersion`; add shared account store; `loginByInstituteId`; `changePasswordWithSetup`; `acknowledgePolicy`; `RequirePasswordChange` guard; `SetupAccountPage`; remove signup link/routes; convert invite; keep the three demo email seats working.
* **Mock-data changes:** `accounts.js` (counter, credential policy, password requests, first-login policy); no deletion of `users.js` fixtures.
* **Acceptance criteria:** temporary password → forced `/setup-account` → new password + policy acknowledgement → correct role dashboard; refresh retains the gate; demo seats unaffected; `/signup` unreachable; no plaintext password in `vyuh.session`.
* **Regression tests:** rewrite `auth-flow.test.jsx` signup cases into first-login cases; `auth-service.test.js`; new `account-setup.test.jsx`; guard matrix for 3 roles; e2e `auth.spec.js` update.
* **Completion definition:** green unit + build; the fundamental product rule is enforced in code, not just copy.

## Batch 3 — Admin People Management (student + faculty creation)

* **Objective:** deliver `/a/people` with three tabs, Create User, credentials sheet, CSV bridge and account operations.
* **Affected routes:** `/admin/users`, `/a/people`, `/admin/users/import`, `/a/people/import`, `/admin/audit`.
* **Relevant files:** `src/features/admin/pages/AdminUsersPage.jsx`, new `PeopleTabs.jsx`, `CreateUserDialog.jsx`, `CredentialsSheet.jsx`, `AccountRowActions.jsx`, `PasswordRequestsTab.jsx`; `src/services/mock/admin.js`, `src/services/types.js`, `src/contracts/admin.js`, `src/features/admin/hooks/useAdminOps.js`, `src/app/providers/queryClient.js`, `src/mock-data/auditLog.js`, `src/mock-data/importCsv.js`.
* **Dependencies:** Batch 2.
* **Exact scope:** Sections 4.4/4.5; bridge `commitImport` to the shared account store; Copy/Download CSV client-side; clear plaintext on close; suspend/reactivate/reset/unlock/edit/move-batch; password-request queue; audit every mutation.
* **Mock-data changes:** `accounts.js` counters/requests; `AUDIT_ACTIONS` additions; `importCsv.js` unchanged data, new optional credential column.
* **Acceptance criteria:** Section 4.4.6/4.5; a CSV-imported account can complete first login; no plaintext visible after sheet close.
* **Regression tests:** `admin-console.test.jsx` (import/policy/audit cases), new `admin-accounts.test.jsx`, new e2e `admin-accounts.spec.js`.
* **Completion definition:** admin can create, deliver, suspend, reactivate, reset, unlock, edit, move and audit both roles entirely in mock mode.

## Batch 4 — Full-screen examination hall completion

* **Objective:** close the exact gaps in the existing hall without rebuilding it.
* **Affected routes:** `/student/exams/:examId/hall`, `/s/exams/:examId/hall`, `/student/exams/:examId/confirmation`.
* **Relevant files:** Section 4.1.6 list; `src/features/exam/components/QuestionPanel.jsx`, `ExamHallHeader.jsx`, `ToolsDock.jsx`, new `FloatingToolsDock.jsx`; `src/features/exam/hooks/useExamFlow.js`; `src/features/exam/pages/ExamHallPage.jsx`.
* **Dependencies:** Batch 1 (registry), Batch 5 (multi-select question definitions) or a deliberate decision to exclude `multiple`.
* **Exact scope:** multi-select; floating dock with mobile sticky fallback; integrity indicator strip; current-section label; confirmation states; no changes to timer/worker/store/palette/submit sheet.
* **Mock-data changes:** none beyond Batch 1 question sets.
* **Acceptance criteria:** Section 4.1.7.
* **Regression tests:** `exam-flow.test.js`, new `exam-multi-paper.test.js`, e2e `exam.spec.js` (all 8 existing flows) + `exam-multi-paper.spec.js`.
* **Completion definition:** hall satisfies every bullet in the directive's examination-hall list, at 1280/768 with a phone notice, axe clean.

## Batch 5 — Faculty question bank, exam builder and shared exam registry

* **Objective:** make faculty-authored papers immediately playable by students.
* **Affected routes:** `/faculty/bank*`, `/faculty/exams*`, `/student/exams*`, `/admin/approvals`, `/a/exams`.
* **Relevant files:** `src/services/mock/faculty.js`, `src/services/mock/examFlow.js`, `src/mock-data/facultyExams.js`, `src/mock-data/exams.js`, `src/mock-data/approvals.js`, `src/mock-data/examDefinitions.js`, `src/features/faculty/pages/FacultyExamBuilderPage.jsx`, `src/features/admin/pages/AdminApprovalsPage.jsx`, `src/features/admin/pages/AdminExamsPage.jsx` (new thin register).
* **Dependencies:** Batch 1, Batch 4 (for multi-select semantics).
* **Exact scope:** one registry with `STATUS_FLOW`, id/title consistency, builder publish → admin approval → student ledger, `/a/exams` register, keep `PalettePreview` and fault-policy bridge.
* **Mock-data changes:** convert duplicate exam fixtures into registry views (do not delete authored content).
* **Acceptance criteria:** Section 4.7; a built paper can be sat and graded end-to-end.
* **Regression tests:** `faculty-workspace.test.jsx`, `admin-console.test.jsx`, `exam-flow.test.js`, new `exam-registry.test.js`.
* **Completion definition:** one exam id/title/status across all three roles.

## Batch 6 — Shared live-session state and cross-tab transport

* **Objective:** build the connected state plane **before** either live UI.
* **Affected routes:** none directly (service-only batch), but unblocks Batches 7/8.
* **Relevant files:** `src/mock-data/realtime.js` (`createCrossTabChannel`), new `src/services/mock/liveSession.js`, `src/contracts/live.js`, `src/services/types.js`, `src/services/mock/index.js`, `src/app/providers/queryClient.js`, `src/services/index.js`/`shared/lib/services.js`, `tests/unit/learning-realtime.test.js`.
* **Dependencies:** Batch 2 (real user ids for viewers/faculty).
* **Exact scope:** Section 4.2.5 steps 1–4; `LiveSessionState` record; `subscribeSession`; revision ordering; `storage`-event fallback; no media APIs yet.
* **Mock-data changes:** `liveSessionState.js` seed for `ses-rot-b`, `ses-chem-b`, `ses-org-m`; unify `facultyClasses` and `liveSessions` ids through the registry (keep existing fixtures as views).
* **Acceptance criteria:** two jsdom/browser contexts see `go_live`, `chat`, `question`, `end_class` within one tick; a late subscriber hydrates from localStorage; no duplicate application of a revision.
* **Regression tests:** `learning-realtime.test.js`, new `live-session-bus.test.js`, `learning-service.test.js`.
* **Completion definition:** one state object is the single source of truth for studio and viewer.

## Batch 7 — Faculty live-class studio

* **Objective:** deliver `/f/live/:sessionId/studio`.
* **Affected routes:** `/faculty/live/:sessionId/studio` (canonical), `/f/live/:sessionId/studio`, `/faculty/classes/:sessionId/host` (keep as legacy/control-panel deep link), `/faculty/classes`, `/faculty`, `/faculty/recordings`.
* **Relevant files:** Section 4.2.2–4.2.4; new `src/features/faculty/studio/*`; `HostPanels.jsx` extensions; `services/mock/faculty.js` `endSession`; `mock-data/recordingLibrary.js`; `attendanceLedger.js`.
* **Dependencies:** Batch 6, Batch 3 (faculty login).
* **Exact scope:** pre-live, on-air, control panel, end-class workflow, summary; browser media APIs with demo fallback; reuse host panels; no new npm dependency.
* **Mock-data changes:** `LiveSessionState`, `StudioMediaState`, `StreamHealth`, `SessionSummary`, `MockRecordingDraft`.
* **Acceptance criteria:** Section 4.2.7.
* **Regression tests:** `faculty-workspace.test.jsx` (host console cases), new `faculty-studio.test.jsx`, new e2e `faculty-studio.spec.js` with two pages.
* **Completion definition:** a client can go live from a laptop camera (or clearly labelled demo source) and end the class with a real mock summary.

## Batch 8 — Student live-class viewer

* **Objective:** YouTube-style parity and connected experience.
* **Affected routes:** `/student/live/:sessionId`, `/s/live/:sessionId`, `/student/live`, `/student/recordings/:recordingId`.
* **Relevant files:** `LiveRoomPage.jsx`, `LiveStage.jsx` → `LivePlayer.jsx`, `LiveRail.jsx`, `LiveSchedulePage.jsx`, `useVideoPlayback.js` → shared `useMediaControls`, new `LiveCountdown.jsx`, `LiveWaiting.jsx`, `LiveReconnecting.jsx`, `LiveEnded.jsx`, `services/mock/learning.js`.
* **Dependencies:** Batch 6, Batch 7 (shared event vocabulary), Batch 8b recording lifecycle for replay availability.
* **Exact scope:** Section 4.3.3.
* **Mock-data changes:** no new entities; consume `LiveSessionState.recordingId` and shared attendance.
* **Acceptance criteria:** Section 4.3.4.
* **Regression tests:** `learning-service.test.js`, `learning-realtime.test.js`, e2e `learning.spec.js` + new `live-viewer.spec.js`.
* **Completion definition:** two tabs demonstrate one live class with consistent state and controls.

## Batch 8b — Recordings, attendance and doubts lifecycles

* **Objective:** connect the downstream workflows.
* **Affected routes:** `/faculty/recordings*`, `/student/recordings*`, `/student/attendance`, `/faculty/attendance`, `/student/doubts*`, `/faculty/doubts*`, `/admin/reports`, `/admin/moderation`.
* **Relevant files:** new `recordingService`, `attendanceService`, `doubtService`; `services/mock/faculty.js`, `services/mock/learning.js`, `services/mock/admin.js`; `mock-data/recordingLibrary.js`, `attendanceLedger.js`, `doubtLedger.js`; `shared/lib/learningMath.js` (unchanged arithmetic).
* **Dependencies:** Batches 6–8.
* **Exact scope:** Sections 4.8/4.9 + shared doubts; publish visibility, ended replay links, cross-role attendance equality, moderation affecting room chat.
* **Mock-data changes:** consolidate duplicate fixtures into shared ledgers while preserving all authored content.
* **Acceptance criteria:** one class → one attendance record → one recording → one doubt thread, visible consistently in all roles.
* **Regression tests:** `learning-math.test.js` (4 attendance arithmetic tests), `learning-service.test.js`, `admin-console.test.jsx`, new `lifecycles.test.js`.
* **Completion definition:** no duplicate id sets remain for classes, recordings, doubts or attendance.

## Batch 9 — Admin pages, policies and reports

* **Objective:** finish the `/a/*` surface and connect admin decisions to shared state.
* **Affected routes:** `/a`, `/a/people`, `/a/batches*`, `/a/exams`, `/a/policies`, `/a/reports`, `/a/compliance`, `/a/settings`.
* **Relevant files:** `AdminLayout.jsx`, `AdminDashboardPage.jsx`, `AdminPoliciesPage.jsx`, `AdminReportsPage.jsx`, `AdminIntegrityPage.jsx`, `AdminModerationPage.jsx`, `AdminAuditPage.jsx`, new `AdminCompliancePage.jsx`, `AdminExamsPage.jsx`; `services/mock/admin.js`.
* **Dependencies:** Batches 1, 3, 5, 8b.
* **Exact scope:** aggregate/compliance/exam register pages as thin compositions of existing screens; policy impact counts include consent acknowledgements; integrity evidence includes exam-hall events; reports read shared attendance/recording ledgers; audit every new action.
* **Mock-data changes:** `AUDIT_ACTIONS`, `policyScopeLabels`, `reportDefinitions` additions.
* **Acceptance criteria:** every v2 admin route renders a real page; all alerts resolve; all mutations appear in audit; no financial data introduced.
* **Regression tests:** `admin-console.test.jsx` (8 cases), e2e `admin.spec.js` (6 cases), new `admin-compliance.spec.js`.
* **Completion definition:** admin console is complete without a redesign.

## Batch 10 — Analytics and final integrations

* **Objective:** make every number traceable to shared mock state.
* **Affected routes:** `/student/performance`, `/student/exams/:examId/result`, `/faculty/analysis`, `/faculty/exams/:examId/monitor`, `/admin`, `/admin/reports`.
* **Relevant files:** `services/mock/analysis.js`, `mock-data/analysis.js`, `shared/lib/analysisMath.js`, `facultyMath.js`, `adminMath.js`, `mock-data/itemAnalysis.js`, `monitorEvents.js`.
* **Dependencies:** Batches 4, 5, 8b, 9.
* **Exact scope:** generalise published fixtures, derive monitor tiles from real attempts where available, include new exams in trends, keep table alternatives and fault policy; no new chart types.
* **Mock-data changes:** per-exam analysis fixtures or full derivation from submissions.
* **Acceptance criteria:** no component invents a count; every chart has a matching table; what-if arithmetic unchanged; faulty-item bridge still moves the student score.
* **Regression tests:** `analysis-data.test.js`, `analysis-ui.test.jsx`, e2e `analysis.spec.js` (5 cases), `faculty-workspace.test.jsx`.
* **Completion definition:** analytics agree across student, faculty and admin.

## Batch 11 — Responsive, accessibility and regression verification

* **Objective:** certify completion in a real browser.
* **Affected routes:** all 65+ route patterns and all new v2 aliases.
* **Relevant files:** `playwright.config.js`, `tests/e2e/*`, `tests/unit/*`, `scripts/check-architecture.mjs`, this document's Section 10 checklist.
* **Dependencies:** Batches 1–10; a Chromium binary (`npx playwright install chromium` in an environment with network access, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`).
* **Exact scope:** run `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, `npx oxlint src tests`; add e2e coverage for all missing areas listed in Section 11; axe at 390/768/1440 for every new page; two-tab studio/viewer test; `VITE_MOCK_ERROR_RATE=1` error-state sweep; no horizontal overflow sweep.
* **Mock-data changes:** none.
* **Acceptance criteria:** all commands green; 0 console errors; no dead buttons; every route has loading/empty/error states; all 10 Section-10 checklists ticked.
* **Regression tests:** the full 56 existing e2e tests plus all new specs; 88+ unit tests.
* **Completion definition:** client-ready demo, one verified batch at a time, with recorded command output.

---

# Section 10 — Final Completion Checklist

## 10.1 Routes and layouts

- [ ] All 39 v2 reference paths resolve (canonical or alias) with the correct role guard.
- [ ] All 65 discovered repository path patterns still resolve; legacy `/app/*`, `/sign-in`, `/student/papers` redirects preserved.
- [ ] `/setup-account`, `/f/live/:sessionId/studio`, `/a/people`, `/a/exams`, `/a/compliance` exist and render.
- [ ] Exam hall has no student sidebar; every other role page uses its own layout.
- [ ] `/access-denied` behaviour for anonymous and mismatched roles is explicitly decided and tested.
- [ ] Public catch-all and three role-specific catch-alls render branded 404s.
- [ ] `*` never catches a real route; deep links preserve query/hash through login.

## 10.2 Account workflows

- [ ] No public signup or self-service password creation path remains.
- [ ] Admin People has Students / Faculty / Password requests tabs.
- [ ] Create User generates `VYU-S-26-0231` / `VYU-F-0042`-shaped IDs with collision-free counters.
- [ ] Temporary password algorithm confirmed by client and documented in `contracts/user.js`.
- [ ] Credentials sheet shows ID + password, Copy per value, Download CSV, secure-sharing note, first-login requirement.
- [ ] Plaintext password is gone from the normal interface and query cache after the sheet closes.
- [ ] First login with Institute ID + temporary password → forced `/setup-account`.
- [ ] New password saved in mock state; old temporary password rejected; policy acknowledgement recorded with version/date.
- [ ] Redirect lands on `/student`, `/faculty` or `/admin` per role; refresh retains the gate.
- [ ] Suspend, reactivate, reset password, unlock, edit details, move batch all work and write audit entries.
- [ ] Password requests can be approved/declined with a note.
- [ ] CSV import creates loginable accounts with row-level validation unchanged.
- [ ] Demo seats still work with `vyuh2026`.

## 10.3 Examination

- [ ] Every registered exam has an authored question set, sections, key, marks, negative marking and instructions.
- [ ] Instructions → hall → submit → confirmation → result works for every playable exam; unplayable exams are labelled.
- [ ] Single-choice, multiple-correct and numerical questions all answer/clear correctly.
- [ ] Four options where applicable; numerical keypad keys ≥56 px; confidence chips optional and non-scoring.
- [ ] Palette: not visited / not answered / answered / review / answered+review / current — shape + label + semantic colour + count.
- [ ] Previous / Next / Save and next / Mark for review / Clear / palette jump / keyboard shortcuts all work; shortcuts pause in inputs.
- [ ] Timer: accurate, <5 min warning, <1 min warning, auto-submit at zero, refresh recovery, background-tab behaviour.
- [ ] Header: title, remaining time, current section, integrity event indicators, candidate.
- [ ] Tools: scientific + basic calculator, rough sheet, font size, contrast, dark mode, floating dock, shortcut sheet.
- [ ] Submit sheet: answered / unanswered / marked / not visited / total, cancel, final, automatic.
- [ ] Result sheet consumes the completed attempt, grades against the authored key, and offers table alternatives.
- [ ] Offline queue + reconnect sync; integrity log attached to submission.

## 10.4 Live classes

- [ ] Studio pre-live: camera/mic selection, mirrored preview, mic level, permission handling, demo-source fallback, session/batch/subject info, readiness checklist, Go Live.
- [ ] Studio on-air: video stage, LIVE indicator, duration, viewer count, peak viewers, mic/camera/screen share, attention check, end class, stream health.
- [ ] Control panel: viewer list, chat moderation (pin/remove/timeout), question upvotes/approve/answered, viewer counts.
- [ ] End class: confirmation, stop all tracks, notify viewers, finalize attendance, create mock recording, show summary.
- [ ] Viewer: scheduled countdown, waiting, live playback, volume/mute, fullscreen, PiP, theater, chat, questions, upvotes, raise hand, reconnect, ended, replay, attendance.
- [ ] Studio and viewer share one `LiveSessionState` over a `BroadcastChannel` + `storage` fallback; two-tab demo passes.
- [ ] No backend, no WebRTC signalling server, no new dependency; StreamHandle interface leaves room for real streaming later.

## 10.5 Connected lifecycles

- [ ] One exam registry across faculty builder, admin approvals, student ledger, hall, result, item analysis and reports.
- [ ] One recording library across end-class draft, faculty editor, student library and replay links.
- [ ] One attendance ledger across student presence, faculty register, admin reports and dashboard trend.
- [ ] One doubt/chat store across student threads, faculty inbox and admin moderation.
- [ ] Every state-changing call appends to the admin audit ledger.
- [ ] `VITE_USE_MOCK=true` remains the default; no API dependency added.

## 10.6 UI/UX, data states, responsive, accessibility

- [ ] Ink/Paper/Ember + Fraunces/Bricolage/JetBrains Mono preserved; `npm run lint` reports 0 boundary/token violations.
- [ ] No generic purple gradients, glassmorphism, generic illustrations or repetitive dashboard cards introduced.
- [ ] Every data page has loading, empty and error states with recovery actions.
- [ ] No dead buttons, non-functional filters/search/tabs, broken dialogs/drawers or missing confirmations.
- [ ] Charts have table alternatives; tables are consistent; typography hierarchy unchanged on working pages.
- [ ] 390 / 768 / 1440 px verified in a real browser with no horizontal overflow; exam hall shows the phone notice.
- [ ] axe A/AA clean on all new and changed pages; focus traps, focus return, visible focus, labelled icon buttons, 44 px targets.
- [ ] `VITE_MOCK_ERROR_RATE=1` sweep shows an error state on every data page.
- [ ] 0 console errors / 0 unhandled exceptions on every route.

## 10.7 Tests and commands

- [ ] `npm run build` passes (architecture guard + Vite).
- [ ] `npm run lint` / `npm run check:architecture` passes.
- [ ] `npm test` passes with the D-10 regression fixed and new workflow tests added.
- [ ] `npm run test:e2e` passes all 56 existing + new specs in a Chromium-enabled environment.
- [ ] `npx oxlint src tests` reports 0 errors (warnings tracked).
- [ ] New unit coverage: admin-created accounts, first login, role navigation, full exam completion, timer auto-submit, refresh recovery, camera studio, live viewer, live state sync, attendance, recording lifecycle.
- [ ] New e2e coverage: two-tab studio/viewer, credentials sheet, first login, multi-exam journey, responsive + axe on every new page.
- [ ] All command outputs recorded with the batch that closed them.

---

# Appendix A — Verification Evidence & Limitations

## A.1 Commands actually executed (this audit)

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | `added 166 packages in 10s` (existing lockfile only; no new dependency) |
| `npm run build` | **PASS.** `Architecture check passed: 313 files, 312 colour-free, no boundary or token violations.` `vite v8.3.6 … ✓ 3296 modules transformed … ✓ built in 1.63s`. |
| `npm test` | **FAIL (1/88).** `Test Files 1 failed \| 12 passed (13)`; `Tests 1 failed \| 87 passed (88)`; `tests/unit/learning-math.test.js:74` → `AssertionError: expected false to be true`; duration 46.22 s. |
| `npm run lint` | **PASS.** `Architecture check passed: 313 files, 312 colour-free, no boundary or token violations.` |
| `npx oxlint src tests` | `Found 38 warnings and 0 errors. Finished in 274ms on 332 files with 104 rules`. |
| `npx playwright test --list` | `Total: 56 tests in 7 files` (admin 6, analysis 5, auth 12 incl. `it.each`, exam 8, faculty 6, learning 4, student 13). |
| `npm run test:e2e` | **NOT EXECUTABLE.** 56 tests started and all failed at `browserType.launch: Executable doesn't exist at /home/user/.cache/ms-playwright/chromium_headless_shell-1254/…` (exit 1). |
| `npx playwright install chromium` | **FAILED.** `ECONNRESET … host: 'cdn.playwright.dev'` (network-restricted sandbox); no browser installed. |
| Temporary jsdom route harness | **82 URLs, 0 thrown exceptions, 0 app-generated console errors.** Verified pages, redirects, 404s, an exam hall with a seeded attempt, a confirmation with a seeded submission and a result sheet after that submission. Harness file deleted; `git status --short` clean. |

## A.2 Verified route-render highlights

`/` (Landing, 5470 chars), `/login` (Welcome back.), `/signup` (Make room for progress.), `/student` (Good evening, Ananya.), `/student/exams/exam-neet-practice/hall` (NEET Practice 01…), `/student/exams/exam-neet-practice/confirmation` (Submission confirmed, after seeding), `/student/exams/exam-neet-practice/result` (Result sheet, 7365 chars), `/student/exams/exam-mock-09/result` (`E_ANALYSIS` error state), `/student/live/ses-rot-b` and `ses-chem-b` (live rooms), `ses-org-m` / `ses-rot-rec` (not-open / ended states), `/faculty/bank/qb-001` (Edit question), `/faculty/classes/ses-rot-b/host` (host console), all 14 admin pages, `/s`, `/f`, `/a`, `/setup-account`, `/f/live/ses-rot-b/studio` → public 404. Unknown paths inside each role shell keep their own chrome.

## A.3 Explicitly unverified

1. Real-browser rendering at desktop/tablet/mobile widths, visual spacing, typography rendering, horizontal overflow and axe results — no Chromium binary.
2. All 56 Playwright e2e assertions, including the exam hall's timer/refresh/offline/responsive/axe claims.
3. Any real `getUserMedia` / `getDisplayMedia` permission behaviour, camera pixels, microphone levels, `MediaStreamTrack` cleanup, fullscreen or Picture-in-Picture behaviour.
4. Cross-tab behaviour (there is no cross-tab transport to test yet).
5. `HTMLCanvasElement` rough-sheet drawing and `HTMLMediaElement` playback (jsdom logs `Not implemented` warnings; these were filtered as environment noise, not app defects).
6. TypeScript `checkJs` — TypeScript is not in `package.json`; the repo is plain JS with JSDoc.
7. Interactive verification of every secondary button/filter/tab; static review found no no-op handlers, but only a real browser sweep can certify this.
8. The temporary-password algorithm and Institute ID counter policy: no such specification exists in the repository; client confirmation is required (Section 4.4.2).

---

**STOP. This document is the deliverable of the audit assignment. No implementation was started. Await explicit approval before beginning Batch 1.**
