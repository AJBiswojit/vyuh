# Phase 3 — Student layout and sections

Status: **complete.** The student shell, dashboard, and every student section
outside the exam player, analysis detail, and live room are implemented and
verified at desktop, tablet, and mobile widths.

## App shell

- **Desktop (≥1024px):** collapsible sidebar with Dashboard, Exams, Live classes,
  Recordings, Performance, Doubts, Attendance, Study rooms, and Profile.
- **Tablet (768–1023px):** the sidebar becomes a focus-trapped navigation drawer.
- **Mobile (<768px):** five bottom slots — Dashboard, Exams, Live, Recordings,
  More. The More sheet contains Performance, Doubts, Attendance, Study rooms,
  and Profile.
- **Top bar:** command palette, notifications popover with unread count and
  mark-all-read, profile menu, and theme control on wider screens.
- **Command palette:** Cmd/Ctrl+K searches pages and exams by name. Arrow keys,
  Home/End, Enter, and Escape work; the active result stays scrolled into view.
  Exam search remains usable while exams load, and page search still works if
  the exam request fails.
- Route changes focus the page heading; modal layers trap focus, close on
  Escape, lock background scroll, and return focus.

## Routes

| Route | Phase 3 surface |
|---|---|
| `/student` | Dashboard |
| `/student/exams` | Upcoming / Live / Past ledger tabs with pattern chips and rules |
| `/student/live` | Live class list; room entry deferred |
| `/student/recordings` | Recording list with chapter and progress; player deferred |
| `/student/performance` | Recharts score trend and subject-wise trends |
| `/student/doubts` | Doubt list with empty state; thread detail deferred |
| `/student/attendance` | Summary card only; full register is Phase 6 |
| `/student/study-rooms` | Room list with empty state; room detail deferred |
| `/student/profile` | Details, batch, institute, notification and data-consent preferences |

Compatibility: `/student/papers` renders Exams (including `?filter=live`),
`/student/account` renders Profile, and `/student/batch` remains available.
Protected deep links still preserve query and hash through login.

## Dashboard

- Fraunces greeting and a streak rendered as one small square per day.
- Next exam with factual pattern chips, e.g. `180 Q · 3 sections · 3 hrs · −1 negative`.
- Mono countdown updating every second inside a memoized `ExamCountdown`; the
  dashboard page does not re-render on the tick. A unit test asserts the parent
  render count stays at one while the timer advances.
- “Enter exam hall” is disabled until the scheduled start. The camera, network,
  and instructions checklist is advisory pre-exam reading, not an extra gate.
  Until the player ships, the button opens an exam-readiness panel on Exams.
- Subject strength bars with a dotted batch-average marker; no leaderboard.
- Last five attempts with score, percentile, and sparkline. Phones use a stacked
  ledger so all three remain visible without horizontal scrolling.
- Continue watching with chapter name and progress strip; today’s live schedule;
  attendance summary.
- Empty states for no attempts, no subject baseline, and nothing to resume.

## Mock data and service boundary

Fixtures live in `src/mock-data/{exams,attempts,batches,subject-strength,recordings,student-extras}.js`.
There are eight past attempts for trends; the dashboard shows the newest five.
Dates are relative to module load so the demo always has a future exam, an open
live window, and a real past ledger.

Presentation code reads through `src/features/student/hooks/useStudentWorkspace.js`
and the service boundary in `src/shared/lib/services.js`. Mock implementations
are in `src/services/mock/{students,live}.js`; HTTP endpoint shapes and Zod
response schemas are in `src/services/api/{index,schemas}.js`. No backend was
supplied with this phase.

Demo state:

- `vyuh.student.preferences` — notification/data-consent preferences per student.
- `vyuh.student.notifications.read` — read notification ids per student.
- `vyuh.mock.studentScenario = 'empty-attempts'` — forces the empty-attempts
  dashboard/performance scenario for the demo student. Remove the key to restore
  the eight-attempt history. Newly signed-up students also start without attempts.

## Accessibility and responsive checks

Semantic landmarks, labelled controls, ARIA tabs, combobox/listbox keyboard
behavior, visible focus, and token-based contrast are covered by tests. Browser
axe checks cover the desktop dashboard, command palette, tablet drawer, and
mobile More sheet. The mobile test visits all nine student routes and asserts no
horizontal overflow; the recent-results ledger keeps score, percentile, and
sparkline inside the phone viewport.

## Verification

```bash
npm test                 # 35 Vitest tests (auth + Phase 3 shell/countdown/readiness)
npm run test:e2e         # 27 Playwright tests (14 auth + 13 student)
npm run build            # architecture guard + production bundle
npx oxlint src tests     # 0 errors; existing fast-refresh/purity warnings remain
```

For a fresh machine, run `npx playwright install chromium` before `test:e2e`.
The Playwright config also accepts `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and
`PLAYWRIGHT_BASE_URL` for constrained CI environments.

## Deferred by design

Exam player/runner, post-attempt analysis detail, live room, recording player,
doubt threads, study-room detail, and the full attendance register are later
phases. Phase 3 provides their routed list/readiness surfaces and empty states.
