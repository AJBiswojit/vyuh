# VYUH — BATCH 3.1 ACCEPTANCE REMEDIATION REPORT

**Status:** implementation complete; verification executed; **final acceptance withheld — user's decision**.
**Branch:** `arena/1763b46c-vyuh` (active). **HEAD:** `ced54030c336bb1041454fd8780f56f423af19f8` (unchanged).
**Date (UTC):** 2026-11-08. **Final verification run:** 2026-11-08T10:46:08Z.
**Artifact:** this file is a NEW, separate addendum. `VYUH_BATCH_3_COMPLETION_REPORT.md` and `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` were **not modified**.

---

## 0. Method, restrictions observed, and evidence taxonomy

This report responds to the user's `VYUH — BATCH 3.1 ACCEPTANCE REMEDIATION DIRECTIVE` and the explicit authorization: *"I now explicitly authorize Batch 3.1 implementation. Begin with the fresh read-only baseline and reconciliation of all six governing documents before the first source edit."*

Observed restrictions:

* A fresh read-only baseline and a reconciliation of **all six** governing documents were completed **before the first source edit** (§3). This is in contrast to the belated Batch 3 reconciliation, which remains a permanent, disclosed process non-compliance (§2).
* No commit, push, merge, pull request, branch switch, tag, release, publish or deployment was performed. No Git state was mutated.
* No dependency installation; `package.json` and `package-lock.json` have **0 diff lines**. `node_modules` was not reinstalled.
* No browser installation was attempted. Chromium remains absent (§16).
* No protected file was modified (§4). No STOP condition was triggered.
* No generated artifact was committed; `dist/` remains gitignored.
* No credential value was persisted by the assistant; no plaintext temporary password appears in any source, test, report or diff (§17).
* Only Batch 3.1 scope was executed. **Batch 4 was not started and is not authorized.**

**Evidence taxonomy used throughout this report** — every claim is tagged with one of:

| Tag | Meaning |
|---|---|
| **[ORIG]** | Evidence produced by the original Batch 1/2/3 implementation (read from the workspace or from the historical completion report). Not re-executed here. |
| **[AUDIT]** | Read-only finding from `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` (§§1–15). Not re-executed as an independent audit here; used as the defect catalogue. |
| **[REM]** | NEW evidence produced by Batch 3.1 remediation: source diff, newly added focused tests, or a command re-run on the remediated tree. |
| **[UNVERIFIED]** | A claim that has NOT been established in this environment (browser, device, visual, OS clipboard, download, real-browser axe, cross-tab, media/camera). |
| **[LIMIT]** | A known remaining limitation or residual risk carried forward. |

No `[UNVERIFIED]` result is ever presented as a pass. The user's six conditions from the independent review §15 are addressed in §§6–16 and §18, with the browser-dependent ones explicitly left `[UNVERIFIED]`.

---

## 1. Executive summary and final recommendation

Batch 3.1 resolved the one **binding P0 defect** (D-1, U-3 student-workspace isolation) at the correct service boundary, and the second P0 finding (R-1, credential retention in the TanStack `MutationCache`). All P1 and P2 findings assigned to Batch 3.1 were remediated with new focused tests. **All four mandated commands pass on the final tree**: `npm test` 27 files / **365 tests** EXIT 0; `npm run build` 3305 modules EXIT 0; `npm run lint` "326 files, 325 colour-free, no boundary or token violations" EXIT 0; `npx oxlint src tests` **38 warnings / 0 errors** on 360 files / 104 rules EXIT 0 (identical to the pre-remediation warning count). `git diff --check` EXIT 0.

**Recommendation: CONDITIONAL ACCEPT of Batch 3.1 remediation.** Final acceptance of Batch 3, and any Batch 4, remain **withheld and are the user's decision**. This report must not be read as an acceptance of Batch 3: it records that one historical blocking defect has been fixed and that browser verification is still entirely absent. See §18 for the complete limitation list and the explicit STOP.

---

## 2. Authority, precedence, and six-document reconciliation

**Binding authority order** (Batch 3.1 §1 supersedes the earlier order):

1. Explicit user decisions
2. Approved Batch 2 decisions / implementation
3. Approved Batch 3 decisions / implementation directive
4. This Batch 3.1 remediation directive
5. Independent acceptance review findings
6. Gate 0 findings
7. Non-conflicting blueprint

Six governing documents were read and reconciled **before the first source edit [REM]**:

| Document | Size at reconciliation |
|---|---|
| `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` | 300 lines / 41,023 bytes |
| `VYUH_BATCH_3_COMPLETION_REPORT.md` | 248 lines / 34,559 bytes |
| `VYUH_BATCH_3_ADMIN_PEOPLE_AUDIT_AND_DECISION_GATE.md` | 498 lines / 83,300 bytes |
| `VYUH_BATCH_2_UPDATED_DECISION_PLAN.md` | 489 lines / 60,271 bytes |
| `VYUH_BATCH_2_COMPLETION_REPORT.md` | 294 lines / 37,821 bytes |
| `VYUH_COMPLETE_FRONTEND_AUDIT_AND_IMPLEMENTATION_BLUEPRINT.md` | 1,108 lines / 154,895 bytes |

**Precedence ruling recorded [REM].** Gate 0 §17.3 and Batch 2 plan §11.3 prospectively listed "all Batch 1 exam/learning/analysis files" as unchanged. The **higher-authority** Batch 3.1 directive (WS1/WS6) explicitly requires service-boundary edits in `src/services/mock/{learning,live,examFlow,analysis,courses}.js`. None of those five files appears in the Batch 3.1 §17 protected-file list, so **no STOP is triggered**; the higher-authority instruction governs and the lower-authority prospective list is superseded for exactly those files. The addendum documents this rather than silently reinterpreting either decision.

**Other reconciliation outcomes:**

* The **late Batch 3 document-reconciliation deviation** (mandatory doc reconciliation was performed *after* many Batch 3 source edits) is permanent, disclosed in the Batch 3 completion report §3 and confirmed by the independent review §8. It is **not rewritten, minimised, or repaired** here. Batch 3.1's own baseline/reconciliation order is correct [REM].
* `src/app/routes/v2RouteTable.js:15,58` still carries stale provisional "Batch 3" comments [AUDIT I-4 / D-6]. It is a protected file; **it was left untouched and is documented, not edited** [REM].
* The independent review's §4 "six claimed vs nine listed" enumeration error (I-1), the two out-of-map type-only contract JSDoc files (I-2), the overstated §16 U-3 claim (I-3), the extra `v2-routes.test.jsx` heading assertion (I-5) and the two §17.2-listed-but-untouched files (I-6) are documentation inconsistencies in the **historical** Batch 3 report. They are recorded here in §6 and §18; that historical report is **not silently rewritten**.
* All approved Batch 2 decisions (G1–G4, G5 blocked, C1 test-migration discipline, U-1–U-5) remain binding and were not re-asked.

---

## 3. WS0 — fresh read-only baseline, pre-edit order compliance, and integrity

Fresh baseline captured **2026-11-08T09:56:25Z**, read-only, immediately after authorization and **before the first source edit** [REM]:

* Branch `arena/1763b46c-vyuh` active; HEAD `ced54030c336bb1041454fd8780f56f423af19f8`.
* 49 modified tracked files + 32 untracked files; `git diff --shortstat`: **49 files changed, 2425 insertions(+), 510 deletions(-)**.
* `git diff --check` EXIT 0; no `D` / `R` entries.
* `package.json`, `package-lock.json`, `src/mock-data/batches.js` diffs empty.
* 33 v2 aliases intact; `/a/people` redirect intact.
* Protected untracked SHA-256 hashes recorded (§4); protected tracked diffs were the six pre-existing Batch 2 files.
* 15 seeded audit keys / 20 seeded entries unchanged; 10 new Batch 3 audit keys present.
* `node_modules` 128 entries; no install performed.
* Chromium absent; `~/.cache/ms-playwright` missing; no `chrome`/`chromium`/`headless_shell`; `PLAYWRIGHT_BROWSERS_PATH` unset; Playwright 1.65.0.
* `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` **absent**.
* Six governing documents present at the sizes in §2; Python quoted generated-password literal scan over the independent review: 0 hits.

Post-implementation tree [REM]: 54 modified tracked files + 37 untracked entries (directory entries collapsed), `git diff --shortstat` **54 files changed, 2691 insertions(+), 552 deletions(-)**, `git diff --check` EXIT 0, no `D`/`R`, package/lockfile diffs 0, 33 aliases intact, no Git mutation.

---

## 4. Scope compliance, protected-file / change-control audit, and STOP evaluation

**No protected file was modified.** Protected untracked hashes are byte-identical to the baseline [REM]:

| File | SHA-256 (unchanged) |
|---|---|
| `src/mock-data/accounts.js` | `d02465726586a2156d62f3da1a1c578aaa7ef7aa1e590a3050fa3850654fc30b` |
| `src/app/routes/v2RouteTable.js` | `98e9fee47099c919b3f72c4414f657798e5e1565358fb713da3279832855e257` |
| `src/app/routes/v2Aliases.jsx` | `01a0067b801070c25484d0ed24b81dd9eb2ae0aba748667eea801502eca97200` |
| `src/features/auth/pages/SetupAccountPage.jsx` | `b5ad26f7b1bcae14e61f623d43f3e56c197e61cab04c266efab79c81b5407a21` |
| `src/mock-data/users.js` | `57d4fe11d657af8782f3dec76f9984f4814bbbb6717ca65a2a9894fca4e58541` |
| `src/mock-data/institution.js` | `a7db65f74b0661842f366db64b91fa0aaf339951c7400380554c513670b763d6` |
| `src/mock-data/batches.js` | `f788603cc42d92ef4fe150de0eec9c78729f9d7f8fffcf7d5ec7ee9eb9c7573d` |
| `src/mock-data/batchesAdmin.js` | `5c0169e32fea83003d2fdcad445d34370f8f9c4fd50ea9981724a178c67c4ef5` |

Protected tracked files (`AppRoutes.jsx`, `guards.jsx`, `authSchemas.js`, `roles.js`, `sessionPersistence.js`, `sessionStore.js`) still carry **only their pre-existing Batch 2 diffs**; `src/styles/tokens.css`, `src/index.css`, `scripts/check-architecture.mjs` have 0 diff. A scan for the `BATCH 3.1` marker across all 17 protected paths returned **0 hits** [REM]. No `package.json` / `package-lock.json` change.

**D-1 did not require a protected file.** The shared eligibility helper lives in a NEW file under `src/services/mock/` (explicitly authorized by clarification ruling 1) and the service-boundary gates live in the five non-protected mock services. D-2 was fixed in `src/services/mock/admin.js`; `SAFE_ACCOUNT_FIELDS` in the protected `accounts.js` was **not broadened**. Stale `v2RouteTable.js` comments were documented, not edited. **No STOP condition occurred**; no hiding workaround was used.

**Product constraints preserved:** one institute; exactly `admin`/`faculty`/`student`; Admin highest; no Super Admin, multi-tenancy, institute registration, public self-registration, Password Requests queue or G5 consent; React + Vite; JavaScript/JSX only, no TypeScript; mock-data source of truth; no backend/database/external auth/API; no new roles, Admin-created Admin accounts, ID reuse, account deletion, credential retrieval, password expiry or automatic unlock; no dependency/lockfile change; no general refactor, architecture redesign or unrelated bug fixing; U-1–U-5, the Admin shell/nav, demo seats, the canonical Batch 2 registry/auth semantics and all 33 v2 aliases unchanged.

---

## 5. Binding decisions U-1–U-5, approved Batch 2 decisions, and the four clarification rulings

Carried forward unchanged [ORIG], not re-asked:

* **U-1** — CSV exact column order `instituteId, temporaryPassword, role, name, batchName`; exact filename `vyuh-one-time-credentials.csv`; client-side transient-only; no storage/cache/URL/log/analytics/audit; no credential column in the uploaded template; warning before download; the app cannot erase the downloaded file.
* **U-2** — explicit per-value Copy with accessible labels, user action only, never auto-copy/log/audit clipboard, never claims the OS clipboard is cleared; verbatim `CREDENTIAL_SECURITY_NOTICE`.
* **U-3** — issued student/faculty honest empty/own workspaces, real name, correct batch/roll, no demo academic data; demo fixtures unchanged. **(This was the failed item; now remediated, §7.)**
* **U-4** — editable name/email/phone/batch where applicable, optional roll number; immutable `instituteId`/`source`/role; email/roll uniqueness; dedicated batch move; terminal archive with reason + irreversible confirmation; no delete/ID reuse.
* **U-5** — minimal additive `issueTemporaryPassword()`, digest/salt only, `mustChangePassword:true`, old temp invalidated, credential returned once in memory, `{clearAttempts:false}`, no status/lockout change.
* **G1–G4, G5 blocked, C1** — `VYU-S-YY-NNNN` / `VYU-F-NNNN` / `VYU-A-NNN`; never-reused IDs, permanent `issuedInstituteIds`, institute-supplied `year:null` with no rollover; 12-char generated passwords, `crypto.getRandomValues` + rejection sampling, no time expiry, mandatory first-login change, salted SHA-256 prototype disclaimer; one-time viewing, no plaintext retrieval; out-of-band recovery with Admin identity verification and mandatory reason; C1 test-migration discipline retained.

Four binding clarification rulings, all applied [REM]:

1. **New shared own-workspace eligibility helper under `src/services/mock/`** with approved fail-closed semantics: honest empty/unavailable for issued students, `notFound` for unresolvable identity, no demo fallback in either case; reuse the existing identity/session model, no second identity system. → `src/services/mock/ownWorkspace.js`.
2. **Credential-export-specific CSV sanitisation** preserving original application values and protecting untrusted text cells; do **not** change the shared `csvFromColumns()`; do not corrupt generated passwords; preserve exact U-1 column order/filename, no template credential column, no weakened import validation. → `src/features/admin/lib/credentialCsv.js`.
3. **Admin authorization at the service boundary** for privileged account-management mutations only; valid Admin case preserved. → `requireAdminActor()` in `src/services/mock/admin.js`.
4. **Keep dialog confirmation as the primary action** and disable/de-emphasise background `PageHeader` actions while any dialog/sheet is open; preserve a11y/keyboard; reuse tokens/primitives. → `AdminUsersPage.jsx`, `AdminImportPage.jsx`, `AccountRowActions.jsx`.

---

## 6. Reconciliation of the 10 enumerated independent-acceptance items

The independent review §1 enumerated 10 scope items. Reconciled here with the original verdict, the Batch 3.1 disposition and the evidence class [AUDIT] → [REM]/[LIMIT]:

| # | Requirement (review §1) | Review verdict | Batch 3.1 disposition |
|---|---|---|---|
| 1 | U-1 through U-5 against source | PARTIAL — U-3 FAIL | **U-3 remediated** at service boundary; U-1/U-2/U-4/U-5 unchanged and re-tested [REM §7, §15]. |
| 2 | Creation, auth, temp credentials, reissue, lifecycle | PASS with D-2 | D-2 fixed (phone preserved on all five operations); `requireAdminActor()` added; 51 existing + new tests pass [REM §11, §13]. |
| 3 | CSV imports create genuine loginable accounts | PASS | Unchanged; import validation NOT weakened; `IMPORT_FIELDS` still exactly 7 columns with no credential column [REM §9]. |
| 4 | New workspace isolation + demo preservation | FAIL (D-1) | **D-1 fixed**: one shared helper, five routes + direct services gated; demo seats unchanged and asserted [REM §7, §12]. |
| 5 | Rollback, audit attribution, React Query credential exposure | PARTIAL (R-1) | **R-1 fixed**: discovered that `mutation.reset()` leaves `state.data` in the `MutationCache`; added keyed removal on close/unmount/navigation [REM §8]. Rollback/audit unchanged. |
| 6 | Batch 3 diffs vs §17.2/§17.3 file-impact map | PARTIAL | Historical I-2/I-5/I-6 remain on the record; §2 precedence ruling documents the higher-authority Batch 3.1 service edits; no map claim is silently rewritten [REM §2]. |
| 7 | §4 "six claimed vs nine listed" | PARTIAL | Documentation-only; recorded in §2/§18; historical report not modified [REM]. |
| 8 | Late reconciliation deviation / scope conflict | PARTIAL | Deviation remains **permanent and disclosed**; Batch 3.1's own reconciliation was correctly performed before the first edit [REM §2, §3]. |
| 9 | 33 aliases + protected Batch 1/2 foundation | PASS | Re-verified: `V2_ROUTE_MATRIX.length === 33`, all protected hashes unchanged [REM §3, §4]. |
| 10 | `SAFE_ACCOUNT_FIELDS` phone limitation + stale route comment | PARTIAL (D-2) | Phone limitation fixed **without** broadening the protected field list; stale `v2RouteTable.js` comments documented and deliberately left untouched [REM §4, §11]. |

Confirmed defects **D-1**, **D-2**, **D-3** are all addressed (§§7, 11, 10). Inconsistencies **I-1…I-6** are documentation issues in the historical report, recorded here. Risks **R-1…R-12**: R-1, R-2, R-3, R-4, R-5, R-6, R-7, R-8, R-11 remediated; **R-9** (non-ACID localStorage rollback), **R-10** (salted SHA-256 prototype digest), **R-12** (`structuredClone` extra in-memory copy) remain accepted/disclosed limitations [LIMIT §18].

---

## 7. WS1 — D-1: complete issued-student workspace isolation (P0, release blocker)

**[AUDIT]** `useLearning.js` → `learningService` bypassed the Batch 3 gates that existed only in `students.js`/`faculty.js`, so issued students saw demo classes, recordings, doubts, study rooms and attendance history on five real routes.

**[REM]** A single new module `src/services/mock/ownWorkspace.js` now classifies identity once, reusing **only** `loadAccountsDb()` / `accountByIdentifier()` / `isInstituteId()` from the canonical Batch 2 registry, `readPersistedSession()` from the existing session model, and the `users` / `currentStudent` demo seats. No second identity store, role, session shape or credential field.

* `accountWorkspace(identifier, role)` → `issued` | `demo` | `invalid`; `studentWorkspace`, `facultyWorkspace`, `sessionWorkspace`, `isIssuedStudent`, `isIssuedFaculty`, `requireStudentWorkspace`.
* **Fail-closed:** blank/non-string id, a canonical record of the wrong role, a syntactically valid Institute ID with no issued record (forged), or an issued session addressing a different issued account → `invalid`; `requireStudentWorkspace()` throws `notFound('student')`. No demo fallback.
* `students.js` and `faculty.js` had their duplicated resolvers replaced with calls to this one helper.
* `learning.js`, `live.js`, `examFlow.js`, `analysis.js`, `courses.js` now consult it for **every** student-facing method. Lists return `[]` / honest unavailable results; demo-record detail/reads/writes throw `not_found`; `subscribe()`/`subscribeRoom()` return harmless no-ops; own doubts can still be created but no demo recording metadata is attached.
* `learningService.getAttendance()` for an issued student returns `buildAttendanceReport([], …)` — **no seeded history, no invented percentage**; `AttendancePage.jsx` now shows "No attendance records yet" instead of a 0.0% summary or a defaulter warning.
* `liveService.listUpcoming(studentId?)` / `listRecordings(studentId?)` accept an optional seat id and otherwise derive identity from the persisted session; `src/services/types.js` JSDoc updated.
* Demo seats `stu-ananya` / `fac-snehasish` and all existing mock scenarios keep their exact seeded behaviour — asserted in tests.

**12 focused WS1 service tests** plus **5 route-level U-3 tests** (`/student/live`, `/student/recordings`, `/student/doubts`, `/student/study-rooms`, `/student/attendance`) and a demo-regression route test were added [REM §15]. All pass.

---

## 8. WS2 — R-1: credential-bearing mutation lifecycle (P0)

**[AUDIT]** `mutation.reset()` was called on close but not on unmount, and the completion report claimed "no credential in cache".

**[REM]** During remediation the new lifecycle test exposed a **stronger** defect: in TanStack Query v5, `MutationObserver.reset()` only detaches the observer; the `Mutation` object and its `state.data` **remain in the `MutationCache` until `gcTime`**. Therefore the reset-on-close alone did not literally satisfy "no credentials in cache". Fixed properly:

* `src/features/admin/hooks/useAdminOps.js`: `TRANSIENT_CREDENTIAL_MUTATION_KEY = ['admin','credentials','transient']` added as `mutationKey` to exactly the three credential-producing mutations (`useCommitImport`, `useCreateUser`, `useReissueTemporaryPassword`); `clearTransientCredentialMutations(queryClient)` removes those cache entries via `MutationCache.remove()`; `useTransientCredentialLifecycle()` calls it on **unmount** (navigation / route change / sign-out) and returns the clear function for explicit close.
* `CreateUserDialog.jsx`, `AdminImportPage.jsx`, `AccountRowActions.jsx` clear on close **and** unmount; `AdminUsersPage.jsx` adds a page-level unmount backstop. All observers still call `.reset()` so no hook result retains a value.
* `CredentialsSheet.jsx` clears its `copied` marker and `marked` ref when the sheet closes (R-11).
* Verified [REM]: no credential in `MutationCache`, `localStorage`, `sessionStorage`, URL, audit ledger, `console.log`, or the canonical registry; no `admin.credentials` query key; U-1/U-2 semantics unchanged; no automatic clipboard clearing and no claim the OS clipboard can be cleared.

---

## 9. WS3 — R-2: credential-export CSV escaping / formula neutralisation

**[REM]** New `src/features/admin/lib/credentialCsv.js` — deliberately **credential-export-specific**. `csvFromColumns()` in `src/shared/lib/adminMath.js` is **unchanged** (verified byte-level by a source assertion).

* `escapeCredentialCell(value, trusted)`: untrusted text cells (`name`, `batchName`, which can come from an uploaded CSV) get a leading apostrophe when they start with `=`, `+`, `-`, `@`, `|`, tab/CR or whitespace-prefixed formula characters. Excel hides the apostrophe, so the visible application value is preserved.
* Commas, quotes, LF, CRLF and CR are kept **inside a quoted cell**; quotes are doubled. Unicode is preserved. `parseCsv()` round-trips embedded newlines to a single 5-cell record.
* `instituteId`, `temporaryPassword`, `role` are **trusted** and emitted verbatim — generated passwords are never altered. (The generator alphabet is strictly alphanumeric, so no generated password can start with a formula character.)
* `buildCredentialCsv(rows)` preserves the exact U-1 header `instituteId,temporaryPassword,role,name,batchName` and `vyuh-one-time-credentials.csv`; explicit user-triggered download; `CREDENTIAL_SECURITY_NOTICE`; one-time "shown once" semantics.
* Import validation was **not weakened**: `IMPORT_FIELDS` remains exactly 7 columns, no credential column; `validateImport()` still called.
* Tests cover `=`, `+`, `-`, `@`, `|`, whitespace prefixes, commas, quotes, LF, CRLF, CR, Unicode, exact header, filename, and verbatim generated password [REM §15].

---

## 10. WS4 — D-3: corrected prospective E2E auth journey

**[AUDIT]** `tests/e2e/admin-accounts.spec.js:86` did `page.goto('/login')` with the Admin session still active, so `GuestOnly()` would redirect the case away from login.

**[REM]** `tests/e2e/admin-accounts.spec.js` rewritten as the full approved journey: Admin signs in → creates ONE student → safely views the transient credentials → explicit Copy of Institute ID **and** password → Download CSV → closes the sheet → **proper sign-out through the Admin shell's "Sign out" control**, asserting `vyuh.session` is cleared → student signs in with Institute ID + temporary password → `/setup-account` → forced temp-password change with the approved strength policy → correct `/student` workspace → honest empty `/student/live` and `/student/attendance`. No injected session, no `page.goto('/login')` shortcut, no weakened guard, no credential literal in the file. The other three prospective cases are preserved (one now also asserts the CSV filename).

**Chromium check only [REM]:** `~/.cache/ms-playwright` absent, no `chrome`/`chromium`/`headless_shell`, `PLAYWRIGHT_BROWSERS_PATH` unset, Playwright 1.65.0. No install attempted. `npx playwright test --list` EXIT 0 → **60 tests in 8 files**, static collection only. The full browser suite was **NOT executed** [UNVERIFIED]. The corrected journey remains a prospective spec.

---

## 11. WS5 / WS9 — D-2 phone projection and no fabricated attendance

**D-2 [REM]** `transitionAccountStatus()` in the protected `accounts.js` returns a `SAFE_ACCOUNT_FIELDS` projection that intentionally omits `phone`; Batch 3 fed that projection straight into `toPeopleRow()`, so operation results had `phone: ''`. `applyAccountOperation()` now re-reads the **canonical** registry record before projecting. `SAFE_ACCOUNT_FIELDS` is **not broadened** and the registry is unchanged. Tests assert `phone` is consistent across suspend / reactivate / lock / unlock / archive, plus edit and batch move, and that the canonical record retains it.

**R-5 / WS9 [REM]** `admin.js:839` invented `62 + ((index * 7) % 37)` per roster position — now applied to real issued accounts. Issued members get `attendancePercent: null`; `AdminBatchDetailPage.jsx` renders "No records" and the batch summary shows "No records / Attendance records are not available yet". `defaulters` counts only members with a real numeric record, so a no-records account is never silently counted as 0%. `contracts/admin.js` widens the `BatchMember.attendancePercent` typedef to `number|null`. Demo members keep their seeded illustrative figures; separate demo/issued assertions were added.

**[LIMIT]** The batch-level header at `AdminBatchDetailPage.jsx:120` still displays the seeded `adminBatches` aggregate `batch.attendancePercent` (a pre-existing demo fixture value, not a per-student fabrication). It is disclosed here rather than silently changed, because altering the seeded batch fixture was outside Batch 3.1's targeted scope.

---

## 12. WS6 / WS10 — R-6 deep-link ownership and R-8 latent hook scoping

**[AUDIT]** `analysisService`, `examFlowService`, `coursesService` had zero own-workspace gates; `useRecordings()` / `useUpcomingSessions()` were globally keyed and unscoped.

**[REM]**

* `analysisService.getAnalysis()` for an issued student returns an honest `source:'unpublished'` result with a plain-words notice, `scoreSummary: null`, `details: null`, and the account's **own** name/roll — never another student's result sheet. `getRevision()` throws `revision_unavailable`.
* `examFlowService.getPaper()`, `startAttempt()`, `submitAttempt()` throw `exam_unavailable`; `syncAttempt()` is session-gated. No demo paper, attempt or submission leaks.
* `courseService.listCourses()` / `questionService.listSamples()` derive identity from the persisted session and return `[]` for issued students.
* `useRecordings(studentId)` and `useUpcomingSessions(studentId)` now pass the id into **both** the query key and the service call, and are `enabled` only when a student id exists. `queryClient.clear()` on logout already prevents cross-account cache reuse.
* The gates live in the **services**, not in route visibility: all five routes remain reachable and render honest empty states. No navigation-hiding workaround.

---

## 13. WS7 / WS8 — R-3 object-URL lifecycle and R-4 service-boundary Admin authority

**R-3 / WS7 [REM]** `CredentialsSheet.jsx` no longer calls `URL.revokeObjectURL()` synchronously after `link.click()`. It tracks pending object URLs in a ref, schedules release with a single `setTimeout(…, 0)` (no arbitrary excessive delay), and revokes any still-pending URL on unmount. A guard prevents double revocation. Filename, columns, explicit download and security notice are preserved. Tests assert URL creation (`Blob` argument), `link.download`, `link.href`, download invocation, **no synchronous revoke**, eventual single revoke, and the unmount backstop. **Real-browser download completion remains [UNVERIFIED].**

**R-4 / WS8 [REM]** `requireAdminActor()` added to `src/services/mock/admin.js`: reads `readPersistedSession()`, rejects missing/expired/malformed/faculty/student sessions with `serviceError('forbidden', …, 403)`. Applied to **exactly the eight privileged account-management mutations** (`commitImport`, `configureInstituteIds`, `createUser`, `markCredentialsShown`, `applyAccountOperation`, `editAccount`, `moveStudentBatch`, `reissueTemporaryPassword`) — nine `requireAdminActor()` occurrences including the definition. Valid Admin sessions keep session-derived attribution through `adminActor()`. Reads and pre-existing console mutations are deliberately **not** given a role check, per the approved "privileged account-management mutations only" ruling; this is a documented scope decision, not an omission. Actor-state tests cover Admin / faculty / student / missing / invalid sessions and all eight mutations.

---

## 14. WS11 / WS12 — primary-action consistency and jsdom clipboard/accessibility

**[AUDIT R-7]** Two filled-ember primaries could be co-visible when a dialog/sheet was open.

**[REM]** `AdminUsersPage.jsx` computes `overlayOpen = createOpen || credentials.length > 0 || rowDialogOpen`; the page-level "Create account" button is `disabled`, and "Import a CSV" is `aria-disabled`, removed from tab order, click-blocked and visually de-emphasised via `cn()`. `AccountRowActions.jsx` reports its dialog state through a new `onDialogStateChange` prop. `AdminImportPage.jsx` disables "Sample CSV" while the credentials sheet is open. The dialog's own confirmation remains the primary action (ember `type="submit"`), keyboard navigation and focus trapping are unchanged, and existing tokens/primitives (`Button`, `Link`, `Dialog`, `Sheet`, `cn`) are reused. `scripts/check-architecture.mjs` still reports no primary-rule violation.

**WS12 [REM]** jsdom-only tests (no real-browser axe claimed):
* Clipboard stub: zero `writeText` calls on mount; exactly two explicit calls, one with the Institute ID and one with the temporary password; no credential in `console.log`, the mutation cache or storage; closing the sheet clears the transient `Copied` marker (`data-testid="copied-marker"`).
* Accessibility assertions for `CreateUserDialog` (named dialog, labelled name/email/phone inputs, radio group, submit), `CredentialsSheet` (named dialog, captioned table, 5 column headers, labelled copy buttons, `role="alert"` notice, Download button) and the `AccountRowActions` confirmation dialog (named dialog, labelled reason textarea, Confirm button, form test id).
* Keyboard reachability of the dialog input is asserted. **These are jsdom accessibility checks, not axe-core in a real browser** [UNVERIFIED].

---

## 15. New focused tests, C1 discipline, and file-impact manifest

**New test files [REM]:**

| File | Tests | Covers |
|---|---|---|
| `tests/unit/batch-3-1-isolation.test.jsx` | 26 | WS1 (12 focused service tests), WS6, WS9, WS10, WS11, 5 route-level U-3 tests + demo regression |
| `tests/unit/batch-3-1-credentials.test.jsx` | 25 | WS2, WS3, WS5, WS7, WS8, WS12 |

No existing test was deleted, weakened, skipped or rewritten to obtain green. Existing suites (including `admin-accounts.test.jsx` with its `configureInstituteIds({year:'99'})` fixture, C1 rewrites, `guard-matrix`, `registration-retirement`, `first-login`, etc.) remain untouched and pass. Total suite grew from **314 → 365 tests**.

**Focused regression command [REM]** (15 files, 286 tests, EXIT 0): both new suites plus `admin-accounts`, `admin-console`, `v2-routes`, `guard-matrix`, `auth-flow`, `auth-service`, `auth-mode`, `institute-auth`, `account-model`, `first-login`, `registration-retirement`, `learning-service`, `exam-flow`.

**Batch 3.1 file-impact manifest [REM]** — 20 existing tracked files edited (most already carried Batch 1/2/3 diffs), 4 new source/test files, 1 new report:

*Services / contracts / types:* `src/services/mock/ownWorkspace.js` (new), `src/services/mock/{learning,live,examFlow,analysis,courses,students,faculty,admin}.js`, `src/services/types.js`, `src/contracts/admin.js`.
*Hooks / features:* `src/features/admin/hooks/useAdminOps.js`, `src/features/admin/lib/credentialCsv.js` (new), `src/features/admin/components/{CredentialsSheet,CreateUserDialog,AccountRowActions}.jsx`, `src/features/admin/pages/{AdminUsersPage,AdminImportPage,AdminBatchDetailPage}.jsx`, `src/features/learning/pages/AttendancePage.jsx`, `src/features/student/hooks/useStudentWorkspace.js`.
*Tests / report:* `tests/e2e/admin-accounts.spec.js`, `tests/unit/batch-3-1-isolation.test.jsx` (new), `tests/unit/batch-3-1-credentials.test.jsx` (new), `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` (new, this file).

No protected file, fixture, style token, architecture script or package file appears in this manifest.

---

## 16. Verification results on the final tree

All four mandated commands were **re-run after the final source edit** [REM]. Final run 2026-11-08T10:46:08Z:

| Command | Exit | Result |
|---|---|---|
| `npm test` | **0** | 27 test files / **365 tests passed**, duration 74.96s |
| `npm run build` | **0** | 3305 modules transformed, built in 1.74s |
| `npm run lint` | **0** | "Architecture check passed: 326 files, 325 colour-free, no boundary or token violations." |
| `npx oxlint src tests` | **0** | **38 warnings / 0 errors** on 360 files / 104 rules (identical warning count to the pre-remediation baseline; 3 transient new warnings were removed by extracting the CSV helper and an unused variable) |

Additional mandated verification [REM]:

* `git diff --check` EXIT 0; no `D`/`R`; package/lockfile diffs 0; `dist/` gitignored.
* Protected-file diff audit and SHA-256 comparison: unchanged (§4); `BATCH 3.1` marker scan across 17 protected paths: 0 hits.
* Credential plaintext exposure scan: 0 egress hits (`console.*` / `localStorage` / `sessionStorage` / `setQueryData` / URL / audit writes of a credential); 0 `admin.credentials` / forbidden query keys; no `revealPassword` / `getPlaintext` / retrieval API (the 3 textual hits are negative assertions/comments); 0 quoted generated-password-shaped literals added in the diff; 1 pre-existing 12-char test fixture in `account-model.test.js` and 1 deliberately non-generated fixture renamed in the new test.
* CSV formula-injection cases: all 9 case families present and passing (§9).
* 33 v2 aliases intact; `/a/people` redirect intact; 15 seeded audit keys / 20 entries unchanged.
* Focused regression suites: 15 files / 286 tests EXIT 0 (§15).
* `npx playwright test --list`: EXIT 0, **60 tests in 8 files** — **static collection only**, not execution.
* **Full Playwright suite NOT executed**: Chromium is absent, no browser install was attempted [UNVERIFIED]. No browser console, real viewport/responsive width, OS clipboard, real download, media/camera, cross-tab or real-browser axe result exists or is claimed.
* No command failed; no failure was hidden, suppressed, deleted or worked around. Intermediate focused-test failures during development (7 in the new credentials suite, 1 in the isolation suite) were fixed at the cause — including the genuine R-1 MutationCache gap — and are disclosed in §8 and §18.

---

## 17. Full diff review, security evidence, and evidence classification

`git diff --shortstat`: **54 files changed, 2691 insertions(+), 552 deletions(-)** (baseline 49 / 2425 / 510). All added lines were reviewed for:

* **Credential egress** — 0 hits. No plaintext temporary password in storage, query cache, URL, audit `note`/`meta`, logs, analytics or account-list projections. No `admin.credentials` key. No retrieval API.
* **Protected-file change** — 0 hits (§4).
* **Generated-artifact / dependency change** — 0 hits; `package.json`, `package-lock.json`, `node_modules` installs, `dist/` commits all absent.
* **Scope creep** — no new role, backend, API, database, external auth, G5, Password Requests queue, public registration, automatic unlock, account deletion, ID reuse, password expiry, credential retrieval or general design overhaul.
* **Weakened test / validation** — no test deleted or weakened; `validateImport()` unchanged; `IMPORT_FIELDS` still exactly 7 columns; auth guards unchanged.

Evidence classification for the headline claims:

| Claim | Class |
|---|---|
| Batch 3 implementation, 33 aliases, canonical registry, U-1/U-2/U-4/U-5, lifecycle matrix, rollback, audit vocabulary | **[ORIG]** |
| D-1/D-2/D-3, I-1…I-6, R-1…R-12, CONDITIONAL ACCEPT, six conditions, browser verification gaps | **[AUDIT]** |
| All Batch 3.1 source changes, 51 new focused tests, corrected E2E spec, all four commands, focused regressions, scans, hashes, 33-alias re-check | **[REM]** |
| Real-browser download completion, clipboard, console, responsive widths, real-browser axe, full E2E journey, cross-tab/session restore | **[UNVERIFIED]** |
| Prototype SHA-256 digest, non-ACID rollback, `structuredClone` extra copy, seeded batch-level aggregate attendance, stale `v2RouteTable.js` comments, historical report documentation inconsistencies, late Batch 3 reconciliation deviation | **[LIMIT]** |

---

## 18. Known limitations, remaining risks, final STOP condition

**Remaining limitations [LIMIT] / [UNVERIFIED]:**

1. **No browser verification of any kind exists.** Chromium is absent and no install was attempted. The full Playwright suite (60 tests / 8 files) was collected but **not executed**. The corrected E2E journey in `tests/e2e/admin-accounts.spec.js` remains prospective.
2. No real-browser console, viewport/responsive width, OS clipboard, download-file, media/camera, cross-tab/session-restore, or axe-core result is claimed. All a11y and clipboard evidence is **jsdom-only**.
3. Independent review §15 condition 3 (full browser suite + §13 items 2–10 + real-browser axe) is therefore **not satisfied**; it cannot be satisfied in this environment without a separately authorized browser installation.
4. Independent review §15 condition 6 asks for "then a fresh independent review". This report is an **implementation addendum**, not an independent audit; a fresh independent review has not been performed and is not claimed.
5. The **late Batch 3 document-reconciliation deviation** is permanent and remains on the record; the historical Batch 3 completion report's documentation inconsistencies (I-1, I-2, I-3, I-5, I-6) are recorded here, not retroactively corrected in that file.
6. Stale provisional comments in the protected `src/app/routes/v2RouteTable.js:15,58` remain untouched, as required by change control.
7. The seeded batch-level `batch.attendancePercent` aggregate is still shown in the batch header (§11); per-student fabrication is removed.
8. `adminActor()`'s fallback to the seeded office seat is retained for **non-privileged** pre-existing admin console mutations, exactly as the approved WS8 "privileged account-management mutations only" ruling requires.
9. Residual accepted risks: **R-9** (compensating localStorage rollback is not ACID), **R-10** (salted SHA-256 is a prototype digest, not a KDF), **R-12** (`simulate()` `structuredClone` creates an extra transient in-memory copy, now cleared on close/unmount).
10. `courseService` / `questionService` and `liveService`'s parameterless forms derive identity from the persisted session; a caller with no student session (e.g. a design preview) still receives the demo fixtures by design.
11. Intermediate development failures (7 + 1) were fixed at cause; the R-1 finding that `mutation.reset()` does not clear the `MutationCache` is disclosed in §8 rather than hidden.
12. Final acceptance of Batch 3 and any Batch 4 work are **the user's decision**; completing Batch 3.1 does **not** constitute acceptance.

**Final recommendation: CONDITIONAL ACCEPT** of the Batch 3.1 remediation. The P0 blockers D-1 and R-1 are resolved with new tests, all four mandated commands pass on the final tree, no protected file or dependency changed, and no Git mutation occurred. Browser verification and a fresh independent review remain outstanding, so **ACCEPT** of Batch 3 is not yet warranted; **REJECT** is disproportionate given the evidence.

**STOP.** No Batch 4. No commit, push, merge, pull request, branch switch, publish or deployment. No further source edit. Final acceptance remains with the user.
