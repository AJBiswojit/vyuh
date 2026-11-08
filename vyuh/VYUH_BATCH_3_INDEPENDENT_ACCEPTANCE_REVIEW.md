# VYUH — Batch 3 Independent Acceptance Review

**Status:** Complete. STOP — awaiting user review.
**Date:** 2026-11-08 (UTC)
**Branch:** `arena/1763b46c-vyuh` (`active`), HEAD `ced54030c336bb1041454fd8780f56f423af19f8` — unchanged by this audit.
**Subject of review:** `VYUH_BATCH_3_COMPLETION_REPORT.md` and the Batch 3 working tree.
**Final recommendation:** **CONDITIONAL ACCEPT** (final acceptance and Batch 4 remain withheld).

---

## 0. Method, restrictions observed, and limits of this audit

This was a **strictly read-only** audit. All inspection used non-mutating commands: `git status`, `git diff`, `git diff --check`, `sha256sum`, `cat`/`sed`/`grep`, Python reads of source, and `node --check` (parse-only). **No source edit, no test edit, no formatting/cleanup, no Git mutation, no dependency install, no browser install attempt and no modification of the existing completion report was performed.** The only file created is this review.

Tree state was identical at the start and end of the audit: **49 modified tracked + 31 untracked**, `49 files changed, 2425 insertions(+), 510 deletions(-)`, `git diff --check` EXIT 0, no `D`/`R` entries, branch/HEAD unchanged.

**I did not re-execute `npm test`, `npm run build`, `npm run lint`, `npx oxlint` or `npx playwright test --list`** in this audit, because executing the build/test pipelines is not strictly read-only. Instead I read the preserved logs from the implementation phase (`/tmp/b3-FINAL-test.log`, `-build.log`, `-lint.log`, `-oxlint.log`, `/tmp/b3-playwright-list.log`) and independently verified the source and diffs. The recorded results are therefore **corroborated, not independently re-run**; see §15.

---

## 1. Verdict summary

| # | Requirement | Verdict |
|---|---|---|
| 1 | Verify U-1 through U-5 against source | **PARTIAL** — U-1, U-2, U-4, U-5 PASS; **U-3 FAIL** |
| 2 | Creation, authentication, temp credentials, reissue, suspend/lock/unlock/archive | **PASS** (one low-severity return-shape defect, D-2) |
| 3 | CSV imports create genuine loginable canonical accounts | **PASS** |
| 4 | New student/faculty workspace isolation and demo fixture preservation | **FAIL** — isolation incomplete (D-1); demo preservation **PASS** |
| 5 | Persistence rollback, audit attribution, React Query credential exposure | **PARTIAL** — rollback PASS, audit PASS, React Query **PARTIAL** (R-1) |
| 6 | All Batch 3 diffs vs approved §17.2/§17.3 file-impact map | **PARTIAL** — two type-only files outside the map; no protected runtime change |
| 7 | Reconcile §4 "six protected files claimed vs nine paths listed" | **PARTIAL** — documentation inconsistency confirmed; no code defect |
| 8 | Late document reconciliation deviation / unresolved scope conflict | **PARTIAL** — deviation disclosed and two fixes verified; two undisclosed scope deviations found |
| 9 | All 33 aliases and protected Batch 1/2 foundation intact | **PASS** |
| 10 | Reassess `SAFE_ACCOUNT_FIELDS` phone limitation and stale route comment | **PARTIAL** — phone limitation is wider than reported (D-2); stale comment confirmed |

---

## 2. U-1 through U-5 — verdicts and exact evidence

### U-1 — Credential CSV — **PASS**

`src/contracts/admin.js` exports `CREDENTIAL_CSV_COLUMNS` with the frozen order `instituteId, temporaryPassword, role, name, batchName` (keys **and** labels identical), `CREDENTIAL_CSV_FILE_NAME = 'vyuh-one-time-credentials.csv'`, and the verbatim `CREDENTIAL_SECURITY_NOTICE`. `src/features/admin/components/CredentialsSheet.jsx:58-74` `downloadCsv()` builds the CSV client-side with `csvFromColumns()` (`src/shared/lib/adminMath.js:340-347`) from the **current transient `rows` prop only**, uses a `Blob` + `URL.createObjectURL` + anchor, and never reads storage. `src/features/admin/pages/AdminImportPage.jsx:183` stores `setResult({ ...payload, credentials: undefined })`, so the wizard's result card never holds a value. `src/mock-data/importCsv.js:13-21` `IMPORT_FIELDS` still has exactly 7 columns and **no credential column** (diff is one line: the email hint, F-14). No `console.*`, `localStorage`, `sessionStorage`, `setQueryData`, URL or audit write of a credential exists in any added diff line (scanned). **Caveats:** the warning is a persistent notice on the sheet, not a per-click confirmation dialog; `csvFromColumns` has an unmitigated formula-injection/CR issue (R-2); the immediate `revokeObjectURL` needs browser verification (R-3).

### U-2 — Explicit per-value Copy — **PASS**

`CredentialsSheet.jsx:46-55` `copyValue()` writes only on an explicit user click of an `IconButton` with accessible labels `Copy Institute ID for {name}` / `Copy temporary password for {name}` (`:129`, `:140`). No `useEffect` auto-copy; no clipboard value in a toast, log or audit. The sheet text at `:101-105` states "the app cannot clear your clipboard or erase that file" — it never claims the OS clipboard is cleared. `CREDENTIAL_SECURITY_NOTICE` is rendered verbatim at `:98`. **Verification gap:** Gate 0 §10 C-5 asks for a jsdom clipboard stub test asserting no automatic write; `tests/unit/admin-accounts.test.jsx:364-388` asserts labels/buttons only, with no clipboard stub. Real-browser clipboard remains unverified (§14).

### U-3 — Honest empty workspaces — **FAIL (confirmed blocking defect D-1)**

**Implemented and passing:** `src/services/mock/faculty.js:141-153` `issuedFaculty()` / `isOwnFacultyWorkspace()` / `facultyName()`; gates at `:164` `composeBank`, `:320` `composeExams`, `:675-690` `getDashboard`, `:931-939` `listClasses`, `:1092-1106` `listRecordings`, `:1176-1195` `getAttendanceReport`, `:1235-1245` `listDoubts`, `:1247` `getDoubt`. `src/services/mock/students.js:41-53` `instituteStudent()` / `ownWorkspace()`, `:60-64` `batchFor()` (reconciles `bat-neet-13` via `adminBatches`), `:67-88` `resolveStudent()`; gates at `:125`, `:134`, `:149`, `:153`, `:163-190`, `:202-205`, `:217`, `:221`. Demo seats `fac-snehasish` / `stu-ananya` are provably untouched (`isEmpty()` is `studentId !== currentStudent.id`; `ownWorkspace()` resolves only `source === 'institute_issued'`). `tests/unit/admin-accounts.test.jsx:654-702` covers these.

**Confirmed defect D-1:** the student-facing **learning routes bypass every gate**. `src/features/learning/hooks/useLearning.js:8-10` `useLearningStudentId()` returns `state.user.id`, which for an issued student **is the Institute ID**. Those pages call `services.learning.*` directly:

| Route | Hook / page | Service | Ungated implementation |
|---|---|---|---|
| `/student/live` | `useLearning.js:13-14` → `LiveSchedulePage.jsx:29` | `learning.listLiveSessions` | `src/services/mock/learning.js:238-239` returns `liveSessions.map(...)` — all demo classes |
| `/student/recordings` | `useLearning.js:100-101` → `RecordingsPage.jsx:14` | `learning.listRecordings` | `learning.js:383` returns `recordings.map(...)` — all demo recordings |
| `/student/doubts` | `useLearning.js:140-141` → `DoubtsPage.jsx:14` | `learning.listDoubts` | `learning.js:442` returns `[...clone(doubtFixtures), ...]` |
| `/student/study-rooms` | `useLearning.js:159-160` → `StudyRoomsPage.jsx:12` | `learning.listStudyRooms` | `learning.js:488` returns `studyRooms.map(...)` |
| `/student/attendance` | `useLearning.js:96-97` → `AttendancePage.jsx:13-14` | `learning.getAttendance` | `learning.js:369-382` seeds the report with `clone(attendanceHistory)` — demo history |

`src/app/routes/AppRoutes.jsx:168-176` maps those routes, via `src/features/student/pages/{RecordingsPage,DoubtsPage,StudyRoomsPage,AttendancePage,LiveClassesPage}.jsx` wrappers, to the learning pages. A scan of `src/services/mock/{learning,live,examFlow,analysis,courses}.js` found **zero** `ownWorkspace` / `institute_issued` / `isOwnFacultyWorkspace` references. Gate 0 §17.2 authorised edits only to `students.js` / `faculty.js`, so the gates were placed on the wrong layer: `studentService.listDoubts()` and `studentService.listStudyRooms()` are gated, but the pages never call them. This directly violates binding U-3's "no demo classes … recordings … doubts … history" and makes the completion report §16 claim ("no demo classes, bank, recordings, assignments, doubts, attempts, reports, analysis, notifications or history") inaccurate. The test suite covers only `studentService` / `assessmentService` / `dashboardService` / `facultyService`, so the gap is untested.

**Latent extension:** `src/features/student/hooks/useStudentWorkspace.js:48-49` `useRecordings()` and `:111-112` `useUpcomingSessions()` call the global `services.live.listRecordings()` / `listUpcoming()` (`src/services/mock/live.js:6-12`) with no seat scoping at all. These two hooks currently have no consumer (only their definitions are found in `src/`), so the exposure is latent, not reachable. Deep links to `analysisService.getAnalysis()` / `examFlowService` / `coursesService` likewise have no own-workspace gate (R-6).

**Demo fixture preservation: PASS.** `src/mock-data/{users,institution,batches,batchesAdmin}.js` and `src/mock-data/accounts.js` have 0 diff lines / unchanged hashes (§10). `tests/unit/admin-accounts.test.jsx:671-676, 699-702` assert the demo seats keep their fixtures after creating real accounts.

### U-4 — Editable fields, immutable identity, terminal archive — **PASS (with D-2)**

`src/services/mock/admin.js:1553-1587` `editAccount()` accepts only `name`, `email`, `phone`, `rollNumber`; forged `instituteId` / `source` / `role` are ignored, and `assertIdentityAvailable()` (`:247-268`) rejects duplicate email/roll against the merged roster, registry and demo seats. `moveStudentBatch()` (`:1588-1617`) is a dedicated move with a `user.batch.move` audit entry and no history rewrite. `applyAccountOperation()` (`:1489-1552`) requires `requiredReason()` (`:282-288`), `archive` requires `acknowledged === true` (`:1501-1503`), `archived` is terminal (`:1504-1506`), and `transitionAccountStatus()` (`src/mock-data/accounts.js:326-336`) never deletes a record — `issuedInstituteIds` is permanent (`accounts.js:247-293`). Login is blocked for `suspended`/`archived`/`locked` (`src/services/mock/auth.js:367-377`), and session restore is blocked by `setAccountEligibilityCheck()` (`auth.js:329-335`) which returns `record.status === 'active'`, enforced at `src/shared/lib/sessionPersistence.js:54-55`. **One low-severity defect:** see D-2 in §11.

### U-5 — Additive auth recovery helper — **PASS**

`src/services/mock/auth.js:293-322` `issueTemporaryPassword()` is the only new behaviour in that file: it validates a non-empty reason, resolves the canonical record, rejects demo/`archived`, generates a fresh value, calls the **private** `writePassword(record.key, temporaryPassword, { clearAttempts: false })` (`:177-183`), sets `mustChangePassword:true` in both `vyuh.mock.auth.v1` and the registry, resets `temporaryPasswordIssuedAt` / `credentialDelivery:'pending'`, and returns the credential once in memory. `src/services/mock/admin.js:1618-1646` `reissueTemporaryPassword()` contains **no digest/salt logic** — it delegates with `issueTemporaryPassword({ targetAccountKey, reason, actorId })`. No status or lockout change. `login`, `changePasswordWithSetup`, `requestReset`, `resetPassword`, `unlockDemo` and the eligibility check are unchanged. `tests/unit/admin-accounts.test.jsx:501-530` proves old-secret rejection, new-secret validity, setup-required-again, lockout survival, and that only the explicit Admin `unlock` clears `db.attempts`.

---

## 3. Creation, authentication and lifecycle inspection — **PASS**

- **Creation** `admin.js:1413-1468`: rejects `role:'admin'`, enforces `assertYearConfigured()` for students, validates email/roll **before** allocating any ID, then delegates to `provisionInstituteAccount()` (`auth.js:225-274`) which rejects admin provisioning, allocates via `issueInstituteId()` and stores only salt+digest. Returns `{ account, credentials, auditId }`.
- **Authentication** `auth.js:342-379`: one identifier resolver (`normalizeAccountKey`), status checked **after** a correct credential (no ID enumeration), mandatory-setup gate from `guards.jsx` `RequirePasswordChange`. `tests/unit/admin-accounts.test.jsx:531-539` covers the full issued-account login → setup → old password rejected path.
- **Suspend / reactivate / lock / unlock / archive** `admin.js:1489-1552`: `spec.from` respects `ALLOWED_TRANSITIONS` (`accounts.js:72-78`) — `lock` accepts only `active` (the earlier illegal `suspended→locked` offer was removed), `unlock` clears `db.attempts` via `clearFailedAttempts()` (`:178-189`) and lifts a `locked` status, `archive` is terminal. `tests/unit/admin-accounts.test.jsx:421-489` covers the matrix, reason enforcement and sign-in blocking.
- **Reissue** — see U-5.
- **Minor metadata nit:** for `unlock` on an already-`active` account the audit summary reads `Status: Active → Active` (`admin.js:1545`), which is misleading but harmless.

---

## 4. CSV imports create genuine loginable accounts — **PASS**

`src/services/mock/admin.js:709-800` `commitImport()` calls `validateImport()` with `users: roster(store)` and `batches: batches(store)`, so duplicates are checked against the **merged** ledger at preview time (`previewImport`, `:688-707`) and against the registry again in pass 1 (`assertIdentityAvailable`, plus `seenEmails`/`seenRolls` for duplicates inside the same file). It rejects `role:'admin'` upstream (`src/shared/lib/adminMath.js:210-211`), blocks student rows when `year` is unconfigured, and then calls `provisionInstituteAccount()` per row — **no `invited` placeholder rows, no `store.createdUsers` writes**. Each row gets a real Institute ID, salt+digest and a transient credential; one `user.import` audit entry is written. `tests/unit/admin-accounts.test.jsx:557-570` commits two rows, asserts `created:2`, `751` People rows, no `stu-imp-*` invited rows, and **logs in with each issued Institute ID + temporary password**, asserting `mustChangePassword === true`. `tests/unit/admin-accounts.test.jsx:581-588` covers a registry duplicate. `importCsv.js` retains all 7 columns and both sample sheets. **PASS.**

---

## 5. Persistence rollback, audit attribution, React Query credential exposure

### Rollback — **PASS (within the disclosed limitation)**

`admin.js:192-231` `snapshotAccountStores()` / `restoreAccountStores()` / `setAccountWriteProbe()` / `withAccountSnapshot()` snapshot exactly `vyuh.mock.accounts.v1`, `vyuh.mock.auth.v1`, `vyuh.mock.admin.v1` and restore their exact prior bytes on any rejection. Every `createUser`, `commitImport`, `applyAccountOperation`, `editAccount`, `moveStudentBatch` and `reissueTemporaryPassword` call goes through it. `tests/unit/admin-accounts.test.jsx:309-316, 572-579` inject failures at `provisioned` and `provision-2` and assert byte-identical stores and no burned IDs. **Limitation (already disclosed, still real):** compensating local writes, not ACID — a process kill or a concurrent second tab is outside the guarantee. `markCredentialsShown` and `configureInstituteIds` are metadata/config-only writes intentionally outside the snapshot.

### Audit attribution — **PASS**

`admin.js:400-424` `recordAudit()` derives `who = actor ?? adminActor()`; `adminActor()` (`:58-64`) reads `readPersistedSession()` and returns the session Admin when `role === 'admin'`, falling back to `adminProfile` (`src/mock-data/institution.js:19-29`) otherwise. `requireReason` is enforced service-side. `note` and `meta.reason` carry the reason; `meta` never carries a credential. `src/mock-data/auditLog.js` diff adds exactly 10 keys and **touches no seeded entry** (`auditSeed` remains 20); `AdminAuditPage.jsx` diff adds exactly 10 tones. `tests/unit/admin-accounts.test.jsx:248-256, 595-611, 613-649` assert session actor, one visible entry per mutation, and no credential in any audit item. **Residual risk R-4:** a service call made with a non-Admin session is attributed to the seeded office seat rather than rejected; admin routes are guarded, so this is low severity but it is not a role check.

### React Query credential exposure — **PARTIAL (R-1)**

No `admin.credentials` query key exists (`src/app/providers/queryClient.js:136-138` adds only `instituteIdConfig`). No `setQueryData` with credentials, no credential in any `queryKey`. `src/features/admin/hooks/useAdminOps.js:141-230` nine hooks invalidate `['admin', adminId]`, `['faculty']`, `['students']`, `['batches']`; none seeds a mutation result into the cache. Mutation results are cleared at close: `CreateUserDialog.jsx:66-71` `create.reset()` on success, `AdminImportPage.jsx:669-676` `commit.reset()` on sheet close, `AccountRowActions.jsx:64-71` `reissue.reset()` via `close()`; these are pinned by `tests/unit/admin-accounts.test.jsx:389-395`.

**Confirmed residual (R-1):** Gate 0 §10 C-2 requires `mutation.reset()` "on close/**unmount**". There is no unmount cleanup anywhere. `useMutation` results live in the TanStack Query `MutationCache` as `mutation.state.data`; `queryClient.js:19` configures mutations with only `retry: 0`, so the default `gcTime` (5 minutes) applies. If the Admin navigates away (or the wizard unmounts) **while the credentials sheet is still open**, `commit.data` / `create.data` / `reissue.data` retain plaintext temporary passwords in memory until GC. `AdminUsersPage.jsx:266` `onClose` only does `setCredentials([])`. This is a time-limited in-memory exposure, not a persistence leak, but "no credentials in cache" is not literally true for that window. No test covers it.

---

## 6. Batch 3 diffs vs the approved file-impact map (Gate 0 §17.2 / §17.3)

I classified every tracked diff by added-line markers. Batch 3 touched these tracked files: `contracts/admin.js`, `contracts/auth.js`, `contracts/user.js`, `services/types.js`, `services/api/index.js`, `services/mock/admin.js`, `services/mock/auth.js`, `services/mock/students.js`, `services/mock/faculty.js`, `mock-data/auditLog.js`, `mock-data/importCsv.js`, `app/providers/queryClient.js`, `features/admin/hooks/useAdminOps.js`, `features/admin/pages/{AdminUsersPage,AdminImportPage,AdminAuditPage}.jsx`, `tests/unit/admin-console.test.jsx`; plus untracked `tests/unit/v2-routes.test.jsx`, 5 new components, `tests/unit/admin-accounts.test.jsx`, `tests/e2e/admin-accounts.spec.js`, and the Batch 3 report. `mock-data/index.js` contains only Batch 1/2 additions (no Batch 3 marker).

**§17.1 (new files) — PASS.** All 7 permitted new files exist; none of the explicitly forbidden files (`PasswordRequestsTab.jsx`, consent changes, Admin-creation component, backend/API/database file) exists. `grep` over `src/` found no `listPasswordRequests`, `resolvePasswordRequest`, `PasswordRequestsTab` or `passwordRequests` state.

**§17.3 (must remain unchanged) — PASS for runtime, PARTIAL for type-only files.** Verified 0 diff lines for `users.js`, `institution.js`, `batchesAdmin.js`, `AdminLayout.jsx`, `styles/tokens.css`, `src/index.css`, `scripts/check-architecture.mjs`, `package.json`, `package-lock.json`, and `batches.js` (the `bat-neet-13` insertion was fully reverted). Untracked protected files are byte-identical to the recorded hashes (§10). The six protected tracked files with diffs contain **only Batch 2 user changes** — a scan of all added and removed lines for `Batch 3`, `BATCH 3`, `issueTemporaryPassword`, `user.create`, `CredentialsSheet`, `ownWorkspace`, `adminActor` returned **0 matches** in each.

**Two deviations (documentation-level, not functional):**

- **D-4:** `src/contracts/user.js` (added JSDoc `@property {string|null} [phone]` — "Batch 3 additive contact metadata") and `src/contracts/auth.js` (added `@typedef {Object} ReissuedCredential` — "Batch 3 (U-5)") are **not listed in §17.2**, and §17.3 says "every existing file not listed in §17.2" must remain unchanged. Both are comment-only JSDoc typedefs with no runtime effect, and the higher-authority Batch 3 directive's WS1 explicitly requires "additive contracts" — under the accepted precedence `#3 > Gate 0` they are authorised. **However, the completion report does not disclose them**: §3 says "Every subsequent edit was checked against the file-by-file impact map in §17.2/§17.3" and "No other discrepancy was found", and §24 lists them without a flag. This is an unreconciled scope-documentation deviation.
- **D-5:** `src/shared/lib/adminMath.js` and `src/features/admin/hooks/useAdmin.js` **are** listed in §17.2 as "would be modified" but were left untouched. This is benign and arguably better (fewer files touched): `validateImport()` receives the merged duplicate source via `admin.js:688-707` `users: roster(store)` without changing `adminMath.js`; tab-awareness is achieved by `AdminUsersPage.jsx:onTab()` mapping the tab to the `role` field of the `query` already keyed in `useAdmin.js:43`, with `placeholderData` preserved at `:46`. Neither file is §17.3-protected, so leaving them unchanged violates no constraint.

**Minor:** §17.2 permits adding "only a `/a/people` query-preservation assertion" to `v2-routes.test.jsx`; the added test also asserts the `User management` heading. One extra assertion, no deletion.

**Verdict: PARTIAL.** No protected behaviour was changed; two type-only files fall outside the map and were not disclosed; two map-listed files were intentionally left untouched.

---

## 7. §4 reporting inconsistency — six claimed vs nine listed — **PARTIAL (documentation only)**

The completion report §4 states:

> "Six protected tracked files (`AppRoutes.jsx`, `guards.jsx`, `services/authSchemas.js`, `shared/lib/roles.js`, `shared/lib/sessionPersistence.js`, `shared/store/sessionStore.js`, `styles/tokens.css`, `src/index.css`, `scripts/check-architecture.mjs`) do carry diffs **from HEAD** …"

The parenthetical enumerates **nine** paths. Independent `git diff -- <path> | wc -l` on the correct Git-root-relative paths gives:

| Path | Diff lines |
|---|---|
| `vyuh/src/app/routes/AppRoutes.jsx` | 249 |
| `vyuh/src/app/routes/guards.jsx` | 41 |
| `vyuh/src/services/authSchemas.js` | 104 |
| `vyuh/src/shared/lib/roles.js` | 13 |
| `vyuh/src/shared/lib/sessionPersistence.js` | 56 |
| `vyuh/src/shared/store/sessionStore.js` | 54 |
| `vyuh/src/styles/tokens.css` | **0** |
| `vyuh/src/index.css` | **0** |
| `vyuh/scripts/check-architecture.mjs` | **0** |

All nine files exist. **Exactly six carry diffs; three have 0.** The numeral "six" is therefore correct for the set of files *with diffs*, but the sentence wrongly includes three zero-diff paths in the "do carry diffs" set. The correct statement is: "Six of the nine listed protected paths carry pre-existing Batch 2 diffs from HEAD (preserved verbatim, zero Batch 3 markers); `tokens.css`, `index.css` and `check-architecture.mjs` have zero diff lines." This is a **reporting/enumeration inconsistency, not a code defect** — no protected file was written by Batch 3. Note also that §17.3 listing these as "must remain unchanged" refers to Batch 3 edits relative to the authorised baseline, not byte-identity with `HEAD`; the six diffs are the user's Batch 2 work that had to be preserved.

---

## 8. Late document reconciliation deviation and scope conflicts — **PARTIAL**

**Deviation confirmed and honestly disclosed** in completion report §3: mandatory post-authorization reconciliation of the four governing documents was performed **after** WS1/continuation edits instead of before. This is a real process non-compliance; the report does not conceal it. I re-read Gate 0 §§8–19, §17, the Rev2 plan, B2 report and blueprint sections during this audit.

**The two fixes it produced are verified:**
1. `src/mock-data/batches.js` — `git diff` is **0 lines**; `bat-neet-13` is resolved from `adminBatches` via the barrel in `students.js:60-64` `batchFor()`. §17.3 satisfied.
2. `src/mock-data/importCsv.js:16` — email hint now reads "Contact address. Must be unique. Sign-in uses the Institute ID issued at creation." §14 F-14 satisfied, no credential column added.

**No behavioural scope conflict remains**, but **two documentation-level conflicts do**:
- §3 claims "Every subsequent edit was checked against the file-by-file impact map in §17.2/§17.3" and "No other discrepancy was found in the sections read" — yet §17.2/§17.3 were not fully reconciled against the final diff (D-4, D-5). Full line-by-line reconciliation was explicitly not claimed.
- The stale `v2RouteTable.js:58` note and the §4 nine-vs-six error are unresolved documentation inconsistencies.

**Verdict: PARTIAL.** The late reconciliation is disclosed and its two concrete corrections hold; the claim of complete map compliance does not.

---

## 9. All 33 aliases and the protected Batch 1/2 foundation — **PASS**

- `src/app/routes/v2RouteTable.js` contains exactly **33** `{ path: '/s|/f|a…', to: … }` alias entries (independent regex count). `V2_NAMESPACES` remains `['/s','/f','/a']`. `/a/people` → `/admin/users` and `/a/people/import` → `/admin/users/import` are intact (`:58-59`). `tests/unit/v2-routes.test.jsx` `it()` count is 11 (10 original + 1 added `/a/people?tab=faculty&status=locked#row-4` assertion); no assertion was removed. `guard-matrix.test.jsx` and `registration-retirement.test.jsx` have **0** "Batch 3" markers — untouched by Batch 3.
- Protected untracked file hashes match the completion report §4 exactly:

| File | SHA-256 |
|---|---|
| `src/mock-data/accounts.js` | `d02465726586a2156d62f3da1a1c578aaa7ef7aa1e590a3050fa3850654fc30b` |
| `src/app/routes/v2RouteTable.js` | `98e9fee47099c919b3f72c4414f657798e5e1565358fb713da3279832855e257` |
| `src/app/routes/v2Aliases.jsx` | `01a0067b801070c25484d0ed24b81dd9eb2ae0aba748667eea801502eca97200` |
| `src/features/auth/pages/SetupAccountPage.jsx` | `b5ad26f7b1bcae14e61f623d43f3e56c197e61cab04c266efab79c81b5407a21` |
| `src/mock-data/batches.js` | `f788603cc42d92ef4fe150de0eec9c78729f9d7f8fffcf7d5ec7ee9eb9c7573d` |

- Additional 0-diff confirmations: `src/mock-data/users.js`, `institution.js`, `batchesAdmin.js`, `src/app/layouts/AdminLayout.jsx`, `styles/tokens.css`, `src/index.css`, `scripts/check-architecture.mjs`, `package.json`, `package-lock.json`.
- `auditSeed` unchanged (diff adds only 10 `AUDIT_ACTIONS` keys); `PasswordRequest` remains typedef-only; G5 consent / Password Requests queue are absent.
- `tests/unit/admin-console.test.jsx` C1 change is **one setup line** (`configureInstituteIds({ year: '99' })` as test fixture) plus a comment; the 720 / 26 / 753 / "CSV import committed" assertions and all 8 cases are unchanged. **PASS.**

---

## 10. `SAFE_ACCOUNT_FIELDS` phone limitation and stale route comment — **PARTIAL**

### Phone limitation is broader than the report claims — **confirmed defect D-2**

`src/mock-data/accounts.js:81-86` `SAFE_ACCOUNT_FIELDS` omits `phone`. `toPeopleRow()` (`admin.js:76-95`) reads `phone: record.phone ?? ''` from a **raw** registry record, so `listUsers()` (which maps `roster()` → raw `loadAccountsDb().accounts`) does show the edited phone; the report §23.6 is correct for that surface, and `tests/unit/admin-accounts.test.jsx:457-479` asserts it.

**But** `transitionAccountStatus()` (`accounts.js:326-336`) returns `account: projectSafeAccount(updated)`, which **drops `phone`**. `applyAccountOperation()` (`admin.js:1489-1552`) passes that projection straight into `toPeopleRow(updated)` for `suspend`, `reactivate`, `lock`, `archive` and `unlock`-from-`locked`. Therefore **`applyAccountOperation().account.phone` is always `''`**, even though the stored record retains the value. By contrast `createUser`, `editAccount`, `moveStudentBatch` and `reissueTemporaryPassword` use raw rows and preserve it. The UI only reads `result.account.status` (`AccountRowActions.jsx:131`), so there is no visible user-facing regression — but the `AccountOperationResult.account` shape is inconsistent and incomplete, and no test covers it. **The report's reassessment ("§8 controls `accounts.js`; no registry rewrite; phone is surfaced via the canonical People row") is incomplete**, not wrong.

### Stale route comment — **confirmed documentation inconsistency D-6**

`src/app/routes/v2RouteTable.js:58` still says *"People Management tabs/Create User are Batch 3; the users ledger is the current surface."* and `:15` says *"…people -> Batch 3/9"*. Both are now stale. The file is §17.3-protected and was correctly left untouched; no functional impact. It should be corrected only under a new explicit directive.

---

## 11. Confirmed defects vs documentation inconsistencies

### Confirmed defects (code / behaviour)

| ID | Severity | Evidence | Effect |
|---|---|---|---|
| **D-1** | **High — binding U-3 violation** | `useLearning.js:13,97,100,140,159`; `learning.js:238,369,383,442,488`; `AppRoutes.jsx:168-176`; gates only in `students.js:49` / `faculty.js:147` | Institute-issued students see demo live classes, recordings, doubts, study rooms and attendance history on five real routes. Untested. |
| **D-2** | Low | `accounts.js:81-86,326-336` + `admin.js:76-95,1489-1552` | `applyAccountOperation().account.phone` is `''` after any status operation; inconsistent result shape. No visible regression. |
| **D-3** | Low (prospective spec, unexecuted) | `tests/e2e/admin-accounts.spec.js:86` `page.goto('/login')` with the Admin session still active and **no logout**; `guards.jsx` `GuestOnly()` redirects any signed-in user away from `/login` | The `a created student signs in …` case cannot find `#Email address` in a real browser. Must be fixed before the E2E suite is trusted. |

### Documentation inconsistencies (no code defect)

| ID | Location | Reconciliation |
|---|---|---|
| **I-1** | Completion report §4 | "Six protected tracked files" followed by nine paths; exactly six have diffs, three have 0. Enumeration error only (§7). |
| **I-2** | Completion report §3 / §24 vs Gate 0 §17.2/§17.3 | `contracts/user.js` and `contracts/auth.js` received type-only Batch 3 JSDoc outside §17.2; undisclosed. Authorised by higher-precedence WS1, but the claim of full map compliance is inaccurate (§6, D-4). |
| **I-3** | Completion report §16 / §19 | "no demo classes … recordings … history" is overstated; U-3 test coverage does not include `learningService` (D-1). |
| **I-4** | `v2RouteTable.js:15,58` | Stale "Batch 3" provisional comments in a correctly-protected file (§10, D-6). |
| **I-5** | `v2-routes.test.jsx` vs §17.2 | One extra heading assertion beyond the permitted "only a `/a/people` query-preservation assertion". |
| **I-6** | Completion report §4 / §24 | `adminMath.js` and `useAdmin.js` are listed in §17.2 as "would be modified" but were intentionally left untouched; functionally satisfied elsewhere (§6, D-5). |

---

## 12. Security and regression risks

| ID | Risk | Evidence | Severity |
|---|---|---|---|
| **R-1** | Credentials retained in the `MutationCache` for up to the default `gcTime` if the sheet is never closed (no unmount cleanup) | `queryClient.js:9-20` (mutations: `retry:0` only); `AdminImportPage.jsx:669-676`; `AdminUsersPage.jsx:266`; Gate 0 §10 C-2 "close/**unmount**" | Medium — time-limited in-memory plaintext |
| **R-2** | CSV formula injection / incomplete escaping in the U-1 export | `adminMath.js:340-347` escapes `"` `,` `\n` but not `\r`, and does not neutralise `=`, `+`, `-`, `@` prefixes; exported `name`/`batchName` originate from uploaded CSV | Medium — spreadsheet execution on open |
| **R-3** | `URL.revokeObjectURL(url)` fires synchronously after `link.click()` | `CredentialsSheet.jsx:62-69` | Low/Medium — download may abort in some browsers; requires real-browser check |
| **R-4** | Non-Admin session writes are attributed to the seeded office seat instead of rejected | `admin.js:58-64` `adminActor()` fallback to `adminProfile` | Low — admin routes are guarded |
| **R-5** | Fabricated attendance percentages for **real** issued students in the Admin batch detail | `admin.js:838-848` `attendancePercent = 62 + ((index * 7) % 37)` over `roster(store)` members | Low — pre-existing behaviour now applied to real accounts; data-honesty risk |
| **R-6** | Deep-link exposure of demo exams/analysis/attempts | `examFlow.js`, `analysis.js`, `courses.js` have 0 own-workspace gates; `analysis.js:58-65` `candidate()` resolves issued IDs | Low/Medium — not linked from `listExams()` but reachable by URL |
| **R-7** | Two `variant="primary"` buttons co-visible when a dialog is open (page "Create account" + `CreateUserDialog` / `AccountRowActions` Confirm) | `AdminUsersPage.jsx:118`, `CreateUserDialog.jsx:123`, `AccountRowActions.jsx:230`; architecture rule is **per-file** (`scripts/check-architecture.mjs:131-140`) so lint passes | Low — design-rule interpretation, unverified visually |
| **R-8** | `useRecordings()` / `useUpcomingSessions()` call global `services.live.*` with no seat scoping | `useStudentWorkspace.js:48-49,111-112`; `live.js:6-12`; currently no consumers | Latent |
| **R-9** | Compensating rollback over `localStorage` is not ACID; cross-tab / process-kill partial writes | `admin.js:192-231` | Low — already disclosed |
| **R-10** | Salted SHA-256 is a prototype digest, not a KDF | `auth.js:140-143`, `accounts.js:54-63` | Accepted prototype limitation |
| **R-11** | No jsdom clipboard stub test and no axe-on-dialog/sheet test | `admin-accounts.test.jsx:364-395` vs Gate 0 §10 C-1/C-5 | Low — verification gap |
| **R-12** | `simulate()` `structuredClone`s the credential result, creating an extra in-memory copy | `latency.js:92-95` (Gate 0 RK-18) | Low — cleared on close, subject to R-1 |

**Positive security findings:** no `revealPassword` / `getPlaintext` / credential retrieval API; no `admin.credentials` query key; no `console.*` of a credential; no `localStorage`/`sessionStorage` write of a value; no credential in audit `note`/`meta`; no credential in URL or analytics; all 12-character generated-password literal scans over the diff and the 8 new files returned **0** matches; `PasswordRequest` remains typedef-only; G5 consent and the Password Requests queue are absent; all 15 original audit actions and 20 seeded entries preserved.

---

## 13. Remaining browser verification requirements (none executed here)

Chromium is **still absent**: `~/.cache/ms-playwright` missing, no `chromium`/`chrome`/`headless_shell` binary, `PLAYWRIGHT_BROWSERS_PATH` unset, Playwright `1.65.0`. Two historical `npx playwright install chromium` attempts failed with `ECONNRESET`; **no install was attempted in this audit**. `npx playwright test --list` (60 tests in 8 files) is static collection only. No browser console, real viewport, clipboard, download, media/camera, cross-tab or real-browser axe result exists.

Before final acceptance, in an environment with a browser:

1. **Fix D-3 first**, then run the full Playwright suite — all 60 tests including the 4 `admin-accounts.spec.js` cases — and the 56 pre-existing cases.
2. **U-3 regression (D-1):** after remediation, sign in as an institute-issued student and verify `/student/live`, `/student/recordings`, `/student/doubts`, `/student/study-rooms`, `/student/attendance` all render honest empty states; verify the demo student is unchanged.
3. **Real-browser axe** on `CreateUserDialog`, `CredentialsSheet` and the `AccountRowActions` dialog (Gate 0 C-1), plus keyboard tab/Escape/focus-trap behaviour.
4. **Clipboard:** real `navigator.clipboard.writeText` on an explicit click, assert **no** write on mount, and verify no clipboard value appears in logs/audit (C-5 / U-2).
5. **CSV download:** confirm the file is actually written despite the immediate `revokeObjectURL`, verify `vyuh-one-time-credentials.csv`, the exact header/row equality, and that the app does not erase it (U-1 / R-3).
6. **Credential lifecycle:** Escape/scrim close of the sheet triggers `reset()`; no credential in React Query devtools / `MutationCache`, `localStorage`, `vyuh.session`, URL or history after close **and after navigating away with the sheet open** (R-1 / C-2); re-opening is impossible and the `•••••••• Shown once` badge renders.
7. **Responsive/visual:** 1440 / tablet / mobile widths for the two tabs, `InstituteIdConfigPanel`, the credentials table overflow, and the "one filled ember primary per view" rule with a dialog open (R-7).
8. **End-to-end journey:** create → copy/download → close → login with Institute ID → forced setup → dashboard → suspend/reactivate/lock/unlock/archive → audit ledger; and CSV import → login → setup.
9. **Session restore:** after suspend/lock/archive, reload and cross-tab restore must be blocked (real browser).
10. **Console:** zero errors/warnings on `/admin/users`, `/admin/users/import`, and the created student/faculty workspaces.

---

## 14. Verification evidence read (corroborated, not re-run)

| Command | Recorded result | Source |
|---|---|---|
| `npm test` | 25/25 files, **314/314 tests**, 68.84s | `/tmp/b3-FINAL-test.log` |
| `npm run build` | **3303 modules**, built in 2.62s | `/tmp/b3-FINAL-build.log` |
| `npm run lint` | "Architecture check passed: 324 files, 323 colour-free, no boundary or token violations." | `/tmp/b3-FINAL-lint.log` |
| `npx oxlint src tests` | **38 warnings / 0 errors** on 356 files / 104 rules | `/tmp/b3-FINAL-oxlint.log` |
| `npx playwright test --list` | **60 tests in 8 files** (static only) | `/tmp/b3-playwright-list.log` |
| `git diff --check` | EXIT 0 (re-run read-only here) | this audit |
| `node --check` on every changed tracked `.js` | all parse cleanly (`.jsx` is not parseable by Node; build log covers it) | this audit |

No generated artifact, dependency or lockfile change was found; `dist/` is gitignored (`vyuh/.gitignore:11`).

---

## 15. Final recommendation — **CONDITIONAL ACCEPT**

**ACCEPT is not warranted:** one confirmed, binding defect remains (D-1: issued students can see demo classes, recordings, doubts, study rooms and attendance history on five live routes), and both the completion report §16 and the U-3 test coverage overstate isolation. The §4 six-vs-nine error, the undisclosed §17.2 deviations (D-4/D-5), the incomplete phone reassessment (D-2), the stale route comments (D-6), the broken prospective E2E case (D-3), and the unmount credential-cache gap (R-1) also require resolution. No browser verification exists.

**REJECT is disproportionate:** the canonical-ledger bridge, ID configuration, create/import provisioning, one-time credentials, lifecycle matrix, out-of-band recovery, audit vocabulary/attribution, rollback, facade parity, C1 discipline, 33 aliases and the entire protected Batch 1/2 foundation are all correct, additive and well covered by 51 focused tests; all four mandated commands pass on the recorded final state; and no Git mutation, dependency change or protected-runtime edit occurred.

**CONDITIONAL ACCEPT**, with final acceptance and Batch 4 explicitly withheld until — under a **new explicit directive** (this audit's restrictions forbid edits) — all of the following are satisfied and re-verified:

1. **D-1 fixed** at the correct layer (`learningService`/`liveService`, or a single shared own-workspace gate consulted by those services), with new tests asserting empty states for issued students on `/student/live`, `/student/recordings`, `/student/doubts`, `/student/study-rooms`, `/student/attendance`, plus deep-link `analysis`/`examFlow` surfaces, and unchanged demo seats.
2. **D-2 fixed** (either return a raw row from `applyAccountOperation`, or explicitly document/derive the phone field) with a shape-consistency test; and **R-1 fixed** with unmount cleanup / `reset()` on navigation.
3. **D-3 fixed** in the prospective E2E spec and the full browser suite executed with Chromium, including §13 items 2–10 and a real-browser axe pass.
4. **Documentation reconciled** in a separate amendment or addendum (the existing `VYUH_BATCH_3_COMPLETION_REPORT.md` must not be modified under this audit's restrictions): correct §4's six-vs-nine enumeration, disclose the two out-of-map type-only files and the two §17.2-listed-but-untouched files, correct §16's U-3 claim, and record the stale `v2RouteTable.js` comments.
5. **R-2 / R-3 addressed or explicitly risk-accepted** (CSV escaping/formula neutralisation; download completion timing).
6. **All four mandated commands re-run** on the remediated tree, with `git diff --check`, protected-file diff, credential-literal scan and a full status/diff review; then a fresh independent review.

The late document-reconciliation deviation (§8) is a disclosed, non-recoverable process non-compliance; it does not by itself block acceptance, but it must remain on the record.

**STOP.** No file other than `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` was created; no source, test, report or Git state was changed. Awaiting your review and any further explicit authorization.
