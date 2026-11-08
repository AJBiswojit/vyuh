# VYUH — FINAL ACCEPTANCE GATE / Batch 3 + Batch 3.1 Independent Verification

**Status:** READ-ONLY REVIEW — AUTHORIZED. Independent fresh acceptance review. NOT Batch 4. NOT implementation, remediation, or repair.
**Review date (UTC):** 2026-11-08, fresh baseline through 2026-11-08T11:12:11Z.
**Branch / HEAD:** `arena/1763b46c-vyuh` / `ced54030c336bb1041454fd8780f56f423af19f8` (unchanged; no commit, push, PR, merge, branch switch, publish or deploy).
**Authority:** explicit user directive > approved Batch 2 > approved Batch 3 > Batch 3.1 > independent acceptance review > Gate 0 > blueprint.
**Artifact authorization judgement:** the directive forbids editing/creating/renaming **source files** and **modifying existing reports/docs**, and names `VYUH_FINAL_BATCH_3_ACCEPTANCE_REVIEW.md` as the required deliverable. A single NEW standalone report is neither a source file nor a modification of an existing report; the preceding independent review produced exactly such a new artifact under the same restriction. **Therefore this one new report is permitted.** No other workspace file was created, edited, deleted or renamed by this review. The three historical reports were re-hashed at the end and are byte-identical to the fresh baseline.

**Evidence taxonomy used throughout (no category is silently promoted):**

| Tag | Meaning |
|---|---|
| `[AUDIT]` | Static source / documentation inspection in this review. No execution. |
| `[NODE]` | Read-only `node --input-type=module` evaluation with an in-memory `Map`-backed `localStorage`. **Not a test suite**, no workspace writes, no browser. |
| `[EXEC]` | A command executed **in this review**, with its exact exit code/result. |
| `[JSDOM]` | Vitest/jsdom evidence (executed here for the focused suites and full suite; jsdom is not a browser). |
| `[STATIC-COLLECT]` | `npx playwright test --list` — static test *collection* only, no browser, no execution, **never "passed"**. |
| `[HIST]` | Evidence recorded in the earlier B3 / B3.1 reports; corroborated, not re-executed here unless also tagged `[EXEC]`. |
| `[UNVERIFIED]` | Claimed or required but not established by any evidence available in this environment. |

---

## 1. Executive verdict

### **REJECT** — exactly one verdict; final acceptance is withheld.

A binding requirement and a critical identity boundary remain violated. **Unconditional `ACCEPT` is barred**, and `CONDITIONAL ACCEPT` is not appropriate because the outstanding item is a *confirmed, reproduced violation of an approved binding ruling*, not merely an outstanding verification.

The single blocking cause is this: the Batch 3.1 shared identity helper **fails open**. `src/services/mock/ownWorkspace.js:84` classifies every unresolvable, arbitrary identifier as `demo`, and `src/services/mock/ownWorkspace.js:105` classifies a missing, expired, malformed or wrong-role session as `demo`. Consequently:

* **A validly signed-in institute-issued student can still obtain the full seeded demo academic record set** by passing any arbitrary identifier to `learningService` — 6 live sessions, 3 recordings, 3 doubts, 3 study rooms, 8 attendance-history rows, plus live-room / recording detail objects. This is precisely the U-3 / D-1 leak class Batch 3.1 was authorized to eliminate; it survives at the service boundary.
* **An unauthenticated, expired-session, malformed-session or wrong-role caller obtains demo fixtures** through `learningService`, `liveService`, `courseService`, `questionService`, `examFlowService.syncAttempt()` and `facultyService.getDashboard()`. No explicit, authorized "demo-preview" context is established anywhere in `src/`; the only global flag, `isMockMode`, is a build-level "use mock services" switch, not a per-call identity distinction.

This contradicts approved clarification ruling 1, which requires *"`notFound` for unresolvable identity, no demo fallback in either case"*, and it contradicts the Batch 3.1 remediation report's §5 claim that the ruling is "applied", §7 claim that lists "return `[]` / honest unavailable results", and §12 claim that "no demo … leaks". The report's own §18 item 10 admits the no-session fallback "by design" — an internally inconsistent position that this review was explicitly asked to reconcile (§3).

**What is genuinely sound and should not be discarded:** U-1, U-2, U-4, U-5; G1–G4 / G5-blocked / C1; the four clarification rulings 2–4; D-2, D-3 (spec-correction only); R-1's real `MutationCache` deletion; R-2, R-3, R-4, R-6, R-7, R-8, R-11; the 33 v2 aliases; all eight baseline-recorded protected hashes; the six pre-existing Batch 2 protected diffs; the route guards; scope discipline; and a clean full-tree verification (`npm test` 365/365, build, lint, oxlint all exit 0 on the exact current tree). The five student routes themselves render honest empty states for issued students — but only because the hooks pass a session-derived id, not because the service boundary is fail-closed. **Unit-test success is not acceptance evidence for a fail-open boundary.**

**Disposition:** document only. This review made **no fix**, no source edit, no historical-report edit, no Git mutation, no dependency or browser install, and does not start Batch 4. Correction requires a new explicit user authorization. Final acceptance of Batch 3 remains the user's decision.

---

## 2. Fresh baseline, integrity, environment and browser tooling

All of the following were recorded fresh in this review, not assumed from the B3.1 completion report. Final re-check at `2026-11-08T11:12:11Z` after all verification commands.

| Item | Fresh result | Tag |
|---|---|---|
| Branch / HEAD | `arena/1763b46c-vyuh` / `ced54030c336bb1041454fd8780f56f423af19f8` | `[EXEC]` |
| Working tree | **54 modified tracked**, **37 untracked**; no `D`/`R` entries | `[EXEC]` |
| Diff | `54 files changed, 2691 insertions(+), 552 deletions(-)` | `[EXEC]` |
| `git diff --check` | exit 0, zero whitespace errors | `[EXEC]` |
| `package.json` / `package-lock.json` diff (both roots checked) | 0 files | `[EXEC]` |
| Historical reports | present, byte-identical to fresh baseline (hashes below) | `[EXEC]` |
| Target artifact `VYUH_FINAL_BATCH_3_ACCEPTANCE_REVIEW.md` | **ABSENT** at baseline; created by this review as the sole new file | `[EXEC]` |
| `dist/` | gitignored at `vyuh/.gitignore:11` | `[EXEC]` |
| `V2_ROUTE_MATRIX.length` | **33** (11 student + 12 faculty + 10 admin = 33; 3 namespaces) | `[NODE]` |
| Node / npm / Playwright | v22.22.3 / 10.9.8 / 1.65.0; `node_modules` present (128 entries) | `[EXEC]` |
| `PLAYWRIGHT_BROWSERS_PATH` | unset | `[EXEC]` |
| `~/.cache/ms-playwright` | **ABSENT** | `[EXEC]` |
| `chromium` / `chromium-browser` / `google-chrome` / `headless_shell` on PATH | **ABSENT** | `[EXEC]` |

**Historical report hashes (unchanged at start and end of this review) `[EXEC]`:**

```
1c43c8ce51c0080143ec34a17d4b3aa9780b1981f9809a8c0984d30e8e4988be  VYUH_BATCH_3_COMPLETION_REPORT.md            (248 lines / 34559 bytes)
0c0b9bcf278a8016aafa0765832559af9ec0681e49887e395f4849855e73bdb7  VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md (300 lines / 41023 bytes)
c279acd965c473bea81b027467e5857e52ab73e6531ffdbab8bbf2b276f6588e  VYUH_BATCH_3_1_REMEDIATION_REPORT.md          (353 lines / 40127 bytes)
```

**Eight baseline-recorded protected hashes — all unchanged `[EXEC]`:**

```
d02465726586a2156d62f3da1a1c578aaa7ef7aa1e590a3050fa3850654fc30b  src/mock-data/accounts.js
98e9fee47099c919b3f72c4414f657798e5e1565358fb713da3279832855e257  src/app/routes/v2RouteTable.js
01a0067b801070c25484d0ed24b81dd9eb2ae0aba748667eea801502eca97200  src/app/routes/v2Aliases.jsx
b5ad26f7b1bcae14e61f623d43f3e56c197e61cab04c266efab79c81b5407a21  src/features/auth/pages/SetupAccountPage.jsx
57d4fe11d657af8782f3dec76f9984f4814bbbb6717ca65a2a9894fca4e58541  src/mock-data/users.js
a7db65f74b0661842f366db64b91fa0aaf339951c7400380554c513670b763d6  src/mock-data/institution.js
f788603cc42d92ef4fe150de0eec9c78729f9d7f8fffcf7d5ec7ee9eb9c7573d  src/mock-data/batches.js
5c0169e32fea83003d2fdcad445d34370f8f9c4fd50ea9981724a178c67c4ef5  src/mock-data/batchesAdmin.js
```

Protected tracked diffs are the six pre-existing Batch 2 files only — `AppRoutes.jsx` 116+/72−, `guards.jsx` 23+/2−, `authSchemas.js` 63+/1−, `roles.js` 2+/1−, `sessionPersistence.js` 25+/2−, `sessionStore.js` 18+/6−; `tokens.css`, `scripts/check-architecture.mjs`, `package.json`, `package-lock.json` show 0. **Zero `BATCH 3.1` markers in any of the 17 protected paths.** No STOP-triggering protected edit by Batch 3.1 or by this review. `[EXEC]` `[AUDIT]`

**Workspace mutation check:** the only file this review wrote is this report. `git status` counts remained 54/37 and `git diff --shortstat` remained 2691+/552− after running all verification commands; `dist/` output is gitignored. `[EXEC]`

---

## 3. Identity contradiction — §7 "fail-closed" vs §18 item 10 "by design"

### 3.1 The two statements, verbatim

* B3.1 report §7 `[AUDIT]`: *"**Fail-closed:** blank/non-string id, a canonical record of the wrong role, a syntactically valid Institute ID with no issued record (forged), or an issued session addressing a different issued account → `invalid`; `requireStudentWorkspace()` throws `notFound('student')`. No demo fallback."* and *"Lists return `[]` / honest unavailable results"*.
* B3.1 report §5 `[AUDIT]`: clarification ruling 1 *"with approved fail-closed semantics: honest empty/unavailable for issued students, `notFound` for unresolvable identity, no demo fallback in either case"* — marked *"all applied [REM]"*.
* B3.1 report §18 item 10 `[AUDIT]`: *"`courseService` / `questionService` and `liveService`'s parameterless forms derive identity from the persisted session; a caller with no student session (e.g. a design preview) still receives the demo fixtures by design."*

### 3.2 The reconciliation

§7's enumerated four cases **are** fail-closed — I verified them. But the enumerated list is narrower than the binding ruling: it omits (a) an arbitrary unresolvable identifier and (b) a missing / expired / malformed / wrong-role session. Both remaining cases fall back to `demo`. §18 item 10 admits (b) but asserts it is an authorized "design preview" context. **No such context exists.**

**Source evidence `[AUDIT]`:**

```
src/services/mock/ownWorkspace.js:75-84   isInstituteId(id) → 'invalid'  (forged IDs only)
                              :81-83   demo seats / fixtureUsers / any canonical record → 'demo'
                              :84      return { kind: 'demo', record: null, identifier: id }   ← EVERY other id
                              :105     if (!session || session.user?.role !== role) return { kind:'demo', … }
                              :110     requireStudentWorkspace() throws ONLY when kind === 'invalid'
src/services/mock/live.js:12            scopeFor(id) = id ? requireStudentWorkspace(id) : sessionWorkspace('student')
src/services/mock/courses.js:6          noOwnRecords() = sessionWorkspace('student').kind === 'issued'
src/services/mock/learning.js:241-242   ownStudent(id) = requireStudentWorkspace(id).kind === 'issued'
src/services/mock/analysis.js:59-65     candidate() independently throws notFound for unresolvable ids
src/services/mock/examFlow.js:37-43     candidate() independently throws notFound for unresolvable ids
src/services/mock/students.js:66        resolveStudent() independently throws for unresolvable ids
```

So **the same "single shared boundary" behaves inconsistently**: `students.js` / `analysis.js` / `examFlow.js` add a stricter `candidate()`/`resolveStudent()` that throws for unknown ids, while `learning.js`, `live.js` and `courses.js` rely on the demo-defaulting helper. That inconsistency is the defect.

**Explicit-context search `[AUDIT]`:** a whole-`src/` search for `demoPreview|previewMode|allowAnonymous|anonymousContext|mockMode|isPreview|previewContext|demoContext|publicPreview|previewToken` found only `isMockMode` (defined at `src/services/index.js:25` as `!useApi`) used for landing/login *presentation*. `isMockMode` is a build-level flag true for every session; it is **not** an identity or preview-context distinction, and it is not consulted by `ownWorkspace.js`. `/design-preview` is unguarded at `src/app/routes/AppRoutes.jsx:267`, but `src/features/design-preview/pages/DesignPreviewPage.jsx` imports no service module. The only public service callers are `useInstituteProfile` and `useLandingContent` (public content, not academic records). **The distinction the directive required me to find is not established.** I therefore do **not** treat missing session as an authorized demo-preview context.

### 3.3 Ten-case identity matrix `[NODE]` + `[AUDIT]`

Classification results from the read-only in-memory evaluation (issued fixture `VYU-S-99-0232`, demo seat `stu-ananya`, arbitrary id `totally-unknown-id`). "Throws" = `requireStudentWorkspace()` result.

| # | Case | `accountWorkspace(id)` | `requireStudentWorkspace(id)` | `sessionWorkspace('student')` | Demo fixtures reachable? |
|---|---|---|---|---|---|
| 1 | Valid demo student (`stu-ananya`, demo session) | `demo` | no throw | `demo` | **Yes** (intended) |
| 2 | Valid issued student (own id, valid issued session) | `issued` | no throw | `issued` | No — 0 rows (intended) |
| 3 | Missing session + demo id | `demo` | no throw | `demo` | **Yes** |
| 4 | Missing session + no id / blank id | `invalid` | **throws `not_found`** | `demo` | **Yes** via parameterless calls |
| 5 | Expired session + demo id | `demo` | no throw | `demo` | **Yes** |
| 6 | Malformed session + demo id | `demo` | no throw | `demo` | **Yes** |
| 7 | Unknown identifier, with or without a demo session | `demo` | no throw | `demo` | **Yes** |
| 8 | Forged Institute ID `VYU-S-99-9999` | `invalid` | **throws `not_found`** | — | No |
| 9 | Issued student A requesting issued student B | `invalid` | **throws `not_found`** | `issued` | No (for that id) |
| 10 | Wrong-role Admin session + demo id | `demo` | no throw | `demo` | **Yes** |
| — | No session / design-preview context (no explicit marker) | `demo` | no throw | `demo` | **Yes** |

### 3.4 Service-return reproduction `[NODE]` — executed in this review

Sessions were schema-valid envelopes (`token`, `user`, `expiresInSeconds`, `issuedAt`, `expiresAt`) with a seeded canonical issued record. `expiresInSeconds` is required by `authSessionSchema` (`src/services/authSchemas.js:122`); an envelope omitting it is correctly rejected by `readPersistedSession()` (`sessionPersistence.js:46-57`) — that nuance was checked and controlled for.

| Service method | No session | Expired | Malformed | Wrong-role Admin | **Valid issued session + arbitrary unknown id** | Valid issued + own id (control) |
|---|---|---|---|---|---|---|
| `learningService.listLiveSessions(id)` | 6 | 6 | 6 | 6 | **6** | 0 |
| `learningService.listRecordings(id)` | 3 | 3 | 3 | 3 | **3** | 0 |
| `learningService.listDoubts(id)` | 3 | 3 | 3 | 3 | **3** | 0 |
| `learningService.listStudyRooms(id)` | 3 | 3 | 3 | 3 | **3** | 0 |
| `learningService.getAttendance(id).sessions` | 8 | 8 | 8 | 8 | **8** | 0 |
| `learningService.getLiveRoom(demoId, id)` | object | object | object | object | **object** | `not_found` |
| `learningService.getRecording(demoId, id)` | object | object | object | object | **object** | `not_found` |
| `liveService.listUpcoming()` (session-derived) | 6 | 6 | 6 | 6 | **0** | 0 |
| `courseService.listCourses()` (session-derived) | 5 | 5 | 5 | 5 | **0** | 0 |
| `questionService.listSamples()` (session-derived) | 2 | 2 | 2 | 2 | **0** | 0 |
| `examFlowService.syncAttempt()` (session-derived) | writes demo sync | writes | writes | writes | throws `exam_unavailable` | throws |
| `facultyService.getDashboard(id)` | object | object | object | object | object | object |
| `analysisService.getAnalysis(demoExam, id)` | `not_found` | `not_found` | `not_found` | `not_found` | `not_found` | honest `unpublished` |
| `examFlowService.getPaper(demoExam, id)` | `not_found` | `not_found` | `not_found` | `not_found` | `not_found` | `exam_unavailable` |
| `studentService.getById(id)` | `not_found` | `not_found` | `not_found` | `not_found` | `not_found` | own record |
| `assessmentService.listExams(id)` | `not_found` | `not_found` | `not_found` | `not_found` | `not_found` | 0 |

Seeded fixture counts: `liveSessions 6`, `recordings 3`, `doubts 3`, `studyRooms 3`, `courses 5`, `questionSamples 2`. `[NODE]`

**Answer to the directive's critical question: YES.** Unauthenticated / missing-session / invalid-session / unknown-identity callers **can** obtain demo academic records through student-facing services. The isolation works only along the narrow path where the caller supplies its own session-derived issued id. The B3.1 §18 item 10 limitation is real but **understated** — it omits `learningService`'s explicit-id methods entirely and omits that a *valid issued session* can trigger the leak.

**Finding:** F-01 (Critical) and F-02 (High) — full severity/file/evidence/reproduction/disposition in §12.

---

## 4. D-1 independent assessment — five routes and direct service access

**Requirement under test:** issued students must not receive demo live sessions, recordings, doubts, study rooms, attendance, analysis reports, exam papers/attempts, or course/question samples; demo seats retain original behaviour; all five routes remain reachable with honest empty states; isolation must be enforced at the service layer, not by hiding navigation.

### 4.1 Route layer — `[AUDIT]` + `[JSDOM]` (B3.1 isolation suite, re-executed here)

| Route | Guard | Hook → service | Issued result | Demo result |
|---|---|---|---|---|
| `/student/live` | `RequireRole allow={['student']}` + `RequirePasswordChange` (`AppRoutes.jsx:148-182`) | `useLearning` / `useUpcomingSessions(studentId)` | empty | seeded 6 |
| `/student/recordings` | same | `useRecordings(studentId)` → `liveService.listRecordings(studentId)` | empty | seeded 3 |
| `/student/doubts` | same | `useLearning().listDoubts(studentId)` | empty | seeded 3 |
| `/student/study-rooms` | same | `useLearning().listStudyRooms(studentId)` | empty | seeded 3 |
| `/student/attendance` | same | `useLearning().getAttendance(studentId)` | "No attendance records yet" | seeded 8 |

`useStudentWorkspace.js` now keys `useRecordings` by `[...queryKeys.recordings, studentId ?? 'unknown']` and gates with `enabled: Boolean(studentId)` (lines 52-56); the same pattern is applied to profile/exams/attempts/performance/notifications. `queryClient.clear()` is called on `useCommitSession`, session expiry, cross-tab clear, and `useLogoutCleanup` (`src/features/auth/hooks/useSession.js:38,60,75,119`); I confirmed `QueryClient.clear()` clears **both** `#queryCache` and `#mutationCache` (`@tanstack/query-core/.../queryClient.js:722-725`). Demo seats `stu-ananya` / `fac-snehasish` retain seeded behaviour. `[AUDIT]` `[JSDOM]`

**Verdict on the route layer: PASS** for the five routes, deep-link `analysis`/`examFlow` surfaces (they throw or return honest `unpublished`), and demo-seat preservation. The 5 route-level U-3 tests and 12 WS1 service tests in `tests/unit/batch-3-1-isolation.test.jsx` pass (re-executed here: 4 focused files / 117 tests, §10).

### 4.2 Direct service access — FAIL (F-01)

Every one of the five routes derives `studentId` from `useSessionStore`, so a browser user cannot type an arbitrary id there. **But the directive explicitly requires direct service access to be inspected**, and WS6/R-6 was specifically about deep-link / direct-call ownership. At that boundary the gate is bypassable:

* `learningService.listLiveSessions('totally-unknown-id')` under a **valid issued session** → 6 demo rows (§3.4).
* Same for recordings / doubts / study rooms / attendance history and all four detail getters.
* `learning.js` uses only `ownStudent(id)` / `requireStudentWorkspace(id)`; both return `demo` for unknown ids because of `ownWorkspace.js:84`.
* `students.js`, `analysis.js`, `examFlow.js` throw for the same id — proving the helper's demo default, not the call site, is the fault.

**Therefore the D-1 / U-3 binding requirement is not satisfied at the service boundary.** The five passing route tests prove the UI path is isolated; they do not prove direct service access is. This is the same class of "test coverage overstates isolation" that the original independent review flagged as I-3 — now recurring in a narrower form.

**Test gap `[AUDIT]`:** the WS1 classification test (`tests/unit/batch-3-1-isolation.test.jsx:92-97`) asserts fail-closed only for `''`, `undefined`, `'   '` and `'VYU-S-99-9999'`. It never tests an arbitrary non-Institute-ID unknown identifier, and never tests expired / malformed / wrong-role / missing session. The issued-to-issued test (lines 117-129) covers case 9 only. **No test in the tree would catch F-01 or F-02.**

**Constraint on any future fix `[AUDIT]`:** existing C1-discipline suites call with arbitrary legacy fixture ids and **no session** — `tests/unit/learning-service.test.js:56,66,68,76,90,101` uses `stu-voter`, `stu-schema`, `stu-play`, `stu-seek`, `stu-doubt`; `tests/unit/live-recording-links.test.jsx:34,41,47` uses `stu-ananya`. Making unknown ids fail closed unconditionally will break those suites. A fix therefore requires an explicit user ruling on how demo/test fixture identities are distinguished — see §14 condition 1. `ownWorkspace.js` is untracked and the five mock services are not protected, so a fix does **not inherently require a protected-file change**; no STOP dependency on protected files is claimed.

**Disposition:** document as Critical; no fix; STOP for explicit authorization. F-01 / F-04 in §12.

---

## 5. R-1 independent assessment — credential-bearing mutation lifecycle

**Requirement under test:** three credential-producing mutations must never persist plaintext in normal storage/logs; `mutation.reset()` must **not** be treated as `MutationCache` deletion; explicit close, unmount, navigation and sign-out must remove cache entries; no alternate query/cache path retains plaintext; tests must prove **actual `MutationCache` removal**, not observer reset.

### 5.1 The three mutations `[AUDIT]`

| Mutation | File / line | `mutationKey` |
|---|---|---|
| `useCommitImport` | `src/features/admin/hooks/useAdminOps.js:80` | `['admin','credentials','transient','import']` |
| `useCreateUser` | `…:204` | `…,'create'` |
| `useReissueTemporaryPassword` | `…:251` | `…,'reissue'` |

### 5.2 Real cache deletion, not observer reset — PASS `[AUDIT]`

```js
// useAdminOps.js:21-26
export function clearTransientCredentialMutations(queryClient) {
  const cache = queryClient.getMutationCache()
  for (const mutation of cache.findAll({ mutationKey: TRANSIENT_CREDENTIAL_MUTATION_KEY, exact: false })) {
    cache.remove(mutation)
  }
}
// :29-33
export function useTransientCredentialLifecycle() { … useEffect(() => () => clear(), [clear]) … }
```

`cache.remove(mutation)` is a genuine `MutationCache` deletion. The `mutation.reset()` calls that remain in the three components are **observer detachment**, and the code/comments explicitly do not treat them as cache deletion. TanStack internals (inspected in the earlier B3.1 work) confirm `MutationObserver.reset()` leaves the `Mutation` and its `state.data` in the cache; `MutationCache.remove()` is the correct API. **The B3.1 report §8 discloses this correctly rather than hiding it** — independent confirmation `[AUDIT]`.

### 5.3 All four removal paths `[AUDIT]`

* **Explicit close:** `CreateUserDialog.jsx:61-65` `close()` → `create.reset()` + `clearCredentials()` + `onClose()`; success path at `:85-89` also clears; `AccountRowActions.jsx:88-91` `close()` clears `operation/edit/move/reissue` + `clearCredentials()`; `AdminImportPage.jsx:685-689` sheet `onClose` → `setCredentials([])` + `commit.reset()` + `clearCredentials()`.
* **Unmount:** `useTransientCredentialLifecycle()` cleanup in `CreateUserDialog.jsx:27`, `AccountRowActions.jsx:38`, `AdminImportPage.jsx:37`, `AdminUsersPage.jsx:56`; plus per-mutation `useEffect(() => () => …reset(), [])` at `CreateUserDialog.jsx:39`, `AdminImportPage.jsx:43-45`, `AccountRowActions.jsx:50-53`.
* **Navigation:** route change unmounts the page/dialog → both cleanups fire. `AdminUsersPage` explicitly registers the lifecycle for "navigating away from People".
* **Sign-out:** `useLogoutCleanup()` (`useSession.js:116-122`) calls `queryClient.clear()`, which clears the `MutationCache`; `useCommitSession` also clears on any new login. Route guards then unmount Admin surfaces, firing the component cleanups as well.

### 5.4 Alternate retention paths `[AUDIT]`

Credentials live only in the mutation result, the caller's component-local `useState` (`AdminImportPage.jsx:48`, `AdminUsersPage.jsx:65`, `AccountRowActions`), and `CredentialsSheet`'s `rows` prop. `CredentialsSheet` stores only `${instituteId}:${field}` in its `copied` marker (never a secret), clears `copied`/`marked` when the signature empties, and does not claim OS clipboard clearing. There is no `admin.credentials` query key; `queryKeys` contains no credential namespace; no `revealPassword` / `getPlaintext` / retrieval API; no credential in audit `meta`/`note`, URL, analytics or `console.*`. `CREDENTIAL_SECURITY_NOTICE` accurately warns that clipboard/Downloads plaintext is outside the app's control. `[AUDIT]`

**Residual `[AUDIT]` (Low, F-05):** `clearTransientCredentialMutations()` removes entries that already exist. If a credential mutation is still *pending* when the component unmounts, `cache.remove()` detaches it from the cache but does not cancel the in-flight promise; the resolved `Mutation.state.data` can briefly hold plaintext in memory until GC. There is no test for that race. This is a time-limited in-memory exposure, not persistence.

### 5.5 Do the tests prove actual cache removal? PARTIAL — `[JSDOM]` `[AUDIT]`

The WS2 test `tests/unit/batch-3-1-credentials.test.jsx:187-212` (re-executed here) does:

```js
const cacheSnapshot = () => JSON.stringify(client.getMutationCache().getAll().map((m) => m.state.data))
… await waitFor(() => expect(rows).toHaveLength(1))
const secret = rows[0].temporaryPassword
expect(cacheSnapshot()).not.toContain(secret)
unmount()
expect(cacheSnapshot()).not.toContain(secret)
expect(JSON.stringify({ ...localStorage })).not.toContain(secret)
expect(JSON.stringify({ ...sessionStorage })).not.toContain(secret)
expect(window.location.href).not.toContain(secret)
const audit = await adminService.listAudit(…); expect(JSON.stringify(audit.items)).not.toContain(secret)
expect(JSON.stringify(loadAccountsDb())).not.toContain(secret)
```

Because `reset()` alone leaves `state.data` in `getAll()`, this assertion **does** discriminate real `MutationCache` removal from observer reset — genuine proof for `useCreateUser`. However, the companion WS2 test (lines 168-181) checks the import and reissue flows only by **source-text regex** (`useEffect(() => () =>`, `.reset()`, `cache.remove(mutation)`), not by executing them against a `MutationCache`. No test exercises navigation-with-sheet-open or sign-out-driven cache clearing, and no test asserts `cache.findAll({mutationKey: …})` is empty after cleanup. **R-1 is substantially remediated with one runtime proof and two unverified-by-execution flows.** No credential persistence was found in any path.

**Disposition:** PASS with a Medium verification gap (F-05); no fix performed.

---

## 6. U-1–U-5, G1–G4 / C1, four clarification rulings, and cross-cutting requirements

Independent reassessment against source; not a restatement of the remediation report. `[AUDIT]` unless noted.

| ID | Requirement | Verdict | Evidence |
|---|---|---|---|
| **U-1** | Exact CSV columns/order `instituteId,temporaryPassword,role,name,batchName`; filename `vyuh-one-time-credentials.csv`; transient only; no storage/cache/URL/log/analytics/audit; no credential column in template; warning before download; no claim of erasing a downloaded file | **PASS** | `contracts/admin.js:492-499` exact 5 frozen columns + filename; `credentialCsv.js:38-41`; `IMPORT_FIELDS` (`mock-data/importCsv.js:13-21`) exactly 7 columns, no credential; `CredentialsSheet.jsx` Blob + `CREDENTIAL_CSV_FILE_NAME`, toast explicitly says the app cannot erase it; §5.4 finds no persistence path. |
| **U-2** | Explicit per-value Copy, accessible labels, user action only, never auto-copy/log/audit clipboard, no OS-clipboard-clearing claim, verbatim notice | **PASS** | `CredentialsSheet.jsx:69-79` `copyValue()` only on click, guarded by `navigator.clipboard?.writeText`, labelled buttons, failure toast; `copied` holds a key not a secret; `CREDENTIAL_SECURITY_NOTICE` verbatim in `contracts/admin.js:501`. |
| **U-3** | Issued student/faculty honest empty/own workspaces; no demo academic data; demo fixtures unchanged | **FAIL at service boundary** | §3 / §4: F-01, F-02. Route-layer isolation passes; direct-service isolation does not. B3.1 §5 marks this "remediated" — not substantiated. |
| **U-4** | Editable name/email/phone/batch; immutable `instituteId`/`source`/role; email/roll uniqueness; dedicated batch move; terminal archive with reason + irreversible confirmation; no delete / ID reuse | **PASS** | `admin.js` edit/move/archive operations with `requireAdminActor()`; `accounts.js` `issuedInstituteIds` permanent; no delete/ID-reuse API; tests in `admin-accounts.test.jsx` (re-executed). |
| **U-5** | `issueTemporaryPassword()` digest/salt only, `mustChangePassword:true`, invalidates old temp, returned once in memory, `{clearAttempts:false}`, no status/lockout change | **PASS** | `auth.js` / `accounts.js`; `admin.js:1619` reissue gate; audit metadata only. Limitations R-9/R-10 disclosed below are prototype-level, not U-5 violations. |
| **G1** | `VYU-S-YY-NNNN` / `VYU-F-NNNN` / `VYU-A-NNN`, never-reused IDs, `year:null` shipped | **PASS** | `instituteIdConfig`, `configureInstituteIds`, `issuedInstituteIds`; `'99'` appears only as test fixture data in tests. |
| **G2** | 12-char `crypto.getRandomValues` rejection sampling; no time expiry; mandatory first login change | **PASS** | generator + `mustChangePassword` guard; salted SHA-256 is a **prototype** digest (R-10, disclosed). |
| **G3** | One-time viewing, no plaintext retrieval | **PASS** | no retrieval API; §5.4. |
| **G4** | Out-of-band recovery, Admin identity verification, mandatory reason | **PASS** | `admin.js` recovery path with `requireAdminActor()` + reason. |
| **G5 / C1** | Consent and Password Requests blocked; test-migration discipline retained | **PASS** | `PasswordRequest` typedef-only; 27 files / 365 tests pass `[JSDOM]` `[EXEC]`; legacy fixture-id dependency noted in §4.2. |

**Four approved B3.1 clarification rulings:**

1. **Shared `src/services/mock/` helper with fail-closed semantics, `notFound` for unresolvable identity, no demo fallback, no second identity system** — **FAIL**. A single helper exists (`ownWorkspace.js`) and reuses `loadAccountsDb()` / `accountByIdentifier()` / `isInstituteId()` / `readPersistedSession()` with no second identity store — that part passes. But `ownWorkspace.js:84,105` fail open, and §3.4 proves demo fallback for unresolvable identities. B3.1 §5's "all applied" is inaccurate. **This is the blocking violation.**
2. **Credential-export-specific CSV sanitisation preserving application values; shared `csvFromColumns()` untouched; exact U-1 order/filename; no corrupted generated passwords; no weakened import validation** — **PASS**. `src/features/admin/lib/credentialCsv.js` uses `TRUSTED_KEYS = {instituteId, temporaryPassword, role}` so generated passwords are never prefixed; `FORMULA_PREFIX = /^\s*[=+\-@|\t\r]/` prefixes a leading apostrophe only for untrusted `name`/`batchName`; CR/LF stay inside quoted cells; `csvFromColumns()` at `adminMath.js:340-347` is byte-unchanged; `IMPORT_FIELDS` still 7 columns. 9 CSV case families covered by executed tests `[JSDOM]`.
3. **Admin service-boundary authorization for privileged account-management mutations only, with session-derived attribution** — **PASS**. `requireAdminActor()` (`admin.js:62-67`) throws `forbidden`/403 unless `readPersistedSession().user.role === 'admin'`, and returns `{id,name}` from the session. Applied at exactly 8 privileged calls (`admin.js:724,1402,1434,1492,1512,1583,1619,1650`). The seeded-office fallback in `adminActor()` is retained for reads and pre-existing console mutations — correct under "privileged mutations only". Valid Admin case preserved.
4. **Dialog confirmation primary; background `PageHeader` actions disabled/de-emphasised; a11y/keyboard preserved; tokens/primitives reused** — **PASS**. `AdminUsersPage.jsx:61-63` `overlayOpen = createOpen || credentials.length > 0 || rowDialogOpen`; `Create account` button `disabled={overlayOpen}`; `Import a CSV` link gets `aria-disabled`, `tabIndex=-1`, `preventDefault()` and `opacity-50 pointer-events-none`. `AccountRowActions.jsx:55` reports dialog state upward. No design-token violation (lint/architecture check exit 0).

**Cross-cutting reassessments:**

* **Credential security** — PASS (§5.4, U-1/U-2). No `admin.credentials` key, no `revealPassword`/`getPlaintext`, no credentials in `localStorage`/`sessionStorage`/QueryCache/MutationCache/URLs/audit/logs/projections after cleanup, no automatic clipboard clearing claimed.
* **CSV formula injection** — remediated (ruling 2); untrusted `name`/`batchName` neutralised; trusted generated fields untouched.
* **Admin service-boundary authorization** — remediated (ruling 3).
* **Account lifecycle / audit attribution** — PASS; `requireAdminActor()` session-derived attribution, reason required on status transitions, 15 original audit actions / 20 seeded entries preserved `[HIST]`, phone projection D-2 fixed at `admin.js:1560-1572` by re-reading the canonical record.
* **Attendance integrity** — partial. `admin.js:857` now returns `attendancePercent: null` for `source === 'institute_issued'` and `:897` returns `averageAttendance: null` when any member is `null`; `AttendancePage.jsx` shows "No attendance records yet" instead of a fabricated 0.0% / defaulter warning. **But `admin.js:1190-1199` (`runReport('attendance')`) still computes `present` and `defaulters` by multiplying seeded `batch.attendancePercent` by `batch.studentCount`** for report rows — a batch-level seeded aggregate, not a per-real-student value, yet it produces percentage/defaulter figures in a report that now includes issued students. B3.1 §11 discloses line 857 but not this path. Low severity; F-06.
* **Accessibility / primary-action consistency** — ruling 4 PASS; `CredentialsSheet` exposes a named dialog, captioned table and labelled copy buttons (jsdom assertions at `batch-3-1-credentials.test.jsx:411` `[JSDOM]`); **no real-browser axe** (§11).

---

## 7. D-1–D-3 disposition (original independent-review defects)

| ID | Original finding | Independent reassessment | Disposition |
|---|---|---|---|
| **D-1** | High — issued students see demo live classes/recordings/doubts/study rooms/attendance on five routes; gates only in `students.js`/`faculty.js` | **Route layer remediated**: one shared helper, five routes honest empty, deep-link surfaces gated, demo seats unchanged, 5 route + 12 service tests pass. **Service boundary NOT remediated**: F-01/F-02 (§3, §4). | **PARTIAL → still blocking.** The P0 release blocker is not fully closed. |
| **D-2** | Low — `applyAccountOperation().account.phone === ''` after status operations | Fixed at `admin.js:1560-1572` by re-reading the canonical registry record; `SAFE_ACCOUNT_FIELDS` in the protected `accounts.js` was **not** broadened (hash unchanged). Shape-consistency test present `[JSDOM]`. | **CLOSED.** No protected-file change. |
| **D-3** | Low — prospective E2E case did `page.goto('/login')` with an active Admin session and no logout | `tests/e2e/admin-accounts.spec.js:33-38` now has `signOut(page)` clicking the Admin shell "Sign out" control, asserting URL `/` and `vyuh.session === null`; case 2 calls it at `:114` before student sign-in; forced setup at `:127`. No injected session, no credential literal. | **CLOSED as a source defect; UNVERIFIED behaviourally** — no browser exists to execute it (§11). |

---

## 8. R-1–R-12 disposition (original independent-review risks)

| ID | Risk | Reassessment | Verdict |
|---|---|---|---|
| **R-1** | Credentials retained in `MutationCache` until `gcTime` when the sheet is never closed | `clearTransientCredentialMutations()` + keyed removal on close/unmount/navigation; `queryClient.clear()` on sign-out; one executed runtime proof of `getMutationCache().getAll()` being clean (§5). Import/reissue verified by source text only; pending-mutation race untested. | **REMEDIATED** with Medium verification gap (F-05) |
| **R-2** | CSV formula injection / `\r` not escaped | `credentialCsv.js` dedicated sanitisation, shared `csvFromColumns()` unchanged; 9 case families tested. | **REMEDIATED** |
| **R-3** | Synchronous `revokeObjectURL` after `link.click()` may abort download | `CredentialsSheet.jsx:80-99` now tracks `pendingUrls`, defers release with `setTimeout(…, 0)`, and revokes any pending URL on unmount. Source-correct; **real download still unverified**. | **REMEDIATED (source); UNVERIFIED (browser)** |
| **R-4** | Non-Admin session writes attributed to seeded office seat | `requireAdminActor()` at 8 privileged mutations, session-derived `{id,name}`. | **REMEDIATED** |
| **R-5** | Fabricated attendance percentages for real issued students | `admin.js:857,897` fixed for roster/detail; `admin.js:1190-1199` report path still derives `present`/`defaulters` from seeded batch percentages. | **PARTIAL** (F-06) |
| **R-6** | Deep-link demo exams/analysis/attempts exposure | `analysis.js` honest `unpublished` + `revision_unavailable`; `examFlow.js` `exam_unavailable` / `syncAttempt()` session-gated; `courses.js`/`live.js` session-derived and return 0 under a valid issued session. **But explicit arbitrary ids and no-session callers still reach `learningService` demo fixtures** (§3.4). | **PARTIAL** — analysis/examFlow closed; learning/live/courses open (F-01/F-02) |
| **R-7** | Two co-visible primary buttons with dialog open | `overlayOpen` disables/de-emphasises background actions on `AdminUsersPage` / `AdminImportPage` / `AccountRowActions`. | **REMEDIATED (source); UNVERIFIED visually** |
| **R-8** | `useRecordings()` / `useUpcomingSessions()` globally keyed, unscoped | Both now take `studentId`, include it in the query key, and are `enabled: Boolean(studentId)` (`useStudentWorkspace.js:52-56`). | **REMEDIATED** |
| **R-9** | Non-ACID compensating rollback over `localStorage` | Unchanged, disclosed in B3.1 §18 item `R-9`. | **ACCEPTED LIMITATION** `[HIST]` |
| **R-10** | Salted SHA-256 prototype digest, not a KDF | Unchanged, disclosed. Prototype has no backend by design. | **ACCEPTED LIMITATION** `[HIST]` |
| **R-11** | No jsdom clipboard stub / axe-on-dialog test | `batch-3-1-credentials.test.jsx:359-420` adds a `navigator.clipboard.writeText` stub, "no write on mount", clear-on-close, and labelled-dialog/table/copy-button assertions. Real-browser axe still absent. | **REMEDIATED (jsdom); UNVERIFIED (real-browser axe)** |
| **R-12** | `simulate()` `structuredClone()` creates an extra in-memory credential copy | `mock-data/latency.js:92-95` still resolves `structuredClone(value)`; short-lived, cleared on close. Disclosed. | **ACCEPTED LIMITATION** |

**Re-confirmed positive security findings `[AUDIT]`:** no `revealPassword` / `getPlaintext` / retrieval API; no `admin.credentials` query key; no `console.*` of a credential; no credential in audit `note`/`meta`, URL, analytics, or account projections; `PasswordRequest` typedef-only; G5 consent and Password Requests queue absent; no Super Admin / multi-tenancy / institute registration / public self-registration / backend / external auth / new dependency.

---

## 9. Protected files, scope restrictions, and the 33 aliases

**Protected-file constraints — PASS `[EXEC]` `[AUDIT]`:** the eight baseline-recorded hashes match; zero `BATCH 3.1` markers across 17 protected paths; the only protected tracked diffs are the six pre-existing Batch 2 files with unchanged counts; `scripts/check-architecture.mjs`, `src/styles/tokens.css`, `package.json` and `package-lock.json` have zero diff. No protected-file modification by B3.1 or by this review. **No STOP dependency on a protected file would be created by fixing F-01/F-02** — `ownWorkspace.js` is untracked and the five mock services are not protected (the Gate 0/B2 prospective "B1 exam/learning/analysis files unchanged" statement is overridden by the explicit user directive for `src/services/mock/{learning,live,examFlow,analysis,courses}.js`; correctly recorded, no STOP).

Two documentation-level notes `[AUDIT]`: the protected list names `src/styles/index.css`, but only `src/styles/tokens.css` exists in this tree (F-12); and `src/app/routes/v2RouteTable.js:15,58` still carries stale "Batch 3" provisional comments (I-4/F-10) — deliberately left untouched under the protected-file restriction, documented only.

**Scope restrictions — PASS `[AUDIT]`:** React + Vite JavaScript/JSX only; exactly one institute; exactly `admin` / `faculty` / `student`; no Super Admin, multi-tenancy, institute registration, public self-registration, Password Requests, G5 consent, backend, external auth, or new dependency (0 package/lockfile diff, no install attempted). Mock-data remains the source of truth; services/hooks/contracts/components/tokens reused; B1/B2 canonical registry and auth session model preserved; guards and import validation not weakened. The five B1 mock services were edited under the explicit user override, which is correctly recorded in B3.1 §2/§4.

**33 v2 aliases — PASS `[NODE]`:** `V2_ROUTE_ALIASES` = 11 student + 12 faculty + 10 admin = **33**; `V2_NAMESPACES.length = 3`; `V2_ROUTE_MATRIX.length = 33`. A naive earlier check printed `unique aliases = 1` because it read a non-existent `r.alias` property; the correct count is 33 and was recomputed from the three arrays plus the matrix in this review. `v2Aliases.jsx` preserves params, query, hash and history state; `/a/people?tab=faculty&status=locked#row-4` remains asserted in `tests/unit/v2-routes.test.jsx`.

---

## 10. Test / build evidence — executed in this review

All four mandated commands were **freshly executed on the exact current tree** (before this report was written) at `2026-11-08T11:07:03Z`. No dependency or browser installation. Logs: `/tmp/final-review-{test,build,lint,oxlint,playwright-list,focused}.log`.

| Command | Exit | Exact result | Class |
|---|---|---|---|
| `npm test` | **0** | `Test Files 27 passed (27)`, `Tests 365 passed (365)`, duration 74.38s | `[EXEC]` `[JSDOM]` |
| `npm run build` | **0** | `✓ 3305 modules transformed`, `✓ built in 1.46s` | `[EXEC]` |
| `npm run lint` | **0** | `Architecture check passed: 326 files, 325 colour-free, no boundary or token violations.` | `[EXEC]` |
| `npx oxlint src tests` | **0** | `Found 38 warnings and 0 errors.` / `Finished in 201ms on 360 files with 104 rules using 2 threads.` | `[EXEC]` |
| `npx vitest run` (4 focused files: B3.1 isolation, B3.1 credentials, admin accounts, guard matrix) | **0** | `Test Files 4 passed (4)`, `Tests 117 passed (117)`, duration 12.18s | `[EXEC]` `[JSDOM]` |
| `npx playwright test --list` | **0** | `Total: 60 tests in 8 files` | `[STATIC-COLLECT]` — **static collection only, NOT a pass** |
| `git diff --check` (after all commands) | **0** | 0 errors; `54 files changed, 2691 insertions(+), 552 deletions(-)`; status 54 `M` / 37 `??` | `[EXEC]` |

**Historical evidence, corroborated but not re-executed as B3/B3.1 final runs `[HIST]`:** B3 final all-four (25/25 files, 314/314 tests, 3303 modules, lint 324/323, oxlint 38/0); B3.1 exact-tree final all-four at `10:50:23Z` (27/27, 365/365, 3305 modules / 1.42s, lint 326/325, oxlint 38/0); B3.1 focused 15-file regression (286 tests, 43.14s); targeted B3.1 suites (2 files / 51 tests). These are **not** fresh independent-review evidence — the `[EXEC]` rows above are.

**What the tests do and do not prove:** 365/365 proves no regression in the existing suites and that the five route-level isolation tests, CSV families, clipboard stubs and cache-clean assertions pass **in jsdom**. It does **not** prove the identity boundary is fail-closed (no test covers F-01/F-02 — §4.2), does not prove real-browser behaviour, and does not prove the prospective Playwright spec passes. **This review does not award ACCEPT on the basis of a green suite.**

---

## 11. Browser limitations and unverified claims

**Environment `[EXEC]`:** Playwright 1.65.0 installed as a package; `PLAYWRIGHT_BROWSERS_PATH` unset; `~/.cache/ms-playwright` **ABSENT**; no `chrome`, `chromium`, `chromium-browser`, `google-chrome` or `headless_shell` binary on PATH. Two historical `npx playwright install chromium` attempts failed with `ECONNRESET` / TLS disconnect; installation is forbidden by this directive and was **not** retried.

**Therefore the following are `[UNVERIFIED]` and are explicitly NOT claimed:**

* Any Playwright / E2E test execution or pass. `npx playwright test --list` is **static collection** of 60 tests in 8 files only. The corrected D-3 journey (`tests/e2e/admin-accounts.spec.js`) remains a **prospective spec**.
* Real-browser console errors/warnings on `/admin/users`, `/admin/users/import`, or issued-student workspaces.
* Real viewport / responsive behaviour at 1440 / tablet / mobile; the "one filled ember primary per view" rule visually confirmed.
* Real `navigator.clipboard.writeText`, OS clipboard state, or any claim the OS clipboard is cleared.
* Actual CSV download completion after the deferred `revokeObjectURL`, file written to Downloads, filename, header/row equality in a real browser.
* Real-browser axe on `CreateUserDialog`, `CredentialsSheet`, `AccountRowActions`; keyboard tab / Escape / focus-trap in a real browser.
* Media / camera, cross-tab restore, session-restore-after-suspend/lock/archive, download interception, network conditions.
* Any browser-based evidence for F-01/F-02 (the leak is proven by direct service evaluation `[NODE]`, which is sufficient and does not need a browser).

jsdom-based accessibility and clipboard assertions exist (`batch-3-1-credentials.test.jsx:359-420`) and are labelled `[JSDOM]` only. The report does not convert them into browser evidence.

---

## 12. Remaining defects, risks and findings register

Each finding below carries severity, file/method, evidence, reproduction (where applicable), and disposition. All are **documented only** — no fix, no source or historical-report edit.

### F-01 — Unresolvable arbitrary identifiers fall back to `demo`; issued-student direct service access returns demo academic records
* **Severity:** **Critical — binding violation (U-3 / D-1 / clarification ruling 1). Release blocker.**
* **File / method:** `src/services/mock/ownWorkspace.js:84` (`accountWorkspace` default branch), `:110` (`requireStudentWorkspace` throws only for `invalid`); consumers `src/services/mock/learning.js:241-242,253,415,486,493,503,521,536`, `src/services/mock/live.js:11-12,21,27`.
* **Evidence:** `[AUDIT]` + `[NODE]` §3.2/§3.4. With a schema-valid issued student session (`VYU-S-99-0232`), `accountWorkspace('totally-unknown-id','student').kind === 'demo'`, `requireStudentWorkspace(...)` does **not** throw, and `learningService.listLiveSessions('totally-unknown-id')` returns 6 rows; recordings/doubts/study rooms 3 each; attendance 8 sessions; demo detail objects returned. Control with the own id returns 0 / `not_found`. `students.js`, `analysis.js`, `examFlow.js` throw for the same id, proving the helper is the fault.
* **Reproduction:** seed a canonical issued record in `vyuh.mock.accounts.v1`, write a schema-valid `vyuh.session` for it (include `expiresInSeconds`), then call `learningService.listLiveSessions('totally-unknown-id')` (or any of the eight methods in §3.4). Observe seeded demo fixtures. No file writes, in-memory storage only.
* **Disposition:** **OPEN. No fix.** Bars unconditional `ACCEPT`. Requires explicit user authorization before correction. If the user rules this prototype behaviour acceptable, ruling 1 must be formally amended by the user (highest authority) and the amendment recorded.

### F-02 — Missing / expired / malformed / wrong-role sessions are classified as `demo` with no explicit preview-context distinction
* **Severity:** **High — unauthenticated data exposure at the service boundary; unsubstantiated "by design" claim.**
* **File / method:** `src/services/mock/ownWorkspace.js:105` (`sessionWorkspace`); `src/services/mock/live.js:12`; `src/services/mock/courses.js:6`; `src/services/mock/examFlow.js:131`; `src/services/mock/faculty.js:142`; `src/services/index.js:25` (`isMockMode`, a build-level flag only).
* **Evidence:** `[AUDIT]` + `[NODE]` §3.2/§3.4. Under NO / EXPIRED / MALFORMED / WRONG-ROLE-ADMIN sessions, `learningService.*` returns 6/3/3/3/8 rows + detail objects and `liveService.listUpcoming()` 6, `courseService.listCourses()` 5, `questionService.listSamples()` 2, `facultyService.getDashboard()` an object, `examFlowService.syncAttempt()` writes demo sync state. Whole-`src` search found no `demo-preview` / `previewMode` / `allowAnonymous` / `previewContext` marker. `/design-preview` (`AppRoutes.jsx:267`) is unguarded but `DesignPreviewPage.jsx` imports no service. B3.1 §18 item 10 calls this "by design" without establishing the distinction.
* **Reproduction:** clear, expire (`expiresAt < Date.now()`), corrupt (`'{not json'`), or replace the role in `vyuh.session`; call any method in the first five columns of §3.4; observe demo fixtures.
* **Disposition:** **OPEN. No fix.** The directive forbids assuming missing session is an authorized demo-preview context; no explicit evidence was found.

### F-03 — Batch 3.1 report overclaims fail-closed compliance and is internally inconsistent
* **Severity:** **Medium — documentation / acceptance-record integrity.** No code defect.
* **File / method:** `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §5 (ruling 1 "all applied"), §7 ("Fail-closed … No demo fallback", "Lists return `[]`"), §12 ("No demo paper, attempt or submission leaks"), §18 item 10 ("still receives the demo fixtures by design"); `VYUH_BATCH_3_COMPLETION_REPORT.md` §16/U-3 claim and `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` I-3.
* **Evidence:** `[AUDIT]` verbatim quotes in §3.1 vs `[NODE]` §3.4.
* **Reproduction:** not applicable (documentation).
* **Disposition:** **OPEN. Historical reports deliberately not modified** under this directive. Reconcile in a NEW addendum only, with separate authorization (§14 condition 4), or record an explicit user risk acceptance.

### F-04 — Regression-test gap for the identity boundary
* **Severity:** **Medium — verification gap that allowed F-01/F-02 to ship green.**
* **File / method:** `tests/unit/batch-3-1-isolation.test.jsx:92-97` (only `''`, `undefined`, `'   '`, `'VYU-S-99-9999'`), `:117-129` (issued-to-issued only); no test for arbitrary unknown ids or for expired/malformed/wrong-role/missing sessions; five route-level U-3 tests pass because hooks supply session-derived ids.
* **Evidence:** `[AUDIT]` + `[JSDOM]` (4 focused files / 117 tests pass, yet F-01 reproduces).
* **Reproduction:** add one assertion `expect(accountWorkspace('totally-unknown-id','student').kind).toBe('invalid')` — it fails on the current tree.
* **Disposition:** **OPEN. No fix.** New tests required before any remediation is accepted (§14 condition 3).

### F-05 — R-1 cache-removal proof covers one of three credential mutations; navigation/sign-out cleanup not exercised
* **Severity:** **Medium — verification gap.** No credential persistence found.
* **File / method:** `tests/unit/batch-3-1-credentials.test.jsx:168-181` (source-regex assertions for import/reissue) vs `:187-212` (runtime `getMutationCache().getAll()` proof for create only); `src/features/admin/hooks/useAdminOps.js:21-26` (removal of already-existing entries; a pending mutation is not cancelled).
* **Evidence:** `[AUDIT]` + `[JSDOM]` §5.5.
* **Reproduction:** not a leak reproduction; execute `useCommitImport` / `useReissueTemporaryPassword` against a real `QueryClient`, assert `getMutationCache().findAll({mutationKey: …})` is empty after close/unmount, and simulate navigation-with-sheet-open and sign-out. No such test exists.
* **Disposition:** **OPEN. No fix.** Non-blocking by itself; include in §14 condition 3.

### F-06 — Attendance report still derives `present` / `defaulters` from seeded batch percentages
* **Severity:** **Low — data-honesty residual (R-5 partial).**
* **File / method:** `src/services/mock/admin.js:1190-1199` (`runReport('attendance')`); contrast `:857` and `:897` which are fixed for issued members.
* **Evidence:** `[AUDIT]` — `Math.round(batch.studentCount * sessions * (batch.attendancePercent / 100))`, `defaulters = …`, `percent: \`${batch.attendancePercent.toFixed(1)}%\``. B3.1 §11 discloses line 857 but not this path.
* **Reproduction:** call `adminService.runReport('attendance')` with a batch containing issued students; report rows still show seeded-derived percentages/defaulters. `[UNVERIFIED]` at runtime — static inspection only.
* **Disposition:** **OPEN, risk-acceptable.** Documented, no fix.

### F-07 / F-08 / F-09 — Accepted prototype limitations (R-12 / R-9 / R-10)
* **Severity:** **Low, disclosed.** `mock-data/latency.js:92-95` `structuredClone()` extra in-memory credential copy; `admin.js:192-231` non-ACID `localStorage` compensating rollback; `auth.js` / `accounts.js` salted SHA-256 prototype digest rather than a KDF.
* **Evidence:** `[AUDIT]` + `[HIST]` (B3.1 §18).
* **Disposition:** **ACCEPTED / documented.** No backend by design; no fix requested.

### F-10 — Stale protected-file comments (I-4)
* **Severity:** **Low — documentation only.**
* **File / method:** `src/app/routes/v2RouteTable.js:15` ("exam/compliance/people -> Batch 3/9") and `:58` (`/a/people` "People Management tabs/Create User are Batch 3") — Batch 3 is complete, yet the file is protected and must not be edited.
* **Evidence:** `[AUDIT]`; protected hash `98e9fee4…` unchanged.
* **Disposition:** **OPEN, documented only.** No protected-file edit authorized; no STOP required.

### F-11 — Historical documentation inconsistencies I-1, I-2, I-3, I-5, I-6 remain on the record
* **Severity:** **Low — documentation only.**
* **File / method:** `VYUH_BATCH_3_COMPLETION_REPORT.md` §4 (six-vs-nine enumeration), §3/§24 vs Gate 0 §17.2 (two type-only JSDoc files outside the map), §16/§19 (overstated U-3 claim — now recurring as F-03/F-04), `tests/unit/v2-routes.test.jsx` extra heading assertion, §4/§24 (`adminMath.js` / `useAdmin.js` listed but untouched). Late B3 document-reconciliation order deviation is permanent and disclosed.
* **Evidence:** `[AUDIT]` + `[HIST]`; reports byte-identical to baseline.
* **Disposition:** **OPEN, documented only.** Historical reports intentionally not rewritten.

### F-12 — Protected list names a non-existent file
* **Severity:** **Low — documentation discrepancy.**
* **File / method:** protected list includes `src/styles/index.css`; `find src/styles -maxdepth 1 -type f` returns only `tokens.css`.
* **Evidence:** `[EXEC]`.
* **Disposition:** **OPEN, documented only.** No tree change.

### F-13 — No real-browser evidence for any browser-dependent acceptance condition
* **Severity:** **Medium — verification gap (non-blocking on its own, but bars `ACCEPT`).**
* **File / method:** `tests/e2e/*` (8 files / 60 tests statically collected), `tests/e2e/admin-accounts.spec.js` corrected D-3 journey; environment per §11.
* **Evidence:** `[EXEC]` `[STATIC-COLLECT]` `[UNVERIFIED]`.
* **Reproduction:** not applicable.
* **Disposition:** **OPEN.** Requires Chromium availability and a new authorization to install/run; neither exists here.

**No other defects found.** In particular: no credential egress, no new dependency, no Git mutation, no protected-file change, no weakened guard/import validation, no violation of the 33 aliases or the canonical registry, no removal of demo fixtures, and no Batch 4 work.

---

## 13. Explicit acceptance recommendation

**REJECT the final acceptance of Batch 3 + Batch 3.1 at this gate.**

* **`ACCEPT` is not available:** all binding requirements are not satisfied. Clarification ruling 1 (fail-closed identity, `notFound` for unresolvable identity, no demo fallback) is violated at `ownWorkspace.js:84` and `:105`; U-3 / D-1 remains open at the service boundary; and the critical identity boundary is fail-open. 365 passing jsdom tests do not cure a confirmed fail-open boundary — this review explicitly refuses to award acceptance on a green suite.
* **`CONDITIONAL ACCEPT` is not appropriate:** that verdict is reserved for "appears sound, specific outstanding verification / non-blocking conditions". Here the outstanding condition is a **reproduced violation of an approved binding ruling**, not a missing verification. F-01 is a code defect with a concrete reproduction under a valid issued session.
* **`REJECT` is therefore the single honest verdict**, and it is deliberately **narrow and remediable**: the rejection rests on one coherent identity-helper defect (F-01/F-02), its test gap (F-04), and the resulting documentation overclaim (F-03). Everything else examined — U-1, U-2, U-4, U-5, G1–G4, G5/C1, rulings 2–4, D-2, D-3 source correction, R-1's real cache deletion, R-2/R-3/R-4/R-6(partial)/R-7/R-8/R-11, the 33 aliases, protected-file constraints, scope discipline, and a clean four-command verification — is sound and should be preserved. **REJECT is not a judgement that the batches are worthless; it is a judgement that the P0 gate is not closed.**

**What the user may decide:** because the explicit user directive has highest authority, the user may (a) authorize a correction, or (b) issue a written, explicit amendment ruling that the demo fallback for missing/invalid sessions and arbitrary identifiers is *intended prototype behaviour*, thereby redefining ruling 1 and reclassifying F-01/F-02. Option (b) is a product decision, not something this review may assume or grant. Until one of these is recorded, this review's verdict stands.

**Final acceptance belongs to the user.** This review does not accept, does not start Batch 4, and does not perform any remediation.

---

## 14. Exact conditions before Batch 4

All of the following must be satisfied **under a new explicit user directive** (this review's authorization is read-only and forbids edits). Batch 4 must not start until the user has accepted Batch 3 and separately authorized Batch 4.

1. **Explicit user ruling on identity semantics (must come first).** Decide, in writing, whether (a) clarification ruling 1 stands — every unresolvable identity, including arbitrary non-Institute-ID identifiers and missing/expired/malformed/wrong-role sessions, must return `not_found` with **no demo fallback** — or (b) a demo fallback is explicitly authorized for a **named, explicit demo-preview context**. If (b), define how that context is established (a real marker, not `isMockMode`, not "no session"), and formally amend ruling 1. **Do not assume (b).** Note the C1 dependency: `tests/unit/learning-service.test.js:56,66,68,76,90,101` and `tests/unit/live-recording-links.test.jsx:34,41,47` use legacy `stu-*` fixture ids with no session, so option (a) requires a documented fixture-identity convention and test updates. No protected-file change is inherently required (`ownWorkspace.js` is untracked; the five mock services are not protected) — but if any proposed fix would touch a protected path, STOP and report the exact dependency before editing.
2. **Remediate F-01 / F-02 at the service boundary** in `src/services/mock/ownWorkspace.js` (and, if needed, its five consumers) so that unknown identifiers and invalid sessions are `invalid` and `requireStudentWorkspace()` throws `notFound('student')`, while **demo seats `stu-ananya` / `fac-snehasish` and the legacy fixture ids used by existing suites retain their seeded behaviour**. Verify all ten identity cases in §3.3 return no demo fixtures outside the explicitly authorized demo context.
3. **Add regression tests** covering: all ten identity cases; all five student routes; **direct service access with an arbitrary unknown id under a valid issued session**; no/expired/malformed/wrong-role session; `liveService.listUpcoming()` / `listRecordings()`, `courseService.listCourses()`, `questionService.listSamples()`, `examFlowService.syncAttempt()` and `facultyService.getDashboard()`; demo-seat unchanged assertions. Also close F-05: execute all three credential mutations against a real `QueryClient` and assert `getMutationCache().findAll({mutationKey: …})` is empty after explicit close, unmount, navigation-with-sheet-open and sign-out — not just `reset()`.
4. **Reconcile the acceptance record in a NEW addendum** (do **not** modify `VYUH_BATCH_3_COMPLETION_REPORT.md`, `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` or `VYUH_BATCH_3_1_REMEDIATION_REPORT.md`): correct §5/§7/§12/§18 claims (F-03), record F-10/F-11/F-12, and record the user's ruling from condition 1. Keep the late B3 reconciliation deviation on the record.
5. **Re-run all four mandated commands on the corrected tree** (`npm test`, `npm run build`, `npm run lint`, `npx oxlint src tests`), plus `git diff --check`, a full status/diff review, protected-hash re-verification, 33-alias re-count, credential-literal / credential-egress scan, and a fresh independent review. `npx playwright test --list` may be reported only as static collection.
6. **Browser verification (currently impossible here).** Provide Chromium under a new authorization, then execute the full 60-test Playwright suite including the corrected D-3 journey: real-browser axe on the three dialogs/sheets; keyboard tab/Escape/focus-trap; explicit clipboard write with no write on mount; real CSV download completion, filename and exact header/row equality; 1440/tablet/mobile layouts and the one-primary-per-view rule; zero console errors/warnings on the Admin and issued-student surfaces; session restore / cross-tab restore after suspend/lock/archive. Until executed, keep every one of these tagged `[UNVERIFIED]`.
7. **Then, and only then**, the user may explicitly accept Batch 3 and separately authorize Batch 4. Do not treat a passing unit suite, a passing `--list`, or this review as acceptance.

---

---

**STOP.**

No implementation. No remediation. No source or historical-report edit. No Git mutation (no commit, push, merge, PR, branch switch). No dependency, lockfile or browser install. No publish or deployment. No Batch 4. The only artifact produced is this new report; the three historical reports and all eight protected hashes are unchanged.

**Verdict: REJECT.** Presenting the verdict and waiting for the user's explicit decision. Final acceptance of Batch 3 + Batch 3.1 remains the user's decision.
