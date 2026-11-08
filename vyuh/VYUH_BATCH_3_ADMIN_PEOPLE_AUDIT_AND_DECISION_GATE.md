# Vyuh — Batch 3 Admin People Management: Read-Only Audit & Decision Gate

**Gate 0 deliverable · READ-ONLY · No Batch 3 implementation performed**

Prepared on branch `arena/1763b46c-vyuh` · 2026-11-07 · All paths in this report are relative to `/home/user/vyuh/vyuh/` unless stated otherwise.

> **Status of this document:** This is the ONLY file created by Gate 0. It is an evidence-based capability audit and a decision gate. It is **not** an implementation prompt, not an implementation plan awaiting silent execution, and not a substitute for the user's explicit authorization. **I am stopped at the end of §19.**

---

## 1. Executive summary

Batch 2 is complete: the single-institute identity foundation exists in `vyuh.mock.accounts.v1` (credential-free registry), `vyuh.mock.auth.v1` (salt/digest/lockout), and `vyuh.session`. `provisionInstituteAccount()` is a **non-UI foundation helper** that already issues a never-reused Institute ID, a 12-character temporary password, a `mustChangePassword` account and a one-time in-memory credential. Login, first-login setup, status enforcement, guard ordering, demo-seat compatibility and all 33 v2 aliases work and are covered by 262 passing unit tests.

Batch 3 must connect that foundation to the Academic Office. The central finding is a **split-brain ledger**: `/admin/users` reads `roster()` = `[...adminUsers, ...store.createdUsers]` from `vyuh.mock.admin.v1` (`src/services/mock/admin.js:149-151`), while real, loginable accounts live in `vyuh.mock.accounts.v1`. `commitImport()` writes only `invited` rows with no Institute ID, no password digest and no registry record (`admin.js:470-484`), so imported accounts cannot sign in. Nothing in `AdminService` can create, suspend, reactivate, lock, unlock, edit, move, re-issue or audit an account (`src/services/types.js:193-216`). There is no Create User UI, no credentials sheet, no tabs, no row actions, no CSV bridge, and no Admin recovery action.

The **authority rule resolves several blueprint conflicts**: the older blueprint asks for three tabs including *Password requests*, a `PasswordRequestsTab.jsx`, a request queue, `year:'26'`, `FirstLoginPolicy`, consent acknowledgement, and a `changePasswordWithSetup({policyVersion, consent})`. Those are **overridden**. Batch 2's approved decisions and actual implementation govern: exactly **two tabs (Students / Faculty)**, **no Password Requests queue/tab without a new explicit directive**, **G5 consent blocked**, **no Admin-created Admin accounts**, **institute-supplied `YY` with `year: null` by default**, **out-of-band recovery with a mandatory reason and no automatic lockout clear**.

Five material blockers require a user ruling before coding (§18): the credentials-CSV column set, clipboard Copy / secure-sharing wording, honest empty-vs-seeded workspace data for newly created accounts, the exact editable-field/archive scope, and explicit authorization for a minimal additive recovery helper in `src/services/mock/auth.js`. A sixth operational gap — the institute-supplied year token has **no configuration surface at all** (`accounts.js:66-69`, `:173-188`) — is a required implementation item, not a re-ask of the approved year-token rule.

**No browser/E2E verification was performed.** Chromium was rechecked in this Gate 0: `~/.cache/ms-playwright` absent, no `chrome`/`chromium`/`headless_shell` executable found, `PLAYWRIGHT_BROWSERS_PATH` unset; Playwright reports version 1.65.0. Therefore no real viewport, console, axe-in-browser, clipboard, download, media or cross-tab claim is made anywhere in this report.

---

## 2. Scope, authority, evidence sources and classification legend

### 2.1 Authorised scope of Gate 0

Read-only inspection of the repository, the mandatory documents, and current implementation/tests, followed by this single new Markdown file. The user's directive authorises **only** `VYUH_BATCH_3_ADMIN_PEOPLE_AUDIT_AND_DECISION_GATE.md` to be created.

### 2.2 Mandatory sources read and reconciled

| # | Source | Sections/lines read | Role in this audit |
|---|---|---|---|
| S1 | `VYUH_COMPLETE_FRONTEND_AUDIT_AND_IMPLEMENTATION_BLUEPRINT.md` | §3.4 (`:284-297`), §4.4 (`:527-588`), §4.5 (`:590-592`), §4.6 (`:594-596`), §4.7 (`:598-602`), §5.2–§5.6 (`:630-695`), Batch 3 (`:866-876`), Batch 2 (`:854-864`) | Original gap inventory. **Not authoritative** where it conflicts with S2/S3/implementation. |
| S2 | `VYUH_BATCH_2_UPDATED_DECISION_PLAN.md` **Revision 2** | §8.1 (`:316-325`), §8.2 (`:327-344`), §8.3 (`:346-365`), §8.4 (`:367-379`), §9 (`:383-401`), §10 (`:405-423`), §11 (`:427-479`), §12 (`:483-489`), §§1–5 (`:28-135`) | Approved decisions; defers Admin People as **D-8** (`:378`). |
| S3 | `VYUH_BATCH_2_COMPLETION_REPORT.md` | §§1–10 (`:1-140`), §11 (`:152-158`), §12 (`:162-168`), §13 (`:172-180`), §16 (`:250-261`), §17 (`:265-276`), §18 (`:280-292`) | Authoritative record of what was actually built and what was deliberately left out. |
| S4 | Current implementation & tests | 313+ source files; 24 unit suites; 7 e2e specs | **Ground truth** for confirmed behaviour. |

Also read: `VYUH_BATCH_1_COMPLETION_REPORT.md`, `VYUH_BATCH_2_DECISION_GATE_REPORT.md` (marked superseded), `scripts/check-architecture.mjs`, `package.json`, `package-lock.json`.

### 2.3 Authority / precedence rule (as directed)

1. **Approved Batch 2 decisions + actual implemented behaviour (S2 §8.1, S3, S4)** override conflicting older blueprint proposals.
2. Blueprint requirements that are **not** contradicted remain valid Batch 3 requirements.
3. Where the current directive speaks (two tabs, no queue, no Admin-created Admin, no G5, no backend), it overrides both S1 and any permissive wording in S3 §18.
4. Approved decisions are **not re-asked** (§5).

### 2.4 Evidence classification legend used throughout

| Tag | Meaning |
|---|---|
| **[CONFIRMED]** | Verified by reading a named file/function/line in the current checkout. |
| **[APPROVED]** | Approved Batch 2 / user-final decision; binding, not re-asked. |
| **[BLUEPRINT]** | Requirement or proposal from S1 only; may be superseded. |
| **[RECOMMENDATION]** | New technical advice derived from this audit; not yet authorised. |
| **[OPEN]** | Genuine unresolved decision requiring user input before coding. |
| **[EXCLUDED]** | Explicitly out of scope by the current directive. |

---

## 3. Gate 0 read-only compliance and repository snapshot

### 3.1 Snapshot recorded at the start of Gate 0 (read-only commands only)

| Item | Observed value |
|---|---|
| Git root | `/home/user/vyuh`; app root `/home/user/vyuh/vyuh` |
| Branch / HEAD | `arena/1763b46c-vyuh` · `ced54030c336bb1041454fd8780f56f423af19f8` (`ced5403 Merge pull request #2 …`) |
| Working tree | **39 modified tracked + 22 untracked** |
| `git diff --stat` | `39 files changed, 1236 insertions(+), 397 deletions(-)` |
| `git diff --check` | **EXIT 0** |
| `git diff --name-only` | The same 39 tracked Batch 1/2 files; no new modifications |
| Protected-file diff | `git diff --name-only` for `mock-data/users.js`, `mock-data/institution.js`, `services/mock/admin.js`, `AdminUsersPage.jsx`, `AdminImportPage.jsx`, `v2RouteTable.js`, `v2Aliases.jsx`, `styles/tokens.css`, `index.css`, `package.json`, `package-lock.json` → **0 lines** (unchanged) |
| Untracked 22 | 5 Markdown documents, 4 Batch 1 source files, 2 Batch 2 source files (`accounts.js`, `SetupAccountPage.jsx`), 6 Batch 1 + 5 Batch 2 unit suites |
| Batch 3 report before writing | **Absent** (`ls` → `No such file or directory`) |
| Chromium | **Absent**; `~/.cache/ms-playwright` missing, no executable on disk/PATH, `PLAYWRIGHT_BROWSERS_PATH` unset; `npx playwright --version` → `Version 1.65.0` |

### 3.2 Gate actions performed

Only `cat -n`, `sed -n`, `grep`, `wc -l`, `ls`, `find`, `git status`, `git diff --stat`, `git diff --check`, `git diff --name-only`, `git branch`, `git rev-parse`, `git log`, `env`, `npx playwright --version` and `read_file` were used. No `write_file`/`edit_file` on any application source, test, config, package file, dependency, lockfile or existing report occurred before this document. No `git checkout/reset/clean/stash/add/commit/push/merge/PR/publish/deploy`, no `npm ci`, no dependency install.

### 3.3 Post-write integrity re-verification

Recorded in §19.3: the same snapshot commands are re-run after this file is created; the only permitted difference is one new untracked Markdown file. **No pre-existing user change was lost.**

---

## 4. Mandatory-source reconciliation and precedence rulings

**[BLUEPRINT] → ruling** table. Line references are to S1 unless noted.

| # | Blueprint proposal (evidence) | Conflict with authority | Ruling |
|---|---|---|---|
| B-1 | §3.4 `:287`, §4.4.1 `:531`, Batch 3 `:868`: **three tabs** Students / Faculty / **Password requests**; `:870` `PasswordRequestsTab.jsx`; `:872` "password-request queue" | S2 §8.2 **R-7** (`:337`) out-of-band recovery, `PasswordRequest` typedef only; S3 §18 `:284` no queue; current directive forbids it | **OVERRIDDEN.** Exactly two tabs. No queue, no tab, no request state/route/UI without a new explicit directive. |
| B-2 | §4.4.2 `:537`: "no specification for the password algorithm, ID counter source, academic-year token (`26`) or reset-request policy exists … Batch 2 must obtain client confirmation" | S2 §8.1 G1/G2/G4 (`:320-324`); S3 §§5–8 | **SUPERSEDED** by approved decisions and shipped code. Do not re-open. |
| B-3 | §4.4.3 `:541`: `instituteIdCounter` with `year:'26'`; `passwordRequests[]`; `firstLoginPolicy` version; §4.4.3 `:546` 4-value status enum; §5.2 `:634` `FirstLoginPolicy` | `accounts.js:66-69` `year: null` (institute-supplied); `accounts.js:32-35` 5 additive statuses; S3 §12 `:165` `FirstLoginPolicy` deliberately NOT added; `contracts/admin.js:445-465` typedef-only request | **SUPERSEDED.** No hardcoded year, no `passwordRequests[]`, no `FirstLoginPolicy`, no consent version. |
| B-4 | §4.4.4 `:563`: `changePasswordWithSetup({newPassword, policyVersion, consent})`; §4.6 `:596`: `ConsentFields.jsx`, `acknowledgedAt`, `policy.acknowledged` audit; §3.4 `:291` consent acknowledgement count | S2 §8.3 G5 blocking (`:346-365`); `authSchemas.js:88-93` setup schema has only `newPassword`/`confirmPassword`; S3 §§9,18 (`:127-135`, `:289`) | **BLOCKED / EXCLUDED.** G5 has no approved wording, version or acknowledgement structure. Do not invent legal copy or enable a consent guard. |
| B-5 | §4.4.4 `:564-569`, §5.4 `:662-664`: `listPasswordRequests`, `resolvePasswordRequest`, `issueCredentialsCsv(rows) -> Blob/CSV` | R-7; G3 one-time viewing; no backend; `csvFromColumns()` (`adminMath.js:340-347`) already exists client-side | **PARTLY SUPERSEDED.** Request methods excluded. CSV generation should be a pure client-side action built from transient rows, not a service method returning a persisted Blob. |
| B-6 | §4.4.6 `:580`: "Creating a student yields `VYU-S-26-0231`-shaped ID"; §4.4.3 `:541` literal `26` | G1 shape `VYU-S-YY-NNNN` with **institute-supplied** `YY`, no `Date`/rollover; `accounts.js:247-293` | **EXAMPLE ONLY.** Literal `26` must never be hardcoded. `YY` comes from `config.year`. |
| B-7 | §4.4.6 `:583`: "unlock clears lockout" | S2 **R-8** (`:338`): recovery does not automatically clear lockout; separate explicit Admin unlock. `auth.js:177-183` `writePassword({clearAttempts})`, `:356-357` | **REFINED.** Unlock is a separate explicit, audited action. Recovery/re-issue must use `clearAttempts:false`. |
| B-8 | §3.4 `:296`: store Institute ID prefix/counter seed in `/admin/settings` | `accounts.js:173-188` `configureInstituteIds()` / `instituteIdConfig()` own config inside `vyuh.mock.accounts.v1` | **CONFLICT → RECOMMENDATION.** Keep config registry-owned; do not couple identity config to branding settings. See §9 F-3. |
| B-9 | §3.5 `:302`: "add query keys for `admin.credentials`" | G3 `[APPROVED]`: no credentials in query cache; S3 §17 `:273` | **REJECTED as written.** Never create a query key that can hold a plaintext credential. See §16. |
| B-10 | §3.4 `:286`: add "pending first logins" **and "password requests"** alert rows | R-7; G5 blocked | **PARTLY SUPERSEDED.** A credential-free "pending first logins" count is permissible; a password-requests alert is excluded. |
| B-11 | §4.5 `:592`: faculty roster in `batchesAdmin.js` must be updated; `/faculty` must resolve `useFacultyId()`; new faculty "sees their own classes/bank/recordings" | `batchesAdmin.js:32-79` is a static fixture; `faculty.js:142-158`, `:647-665` compose shared fixtures for ANY id | **VALID REQUIREMENT, BLOCKED BY CURRENT BEHAVIOUR.** See §15 and [OPEN] U-3. |
| B-12 | §3.4 `:289`, Batch 3 `:872`: `moveStudentBatch`, "move updates both rosters" | `admin.js:535-550` derives members from `roster(store)`; `batchesAdmin.js:93+` `studentCount` is static | **VALID, with caveat.** Two ledgers and static counts must be reconciled. See §11/§15. |
| B-13 | Batch 3 `:873`: "new optional credential column" in `importCsv.js` | G3: no permanent plaintext storage, one-time viewing; a CSV column in an uploaded sheet is persisted plaintext | **RECOMMEND OVERRIDE.** Generate at commit time and show the one-time sheet instead. See §13 F-4 and [OPEN] U-1. |
| B-14 | §5.5 `:680`: "`admin.commitImport` creates `invited` accounts with no credentials; `auth.findAccount` never sees them"; §5.3 `:650`: "Admin users ↔ auth users separate rosters" | Still true in `admin.js:470-484`; `auth.js:129-137` | **CONFIRMED — the primary Batch 3 gap.** |
| B-15 | S2 §8.4 **D-8** `:378`; S3 §18 `:284-292` list Admin People work (incl. "password-request queue") for a later batch | S3's list is descriptive, not an approval; current directive explicitly excludes the queue | **D-8 ACTIVATED for this audit; queue item FILTERED OUT.** |
| B-16 | §4.7 `:598-602` exam-lifecycle registry; §4.8, Batches 4–9 | Batch 1 already delivered `examDefinitions.js`/`examAvailability.js`; Batch 4+ work | **EXCLUDED** — no exam/live/studio/hall work in Batch 3. |

---

## 5. Approved Batch 2 decisions and strict exclusions (not re-asked)

### 5.1 Binding architecture and product rules [APPROVED]

Single institute · exactly three roles `student` / `faculty` / `admin` with `admin` highest · **no Super Admin, no tenancy, no institute switching** · no public registration / self-service signup / invitation / OTP provisioning · no backend, API server, database or external auth · React + Vite + plain JS/JSX with JSDoc · existing mock-data architecture · preserve all Batch 1 and Batch 2 work · no unrelated refactor/redesign.

### 5.2 Binding identity/credential decisions [APPROVED]

| Gate | Decision (source S2 §8.1, S3 §§5–10) |
|---|---|
| **G1** | `VYU-S-YY-NNNN`, `VYU-F-NNNN`, `VYU-A-NNN` (3 digits) shapes; one institute-wide unique system; never reuse IDs; permanent `issuedInstituteIds`; counters never decrement; explicit exhaustion error; institute-supplied `year` token with **no `Date`/rollover**; `nextCounter = max(configuredSeed, lastAllocatedCounter, highestExistingSuffix) + 1`; `instituteId` / `rollNumber` / `instituteCode` separate. **No Admin-created Admin accounts.** |
| **G2** | Exactly **12 characters** (user-selected final-directive decision, **not** a blueprint requirement — S3 §17 `:276`); alphabet `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789`; `crypto.getRandomValues` + whole-candidate rejection sampling with digit+non-digit invariant; deterministic generator is test-only; **no time expiry**; mandatory first-login change; old temporary password invalid after success; `newPasswordSchema` min 10 / letter / digit / max 128 + confirm + temp rejection; salted SHA-256 prototype disclaimer (NOT a KDF). |
| **G3** | One-time credential viewing; **no permanent plaintext storage**; no plaintext/retrieval/`revealPassword`/`getPlaintext`; no credentials in logs, audit entries, normal account lists, sessions, URLs or query cache; lost credentials → Admin issues a **NEW** temporary password. |
| **G4** | Out-of-band recovery; Admin verifies identity; Admin issues new temporary password; user repeats first-login setup; auditable; `PasswordRequest` **typedef only** with mandatory `reason`; no request UI/lifecycle; **no automatic lockout clear**; separate explicit Admin unlock; demo self-service reset only for the three seeded emails. |
| **G5** | **BLOCKING.** No approved policy wording, version identifier or acknowledgement structure. No invented legal text; no demo `ConsentFields.jsx` copy as policy. |
| **C1** | Retained test-migration principle: rewrite obsolete tests into retirement/security assertions; preserve authentication/lockout/session/role-isolation coverage; port the no-plaintext assertion into first-login; never delete tests merely to make the suite pass; report every changed test case individually. |
| **C2** | Resolved: 12 characters is user-selected, not blueprint-confirmed. |

### 5.3 Strict exclusions for Gate 0 and for any future Batch 3 coding

No source/test/config/package edits during Gate 0 beyond this report · no dependency or lockfile change · no Batch 2 registry/auth **rewrite** · no Password Requests queue/tab without a new explicit directive · no G5 consent · no Admin-created Admin accounts · no backend/API/database/external-auth code · no Batch 4+ work · no commit/push/merge/PR/publish/deploy · no overwrite of user work · no implementation prompt · no fabricated browser/e2e results.

---

## 6. Current-state architecture and identity lifecycle [CONFIRMED]

### 6.1 Four stores, two independent ledgers

| Store | Owner | Contents | Evidence |
|---|---|---|---|
| `vyuh.mock.accounts.v1` | `src/mock-data/accounts.js:28` | Canonical identity/lifecycle: `accounts`, `issuedInstituteIds`, `counters`, `config`, `audit`. **No secrets.** | `:125-166`, `:295-367` |
| `vyuh.mock.auth.v1` | `src/services/mock/auth.js:42` | `accounts[key].user/salt/passwordHash`, `attempts` (lockout), `challenges`, `resets`, `acceptedInvites` | `:50-75`, `:140-183` |
| `vyuh.mock.admin.v1` | `src/services/mock/admin.js:35` | `createdUsers`, `batchFaculty`, `policies`, `approval/integrity/moderation` decisions, `branding`, `audit`, `importSerial`, `auditSerial` | `:54-70`, `:130-151` |
| `vyuh.session` | `src/shared/lib/sessionPersistence.js` | Session envelope; status revalidated via `setAccountEligibilityCheck` (`auth.js:281-286`) | Batch 2 report §13 |

**Two audit systems exist:**
1. `admin.js:130-146` `recordAudit()` → `store.audit` in `vyuh.mock.admin.v1`, merged with `auditSeed` (`src/mock-data/auditLog.js:44-145`) by `ledger()` (`admin.js:114-116`) and surfaced by `listAudit()` (`admin.js:987-1028`) → `/admin/audit`.
2. `accounts.js:344-367` `createAccountAuditEntry()`/`appendAccountAudit()` → `db.audit` in `vyuh.mock.accounts.v1`, whitelisted to `id/at/actorId/target/action/reason` (`:89`), **no UI reads it**.

### 6.2 Identity lifecycle as implemented

`provisionInstituteAccount(input, options)` — `auth.js:225-274` — is **not** on the `AuthService` facade (`types.js:29-45`) and is reachable from no route. It: parses `instituteAccountInputSchema` (`authSchemas.js:99-106`); rejects `role:'admin'` with `admin_provisioning_not_available` (`:229-231`); calls `issueInstituteId()` (`accounts.js:247-293`); generates the temporary password (`:236`); builds `status:'active'`, `mustChangePassword:true`, `credentialDelivery:'pending'`, `rollNumber:null`, `instituteCode:null`, `batchId/batchName` (`:240-260`); writes salt+digest to the auth DB (`:265-266`) then the registry (`:267`); returns `{ account, credentials:{ instituteId, temporaryPassword } }` **once, in memory** (`:269-272`).

`authService.login()` (`auth.js:290-324`) resolves one identifier through `loginIdentifierSchema` (email **or** Institute ID), checks the digest, then enforces registry status (`suspended` `:316`, `archived` `:317`, `locked` `:318`, other `:319`). `changePasswordWithSetup()` (`:338-367`) uses `writePassword(..., {clearAttempts:false})` (`:357`), sets `mustChangePassword:false`, `temporaryPasswordIssuedAt:null`, `credentialDelivery:'delivered'` (`:363`). Session restore checks `record.status === 'active'` (`:281-286`).

### 6.3 Significant confirmed findings

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| F-1 | `admin.js:149-151` `roster()`; `:364-407` `listUsers()`; `accounts.js:306-308` `listAccounts()` | `/admin/users` reads only `[...adminUsers, ...store.createdUsers]`. Canonical accounts in `vyuh.mock.accounts.v1` are invisible to the People page, dashboard, batch detail and CSV duplicate checks. | Merge `roster()` with registry-backed `institute_issued` accounts, deduped by `instituteId`/`email`; keep 720 seeded users and existing `user-row`/`users-count` test IDs. | Duplicate rows, wrong counts, orphan accounts, broken `admin-console.test.jsx:24,35,67` assertions. | Unit: create → list → assert exactly one row; assert seeded totals unchanged; assert dedupe when a row exists in both stores. |
| F-2 | `admin.js:470-484` `commitImport()`; `admin.js:487-497` | Imported rows are `status:'invited'`, `id:'stu-imp-NNNN'` / `'fac-imp-NNNN'`, no `instituteId`, no digest, no registry entry. | Bridge commit to `provisionInstituteAccount()`/registry so each committed row becomes a loginable account. | Imported accounts cannot sign in; blueprint §5.5 `:680` still true. | E2E-listed/unit: import clean row → credential → login → `/setup-account` → dashboard. |
| F-3 | `accounts.js:66-69` `DEFAULT_INSTITUTE_ID_CONFIG.year: null`; `:251-258` `issueInstituteId()`; `:173-188` `configureInstituteIds()`/`instituteIdConfig()` | Student ID allocation **hard-fails** with `institute_year_not_configured` when `year` is null. No UI or bootstrap ever calls `configureInstituteIds()`; `institute-auth.test.js:80-90` asserts this with a test-only `'99'`. | Provide an Admin-only surface that accepts the **institute-supplied** two-digit token, validates `/^\d{2}$/`, and persists via `configureInstituteIds()`; no `Date`, no rollover, no invented default. | Create Student fails out of the box; CSV import of any student fails. | Unit: null → explicit blocked error; valid `'26'` → `VYU-S-26-0232`; reject `'2026'`, `''`, `Date`-derived values; faculty creation works with `year:null`. |
| F-4 | `auth.js:129-137` `findAccount()`; `:164-167` `passwordMatches()`; `provisionInstituteAccount` stores `db.accounts[instituteId]` (`:265`) | A newly issued account's digest is keyed by Institute ID only. `loginIdentifierSchema` accepts an email, but `findAccount(email)` finds the registry record with **no `passwordHash`**, so `passwordMatches` rejects it. Also no duplicate-email check exists in provisioning. | Keep Institute ID as the sole login identifier for institute accounts; correct UI/fixture copy that calls email "the sign-in address"; add a shared duplicate-email check across registry + admin ledger + demo fixtures. | Users cannot log in with the email they supplied; two accounts with one email make `accountByIdentifier()` ambiguous. | Unit: email login for issued account fails generically (no enumeration); duplicate email rejected at create/import; Institute ID login succeeds. |
| F-5 | `admin.js:130-143` `recordAudit()`; `:364,422,436,528,587,987` `_adminId` | Every method ignores its `adminId`; actor is hardcoded `adminProfile.id/name` (`institution.js:20-29`). | Derive `actorId`/`actorName` from the signed-in Admin session with a demo fallback; keep the existing seeded ledger untouched. | Recovery/account actions are attributed to the wrong person — breaks G4 "auditable". | Unit: assert `actorId` equals the session Admin id for a new action; seeded `auditSeed` entries unchanged. |
| F-6 | `admin.js:258-277` `userFacets()`; `AdminUsersPage.jsx:13-17` `StatusBadge()`; `contracts/admin.js:17-20` | `AdminUserStatus` is now 5 values, but facets enumerate only `active/invited/suspended` and the badge renders anything else as "Suspended". `contracts/admin.js:17-19` explicitly says the extra values are "not by the Admin People UI" — a Batch 2 statement Batch 3 must now reconcile. | Add `locked`/`archived` facets and badges; keep additive status vocabulary. | Mislabelled locked/archived accounts in the People UI. | Unit: render each of the 5 statuses and assert correct label/tone. |
| F-7 | `AdminUsersPage.jsx:65`; `AdminImportPage.jsx:239-240`, `:605`; `importCsv.js:16` | Copy says accounts "arrive by CSV import or invitation" and "the person sets their own password on first sign-in"; `IMPORT_FIELDS` calls email "The sign-in address". | Replace with Admin-issued Institute ID + one-time temporary credential language. | Misleading flow; contradicts the retired public signup (S3 §11 `:156`). | Source-level assertion in the admin-accounts suite that no "sets their own password" / "invitation" copy remains. |
| F-8 | `auth.js:265-267`; `latency.js:78-98` `simulate()` | Provisioning performs two separate `localStorage` writes with no rollback. `simulate()` injects failures **before** `produce()` (safe) but `structuredClone()`s the returned plaintext. | For batch operations, compute one registry snapshot + one auth DB write, then one `recordAudit`; never let a cloned credential enter any cache. | Partial account creation / orphan digest / ID burned on failure; plaintext clone leak. | Unit: simulated mid-batch failure leaves no partial account and no reserved ID; assert no credential in `localStorage`, query cache, or console. |
| F-9 | `accounts.js:54-63` `credentialPolicy`; `:57` `expiresByTime:false`; S3 §18 `:286` | Unused temporary credentials stay valid indefinitely until revocation/re-issue. | Batch 3 re-issue + suspend/archive are the mitigation; do **not** invent a time-expiry rule. | Dormant credential exposure (documented Batch 3 security dependency). | Unit: re-issue invalidates old temp; suspend blocks login; no new expiry field is added. |
| F-10 | `contracts/user.js:58` `credentialDelivery`; `auth.js:252` sets `'pending'`; `:363` sets `'delivered'` | `'shown'` is never set by any code path. | Set `'shown'` when the one-time sheet is displayed (metadata only, no value). | Sheet state cannot be audited/asserted; "shown once" has no backing state. | Unit: display → `credentialDelivery === 'shown'`; setup → `'delivered'`; no retrieval path. |

---

## 7. Route compatibility, guard chain and all 33 v2 aliases [CONFIRMED]

### 7.1 The five Batch 3 routes named in the directive

| Route | Current target | Evidence | Batch 3 requirement |
|---|---|---|---|
| `/admin/users` | `AdminUsersPage` | `AppRoutes.jsx:232` | Enhance in place with two tabs, Create User, row actions. **Do not create a duplicate page.** |
| `/a/people` | `V2Redirect` → `/admin/users`, `provisional: true` | `v2RouteTable.js:58`; `AppRoutes.jsx:224-226` | Keep the redirect. Optionally drop `provisional` once tabs land; no new route/page. |
| `/admin/users/import` | `AdminImportPage` | `AppRoutes.jsx:233` | Bridge commit; keep 4-step `Stepper` and all validation. |
| `/a/people/import` | `V2Redirect` → `/admin/users/import` | `v2RouteTable.js:59` | Keep unchanged. |
| `/admin/audit` | `AdminAuditPage` | `AppRoutes.jsx:241` | Add action labels/tones; keep read-only. |

### 7.2 Guard chain

`AppRoutes.jsx:221-248`: `RequireAuth → RequireRole allow={['admin']} → RequirePasswordChange → V2_ROUTE_ALIASES.admin + V2_NAMESPACES('/a') → /admin/*`. `guards.jsx:12-58` confirms deep-link preservation and role-mismatch isolation. `/setup-account` sits outside `RequirePasswordChange` (S3 §11 `:157`), so newly created accounts are correctly diverted there. **No guard or route change is required for Batch 3.**

### 7.3 All 33 aliases

`v2RouteTable.js:28-68`: student 11 (`:29-41`), faculty 12 (`:42-55`), admin 10 (`:56-67`) = **33**; `V2_ROUTE_MATRIX` (`:82-86`). `V2_NAMESPACES` (`:75-79`) catches unlisted `/s/*`, `/f/*`, `/a/*`. `tests/unit/v2-routes.test.jsx:52-58` generates one positive-resolution test per alias, `:76-81` one wrong-role denial per alias, plus 5 explicit tests = **77 tests** (S3 §11 `:155`). `registration-retirement.test.jsx` asserts `V2_ROUTE_MATRIX.length === 33`. `ADMIN_NAV` (`AdminLayout.jsx:13-25`) and `CRUMB_RULES` (`:27-35`) use canonical paths only.

| # | Evidence | Current behaviour | Required change | Risk | Test |
|---|---|---|---|---|---|
| F-11 | `v2RouteTable.js:58`, `:82-86`; `tests/unit/v2-routes.test.jsx:52-81` | `/a/people` is a working provisional redirect; all 33 aliases guarded identically. | Preserve all 33 mappings, paths, params, query/hash/state and role guards verbatim. If `provisional` is removed, only the note string changes. | Regression of the 77-test route suite; deep-link loss; duplicate People pages. | Re-run `v2-routes.test.jsx` unchanged; add `/a/people?tab=faculty` hash/query preservation assertion; assert `V2_ROUTE_MATRIX.length === 33`. |

---

## 8. Capability gap A — `/a/people` with Students + Faculty tabs (no Password Requests tab)

`AdminUsersPage.jsx:24-203` is a single paged 25-row table with search, role, batch and status `Select` filters (`:28-30`, `:88-103`), one primary "Import a CSV" link (`:77-85`), and no tabs, no Create User, no row actions. `useAdminUsers()` (`useAdmin.js:40-48`) reads `services.admin.listUsers()`. The `Tabs`/`TabList`/`TabPanel` primitive already exists (`src/shared/ui/Tabs.jsx:34-49`, exported at `src/shared/ui/index.js:21`); admin pages currently use local `TABS` arrays plus segmented buttons (e.g. `AdminApprovalsPage.jsx:12-17`), so either pattern is available.

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| A-1 | `AdminUsersPage.jsx:24-103`, `:127-170` | One ledger with a free-form role filter; no tabs. | Add exactly **two** ARIA tabs, *Students* and *Faculty*, driving `query.role`; retain search/batch/status filters, 25-row paging, empty/error/loading states and `data-testid="user-row"`/`users-count`. | Adding a third "Password requests" tab would violate the directive; removing the existing role filter could break `admin-console.test.jsx:31-39`. | Unit: two tabs only, ARIA roles/keyboard arrows; faculty tab count = seeded + created faculty; no "Password requests" string anywhere. |
| A-2 | `AdminUsersPage.jsx:77-85`; `scripts/check-architecture.mjs:131-140` | One filled ember primary (`bg-ember` link). The architecture lint allows **one** filled ember primary per view file (`:135-140`). | If "Create user" becomes the primary, demote "Import a CSV" to `variant="secondary"` (or vice versa). | `npm run lint` fails on two ember primaries. | Architecture lint (`npm run lint`) assertion; source count of `bg-ember` primary surfaces. |
| A-3 | `AdminUsersPage.jsx:13-17`, `:65`, `:73`; `admin.js:258-277` | `StatusBadge` collapses `locked`/`archived` into "Suspended"; facets omit them; meta says "invitations pending"; description claims invitation-based arrival. | Reconcile with the 5-value additive vocabulary; correct copy to Admin-issued credentials. | Misleading states; C1 forbids deleting tests to hide regressions. | Unit: 5 status labels; source assertions on stale copy. |
| A-4 | `admin.js:364-407` `listUsers()`; `accounts.js:306-308` `listAccounts()` | `listUsers` returns `AdminUser` rows (`:390-406`) with no `instituteId`, `mustChangePassword`, `credentialDelivery` or `source`. | Extend the response **additively** with `instituteId`, `mustChangePassword`, `credentialDelivery`, `source`, `phone`, `statusChangedAt`; keep every existing field (`id/name/initials/email/role/status/batchId/batchName/rollNumber/joinedAt/lastActiveAt`) so `AdminUser` consumers keep working. | Shape drift breaks `getAdminBatch()` (`:535-550`), `getDashboard()` (`:283-359`), `policyImpact()` and UI formatters. | Unit: `listUsers` row satisfies both the old `AdminUser` shape and the new additive fields; 720/749/753 count assertions updated per C1. |

---

## 9. Capability gap B — Create User (student and faculty only)

`AdminService` (`types.js:193-216`) has no `createUser`. `adminService` (`admin.js:280-1075`) has no mutating user methods. `instituteAccountInputSchema` (`authSchemas.js:99-106`) accepts `role`, `name`, `email`, `phone?`, `batchId?`, `batchName?` — no `rollNumber`. `CreateUserDialog` and `PeopleTabs` do not exist.

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| B-1 | `auth.js:225-274` `provisionInstituteAccount()`; `types.js:193-216` | Foundation helper exists but is unreachable from any UI or service facade. | Add `adminService.createUser(adminId, input)` that validates role ∈ {student, faculty}, resolves the batch from `adminBatches`, checks duplicate email/roll number, then calls `provisionInstituteAccount()`; return `{account, credentials}` once. | A service→service import inside `src/services/mock` is permitted by `check-architecture.mjs:86-94` (only `mock-data` boundaries are restricted). | Unit: student + faculty creation; one-time credential returned exactly once; `role:'admin'` rejected with `admin_provisioning_not_available`; no ID burned on rejection. |
| B-2 | `auth.js:229-231`; `adminMath.js:210-212` ; `importCsv.js:71` | Admin role rejected in provisioning; `validateImport()` rejects `admin` with "Office seats are created by the trust, not by import". | Preserve both guards. | Admin-created Admin accounts would violate the directive. | Unit: create-user and CSV paths both reject `role:'admin'`; `issuedInstituteIds` unchanged. |
| B-3 | `accounts.js:66-69`, `:247-293`; `institute-auth.test.js:80-90` | `year:null` blocks every student ID; no configuration surface exists. | Admin-only two-digit year-token control writing through `configureInstituteIds()` (§4 B-8, §6 F-3). **No `Date`, no rollover, no invented value.** | Without it, Create Student and student CSV import are dead features. | Unit: blocked state with explicit message; valid token; faculty unaffected; token never derived from current year. |
| B-4 | `auth.js:252-260` `record`; `importCsv.js:14`, `:16` | Created records carry `rollNumber:null`; CSV requires `VY-YY-NNNN` roll numbers; `instituteAccountInputSchema` has no `rollNumber`. | Decide whether Create User collects an optional roll number; if so, add it **additively** to the input schema and record, keeping it separate from `instituteId`. [OPEN] U-4 covers this. | Confusing two identifiers would break G1. | Unit: `instituteId !== rollNumber`; both stored; `parseInstituteId(rollNumber)` returns null for `VY-26-4101`. |
| B-5 | `auth.js:228-267`; `accounts.js:242-243`, `:287-292` | No duplicate-email check; `issueInstituteId()` deliberately returns an **unpersisted** DB for one atomic caller write. | Add a shared duplicate check and keep the atomic-write pattern; for multi-row creation chain `issueInstituteId(role, db)` then one `saveAccountsDb()`. | Duplicate logins, ID reuse, partial rows. | Unit: duplicate email/roll rejected; 20-row batch allocates distinct never-reused IDs; failure leaves zero partial records. |
| B-6 | `adminMath.js:157-161` `batchByKey`; `batchesAdmin.js:86-195`; `src/mock-data/batches.js:4-8` | Admin batches include `bat-neet-13`; student-side `batches.js` does **not**. | Resolve `batchId`/`batchName` from a single authoritative list; see §15 D-3. | A created student in `bat-neet-13` silently resolves to `bat-prayas-m`. | Unit: create in every active admin batch → `resolveStudent()` yields the same `batchId`. |
| B-7 | `contracts/admin.js:89-102` `AdminUser`; `contracts/user.js:44-65` `InstituteAccount` | Two shapes with overlapping but different field sets. | Add a `CredentialSheetRow` / `CreateUserResult` typedef (transient), plus `createUser` in `types.js` and `api/index.js:129-135` `adminMethodNames` (honest 501 stub — `:122-140`). No backend endpoint. | HTTP facade shape drift; `auth-mode.test.js`-style parity failure. | Unit: `Object.keys(mockServices.admin)` and `Object.keys(apiServices.admin)` match; API method rejects with `admin_api_unavailable`. |

---

## 10. Capability gap C — one-time credentials sheet, Copy and Download CSV

No `CredentialSheetRow` typedef exists in the repository (verified by grep); `contracts/auth.js:98-106` defines only the credential-free `CredentialAuditEvent`. S2 §9 Step 5 (`:392`) planned a "contract only" row with **no plaintext field**; Batch 3 needs a transient row that carries the value in memory. `csvFromColumns()` (`adminMath.js:340-347`) is a pure CSV serializer and `AdminImportPage.jsx:108-119` `downloadSample()` already implements the `Blob` + `URL.createObjectURL` + `anchor.click()` + `revokeObjectURL()` download pattern. `Dialog`/`Sheet` (`shared/ui/index.js:9,19`) and `RequireNoteDialog`/`ConfirmAction` exist.

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| C-1 | `contracts/admin.js:383-389` `ImportCommitResult`; `accounts.js:54-63` `credentialPolicy` | No credentials sheet, no Copy, no Download, no `CredentialSheetRow`. | Build `CredentialsSheet` from transient mutation results: Institute ID, temporary password, name, role, batch (column set [OPEN] U-1), a secure-sharing note, "password change required on first login", explicit one-time notice. Use `csvFromColumns()` + the existing download pattern. | Plaintext in the browser's Downloads folder is unavoidable once downloaded — the note must say so. | Unit: sheet rows === CSV rows; a11y dialog/sheet axe check; one-time visibility. |
| C-2 | G3 [APPROVED]; `auth.js:269-272`; `latency.js:92-95` `structuredClone` | Credential exists only in the returned object; `simulate()` clones it. | Keep credentials **only** in component-local state; never `useQuery`, `queryClient.setQueryData`, `localStorage`, `sessionStorage`, URL, log, audit or analytics. Call `mutation.reset()` and clear state on close/unmount. | Blueprint §3.5 `:302` `admin.credentials` query key would put plaintext in cache — **rejected** (§4 B-9). | Unit: after close, assert no credential in `localStorage`, `vyuh.session`, query cache, spied `console.*`, audit entries; re-open shows `••••••••` + "Password was shown once". |
| C-3 | `contracts/user.js:58`; `auth.js:252`, `:363` | `credentialDelivery` goes `pending → delivered` with no `'shown'` state. | Set `'shown'` on display (metadata only); never store the value. | No evidence of one-time delivery. | Unit: `credentialDelivery === 'shown'` after display; `'delivered'` after setup; no getter for the value. |
| C-4 | `useAdminOps.js:12-16` `useConsoleInvalidator()`; `useAdmin.js:18-25` `useAdminInvalidator()` | Every console mutation invalidates `['admin', adminId]`. | New mutation hooks must use the same invalidation so people/dashboard/audit refresh; must not invalidate by writing credentials. | Stale roster after creation; accidental credential caching. | Unit: create → `listUsers` refetch includes the new row; audit ledger shows one entry. |
| C-5 | `navigator.clipboard` (no existing use in admin) | No Copy action exists. | Per-value Copy is [OPEN] U-2; if approved, use an explicit button with `aria-label`, never auto-copy, and warn that the OS clipboard retains the value. | Clipboard is a plaintext egress channel; conflicts with a strict reading of "no permanent plaintext storage". | jsdom clipboard test with a stub; assert no automatic write. Real-browser clipboard unverified (no Chromium). |

---

## 11. Capability gap D — account lifecycle operations

`transitionAccountStatus()` (`accounts.js:326-336`) with `ALLOWED_TRANSITIONS` (`:72-78`) is the only status writer:

`active → suspended | locked | archived` · `invited → []` · `suspended → active | archived` · `locked → active | suspended | archived` · `archived → []` (terminal). Records are never deleted (`:320-321`), so issued IDs stay reserved.

`authService.login()` (`auth.js:315-319`) and session restore (`:281-286`) enforce those statuses. `writePassword()` (`:177-183`) defaults to `clearAttempts:true`; `unlockDemo()` (`:508-513`) clears the 15-minute failed-attempt lockout (`LOCK_MS` `:45`, `MAX_ATTEMPTS` `:47`) with **no reason and no audit**. `RequireNoteDialog` (`src/features/admin/components/RequireNoteDialog.jsx:27-110`) enforces a minimum-length note before confirm.

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| D-1 | `types.js:193-216`; `admin.js:280+` | No `suspend/reactivate/lock/unlock/archive/edit/move/reset` methods. | Add audited Admin methods, each with a **mandatory reason**, using `transitionAccountStatus()` and `recordAudit()`. | Unaudited state change; G4/R-8 violation. | Unit: every mutation writes exactly one visible audit entry and rejects an empty reason. |
| D-2 | `auth.js:177-183`, `:508-513`; `contracts/auth.js:87-96` `IssueTemporaryPasswordInput` | Re-issuance and explicit unlock do not exist; `unlockDemo` is demo-only and unaudited. | New re-issue helper with `{clearAttempts:false}`; new explicit unlock action. **Do not reuse `unlockDemo`.** | Recovery washing away lockouts (R-8). | Unit: failed-attempt lockout survives re-issue; only the explicit unlock clears it; demo seats unaffected. |
| D-3 | `accounts.js:72-78`, `:326-336`; `contracts/admin.js:17-20` | `invited` has no legal transitions; `archived` is terminal. | Imported rows must become canonical `active` accounts (§13), never "reactivated" from `invited`. Include `archive` only if [OPEN] U-4 approves it, with a terminal-state warning. | Invalid-transition errors, accidental irreversible archive. | Unit: full transition matrix; invalid transitions rejected; ID never reused after archive. |
| D-4 | `admin.js:535-550` `getAdminBatch()`; `batchesAdmin.js:93,111,128,147,165,183` `studentCount`; `AdminBatchDetailPage.jsx:37-41` `seededFor` | Members are derived from `roster(store)` but `studentCount`/`capacity` are static fixtures; `policyImpact()` (`adminMath.js:261-320`) uses those static counts. | Derive roster counts from the merged ledger or document a deliberate fixture/derived split; preserve the `seededFor` guard. | Dashboard, batch detail and policy impact disagree after move/create. | Unit: create/move → all three readers agree; `admin-console.test.jsx:24` 720 assertion updated per C1. |
| D-5 | `RequireNoteDialog.jsx:86-88` | Hint says the note "is what the other party reads" — wrong for account operations. | Parameterise `noteHint`/`noteLabel` for the record-only reason. | Misleading confirmation copy. | Unit: assert the account-operation dialog uses a record-only hint. |
| D-6 | `auth.js:340-365` `changePasswordWithSetup()`; `accounts.js:54-63` | Setup already clears `mustChangePassword`, rejects password reuse, and does not clear lockouts. | Preserve verbatim; no role special-case, no consent step. | Regression of 262 passing tests. | Re-run `first-login.test.jsx`, `institute-auth.test.js`, `guard-matrix.test.jsx` unchanged. |

---

## 12. Capability gap E — out-of-band recovery (no queue)

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| E-1 | `contracts/admin.js:445-465` `PasswordRequest` **typedef only**; `contracts/auth.js:87-96` `IssueTemporaryPasswordInput` contract only; `accounts.js:344-367` `createAccountAuditEntry()`/`appendAccountAudit()` | No request state, no UI, no route, no `issueTemporaryPassword()` implementation, no explicit Admin unlock. S3 §18 `:285` confirms contract/helper only. | Add **one** Admin action "Issue new temporary password" behind `RequireNoteDialog` (identity verified out-of-band), with a mandatory reason; return a NEW credential once via the same one-time sheet; set `mustChangePassword:true`, `temporaryPasswordIssuedAt`, `credentialDelivery:'pending'`; leave status/lockout untouched. | `writePassword` and `digest` are private to `auth.js` (`:140-143`, `:177-183`), so a **minimal additive export** in that Batch 2 file is needed — [OPEN] U-5. | Unit: old temp invalid, new temp works, setup required again, reason mandatory, audit contains no credential, lockout preserved. |
| E-2 | `auth.js:444-473` `requestReset()`/`resetPassword()` | Demo self-service reset works for the three seeded emails only; Institute-ID accounts get a generic response and no token. | Preserve verbatim (R-9). | Creating a real self-service recovery path would violate G4. | Re-run `registration-retirement.test.jsx` and `auth-service.test.js` reset cases unchanged. |
| E-3 | S2 §8.2 R-7/R-8 (`:337-338`); current directive | Recovery is out-of-band; no queue, no approve/decline lifecycle. | **EXCLUDED**: no `PasswordRequestsTab.jsx`, no `listPasswordRequests`, no `resolvePasswordRequest`, no third tab, no public request form. | Re-introducing a queue would re-open an approved decision. | Source assertion: no `passwordRequests` state, no `PasswordRequestsTab` file, no third tab. |
| E-4 | `accounts.js:344-356` `createAccountAuditEntry()` | Reason is enforced there (`audit_reason_required`), but `recordAudit()` (`admin.js:130-146`) accepts `note` as optional. | Validate reason **service-side** in every new Admin method; optionally add a `requireReason` option to `recordAudit` (additive only). | UI-only validation can be bypassed. | Unit: direct service call with `reason:''` rejects; audit `note`/`meta.reason` non-empty. |

---

## 13. Capability gap F — CSV import bridge

`commitImport()` (`admin.js:436-507`) re-validates with `validateImport()` (`adminMath.js:144-247`), constructs `invited` `AdminUser` rows (`:470-484`), pushes them to `store.createdUsers` (`:487`), writes **one** `import.commit` audit entry (`:489-495`), and persists only `vyuh.mock.admin.v1` (`:497`). `ImportCommitResult` (`contracts/admin.js:383-389`) = `created/skipped/invalid/names/auditId`. `useCommitImport()` (`useAdminOps.js:42-50`) invalidates the console. `AdminImportPage.jsx:228-263` renders the result card; `:588-609` the commit summary; `:172-183` `doCommit()`.

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| F-12 | `admin.js:436-507`; `adminMath.js:163-165` (`existingRolls`/`existingEmails` from `roster(store)`) | Duplicate detection ignores `vyuh.mock.accounts.v1`; committed rows never become loginable. | Validate against the **merged** roster + registry before any write; at commit, create canonical accounts and return transient credentials in an extended `ImportCommitResult`; show the same `CredentialsSheet`. | Duplicate emails across stores; `invited` rows with no digest; blueprint §4.4.1 `:533` remains true. | Unit: clean import → N credentials → each logs in → forced setup; duplicate in registry rejected with the existing row-level error. |
| F-13 | `AdminImportPage.jsx:239-240`, `:605`; `AdminUsersPage.jsx:65` | "Each account arrives invited, so the person sets their own password on first sign-in." | Replace with Admin-issued credential copy. | Contradicts retired public signup (S3 §11 `:156`). | Source assertion; `admin-console.test.jsx:41-73` result-card assertions updated per C1. |
| F-14 | `importCsv.js:13-21`, `:36-77`; `adminMath.js:20`, `:210-212`, `:218-220` | 7 columns; `rollNumber` required `VY-YY-NNNN`; `role` optional (defaults student), `admin` rejected; students require a batch; email hint says "sign-in address". | Keep row validation and the messy/clean samples intact; correct the email hint; keep `role ∈ {student, faculty}` rejection. | Blueprint Batch 3 `:873` "optional credential column" would persist plaintext in a sheet — **recommend override** ([OPEN] U-1). | Re-run `admin-console.test.jsx:41-73` (8 errors → 7 → 0, commit 4, audit row) unchanged except count/copy assertions; e2e `admin.spec.js:39-71` listed only. |
| F-15 | `admin.js:462-487` `store.importSerial`; `accounts.js:247-293` | Import IDs `stu-imp-0001` are independent of the never-reused Institute ID series. | Decide the merge strategy: either stop writing `createdUsers` for new imports and derive them from the registry, or write a thin roster row carrying `instituteId` and dedupe. | Double-counted rows; `admin-console.test.jsx:67` asserts `753 accounts` after 4 rows. [RECOMMENDATION] use one canonical row only. | Unit: after import, `listUsers()` returns exactly one row per committed account with both `instituteId` and `rollNumber`; counts unchanged. |
| F-16 | `auth.js:265-267`; `admin.js:497` | Two separate persistence layers, no transaction across N rows. | Pre-validate all rows (including year token and duplicates), then write one registry snapshot + one auth DB snapshot + one audit entry (§6 F-8). | Partial import after a mid-loop failure; burned IDs. | Unit: injected failure on row k leaves no account and no ID reservation for any row. |

---

## 14. Capability gap G — audit integration

`AUDIT_ACTIONS` (`src/mock-data/auditLog.js:16-32`) has 15 keys, none for account operations. `auditSeed` (`:44-145`) is immutable seeded history; it includes `aud-1013` "Consent version · 2026-2 published to 720 accounts" (`:107-109`), `aud-1015` "18 faculty invitations" (`:116-119`) and `aud-1007` "6 accounts created from a CSV import" (`:76-79`). `listAudit()` (`admin.js:987-1028`) builds actor/action facets from `ledger(store)` (`:990`), so new actions appear automatically. `AdminAuditPage.jsx:10-26` `ACTION_TONES` falls back to `'neutral'` (`:156`); `admin.js:1012,1019` falls back to the raw action key as a label.

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| G-1 | `auditLog.js:16-32`; `AdminAuditPage.jsx:10-26` | No `user.create`, `user.suspend`, `user.credential.reissue`, etc. labels/tones. | Add **additive** keys + labels + tones (e.g. `user.create`, `user.suspend`, `user.reactivate`, `user.lock`, `user.unlock`, `user.archive`, `user.edit`, `user.batch.move`, `user.credential.reissue`); keep all 15 existing keys and the 20 seeded entries byte-identical. | Raw action keys shown in the ledger; seeded history altered. | Unit: every new action resolves to a human label/tone; `auditSeed.length === 20`; existing labels unchanged. |
| G-2 | `admin.js:114-146` `ledger()`/`recordAudit()`; `accounts.js:344-367` | Two audit stores; only `vyuh.mock.admin.v1` is visible. | Use `recordAudit()` as the **single visible ledger** for all Admin People mutations. Do not write duplicate visible entries into `db.audit`; keep the registry helper contract-only unless a separate registry-only event is explicitly required. [RECOMMENDATION] | Divergent records, double-counted events, unclear source of truth. | Unit: one mutation → exactly one new `listAudit()` item; `db.audit` unchanged. |
| G-3 | `admin.js:489-495` `commitImport` audit; `contracts/auth.js:98-106` `CredentialAuditEvent` | `import.commit` has `note` and `meta` but no `reason` field; credential events have no implementation. | Require `reason` for account/credential mutations and put it in `note`/`meta.reason`; audit metadata must **never** carry a credential (G3). | Credential leak into `meta`; unattributable actions. | Unit: scan serialized audit entries for any generated password; assert reason present. |
| G-4 | `admin.js:133-143` `recordAudit()` actor; `institution.js:19-29` `adminProfile` | Hardcoded actor (§6 F-5). | Derive from the session Admin for new entries; keep seeded entries untouched. | Misattribution defeats "auditable". | Unit: session-actor assertion; `admin-console.test.jsx:69-72` audit-row assertion still passes. |
| G-5 | `auditLog.js:107-119`; S3 §9 `:127-135` | Seeded entries mention consent versions and invitations. | **Do not** interpret these as approval for G5 consent or a new invitation flow; do not edit the seeded ledger. | Fabricating policy/invitation features. | Source assertion: no `ConsentFields.jsx` change, no new invitation route. |

---

## 15. Capability gap H — downstream workspace, roster and count propagation

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| H-1 | `src/features/faculty/hooks/useFaculty.js:12-14` `useFacultyId()`; `auth.js:241-243` `record.id = instituteId` | A newly created faculty session resolves `facultyId = 'VYU-F-0043'` (Institute ID), not a `fac-*` fixture id. | Keep `useFacultyId()` unchanged; make every downstream service accept the new id honestly. | Query keys `['faculty', id, …]` (`queryClient.js:73-106`) work, but data is wrong (H-2). | Unit: create faculty → login → `useFacultyId()` equals issued ID → dashboard resolves. |
| H-2 | `src/services/mock/faculty.js:44-46` `storageKey()`, `:134-137` `facultyName()`, `:142-158` `composeBank()`, `:294-296` `composeExams()`, `:647-665` `getDashboard()`, `:135-137` | For ANY id the service clones the static `facultyDashboard` and composes the **shared fixture** question bank, exams, classes, recordings and doubts; name becomes `'Faculty member'`. A new teacher would see the demo teacher's academic data. | Decide honest "own" data ([OPEN] U-3): prefer an empty/own-data workspace for `source:'institute_issued'` accounts while preserving the demo seat. Use the account's real `name`. Do **not** fabricate classes, recordings, subjects or assignments. | Blueprint §4.5 `:592` acceptance fails; fabricated academic records. | Unit: new faculty sees zero seeded classes/recordings/bank entries and their own name; demo `fac-snehasish` data unchanged. |
| H-3 | `src/mock-data/batchesAdmin.js:32-79` `facultyRoster`; `admin.js:511-526` `listAdminBatches()`, `:552-558`, `:587-618` `saveBatchFaculty()` | The roster is a static module-level array; a new faculty is not assignable and `leadFacultyName`/`facultyNames` cannot resolve it (`?? id`). | Derive extra faculty from `listAccounts()` where `role==='faculty' && source==='institute_issued'` and merge it in `admin.js`; do not mutate the fixture array. | `/admin/batches/:batchId` cannot see the new teacher; `faculty_unknown` error on assignment. | Unit: created faculty appears in `availableFaculty`, can be assigned, and the batch detail shows their name; `aud-1005`-style audit entry written. |
| H-4 | `src/services/mock/students.js:32-44` `resolveStudent()`; `src/mock-data/batches.js:4-8`; `:10` `studentBatchId` | Non-demo students are resolved from the persisted session with `rollNumber:'Pending allotment'` and `batchId` looked up in the **student-side** `batches.js`, which lacks `bat-neet-13`. | Reconcile the two batch lists without a redesign; preserve `rollNumber` separation. | Silent fallback to `bat-prayas-m`; wrong dashboard batch. | Unit: for each active admin batch, `resolveStudent().batchId` matches the created account. |
| H-5 | `src/services/mock/students.js:58-171` (multiple `resolveStudent()` calls then shared fixtures) | New students see the demo student's exams, attempts, reports, notifications and analysis. | Same honest-data decision as H-2 ([OPEN] U-3); do not fabricate academic history. Batch 1's exam registry already limits playable exams to NEET practice. | Fabricated results/attempts. | Unit: newly created student has no seeded attempts; demo `stu-ananya` unchanged. |
| H-6 | `admin.js:283-359` `getDashboard()`; `adminMath.js:261-320` `policyImpact()`; `institution.js:207-248` `adminAlerts` | Dashboard student count = `roster(store).length`; alert-04 mentions consent, alert-05 "invitations … unaccepted". | Recompute after the ledger merge; do not add a "password requests" alert (§4 B-10); do not treat seeded consent copy as policy approval. | `admin-console.test.jsx:24` 720 assertion; misleading alerts. | Unit: dashboard count equals merged People count; no new invitation/consent flow. |

---

## 16. Query cache, hooks, service contracts and API facade parity

| # | Evidence (path:line, symbol) | Current behaviour | Required change | Risk | Test recommendation |
|---|---|---|---|---|---|
| Q-1 | `src/app/providers/queryClient.js:9-21`, `:109-136` `queryKeys.admin` | `QueryClient` has `staleTime:30_000`, `gcTime:5m`, `retry:2`, focus/reconnect refetch; keys are `['admin', adminId, …]`. | Any new read key must stay under `['admin', adminId, …]` so `useConsoleInvalidator()` (`useAdminOps.js:12-16`) invalidates it. **Never** add `admin.credentials` (§4 B-9). | Stale People rows; plaintext in cache. | Unit: invalidation covers every new read key; assert no query key contains a credential value. |
| Q-2 | `useAdmin.js:40-48` `useAdminUsers()`; `useAdminOps.js:42-50`, `:121-129` | `placeholderData: previous` is used for lists; mutations invalidate the console namespace. | Keep for lists; for credentials use `useMutation` only, `reset()` on close; no `setQueryData`. | Mutation state retains plaintext until GC. | Unit: close sheet → `mutation.data` cleared; no query cache entry. |
| Q-3 | `src/services/types.js:193-216` `AdminService`; `src/services/api/index.js:129-140` `adminMethodNames`/`adminApi` | HTTP facade has 23 methods, all rejecting with honest `501 admin_api_unavailable` (`:122-127`); there are **no** admin endpoints. | Add each new method name to both `AdminService` and `adminMethodNames`; keep the 501 stub. **No backend/API code.** | Mock/HTTP shape drift; pretending endpoints exist. | `auth-mode.test.js`-style parity test: method-name sets equal; API method rejects with `admin_api_unavailable`. |
| Q-4 | `scripts/check-architecture.mjs:86-94`, `:131-140` | Presentation must not import `mock-data`/`services/mock`; mock services must import fixtures via `mock-data/index.js`; one filled ember primary per view. | New UI must go through hooks/services; `admin.js` importing `./auth.js` is same-layer and allowed; new registry helpers must be read through the barrel (`mock-data/index.js:38-47`). | Architecture lint failure. | `npm run lint` on the final state. |
| Q-5 | `src/shared/ui/index.js:5-24`; `Tabs.jsx`, `Dialog.jsx`, `Sheet.jsx`, `RequireNoteDialog.jsx`, `ConfirmAction.jsx` | All required primitives exist; no new dependency is needed. | Reuse them; no package/lockfile change. | Unnecessary dependency or redesign. | `package.json`/`package-lock.json` byte-identical check. |
| Q-6 | `src/services/mock/index.js:5-35`; `src/services/index.js:14-25`; `src/shared/lib/services.js` | `services.admin` is `adminService`; no `provisionInstituteAccount` is on the facade. | Keep the facade unchanged; the new helper is imported directly inside `admin.js`. | Exposing a credential-returning helper on the public `Services` object. | Source assertion: `mockServices.auth` keys unchanged. |

---

## 17. File-by-file impact map (prospective — nothing has been edited)

### 17.1 Files that would be **newly created** (Batch 3, after authorization)

| Path | Purpose | Risk | Test |
|---|---|---|---|
| `src/features/admin/components/PeopleTabs.jsx` | Exactly two ARIA tabs (Students / Faculty). | Third tab regression; `Tabs` keyboard contract. | `admin-accounts.test.jsx` tab/ARIA tests. |
| `src/features/admin/components/CreateUserDialog.jsx` | Role (student/faculty), name, email, phone, batch; Institute-ID config gate; no admin role. | Duplicate email; year-token blocked state; two ember primaries. | Create-user unit matrix. |
| `src/features/admin/components/CredentialsSheet.jsx` | One-time viewing, Copy (if approved), CSV download, secure-sharing note. | Plaintext egress; clipboard; query cache. | No-plaintext + row-equality tests. |
| `src/features/admin/components/AccountRowActions.jsx` | Suspend/reactivate/lock/unlock/archive/edit/move/re-issue behind `ConfirmAction`/`RequireNoteDialog`. | Unaudited mutation; wrong status transition. | Transition-matrix tests. |
| `src/features/admin/components/InstituteIdConfigPanel.jsx` *(recommended)* | Institute-supplied two-digit year token via `configureInstituteIds()`. | Inventing a token; coupling to Settings. | Config tests (§6 F-3). |
| `tests/unit/admin-accounts.test.jsx` | New focused suite (ID uniqueness, no-plaintext, statuses, reasons, import bridge, roster merge, aliases). | C1: do not delete existing tests. | `npm test`. |
| `tests/e2e/admin-accounts.spec.js` *(prospective, unverified)* | Create→copy/download→close→login→setup→dashboard; suspend; re-issue. | **No Chromium**; cannot be executed here. | `npx playwright test --list` only. |

**Explicitly NOT created:** `PasswordRequestsTab.jsx`, `ConsentFields.jsx` changes, any Admin-creation component, any backend/API/database file.

### 17.2 Files that would be **modified** (with exact evidence)

| Path | Symbol / lines | Current behaviour → required change | Risk / test |
|---|---|---|---|
| `src/features/admin/pages/AdminUsersPage.jsx` | `AdminUsersPage()` `:24-203`, `StatusBadge()` `:13-17`, header `:62-86` | Add tabs, Create User, row actions, 5-status badges, corrected copy; keep one ember primary. | A-1…A-4; `admin-console.test.jsx:31-39`. |
| `src/features/admin/pages/AdminImportPage.jsx` | `doCommit()` `:172-183`, result card `:228-263`, commit summary `:588-609` | Render one-time credentials on commit; correct "sets their own password" copy; keep the 4-step wizard. | F-13; `admin-console.test.jsx:41-73`. |
| `src/services/mock/admin.js` | `roster()` `:149-151`, `userFacets()` `:258-277`, `recordAudit()` `:130-146`, `listUsers()` `:364-407`, `commitImport()` `:436-507`, `getAdminBatch()` `:528-585`, `saveBatchFaculty()` `:587-618`, `getDashboard()` `:283-359`, `listAudit()` `:987-1028` | Merge canonical accounts; add all mutating methods; session-derived actor; mandatory reason; derived faculty roster/counts; bridge import. | F-1, F-2, F-5, F-6, G-1…G-4, H-3; every admin-console test. |
| `src/services/types.js` | `AdminService` `:193-216` | Add new method signatures; no `revealPassword`/`getPlaintext`. | Q-3 parity. |
| `src/contracts/admin.js` | `AdminUserStatus` `:17-20`, `AdminUser` `:89-102`, `ImportCommitResult` `:383-389`, `PasswordRequest` `:445-465` | Additive `CredentialSheetRow`, `CreateUserResult`, extended results; **keep `PasswordRequest` typedef-only**. | Shape drift; B-7. |
| `src/features/admin/hooks/useAdminOps.js` | `useConsoleInvalidator()` `:12-16`, `useCommitImport()` `:42-50`, `useAuditLog()` `:121-129` | New mutation hooks with exact invalidation; credential mutations never cached. | Q-1, Q-2. |
| `src/features/admin/hooks/useAdmin.js` | `useAdminInvalidator()` `:18-25`, `useAdminUsers()` `:40-48` | Tab-aware query; keep `placeholderData`. | A-1, Q-1. |
| `src/app/providers/queryClient.js` | `queryKeys.admin` `:109-136` | Add **read-only** keys under the `admin` namespace; **no `credentials` key**. | §4 B-9. |
| `src/mock-data/auditLog.js` | `AUDIT_ACTIONS` `:16-32`, `auditSeed` `:44-145` | Additive action keys only; seeded 20 entries unchanged. | G-1, G-5. |
| `src/mock-data/importCsv.js` | `IMPORT_FIELDS` `:13-21` | Correct email hint; **no** credential column (recommendation). | F-14. |
| `src/shared/lib/adminMath.js` | `validateImport()` `:144-247`, `csvFromColumns()` `:340-347` | Accept a merged duplicate source; reuse the CSV serializer unchanged. | F-12, C-1. |
| `src/features/admin/pages/AdminAuditPage.jsx` | `ACTION_TONES` `:10-26`, render `:156-168` | Add tones for new actions; keep read-only. | G-1. |
| `src/services/api/index.js` | `adminMethodNames` `:129-135`, `adminError()` `:122-127` | Add method names to the 501 stub list; **no endpoints**. | Q-3. |
| `src/services/mock/auth.js` | `provisionInstituteAccount()` `:225-274`, private `writePassword()` `:177-183`, `digest()` `:140-143` | **Minimal additive** recovery helper with `{clearAttempts:false}`; no change to login/setup/reset/demo behaviour. **[OPEN] U-5.** | E-1, D-2; all 5 Batch 2 auth suites. |
| `src/services/mock/faculty.js` / `src/services/mock/students.js` | `getDashboard()` `:647-665`, `composeBank()` `:142-158`; `resolveStudent()` `:32-44` | Honest own-data behaviour for issued accounts **[OPEN] U-3**; fix `bat-neet-13` resolution. | H-2, H-4, H-5. |
| `tests/unit/admin-console.test.jsx` | `:20-73` (720 / 26 / 753 assertions) | Update counts/copy **per C1**, reporting each changed case individually; never delete to pass. | Full `npm test`. |
| `tests/unit/v2-routes.test.jsx`, `registration-retirement.test.jsx` | `:52-104`, alias count | Keep unchanged; add only a `/a/people` query-preservation assertion. | 77 tests + 33-alias count. |

### 17.3 Files that must remain **unchanged**

`src/mock-data/users.js`, `src/mock-data/institution.js` (all 749 `adminUsers` + 5 `adminAlerts`), `src/mock-data/accounts.js` (Batch 2 registry — reuse, no rewrite), `src/mock-data/batchesAdmin.js` (fixtures), `src/app/routes/v2RouteTable.js`, `src/app/routes/v2Aliases.jsx`, `src/app/routes/AppRoutes.jsx`, `src/app/routes/guards.jsx`, `src/app/layouts/AdminLayout.jsx` (nav/crumbs), `src/features/auth/pages/SetupAccountPage.jsx`, `src/services/authSchemas.js` (unless [OPEN] U-4 needs an additive field), `src/shared/lib/roles.js`, `src/shared/store/sessionStore.js`, `src/shared/lib/sessionPersistence.js`, `src/styles/tokens.css`, `src/index.css`, `scripts/check-architecture.mjs`, `package.json`, `package-lock.json`, all Batch 1 exam/learning/analysis files, all Batch 2 reports and plans, all 33 aliases, all 20 seeded audit entries, and every existing file not listed in §17.2. **No file is renamed or deleted.**

---

## 18. Decision table

### 18.1 Binding decisions — **NOT re-asked**

| ID | Class | Decision | Evidence |
|---|---|---|---|
| A-01 | [APPROVED] | Single institute, 3 roles, `admin` highest, no Super Admin/tenancy. | S2 §§1–3; directive. |
| A-02 | [APPROVED] | No public registration / invitation / OTP provisioning; no backend/API/DB/external auth. | S3 §11 `:156`; `api/index.js:122-140`. |
| A-03 | [APPROVED] | G1 ID shapes, never-reuse, institute-supplied `YY`, no `Date`/rollover, `rollNumber` separate. | `accounts.js:42-45,66-69,247-293`. |
| A-04 | [APPROVED] | G2 12 chars, exact alphabet/generator, no time expiry, mandatory setup. | `accounts.js:54-63,392-427`. |
| A-05 | [APPROVED] | G3 one-time viewing, no plaintext/retrieval/cache/audit/storage. | S3 §7; `contracts/auth.js:1-8`. |
| A-06 | [APPROVED] | G4 out-of-band, mandatory reason, no auto lockout clear, separate explicit unlock, demo reset only. | S2 R-7/R-8/R-9; `contracts/admin.js:445-465`. |
| A-07 | [APPROVED] | G5 blocked — no wording/version/acknowledgement structure. | S2 §8.3; S3 §9/§18. |
| A-08 | [APPROVED] | No Admin-created Admin accounts; exactly Students + Faculty tabs. | `auth.js:229-231`; directive. |
| A-09 | [APPROVED] | C1 test migration discipline; all 33 aliases preserved; demo seats intact. | S3 §§11,14. |
| A-10 | [APPROVED] | React+Vite+JS/JSX, existing mock architecture, no dependency/lockfile change. | `package.json`; `check-architecture.mjs`. |

### 18.2 Blueprint proposals already resolved by authority (do not implement)

`PasswordRequestsTab.jsx` · password-request queue/state/approve-decline · `FirstLoginPolicy` · `ConsentFields.jsx` consent step · `changePasswordWithSetup({policyVersion, consent})` · hardcoded `year:'26'` · `passwordRequests[]` · `listPasswordRequests`/`resolvePasswordRequest` · `admin.credentials` query key · `/admin/settings` as ID-config owner · "unlock clears lockout" as part of recovery · optional credential column in the import CSV (recommend override, see U-1) · consent acknowledgement count · `password requests` alert row. Rationale: §4.

### 18.3 New technical recommendations (no user input needed)

| ID | Recommendation | Why |
|---|---|---|
| N-1 | `/a/people` stays a redirect; enhance `/admin/users` in place. | No duplicate pages, all 33 aliases preserved. |
| N-2 | `recordAudit()` is the single visible ledger; `appendAccountAudit()` stays contract-only for Admin People mutations. | `listAudit()` reads only `vyuh.mock.admin.v1`. |
| N-3 | Derive audit actor from the session Admin, keep seeded entries untouched. | G4 auditability; F-5. |
| N-4 | Credentials live only in component state; `mutation.reset()` on close; never a query key. | G3; §4 B-9. |
| N-5 | Reuse `Tabs`, `Dialog`/`Sheet`, `RequireNoteDialog`, `ConfirmAction`, `csvFromColumns`, the existing Blob download pattern, and the `mock-data/index.js` barrel. | No dependency, no redesign. |
| N-6 | Pre-validate a whole import, then one registry snapshot + one auth snapshot + one audit entry. | Avoids partial rows and burned IDs. |
| N-7 | Additive-only contract/method changes; API facade keeps its honest 501 stubs. | No backend; Q-3. |
| N-8 | Institute-supplied year token gets a dedicated Admin-only control writing through `configureInstituteIds()`; never derived from `Date`. | F-3 — an implementation requirement, **not** a re-ask of A-03. |

### 18.4 Genuine unresolved decisions requiring user input **[OPEN]**

| ID | Question (framed so no approved decision is re-asked) | Default offered | Consequence if unanswered |
|---|---|---|---|
| **U-1** | Which columns should the **one-time credentials CSV** contain, and what should the file be named? (S2 Gate 3 / "CSV export columns still open".) The approved rule that it carries Institute ID + temporary password is not in question. | `instituteId, temporaryPassword, role, name, batchName` with a non-credential-bearing filename and a secure-sharing note. | Cannot finalise `CredentialSheetRow` or the download test; the sheet could expose more identity data than intended. |
| **U-2** | Is **per-value clipboard Copy** approved, and what exact **secure-sharing note** wording should be used? | Copy allowed only via an explicit labelled button, no auto-copy; note states the password is shown once, must be shared securely, is not retrievable, and a downloaded CSV remains on the device. | Copy is a plaintext egress channel; without wording, the sheet cannot satisfy "secure-sharing note". |
| **U-3** | For a **newly created** student/faculty, should workspaces show **honest empty/own data** or the existing seeded demo data? | Empty/own data only; demo seats keep their fixtures. Do not fabricate classes, recordings, subjects or assignments. | `faculty.js`/`students.js` would otherwise show the demo teacher's classes/bank/recordings and the demo student's attempts to a brand-new account (H-2/H-5). |
| **U-4** | Exact **edit scope**: may an Admin edit name/email/phone/batch and an optional `rollNumber`, and should **archive** (terminal, irreversible) be included alongside suspend/reactivate? | Edit name/email/phone/batch with duplicate checks; include archive with an explicit terminal-state warning; keep `instituteId` immutable. | `instituteAccountInputSchema` may need an additive field; `ALLOWED_TRANSITIONS` terminal state must be surfaced. |
| **U-5** | Is a **minimal additive helper** in `src/services/mock/auth.js` (re-using its private `writePassword`/`digest`, with `{clearAttempts:false}`) authorised for Admin-issued new temporary passwords, given the "no Batch 2 registry/auth implementation change" exclusion? | Additive export only; **no change** to login, setup, reset, demo seats, guards or existing exports. | Out-of-band recovery cannot be implemented without duplicating digest logic in `admin.js` or leaving G4 as contract-only. |

**Not asked:** every item in §18.1, the "Password Requests" queue/tab (excluded; requires a new explicit directive, not a ruling here), and G5 (blocked pending institute-supplied text).

---

## 19. Risk register, implementation sequence with gates, verification plan, exclusions and final stop condition

### 19.1 Risk register

| ID | Risk | Evidence | Impact | Mitigation | Test |
|---|---|---|---|---|---|
| RK-1 | **Split-brain ledgers** — canonical accounts invisible to `/admin/users` | F-1, F-2 | Feature appears broken; duplicate rows | Merged `roster()` with dedupe; one canonical row per account | Create→list; import→list; count assertions |
| RK-2 | **Plaintext leak** into cache/storage/audit/CSV/clipboard | G3, C-2, C-5 | Violates approved G3 | Component-local state only; `reset()`; whitelisted audit; explicit download | Serialized-store + console + cache scans |
| RK-3 | **Year token unconfigured** blocks all student creation | F-3 | Dead feature | Admin-only config control; no invented value | Blocked-state + valid-token tests |
| RK-4 | **Partial batch writes / burned IDs** | F-8, F-16 | Orphan digests, unreusable IDs | Pre-validation + single snapshot writes | Injected-failure tests |
| RK-5 | **Duplicate emails / ambiguous identity resolution** | F-4, B-5 | Wrong account at login | Shared duplicate check across 3 stores | Duplicate-rejection tests |
| RK-6 | **Mislabelled statuses** (`locked`/`archived` → "Suspended") | F-6, A-3 | Wrong UI state | 5-value facets/badges | Render tests |
| RK-7 | **Fabricated academic data** for new accounts | H-2, H-5 | Blueprint §4.5 fails | U-3 ruling; own-data only | New-account empty-state tests |
| RK-8 | **Faculty roster / batch counts stale** | H-3, D-4 | New teacher unassignable; disagreeing counts | Derive from registry; `seededFor` preserved | Assignment + cross-reader consistency tests |
| RK-9 | **`bat-neet-13` missing** from student batches | B-6, H-4 | Silent batch fallback | Reconcile batch lists | Per-batch resolution test |
| RK-10 | **Two audit systems / hardcoded actor** | F-5, G-2, G-4 | Untrustworthy ledger | One visible ledger; session actor | Exactly-one-entry + actor tests |
| RK-11 | **Recovery clears a lockout** | D-2, E-1 | Violates R-8 | `{clearAttempts:false}`; explicit unlock only | Lockout-survival test |
| RK-12 | **Architecture lint: two ember primaries** | A-2 | `npm run lint` fails | Demote one action to secondary | `npm run lint` |
| RK-13 | **Alias / route regression** | F-11 | 77-test suite fails, deep links lost | Preserve all 33 mappings verbatim | `v2-routes.test.jsx` unchanged |
| RK-14 | **C1 test-count regressions** (720 / 26 / 753 / result copy) | A-4, F-13, F-15 | Existing tests fail | Update assertions per C1, report each case | `admin-console.test.jsx` review |
| RK-15 | **No time expiry** on unused credentials | F-9 | Dormant credential exposure | Suspend/archive + re-issue; no invented expiry rule | `expiresByTime === false` assertion |
| RK-16 | **G5 / queue scope creep** | §4 B-1/B-4, §18.2 | Violates directive | Explicit out-of-scope list (§19.4) | Source assertions |
| RK-17 | **No Chromium / E2E** | §3.1, S3 §16 `:261` | No real browser evidence | Report unverified; never fabricate | `npx playwright test --list` (static only) |
| RK-18 | **`simulate()` deep-clones the credential** | F-8, `latency.js:92-95` | Extra in-memory plaintext copy | Never cache the clone; clear on close | Cache/store scan |
| RK-19 | **`apiServices.admin` shape drift** | Q-3 | HTTP-mode parity failure | Add names to `adminMethodNames`; keep 501 | Method-set parity test |
| RK-20 | **Seeded consent/invitation fixtures misread as approval** | G-5, H-6 | Policy/invitation features invented | Leave `auditSeed`/`adminAlerts` untouched | Source assertions |

### 19.2 Implementation sequence with gates (prospective only — nothing started)

| Gate | Work (only after explicit authorization) | Stop / gate condition |
|---|---|---|
| **G0 — THIS AUDIT (complete)** | Read-only evidence gathering + this report. | **STOP.** Await user decisions from §18.4 and explicit coding authorization. |
| **G1 — Decision gate** | Record rulings on U-1…U-5; confirm strict exclusions; no source edit. | All five answered; no approved decision re-opened. |
| **WS1 — Contracts & facade** | Additive typedefs (`CredentialSheetRow`, `CreateUserResult`, extended `ImportCommitResult`), `AdminService` signatures, `adminMethodNames` 501 stubs, `AUDIT_ACTIONS` keys/tones. | `npm run lint` + `auth-mode`-style parity test pass; seeded audit unchanged. |
| **WS2 — Registry bridge** | Merge `roster()` with `listAccounts()`; dedupe; session-derived actor; derived faculty roster/counts; 5-status facets/badges; year-token config surface. | Count/facet tests pass; 720/749/753 assertions updated per C1 with each case reported. |
| **WS3 — People UI** | Two tabs, Create User dialog, corrected copy, one ember primary, row-action placeholders. | `admin-accounts.test.jsx` create/list/tab tests pass; no third tab. |
| **WS4 — Credentials sheet** | One-time viewing, Copy (if U-2 approves), CSV download, `credentialDelivery:'shown'`, state clearing. | No-plaintext suite passes; row equality; axe on dialog/sheet (jsdom). |
| **WS5 — Operations & recovery** | Suspend/reactivate/lock/unlock/archive/edit/move with mandatory reason; additive recovery helper (U-5); audited explicit unlock. | Transition matrix, reason enforcement, lockout-survival and audit tests pass; all Batch 2 auth suites unchanged. |
| **WS6 — Import bridge** | `commitImport()` → canonical accounts + transient credentials; merged duplicate validation; atomic batch write; result-card copy. | `admin-console.test.jsx` import case passes; import→login→setup covered. |
| **WS7 — Downstream propagation** | U-3 ruling applied to faculty/student services; `bat-neet-13` reconciliation; dashboard/policy-impact consistency. | New-account empty-state + batch-resolution tests; demo seats unchanged. |
| **WS8 — Tests** | New `admin-accounts.test.jsx`; prospective `admin-accounts.spec.js` (unverified); C1-compliant updates to `admin-console.test.jsx`; alias assertions. | `npm test` green; every changed test case reported individually. |
| **WS9 — Final verification** | `npm test`, `npm run build`, `npm run lint`, `npx oxlint src tests`, `npx playwright test --list`, `git diff --check`, protected-file diff, credential-literal scan, full status/diff review, Batch 3 completion report. | All four commands EXIT 0; no credential leak; no user work lost; no commit/push/PR. |
| **GF — Final gate** | Present the completion report and **STOP**. | Wait for a further directive. |

### 19.3 Test and verification plan

- **Baseline to preserve:** S3 §16 (`:250-259`) — `npm test` 24/24 files, 262/262 tests (62.49 s); `npm run build` 3297 modules / 1.57 s; `npm run lint` "Architecture check passed: 319 files, 318 colour-free"; `npx oxlint src tests` 38 warnings / 0 errors on 349 files / 104 rules. `git diff --check` EXIT 0.
- **Unit (jsdom, executable here):** `npm test` after each workstream; new `admin-accounts.test.jsx` covering B-1…B-7, C-1…C-4, D-1…D-6, E-1…E-4, F-12…F-16, G-1…G-5, H-1…H-6, Q-1…Q-6, plus the 33-alias/`V2_ROUTE_MATRIX.length === 33` regression. Use `tests/unit/helpers.jsx` `renderRoute()` with a real Admin session and `tests/setup.js` webcrypto (`:4-9`). Mock `latency.js simulate` as `admin-console.test.jsx:7-10` does.
- **Static:** `npx playwright test --list` (56 tests in 7 files today) confirms collection only.
- **Not executable here:** `npm run test:e2e`, real viewports, browser console, real-browser axe, clipboard/download behaviour, media/camera, cross-tab. **No results will be claimed** until Chromium is available. (`npx playwright install chromium` previously failed with `ECONNRESET` because outbound access excludes `cdn.playwright.dev`; do not retry as a verification substitute.)
- **Integrity after WS9:** re-run `git branch --show-current`, `git rev-parse HEAD`, `git status --short`, `git diff --stat`, `git diff --check`, `git diff --name-only`, protected-file diff, `package.json`/`package-lock.json` byte comparison, and a credential-literal scan. Compare against the §3.1 snapshot so no pre-existing user change is lost.

### 19.4 Explicit out-of-scope list

1. Any Password Requests queue, tab, state, lifecycle, approve/decline UI, public request form, `PasswordRequestsTab.jsx`, `listPasswordRequests()` or `resolvePasswordRequest()` — requires a **new explicit directive**.
2. G5 consent: no policy wording, version identifier, acknowledgement structure, `FirstLoginPolicy`, `ConsentFields.jsx` copy, consent guard, acknowledgement count or `policy.acknowledged` audit.
3. Admin-created Admin accounts; any 4th role; Super Admin; tenancy; multi-institute switching; institute IDs for new Admin accounts.
4. Backend, API server, database, network endpoints, external auth provider, real credential security/KDF, encryption at rest.
5. Public registration, self-service signup, invitation acceptance, OTP provisioning, any new public recovery route; changing the three demo seats' self-service reset.
6. Any new dependency, `package.json` or `package-lock.json` change, lockfile rewrite, `npm ci` as a code change, or generated artifact committed to Git.
7. Any change to `users.js` / `institution.js` fixtures, `accounts.js` registry semantics, `authSchemas.js` validation rules (except an explicitly approved additive field), `SetupAccountPage.jsx`, guards, `HOME_FOR_ROLE`, `ADMIN_NAV`, canonical routes, all 33 v2 aliases, the 20 seeded audit entries, `tokens.css`, `index.css`.
8. Time-based credential expiry, credential retrieval/`revealPassword`/`getPlaintext`, permanent plaintext storage, credentials in logs/audit/session/URL/query cache, automatic lockout clearing on recovery.
9. Batch 4+ work: exam-hall rebuild, multi-select, floating dock, live studio/viewer, cross-tab transport, moderation/live-chat parity, full exam register, unified compliance page.
10. Unrelated refactor, redesign, palette/token change, file rename/deletion, or rewriting tests merely to make the suite pass (C1).
11. Any commit, push, merge, PR, publish, deploy, release, Git state mutation or stage/reset/checkout/clean/stash during Gate 0.
12. Fabricated browser/e2e/axe/console/media results.

### 19.5 Final stop condition

**Gate 0 is complete.** The only file created is:

`/home/user/vyuh/vyuh/VYUH_BATCH_3_ADMIN_PEOPLE_AUDIT_AND_DECISION_GATE.md`

Post-write verification was re-run: branch `arena/1763b46c-vyuh`, HEAD `ced54030c336bb1041454fd8780f56f423af19f8`, **39 modified tracked + 23 untracked** (the 22 pre-existing untracked files plus this report), `39 files changed, 1236 insertions(+), 397 deletions(-)` for tracked files, `git diff --check` EXIT 0, protected-file diff 0 lines, `package.json`/`package-lock.json` unchanged. **No pre-existing user change was lost.** No application source, test, configuration, package file, dependency, lockfile or existing report was edited; no Batch 2 registry/auth implementation was changed; no Batch 3 coding was performed; no implementation prompt was produced; no Chromium/e2e/browser verification was run; no commit, push, merge, PR, publish or deploy occurred.

Decisions requiring user input are exactly **U-1 … U-5 in §18.4**; G5 remains blocked and the Password Requests queue remains excluded unless a new explicit directive is issued.

**I am stopped here and waiting for your explicit authorization before any Batch 3 implementation.**
