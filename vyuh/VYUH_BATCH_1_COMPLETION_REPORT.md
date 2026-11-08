# Vyuh — Batch 1 Completion Report

**Date:** 2026-11-08 (Asia/Calcutta)
**Branch:** `arena/1763b46c-vyuh` (working tree; no commit or push made)
**Source of truth:** `VYUH_COMPLETE_FRONTEND_AUDIT_AND_IMPLEMENTATION_BLUEPRINT.md`, Section 9 "Batch 1" (lines 842–852), plus the user's explicit Batch 1 authorisation.
**Scope:** Batch 1 **only**. No Batch 2 work was started.

---

## 1. Summary

All five Batch 1 scopes are implemented, verified and covered by new tests. The previously red unit baseline is green, all 33 role-prefixed v2 reference paths now resolve under the correct guards, the exam/result single-NEET gates are replaced by a shared registry with honest playability states, the exam confirmation page has explicit loading/empty/error/success states, and ended-class replay links come from the session's own recording id.

| Metric | Baseline (audit) | Final (Batch 1) |
|---|---|---|
| `npm test` | EXIT 1 — 13 files / 88 tests, **87 passed / 1 failed** | EXIT 0 — 19 files / 209 tests, **209 passed** |
| `npm run build` | EXIT 0 (313 files, 3296 modules) | EXIT 0 (317 files, 3300 modules) |
| `npm run lint` | EXIT 0 | EXIT 0 |
| `npx oxlint src tests` | 38 warnings / 0 errors | 38 warnings / **0 errors** (no new warnings) |
| v2 routes resolving | 0 of 33 | **33 of 33** (+ 3 namespace fallbacks) |
| Dependencies added | — | **0** (`package.json`, `package-lock.json` unchanged) |

---

## 2. Changes implemented

### 2.1 D-10 — IST calendar grouping (fixes the failing unit test)

**Root cause:** `liveSessions.js dayAt()` used host-local `setDate`/`setHours` (UTC in CI), while `groupSessionsByDay()` grouped with `Asia/Kolkata`; "Tomorrow"/"Yesterday" were computed as `nowMs ± 86_400_000`, which is wrong near an IST midnight.

* `src/shared/lib/learningMath.js` — added exported `istDayKey(ms)` (explicit `formatToParts`, no locale assumptions) and `shiftIstDayKey(dayKey, deltaDays)` (UTC calendar arithmetic on an IST `YYYY-MM-DD` key, so month/year/leap-day rollovers are correct). `groupSessionsByDay` now uses these instead of millisecond offsets, and hoists the fallback `Intl.DateTimeFormat` into `fallbackDayFormatter`.
* `src/mock-data/liveSessions.js` — `dayAt()` now shifts into an IST wall clock (`IST_OFFSET_MINUTES = 330`), moves whole calendar days with `setUTCDate`, then converts back to a real instant. `dayAt(1, 9)` is now 09:00 IST on the next IST calendar day regardless of host zone.
* Evidence: `tests/unit/learning-math.test.js > recording arithmetic > groups the schedule by IST day with Today/Tomorrow labels` now passes (baseline failure was `expected false to be true` at line 74). Six new midnight/rollover regression tests in `tests/unit/ist-calendar.test.js`.

### 2.2 D-01 — Thin v2 route alias layer

* `src/app/routes/v2RouteTable.js` (created) — declarative `V2_ROUTE_ALIASES` (11 student `/s`, 12 faculty `/f`, 10 admin `/a`), `V2_NAMESPACES` prefix fallbacks, and the flat `V2_ROUTE_MATRIX` used by tests. Five mappings are marked `provisional` with a `note` explaining which later batch owns the real page.
* `src/app/routes/v2Aliases.jsx` (created) — `V2Redirect` (uses `generatePath` for `:params`, preserves `search`, `hash` and `state` via `Navigate replace`) and `V2NamespaceRedirect` (prefix-preserving fallback for unlisted v2 sub-paths such as `/s/exams/:examId/instructions`). Components-only module so React Fast Refresh is unaffected.
* `src/app/routes/AppRoutes.jsx` — alias and namespace routes are registered **inside the existing** `RequireAuth` / `RequireRole` wrappers for each role. Canonical `/student`, `/faculty`, `/admin` routes, `/app/*` compatibility, `/sign-in`, `/student/papers`, `/student/account`, `HOME_FOR_ROLE` and `safeReturnPath` are unchanged. In-app links still use canonical paths; v2 paths are entry points only.
* No route rename, no new page component, no new guard, no backend.

### 2.3 D-08 / D-09 — Shared `examDefinitions` registry; NEET-only restrictions removed

* `src/mock-data/examDefinitions.js` (created) — one `ExamDefinition` per seeded exam (all 12 rows in `exams.js`). `EXAM_QUESTION_SETS` contains **only** the real authored set `neet-practice-01` (60 questions with keys/explanations from `questions.js`). `PLAYABLE_EXAMS` contains only `exam-neet-practice`. `resultMode` is `question_level` (authored set), `score_summary` (real seeded `attempts.js` row) or `unpublished` (neither). Helpers: `examDefinitionById`, `isPlayableExam`, `listPlayableExams`, `listUnplayableExams`, `authoredQuestionsFor`, `gradingQuestionsFor`, `examSectionsFor`, `seededAttemptFor`, `withExamDefinition`. **No questions, answer keys or question-level analytics are fabricated.**
* `src/shared/lib/examAvailability.js` (created) — pure predicates `canShowResultSheet`, `canEnterExamHall`, `examHallNotice`; pages no longer hard-code `track === 'NEET'`.
* `src/services/mock/students.js` — `assessmentService.listExams` decorates every row via `withExamDefinition`; the configurable question-count/max-marks override now applies only to registry-playable papers.
* `src/services/mock/examFlow.js` — `findExam` resolves via the registry; the hard-coded `NEET_PRACTICE_EXAM_ID` comparison is gone. `getPaper` / `submitAttempt` use `authoredQuestionsFor` and `examSectionsFor`. A ledger-only paper raises `paper_not_playable` (404) with the registry's plain-words reason instead of a NEET-specific message.
* `src/mock-data/analysis.js` — `buildAnalysisFromSubmission(input, authoredBank = questions)` now grades against an explicitly supplied paper-specific bank; the default keeps existing callers unchanged.
* `src/services/mock/analysis.js` — `analysis_unavailable` is **removed**. `getAnalysis` returns a labelled `source: 'unpublished'` payload with `details: null`, a plain-words `notice`, and (only where a real `attempts.js` row exists) a real `scoreSummary`. Playable submissions are graded with `gradingQuestionsFor(examId)`. The published example fixture is still used **only** for the NEET practice paper.
* `src/mock-data/analysis.js`, `src/features/analysis/pages/ExamResultPage.jsx`, `src/features/student/pages/ExamsPage.jsx`, `src/features/exam/pages/ExamDetailPage.jsx` — availability-gated CTAs, explicit notices, and an `EmptyState` + optional real score-summary `Card` for unpublished papers. The header no longer displays a fabricated "Submitted …" stamp for unpublished sheets.
* Contracts/schemas: `contracts/exam.js` (`ExamDefinition`), `contracts/student.js` (optional `playable`/`resultMode`/`unavailableReason`), `contracts/analysis.js` (`source` union, `notice`, `scoreSummary`, `ExamScoreSummary`), `services/api/schemas.js` (`examSchema`, `examScoreSummarySchema`, `examAnalysisSchema`). All new fields are optional/nullable so existing adapters stay valid. `src/mock-data/index.js` re-exports the registry through the existing barrel.

### 2.4 D-18 — Examination confirmation page L/E/E/S states

`src/features/exam/pages/ExamConfirmationPage.jsx` was rewritten. The old `useEffect(() => { if (!attempt) navigate('/student/exams') })` + `return null` is gone.

| State | Trigger | UI |
|---|---|---|
| Loading | `studentId` unresolved (shell restoring) | `Skeleton.Region` labelled "Restoring your submission" (`role="status"`, `aria-busy`) |
| Empty | no submitted attempt on this device | `EmptyState` "No submission to confirm here" with "Back to exams" + "Open exam detail" |
| Error | attempt submitted but receipt missing/corrupt | `ErrorState` `E_RECEIPT` with "Back to exams" + "Open result sheet" |
| Success | valid receipt | Receipt `Card` (counts, attempt id, timestamp, auto-submit copy), sync notice, dashboard/exams buttons, result-sheet link with `?attempt=` |
| Sync pending | `receipt.pendingSync` | "Sync pending" badge, result-sheet link replaced by an `aria-disabled` label (no dead link) |

The page stays on `/student/exams/:examId/confirmation` for all states (no silent redirect), and navigation uses `useNavigate` (SPA, not `window.location`).

### 2.5 D-19 — Session-derived ended-class replay links

* `src/mock-data/liveSessions.js` — the ended session `ses-rot-rec` now carries `recordingId: 'rec-rot-b'`, matching its existing `joinUrl` and the real `recordings.js` fixture.
* `src/contracts/live.js`, `src/services/api/schemas.js` — optional nullable `recordingId` added to `LiveSession` / `liveSessionSchema`.
* `src/services/mock/learning.js` — `recordingIdFor(session)` prefers `session.recordingId`, falls back to parsing the session's own `joinUrl` **only** when it already points at a recording, and returns `null` otherwise. The hard-coded `'rec-rot-b'` return is removed.
* `src/features/learning/pages/LiveSchedulePage.jsx` — `endedAction(session)` builds the link from the fixture and renders "Recording not published yet" when absent.
* `src/features/learning/pages/LiveRoomPage.jsx` — `replayHref` derived from the service/fixture; ended state shows a non-link notice when no recording is published.
* Other fixtures that legitimately reference `rec-rot-b` (`doubts.js`, `facultyWorkspace.js`, `itemAnalysis.js`, `recordings.js`, `faculty.js`) were intentionally left alone — they are not ended-class replay links.

---

## 3. Files modified and created

### 3.1 Created (11)

| Path | Purpose |
|---|---|
| `VYUH_BATCH_1_COMPLETION_REPORT.md` | This report |
| `src/app/routes/v2RouteTable.js` | v2 alias matrix, namespaces, flat route matrix |
| `src/app/routes/v2Aliases.jsx` | `V2Redirect`, `V2NamespaceRedirect` |
| `src/mock-data/examDefinitions.js` | Shared exam registry + authored-set helpers |
| `src/shared/lib/examAvailability.js` | Pure availability predicates/notices |
| `tests/unit/ist-calendar.test.js` | 6 tests |
| `tests/unit/v2-routes.test.jsx` | 77 tests |
| `tests/unit/exam-registry.test.js` | 16 tests |
| `tests/unit/exam-availability-ui.test.jsx` | 10 tests |
| `tests/unit/exam-confirmation-states.test.jsx` | 5 tests |
| `tests/unit/live-recording-links.test.jsx` | 7 tests |

*(11 rows: this report, 4 new source modules and 6 new test files.)*

### 3.2 Modified (20)

`src/app/routes/AppRoutes.jsx`
`src/contracts/analysis.js`, `src/contracts/exam.js`, `src/contracts/live.js`, `src/contracts/student.js`
`src/features/analysis/pages/ExamResultPage.jsx`
`src/features/exam/pages/ExamConfirmationPage.jsx`, `src/features/exam/pages/ExamDetailPage.jsx`
`src/features/learning/pages/LiveRoomPage.jsx`, `src/features/learning/pages/LiveSchedulePage.jsx`
`src/features/student/pages/ExamsPage.jsx`
`src/mock-data/analysis.js`, `src/mock-data/index.js`, `src/mock-data/liveSessions.js`
`src/services/api/schemas.js`
`src/services/mock/analysis.js`, `src/services/mock/examFlow.js`, `src/services/mock/learning.js`, `src/services/mock/students.js`
`src/shared/lib/learningMath.js`

### 3.3 Deliberately unchanged

`package.json` / `package-lock.json` (no new dependencies), `src/services/index.js`, `src/services/mock/index.js`, `src/services/types.js`, `src/shared/lib/services.js`, `src/app/routes/guards.jsx`, `src/app/layouts/*`, `src/styles/tokens.css`, `src/index.css`, all existing test files, seeded question/attempt/recording data, `scripts/check-architecture.mjs`, `vitest.config.js`, `playwright.config.js`, and the audit blueprint itself. `dist/` was regenerated by the build (build output, not a deliverable). The audit document `VYUH_COMPLETE_FRONTEND_AUDIT_AND_IMPLEMENTATION_BLUEPRINT.md` remains untracked from the audit phase.

---

## 4. Tests added

**121 new tests across 6 new files. No existing test was weakened, skipped, deleted or modified.**

| File | Tests | Covers |
|---|---:|---|
| `tests/unit/ist-calendar.test.js` | 6 | IST day keys at 18:29/18:30 UTC, month/year/leap-day shifts, Today/Tomorrow/Yesterday at IST midnight, seeded-fixture grouping regression |
| `tests/unit/v2-routes.test.jsx` | 77 | all 33 aliases resolve to canonical paths; all 33 aliases deny a wrong-role session; anonymous → `/login`; 3 explicit wrong-role chrome checks; correct-role canonical page render; query/hash preservation; `/s/*` namespace fallback; `/sign-in`, `/app/profile`, `/student/papers`, unknown-route chrome |
| `tests/unit/exam-registry.test.js` | 16 | registry completeness, exactly one playable paper, no fabricated sets/keys/sections, real seeded summaries, non-mutating decoration, `getPaper` playable/ledger-only/unknown, submission counts, published 60-question sheet, no more `analysis_unavailable`, real score summary for `exam-mock-08`, custom-bank grading, schema validation, source-level assertion that both hard gates are gone, `listExams` decoration |
| `tests/unit/exam-availability-ui.test.jsx` | 10 | pure predicates + all four changed exam pages (Exams, Exam Detail, Result Sheet for unpublished/score-summary/NEET) |
| `tests/unit/exam-confirmation-states.test.jsx` | 5 | loading, empty, error, success, sync-pending states |
| `tests/unit/live-recording-links.test.jsx` | 7 | fixture ↔ recording linkage, service `recordingId`, no id for live/scheduled sessions, schedule + room page links, source-level assertion that no hard-coded replay link remains |

Coverage by changed workflow: IST grouping ✔, all v2 aliases + guards + legacy ✔, registry/exam entry ✔, result analysis ✔, availability-gated pages ✔, confirmation states ✔, ended-class replay ✔.

---

## 5. Commands executed and actual results

All four required commands were run **again on the final state** (after the last source change). Exact outputs:

| # | Command | Exit | Actual result |
|---|---|---:|---|
| 1 | `npm test` | **0** | `Test Files  19 passed (19)` · `Tests  209 passed (209)` · `Duration  84.99s` · 0 failed |
| 2 | `npm run build` | **0** | `Architecture check passed: 317 files, 316 colour-free, no boundary or token violations.` · `✓ 3300 modules transformed.` · `✓ built in 2.46s` |
| 3 | `npm run lint` | **0** | `Architecture check passed: 317 files, 316 colour-free, no boundary or token violations.` |
| 4 | `npx oxlint src tests` | **0** | `Found 38 warnings and 0 errors.` · `Finished in 299ms on 342 files with 104 rules using 2 threads.` |

`oxlint` is at the exact baseline warning count (38 / 0 errors). An intermediate run had reached 41 warnings because the alias data and components shared one `.jsx` file (React Fast Refresh `only-export-components`); splitting `v2RouteTable.js` from `v2Aliases.jsx` returned it to 38. No warnings originate from any Batch 1 file.

Additional commands run during implementation (not part of the required four):
* `npx vitest run tests/unit/<new file>` for each new test file during development — all passing once the two initial test-harness issues were fixed (a `readFileSync(new URL(...))` path resolution issue and a missing `findByRole` wait on a lazy Suspense boundary). Both were test-code fixes, not product fixes.
* `node --input-type=module -e "import { V2_ROUTE_MATRIX } …"` — emitted the 33-row matrix used below (`COUNT 33 {"student":11,"faculty":12,"admin":10}`, `PROVISIONAL 5`).
* `git status --short` — final working tree listed in Section 3.
* `npm run test:e2e` was **not** re-run: see Section 7.

---

## 6. Route verification matrix

**Method:** `tests/unit/v2-routes.test.jsx` renders the real `AppRoutes` in `MemoryRouter` with `tests/unit/helpers.jsx renderRoute`, using real authenticated sessions from `authService.login` for all three roles and a `LocationProbe` outside `<Routes>`. For each alias it asserts the resolved `pathname+search+hash` equals the canonical pattern with `:params` substituted by real seeded ids. Every alias is also tested with a session from a different role (`student→faculty`, `faculty→admin`, `admin→student`) and must resolve to `/access-denied`. **Result: 77/77 passed.**

Concrete parameters used: `:examId=exam-neet-practice`, `:sessionId=ses-rot-b`, `:recordingId=rec-rot-b`, `:batchId=bat-prayas-m`. The `/s/exams/:examId/hall` case seeds a real exam attempt first, because the canonical hall legitimately redirects to `/instructions` when no attempt exists.

| # | v2 path | Canonical target | Guard | Mapping |
|---:|---|---|---|---|
| 1 | `/s` | `/student` | student | exact |
| 2 | `/s/exams` | `/student/exams` | student | exact |
| 3 | `/s/exams/:examId` | `/student/exams/:examId` | student | exact |
| 4 | `/s/exams/:examId/hall` | `/student/exams/:examId/hall` | student | exact |
| 5 | `/s/exams/:examId/result` | `/student/exams/:examId/result` | student | exact |
| 6 | `/s/live` | `/student/live` | student | exact |
| 7 | `/s/live/:sessionId` | `/student/live/:sessionId` | student | exact |
| 8 | `/s/recordings` | `/student/recordings` | student | exact |
| 9 | `/s/recordings/:recordingId` | `/student/recordings/:recordingId` | student | exact |
| 10 | `/s/doubts` | `/student/doubts` | student | exact |
| 11 | `/s/profile` | `/student/profile` | student | exact |
| 12 | `/f` | `/faculty` | faculty | exact |
| 13 | `/f/live` | `/faculty/classes` | faculty | **provisional** (live hub is Batch 7) |
| 14 | `/f/live/:sessionId/studio` | `/faculty/classes/:sessionId/host` | faculty | **provisional** (studio is Batch 7; host console is a control panel, not a studio) |
| 15 | `/f/questions` | `/faculty/bank` | faculty | exact |
| 16 | `/f/exams` | `/faculty/exams` | faculty | exact |
| 17 | `/f/exams/:examId` | `/faculty/exams/:examId` | faculty | exact |
| 18 | `/f/exams/:examId/monitor` | `/faculty/exams/:examId/monitor` | faculty | exact |
| 19 | `/f/recordings` | `/faculty/recordings` | faculty | exact |
| 20 | `/f/recordings/:recordingId` | `/faculty/recordings/:recordingId` | faculty | exact |
| 21 | `/f/analytics` | `/faculty/analysis` | faculty | exact |
| 22 | `/f/doubts` | `/faculty/doubts` | faculty | exact |
| 23 | `/f/profile` | `/faculty/account` | faculty | exact |
| 24 | `/a` | `/admin` | admin | exact |
| 25 | `/a/people` | `/admin/users` | admin | **provisional** (People Management tabs/Create User are Batch 3) |
| 26 | `/a/people/import` | `/admin/users/import` | admin | exact |
| 27 | `/a/batches` | `/admin/batches` | admin | exact |
| 28 | `/a/batches/:batchId` | `/admin/batches/:batchId` | admin | exact |
| 29 | `/a/exams` | `/admin/approvals` | admin | **provisional** (full exam register is Batch 9) |
| 30 | `/a/policies` | `/admin/policies` | admin | exact |
| 31 | `/a/reports` | `/admin/reports` | admin | exact |
| 32 | `/a/compliance` | `/admin/integrity` | admin | **provisional** (unified compliance is Batch 9) |
| 33 | `/a/settings` | `/admin/settings` | admin | exact |

**Namespace fallbacks** (verified): `/s/*` → `/student/*`, `/f/*` → `/faculty/*`, `/a/*` → `/admin/*`. Test case: `/s/exams/exam-neet-practice/instructions` → `/student/exams/exam-neet-practice/instructions`.

**Guard verification** (verified): anonymous `/s/exams` → `/login` (login heading present); all 33 aliases with a wrong-role session → `/access-denied`; the wrong-role session keeps its **own** workspace chrome (`Student workspace` / `Faculty workspace` / `Academic office`), so no cross-role page leaks. Correct-role `/f/questions` renders the canonical Question Bank page heading. `<Navigate replace>` preserves `?t=12#notes` (test on `/s/recordings/rec-rot-b`).

**Legacy/canonical preservation** (verified): `/sign-in?next=%2Fstudent#top` → `/login?next=%2Fstudent#top`; `/app/profile` → `/student/profile`; `/student/papers?filter=live#top` still renders `ExamsPage` with its heading; `/student/does-not-exist` keeps the student chrome; the published NEET result sheet still renders its question ledger; unknown exam ids still 404.

---

## 7. Remaining defects and verification limits

### 7.1 Intentional Batch 1 limitations (not defects)

* Only **one** paper (`exam-neet-practice`) has an authored question set. The other 11 ledger entries are explicitly `playable: false` with a plain-words reason; their exam halls and question-level result sheets are **not published by design**. No fake questions, keys or analytics were created. This is the honest state the user requested, and it is the main remaining product gap to be resolved by authoring question sets in a later batch.
* A registered ledger-only paper still gets a 404 service error (`paper_not_playable`) if code calls `getPaper` directly, but its message is now registry-driven and the UI never surfaces it as an unlabelled error — the hall CTA is disabled/hidden and an explicit notice is shown.
* Five v2 aliases point at the nearest existing page rather than the final feature (marked `provisional` above). v2 paths redirect to canonical URLs rather than replacing them; in-app links remain canonical.
* `getAnalysis` still uses the published example fixture for `exam-neet-practice` when no stored submission exists; `NEET_PRACTICE_EXAM_ID` remains in `services/mock/analysis.js` for that single legitimate use, not as a gate.

### 7.2 Known defects carried over from the audit (Batch 2+, all out of scope here)

D-02 public self-registration; D-03 no admin Create User / Institute IDs / temp passwords / credentials sheet; D-04 no `/setup-account`, `mustChangePassword` or first-login policy acknowledgement; D-05 faculty live studio; D-06 no cross-tab mock transport; D-07 live viewer gaps (volume/PiP/theater/countdown/reconnect); D-11 `endSession` does not create a recording; D-12 duplicate/inconsistent seed registries; D-13 missing/split admin pages (`/a/exams`, `/a/compliance`, People tabs); D-14 doubt/chat stores not synchronised; D-15 exam hall tools dock/integrity; D-16 `multiple` question type; D-17 hooks bypassing the service import surface; D-20 `/access-denied` behind `RequireAuth`; D-21 faculty/admin HTTP adapters are 501 stubs; D-23 public design preview; D-24 student breadcrumb fallback; D-26 public 404 copy; D-27 account status operations / password-request queue; D-28 CSV import accounts cannot log in; D-29 scripted cross-role analytics; D-30 `VITE_MOCK_ERRORS` partial-dashboard empty states. D-25 (38 oxlint warnings) is unchanged at baseline.

### 7.3 Verification limits (evidence-based, cannot be claimed as verified)

* **Playwright / real browser is unverified.** `npx playwright install chromium` fails in this sandbox (`ECONNRESET` from `cdn.playwright.dev`); `~/.cache/ms-playwright` is absent. The earlier `npm run test:e2e` collected 56 tests in 7 files and all 56 failed at browser launch (`chromium_headless_shell-1254` missing) — launch failures, not product assertions. `npm run test:e2e` was **not** re-run in Batch 1 for that reason.
* Consequently, real desktop/tablet/mobile widths, browser console errors, responsive behaviour, axe/accessibility findings, camera/mic capture, video playback, fullscreen/PiP and multi-tab transport remain **unverified**.
* All route verification in this batch is jsdom/`MemoryRouter`-based (`renderRoute`), not a real browser. It confirms routing, guards and rendered headings; it does not confirm layout or visual design at real viewports.
* `tsc --noEmit` was not run (the repository is JS + JSDoc, no TypeScript tooling configured).
* No commit or pull request was created; the working tree changes are present on `arena/1763b46c-vyuh` and are saved automatically.

---

## 8. Deviations from the approved blueprint

1. **"39 v2 paths" → 33 new aliases + 6 reference strings.** The blueprint's Section 2.1 counts 39 reference path strings including `*`. Six are public/non-role: `/`, `/login`, `/forgot-password`, `/setup-account`, `/access-denied`, `*`. Five already exist and were left untouched. `/setup-account` is **deliberately deferred**: account management / first-login password change is explicitly out of scope for Batch 1 (blueprint D-04, Batch 3). The remaining 33 role-prefixed paths — the ones the blueprint says "all 33 role-prefixed paths use a different namespace" — are all implemented. No alias was omitted.
2. **Alias implementation split across two modules.** `v2RouteTable.js` (data) and `v2Aliases.jsx` (components) instead of a single `.jsx`. Purely to keep `oxlint` at the baseline 38 warnings (React Fast Refresh `only-export-components`), with no behavioural difference.
3. **"`no paper_unavailable` … for registered exams" interpreted with the "never fabricate questions" constraint.** The NEET-specific `paper_unavailable` gate and `analysis_unavailable` are both removed from source. `getPaper` on a registered-but-unplayable paper now returns a labelled `paper_not_playable` 404 carrying the registry's plain-words `unavailableReason`; the pages show an explicit notice and disable the hall CTA rather than an unlabelled error. `getAnalysis` no longer errors for any registered exam — it returns `source: 'unpublished'` with a real seeded score summary where one exists. This honours the user's higher-priority instruction to never fabricate questions/keys/analytics.
4. **Result analysis for ledger-only papers is a labelled unavailable state plus a real score summary, not full question-level analytics.** The blueprint says "generalise `getAnalysis` to any registered exam"; question-level analytics are mathematically impossible without authored keys, so the honest generalisation is the labelled state. No data was invented.
5. **Confirmation page has four states, not just `EmptyState`/`ErrorState`.** A labelled loading state and a distinct `pendingSync` treatment were added because the user explicitly requested loading, empty and error states and because a dead result-sheet link while offline would be misleading.
6. **`recordingId` fallback.** `recordingIdFor()` also accepts a session's own `joinUrl` if it already names a recording. This is a compatibility path for older fixtures, not a blanket replacement of other `rec-rot-b` references (D-12 duplication is a later-batch problem).
7. **`examDefinitions.js` registers all 12 exams rather than pointing non-NEET papers at authored question sets.** The blueprint allowed either authored sets **or** a labelled `not_playable` reason; no additional question sets were authored because the user forbade fabricating them. Adding a paper later is a data-only change.

**No deviations** in: mock-data architecture, service boundaries, dependency list, design tokens, canonical/legacy routes, seeded data, existing tests, or the "no backend / no new features / no redesign" constraints.

---

## 9. Stop condition

Batch 1 is complete and verified (`npm test`, `npm run build`, `npm run lint`, `npx oxlint src tests` all green; route matrix and guards verified by 77 passing tests). **No Batch 2 work has been started.** This report is the Batch 1 deliverable — awaiting explicit approval before beginning any further batch.
