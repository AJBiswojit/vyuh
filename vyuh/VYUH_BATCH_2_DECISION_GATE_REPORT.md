# Vyuh — Batch 2 Decision Gate Report

**Date:** 2026-11-08 (Asia/Calcutta)
**Branch:** `arena/1763b46c-vyuh` · **HEAD:** `ced54030c336bb1041454fd8780f56f423af19f8`
**Status:** **STOPPED — no application source file was created, modified or deleted.**
**Update (2026-11-08):** `VYUH_BATCH_2_UPDATED_DECISION_PLAN.md` is now the authoritative updated plan. It records the **FINAL** confirmed single-institute / Admin-as-highest-authority model, resolves conflict **C2** (the blueprint does *not* define a 12-character temporary password — 12 characters is only a proposal), and restates the current G1–G5 decision table. This report remains the evidence record for Gate 0, the architecture inventory and per-decision technical consequences; its §9 decision request is superseded by the updated plan's §8 approval list. No confirmed decision is re-asked.
**Reason:** All five mandatory decision gates (Gates 1–5) are unresolved. The Batch 2 assignment states: *"If any required decision is unavailable: 1. Do not modify application source files … 7. Stop and wait."* It also states: *"You may not implement around missing decisions."*

This document is the deliverable required by that stop condition. It contains Gate 0 evidence, every unresolved decision, the proposed default (where one genuinely exists), the technical consequence of each choice, a prepared-but-unexecuted technical plan, and one concise decision request.

---

## 1. Gate 0 — Repository and Batch 1 integrity (read-only)

### 1.1 Branch, HEAD and working tree

| Check | Result |
|---|---|
| `git branch --show-current` | `arena/1763b46c-vyuh` |
| `git rev-parse HEAD` | `ced54030c336bb1041454fd8780f56f423af19f8` |
| `git log -1 --oneline` | `ced5403 Merge pull request #2 from AJBiswojit/arena/88b9a4a6-vyuh` |
| `git status --short` | **32 entries: 20 modified + 12 untracked** — exactly the Batch 1 file set |
| `git diff --stat` | 20 files, `338 insertions(+), 67 deletions(-)` |
| `package.json` / `package-lock.json` | **unchanged** (no new dependency) |

**Batch 1 is present and intact.** The 20 modified paths and the 11 Batch 1-created paths (4 source modules, 6 test files, 1 completion report) match `VYUH_BATCH_1_COMPLETION_REPORT.md` §3 exactly, plus the original untracked audit blueprint. **No reset, clean, discard, overwrite or revert was performed. No source differences from the Batch 1 report were found.**

### 1.2 Environment difference found (not a source difference)

`node_modules/` was **empty** in this restored sandbox (the workspace snapshot excludes `node_modules`). The first `npm test` failed with `sh: 1: vitest: not found` (EXIT 127) — an environment issue, not a product regression. I restored the locked tree with `npm ci --no-audit --no-fund` (`added 166 packages in 8s`, EXIT 0; manifest and lockfile unchanged) and re-ran the verification set. `npm run build` also regenerated the gitignored `dist/` output. Neither action modifies application source.

### 1.3 Read-only verification of the current checkout

| Command | Exit | Actual output |
|---|---:|---|
| `npm test` | **0** | `Test Files  19 passed (19)` · `Tests  209 passed (209)` · `Duration  67.04s` |
| `npm run build` | **0** | `Architecture check passed: 317 files, 316 colour-free, no boundary or token violations.` · `✓ 3300 modules transformed.` · `✓ built in 1.78s` |
| `npm run lint` | **0** | `Architecture check passed: 317 files, 316 colour-free, no boundary or token violations.` |
| `npx oxlint src tests` | **0** | `Found 38 warnings and 0 errors.` · `Finished in 202ms on 342 files with 104 rules using 2 threads.` |

This reproduces the Batch 1 baseline exactly (209/209 tests; 38 oxlint warnings / 0 errors). `npm run test:e2e` was **not** run — Chromium is unavailable in this sandbox (see §7).

### 1.4 Current auth / identity architecture inventory (verified by reading files)

| Concern | Current state | Evidence |
|---|---|---|
| Shared account registry | **Does not exist.** `src/mock-data/accounts.js` absent. | `ls` + file inventory |
| Seeded users | `users.js` holds 4 users with ids `stu-ananya`, `fac-rituparna`, `fac-snehasish`, `adm-pratibha`; `DEMO_PASSWORD='vyuh2026'`; 3 demo email seats; `signupBatches`; `facultyInvitations` (incl. `VYUH-FACULTY-2026`). | `src/mock-data/users.js:9-101` |
| Auth DB | `localStorage['vyuh.mock.auth.v1']` holds `accounts`, `attempts`, `challenges`, `resets`, `acceptedInvites`. Password handling = salt + SHA-256 digest; **no plaintext stored**. | `src/services/mock/auth.js:22-45,64-85` |
| Admin DB | Separate `localStorage['vyuh.mock.admin.v' + VERSION]`; `commitImport` writes `invited` rows with **no `instituteId` and no password**. | `src/services/mock/admin.js:35`, blueprint D-28 |
| Session | `localStorage['vyuh.session']` (Zustand persist v1) with `token`, `user`, `issuedAt`, `expiresAt`, `expiresInSeconds`; 8-hour lifetime. **No** `instituteId`, `mustChangePassword`, `acknowledgedPolicyVersion`. | `src/shared/lib/sessionPersistence.js:8-9`, `src/shared/store/sessionStore.js:20-53`, `src/services/authSchemas.js:57-67` |
| Session restore | `AuthService.getSession()` → `readPersistedSession()` validates `authSessionSchema` + expiry only; **no account-status revalidation**. | `src/services/mock/auth.js:268-271`, `src/shared/lib/sessionPersistence.js:31-47` |
| Login | `auth.login({email, password})` via `loginSchema`; 5-attempt → 15-min lockout; generic `invalid_credentials`; `findAccount` merges fixture users with auth DB. | `src/services/mock/auth.js:113-138` |
| Login page | Email + `PasswordField` (show/hide, strength meter optional); demo seats; notices; **public signup CTA at line 86**; `email_unverified` link to `/signup` at line 80. | `src/features/auth/pages/LoginPage.jsx:61-90` |
| Guards | `RequireAuth`, `RequireRole`, `GuestOnly`, `BootScreen`. `GuestOnly` bounces **any** authenticated user to `safeReturnPath(...) ?? homeRouteFor(role)`. **No `RequirePasswordChange`.** | `src/app/routes/guards.jsx:12-49` |
| `safeReturnPath` | Rejects external/protocol-relative/backslash and `/login`, `/sign-in`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/join`. **Does not reject `/setup-account`.** | `src/shared/lib/roles.js:16-20` |
| Routes | `/login`, `/signup` under `GuestOnly`; `/verify-otp`, `/forgot-password`, `/reset-password`, `/join/:inviteCode` under `AuthLayout`; all three workspaces under `RequireAuth`+`RequireRole`; Batch 1 v2 aliases intact. **No `/setup-account`.** | `src/app/routes/AppRoutes.jsx:120-249` |
| Policy copy | `ConsentFields.jsx` has **two** checkboxes (`termsConsent`, `attendanceConsent`) and demo attendance copy that explicitly says *"This is a demonstration summary, not a production legal agreement."* **No policy version, no retention expectations, no named contact.** | `src/features/auth/components/ConsentFields.jsx:16-41` |
| Password policy | `newPasswordSchema` already enforces min 10 chars + ≥1 letter + ≥1 digit + max 128. | `src/services/authSchemas.js:10-14` |
| OTP / invite | `makeChallenge(email, 'reset')` is **dead code** — only `'signup'` is called; `requestReset` issues a token directly, so `/verify-otp` is in practice exclusively the signup flow. | `src/services/mock/auth.js:87-98,157,210-218` |
| Service surface | `AuthService` facade → `services.auth`; `types.js` `AuthService` typedef lists 12 methods, none of them Institute-ID or first-login related. | `src/services/AuthService.js`, `src/services/types.js:29-42` |
| Tests | 6 auth-related unit files (incl. `auth-flow.test.jsx`, `auth-service.test.js`), `tests/unit/helpers.jsx renderRoute`, `tests/setup.js` webcrypto polyfill; 7 e2e spec files / 56 tests. | `find tests -type f` |
| Crypto availability | `crypto.randomUUID()` and `crypto.subtle.digest('SHA-256')` are already used; `webcrypto` is polyfilled in `tests/setup.js`. `crypto.getRandomValues` is therefore available for a mock generator. | `src/services/mock/auth.js:47,66`, `tests/setup.js` |

---

## 2. Decision gate status

| Gate | Subject | Questions asked | Answers supplied | Status |
|---|---|---:|---:|---|
| 1 | Institute ID policy | 6 | 0 | **UNRESOLVED** |
| 2 | Temporary password policy | 6 (+2 derived) | 0 | **UNRESOLVED** |
| 3 | Credentials CSV policy | 5 | 0 | **UNRESOLVED** |
| 4 | Password-request / recovery policy | 6 (+2 scope) | 0 | **UNRESOLVED** |
| 5 | First-login policy acknowledgement | 5 (+1 derived) | 0 | **UNRESOLVED** |
| — | Cross-cutting conflicts (§6) | 3 rulings needed | 0 | **UNRESOLVED** |

**Total: 28 explicitly enumerated decisions, none confirmed.** Additional derived clarifications are listed in §4. Some items have a genuine proposed default in the approved blueprint; others have **no default at all** and require the user to supply a value.

> **Important factual finding (§6, C2):** the assignment says *"The blueprint proposes: 12-character temporary passwords. An unambiguous character set. Excluding `0`, `O`, `1`, `l`, and `I`."* The approved blueprint file on disk contains **no such specification**. Line 537 states verbatim: *"no specification for the password algorithm, ID counter source, academic-year token (`26`) or reset-request policy exists in this repository"*, and *"Batch 2 must obtain client confirmation"*. `credentialPolicy` at line 541 is marked *"proposed, pending confirmation"* with no values. The only source for the 12-character/charset proposal is the Batch 2 assignment text itself.

---

## 3. Every unresolved decision, with default and technical consequence

**Legend:** `DEFAULT` = value genuinely present in the approved blueprint / assignment; `PARTIAL` = implied but not stated; **`REQUIRED`** = no default exists, the user must supply a value.

### Gate 1 — Institute ID policy

| # | Decision required | Proposed default | Technical consequence |
|---|---|---|---|
| G1.1 | Are `VYU-S-YY-NNNN`, `VYU-F-NNNN`, `VYU-A-NNNN` approved? | **PARTIAL** — blueprint §4.4.1 gives `VYU-S-26-0231`, `VYU-F-0042`; §4.4.3 counter `{student:231, faculty:42, year:'26'}` has **no admin counter**. `VYU-A-0001` appears only in the assignment. | Determines the ID parser/regex, field width, validation schema, and how seeded `users.js` ids (`stu-ananya`, …) map into the registry. Approving the admin format requires a third counter plus seed values that do not exist today. |
| G1.2 | Does the student counter reset each academic year? | **PARTIAL** — `year:'26'` token implies a per-year student series, but no reset rule, no rollover date, no definition of "academic year" (calendar year vs Apr–Mar). | Without a year-source rule the generator cannot produce `26`. Worse, a reset with a reused number would violate *"A counter must never silently reuse an already-issued identity"*. Needs an explicit academic-year source and rollover date. |
| G1.3 | Are faculty/admin counters institute-wide and persistent across years? | **REQUIRED** — blueprint has no year token for faculty (implies persistent) but never states it; admin has no counter at all. | Decides whether `VYU-F-0042` may be reissued later, and whether counter state is per-institute (only one mock institute exists) or global. Directly affects the `instituteIdCounter` shape. |
| G1.4 | Are IDs unique across imported, suspended and deleted/archived records? | **PARTIAL** — blueprint §4.4.6 says *"counters increment without collisions across CSV import and Create User"*; silent on suspended/archived. | Determines whether the store needs a permanent **issued-ID ledger** (`issuedInstituteIds`) instead of scanning live rows. `admin.js commitImport` currently writes `vyuh.mock.admin.v*` rows with no `instituteId`. Suspension/archival must never free an ID. |
| G1.5 | What happens if a generated ID already exists? | **REQUIRED** — no policy; blueprint only says "collision-free counters". | Options: advance to next free number / fail with explicit error / regenerate. Each produces a different `createUser` error contract, audit entry, and regression test. Cannot be guessed. |
| G1.6 | Should counters ever decrement or reuse previously issued IDs? | **REQUIRED** — the assignment gives a *constraint* ("never silently reuse") but no full policy (e.g. does a rolled-back/failed creation consume a number?). | Decides whether the counter is strictly monotonic and whether a `reserved`/`issued` set is persisted separately from the numeric counter. |

### Gate 2 — Temporary password policy

| # | Decision required | Proposed default | Technical consequence |
|---|---|---|---|
| G2.1 | Temporary password length | **REQUIRED** — assignment proposes 12; **blueprint has no value** (see §2 finding). | Drives generator, validation schema, credentials-sheet column width and tests. |
| G2.2 | Allowed character set and excluded characters | **REQUIRED** — assignment proposes excluding `0`, `O`, `1`, `l`, `I` and an "unambiguous character set", but does not enumerate the allowed alphabet (upper? lower? digits? symbols?). | A rejection-sampling generator needs an exact alphabet. An unenumerated alphabet cannot be implemented without inventing policy. |
| G2.3 | Does the temporary credential expire? | **REQUIRED** — no default. | If yes, `temporaryPasswordIssuedAt` becomes a login-time check and the login error contract needs an `expired_credential` case; if no, the field is informational only. |
| G2.4 | Exact validity period (if it expires) | **REQUIRED** — no default. | Determines the constant, the clock source (`Date.now()`), and the "expired temporary credential follows the confirmed policy" unit test required by §7. |
| G2.5 | Does password reset generate a new temporary credential or use another recovery process? | **PARTIAL** — blueprint §4.4.6 says *"reset generates a new one-time credential"*, but that refers to the admin `resetPassword` action, not self-service `requestReset`. Overlaps G4.5. | Decides whether `setPassword` must also set `mustChangePassword = true`, and whether self-service `/forgot-password` + `/reset-password` survives at all (see G4.8). |
| G2.6 | Can a temporary credential be used only once? | **REQUIRED** — blueprint says *"one-time credentials sheet"* / *"one-time password visibility"*, which is about **display**, not credential use. Ambiguous. | "Once" could mean (a) cannot log in twice, (b) must be rotated on first login, or (c) invalid after setup. Each needs different state (`tempPasswordUsedAt`, `mustChangePassword`, hash replacement) and different tests. |
| G2.7 | New-password policy: min 10 chars + ≥1 letter + ≥1 digit? | **PARTIAL** — assignment §4.5 says *"The blueprint proposes a minimum of 10 characters and at least one letter and one digit. Use this only after the relevant policy has been confirmed."* `newPasswordSchema` already implements exactly this. | Needs explicit approval before `/setup-account` may enforce it. Also: assignment §4.5 requires **rejecting the current temporary password** — confirm that rule and whether a max length / breached-password check is in scope. |
| G2.8 | Mock generator strategy | **PARTIAL** — assignment: *"If a cryptographically secure random generator is unavailable … document the limitation and use a clearly identified mock-only generation strategy. Never claim that a predictable demo generator is cryptographically secure."* | `crypto.getRandomValues` **is** available (§1.4), so rejection sampling is possible. Still needs confirmation that (a) runtime uses Web Crypto, (b) unit tests may inject a deterministic **mock-only** generator, and (c) the existing salted SHA-256 digest is retained with an explicit **"not production credential security"** disclaimer. |

### Gate 3 — Credentials CSV policy

| # | Decision required | Proposed default | Technical consequence |
|---|---|---|---|
| G3.1 | May a downloaded CSV contain temporary passwords in plaintext? | **PARTIAL / conflicting** — blueprint §4.4.3 `CredentialSheetRow { instituteId, temporaryPassword, … }` and §4.4.5 *"CSV downloads with the same rows"* imply yes, but the assignment's security default says *"Never persist plaintext passwords"* — a downloaded CSV is a persistent artifact. | Determines the whole credential-handling contract Batch 2 must establish. Without a ruling, `CredentialSheetRow` cannot be typed. **No CSV UI is built in Batch 2**, but the contract is. |
| G3.2 | Is the CSV intended for one-time download only? | **PARTIAL** — blueprint says *"one-time credentials sheet"* and *"password never visible again after sheet closes"*; download-once is not stated. | Decides whether the contract needs a `delivered`/`downloadedAt` state on `credentialDelivery`. |
| G3.3 | Should CSV export be disabled after the credentials sheet closes? | **PARTIAL** — blueprint §4.4.5 requires clearing plaintext from component state and the admin query cache on close, but does not explicitly govern export. | Determines `credentialDelivery: 'pending'|'shown'|'delivered'` transitions and the invalidation contract. |
| G3.4 | Exact CSV columns | **PARTIAL** — blueprint §4.4.3: `instituteId, temporaryPassword, role, name, batchName, mustChangePassword`. Assignment asks: *"Institute ID, name, role, batch and temporary password"*. These differ (`batchName` vs `batch`, plus `mustChangePassword`). | Sets the exact header order and the `CredentialSheetRow` typedef; also affects the future CSV row-equality test. |
| G3.5 | Exact secure-sharing guidance copy | **REQUIRED** — blueprint §4.4.5 says *"secure-sharing copy"* but contains no text. | Batch 2 must establish the credential-handling contract including this copy as a constant; no approved wording exists to reuse. |
| G3.6 | Are the assignment's stated security defaults binding? | **DEFAULT (stated)** — *"Never persist plaintext passwords; never put passwords in localStorage account records; never in the normal account list; never expose through query results, logs or audit entries; never retain plaintext passwords in a query cache after the credentials sheet closes."* | These will be treated as binding unless overridden. Confirming them fixes the `accounts.v1` vs `auth.v1` separation and the `listAccounts` projection rules. |

### Gate 4 — Password-request and recovery policy

| # | Decision required | Proposed default | Technical consequence |
|---|---|---|---|
| G4.1 | Can a student/faculty submit a password request **without authentication**? | **REQUIRED** — no default. | If yes, a public request route/method is needed — but §5 puts the full UI in Batch 3. If no, the request is created from an authenticated session. Changes the service contract and whether an unauthenticated endpoint exists. |
| G4.2 | Is Institute ID mandatory on a request? | **PARTIAL** — blueprint §4.4.3 `PasswordRequest` includes `instituteId`, but no validation rule. | Determines whether requests can be keyed by email alone, and whether unknown IDs must return a generic (non-enumerating) response. |
| G4.3 | Which administrator roles may approve/decline? | **PARTIAL** — blueprint `resolvePasswordRequest(adminId, …)`; the only admin role today is `admin` (`Role = student\|faculty\|admin`). | Confirms whether `RequireRole allow={['admin']}` is the only permission, or whether a second admin tier is implied (it does not exist in the code). |
| G4.4 | Must **every** decision include a reason? | **PARTIAL** — blueprint `PasswordRequest` has a `note` field and `resolvePasswordRequest(..., {decision, note})`, but no rule that `note` is mandatory for both approve **and** decline. | Sets the Zod/validation contract; affects the "every decision includes a reason" test. |
| G4.5 | Does approval directly issue a new temporary password, or only authorize a later reset? | **REQUIRED** — blueprint §4.4.6 says *"reset generates a new one-time credential"* but does not tie it to request approval. Overlaps G2.5. | Determines the state machine (`open → approved → resolved`) and whether approval mutates the auth DB hash immediately. |
| G4.6 | What happens to an existing account lockout during an approved reset? | **PARTIAL** — current `setPassword()` **always** calls `delete db.attempts[email]`, i.e. clears the lockout (`src/services/mock/auth.js:80-86`). | Needs confirmation: clearing the lockout on approval is a security-relevant behaviour. The assignment says *"Do not create a recovery flow that bypasses account-state checks"*. |
| G4.7 | Does Batch 2 include the shared `PasswordRequest` contract + mock state at all? | **REQUIRED (scope)** — assignment: *"Batch 2 may define the shared request contract and mock state only if the approved scope requires it."* | Yes/no decides whether `accounts.js` includes `passwordRequests[]`, its labels and statuses in this batch. |
| G4.8 | Is self-service `/forgot-password` + `/reset-password` preserved? | **REQUIRED (scope)** — assignment §4.7: *"Preserve unrelated recovery behaviour only if it remains valid under the confirmed policy."* Blueprint §4.6 suggests reusing `/reset-password` helpers for setup. | Retiring or keeping these routes changes 1 unit test (`auth-flow.test.jsx:133`), 2 e2e tests, and the `requestReset`/`resetPassword` service methods. |

### Gate 5 — First-login policy acknowledgement

| # | Decision required | Proposed default | Technical consequence |
|---|---|---|---|
| G5.1 | Exact policy text or approved policy reference | **REQUIRED** — none exists. `ConsentFields.jsx:16-38` is a **demo summary** that explicitly disclaims being a legal agreement; it has **no retention expectations** and **no named contact**. Assignment: *"The policy should explain attendance tracking, why it is tracked, retention expectations and whom to contact … Do not invent legal or regulatory statements."* | `/setup-account` must render approved content verbatim. Without it, the page cannot be built without inventing policy — which is forbidden. |
| G5.2 | Policy version identifier | **REQUIRED** — blueprint §4.4.3 mentions `firstLoginPolicy version` with **no value**; no `policyVersion` string exists anywhere in `src`/`tests`. | `acknowledgedPolicyVersion` comparison, `authSessionSchema` extension and the version-change re-acknowledgement test all depend on a concrete identifier (e.g. `ATT-2026.1`). |
| G5.3 | Is acknowledgement mandatory before workspace access? | **PARTIAL (implies YES)** — blueprint §4.6 guard on `acknowledgedPolicyVersion !== currentPolicyVersion`; assignment §4.6 forces `/setup-account` for `mustChangePassword`. Confirm that policy acknowledgement **alone** (even after password rotation) also gates access. | Decides whether `RequirePasswordChange` checks one flag or two, and whether a user who changed their password but did not consent is still blocked. |
| G5.4 | Must the acknowledgement timestamp be stored, and where? | **PARTIAL** — blueprint §4.6 says add `acknowledgedAt`; no storage location stated. | Determines whether `acknowledgedAt` lives in `vyuh.mock.accounts.v1`, in `vyuh.session`, or both, and whether it is exposed through `listAccounts`. |
| G5.5 | Does a policy-version change require acknowledgement again? | **PARTIAL (implies YES)** — blueprint §4.6. | Needs the source of `currentPolicyVersion`, who may change it (Batch 3 admin policies?), and whether a changed version re-sets `mustChangePassword` or only the consent gate. |
| G5.6 | One consent checkbox or two? | **REQUIRED** — assignment §4.5 Step 2 says *"Require an explicit checkbox"* (singular). `ConsentFields.jsx` currently has **two** (`termsConsent`, `attendanceConsent`). | Decides whether setup reuses `ConsentFields.jsx` as-is (blueprint §4.6 suggests reuse) or needs a single explicit acknowledgement control. |

---

## 4. Additional unconfirmed clarifications (derived, also blocking)

| # | Clarification | Proposed default | Consequence |
|---|---|---|---|
| D1 | Do the 3 seeded demo email seats receive Institute IDs? If so, which values, and do they consume counter slots? | **REQUIRED** | The compatibility layer between `users.js` and `accounts.js` depends on this; assigning IDs that collide with the issued-ID ledger would break uniqueness. |
| D2 | Does the new `instituteId` replace or coexist with the existing `User.rollNumber` (`VY-25-0187`) and `instituteCode` (`VYUH2026`)? | **REQUIRED** | Affects `userSchema`, `authSessionSchema`, session payload and profile display. Assignment §4.4 says "one canonical identity per account". |
| D3 | Academic-year token source and rollover date (feeds G1.2). | **REQUIRED** | Without it `26` cannot be derived deterministically; a hard-coded `26` would be fabricated policy. |
| D4 | Initial counter values (`{student:231, faculty:42, year:'26'}` from blueprint §4.4.3) — confirm as seed or supply new values. | **PARTIAL** (blueprint §4.4.3) | Determines the first generated IDs and the ID-generator regression tests. |
| D5 | Login API shape: the assignment lists both `login({instituteId,email,password})` **and** `loginByInstituteId({instituteId,password})` plus `changePasswordWithSetup`, while saying *"Adapt signatures to the existing service conventions"*. | **PARTIAL** — proposal: one shared resolver; `login` accepts a single identifier that is either a demo email or an Institute ID; `loginByInstituteId` delegates to it; `changePasswordWithSetup` returns a refreshed `AuthSession`. | Avoids two divergent credential paths (the "one authentication state" principle). Needs confirmation because `loginSchema` currently requires a valid **email**, so Institute IDs must be accepted without weakening Zod validation or revealing account existence. |
| D6 | Should `temporaryPasswordIssuedAt` be used to detect expiry at **login** and at **setup completion**? | **REQUIRED** (depends on G2.3/G2.4) | Determines where expiry is enforced and which error codes are added to `authErrors.js`. |
| D7 | Where does `currentPolicyVersion` live and who can change it? | **REQUIRED** | Needed for G5.5 and to avoid a Batch 3 UI dependency in Batch 2. |

---

## 5. Prepared technical plan (NOT executed — no source changed)

This is the plan I will execute **only after** the decisions are confirmed. It is included to show the work is understood and to make the consequences above concrete.

1. **Data / contracts (no fabrication):** create `src/mock-data/accounts.js` with `instituteIdCounter`, `issuedInstituteIds`, `credentialPolicy`, `firstLoginPolicy` (version + approved text), optional `passwordRequests[]` (per G4.7), status labels and pure helpers. Add `InstituteAccount` / `CredentialSheetRow` / `PasswordRequest` typedefs and extend `contracts/user.js`, `contracts/auth.js`, `services/authSchemas.js` (`authSessionSchema` optional `instituteId`, `mustChangePassword`, `acknowledgedPolicyVersion`), `services/types.js`. Keep `users.js` fixtures intact and adapt them through a compatibility projection.
2. **Storage separation:** `vyuh.mock.accounts.v1` (identity/lifecycle, **no secrets**) alongside the existing `vyuh.mock.auth.v1` (salt/hash/lockout/challenges) and `vyuh.session` (envelope). Versioned, backward-compatible migration that does not delete existing keys; `readPersistedSession` gains account-status revalidation on restore.
3. **Service:** extend `src/services/mock/auth.js` — shared identifier resolver, status checks (`active|invited|suspended|locked`), `loginByInstituteId`, `changePasswordWithSetup`, `acknowledgePolicy`, `getAccountStatus`; password hashes never returned by account-list/session projections. Retain `crypto.subtle` salt+hash with an explicit mock-only disclaimer; generator uses `crypto.getRandomValues` with an injectable deterministic mock generator for tests.
4. **Login page:** focused update to `LoginPage.jsx` — Institute ID/email identifier field, show/hide, caps-lock hint via existing form conventions, generic invalid-credential plus suspended/locked/expired notices, remove the `/signup` CTA and `email_unverified` → `/signup` link, keep demo seats and design tokens.
5. **Setup:** `src/features/auth/pages/SetupAccountPage.jsx` at `/setup-account`, reusing `AuthLayout`, `AuthHeading`, `PasswordField`, `Checkbox`, `newPasswordSchema` and the **approved** policy text; explicit unchecked consent; clear sensitive component state after success; recoverable after refresh.
6. **Guards:** add `RequirePasswordChange` to `guards.jsx`; place `/setup-account` **outside** `GuestOnly` (otherwise `guards.jsx:35` creates a redirect loop — blueprint §4.6 flags this); add `/setup-account` to `safeReturnPath`'s rejection list; preserve the existing `RequireAuth`/`RequireRole` ordering and all Batch 1 aliases; verify a student/faculty/admin cannot cross roles through setup.
7. **Retire:** `/signup` and `/join/:inviteCode` become informational redirects; retire or redirect `/verify-otp` per G4.8 ruling; keep the old page files (assignment §4.7) unless the dependency graph requires removal; preserve legacy `/sign-in`, `/app/*`, `/student/papers`, `/student/account` and all `/s`, `/f`, `/a` aliases.
8. **Tests (after approval):** new unit files for account model, auth, first-login flow, guard matrix (3 roles × anonymous/correct/wrong/must-change), registration retirement and Batch 1 regression. E2E only if Chromium becomes available.
9. **Verification:** `npm test`, `npm run build`, `npm run lint`, `npx oxlint src tests` on the final state; compare oxlint against the 38/0 baseline; `npm run test:e2e` only if a browser exists.
10. **Report:** `VYUH_BATCH_2_COMPLETION_REPORT.md` with all 17 required sections, then stop.

---

## 6. Conflicts that need a ruling before any source edit

**C1 — Retired-flow tests vs "do not weaken or delete existing tests" (BLOCKING).**
The following existing tests assert the flows Batch 2 must retire:
- `tests/unit/auth-flow.test.jsx:89` signup + Terms dialog + OTP paste; `:123` expired OTP via `authService.signup` + `/verify-otp`; `:150` faculty invite reaches faculty layout; `:171` axe check renders `/signup`.
- `tests/unit/auth-service.test.js:49,63,73,90` — signup consent/OTP/resend/expiry and `acceptInvite` (service-level).
- `tests/e2e/auth.spec.js:60,84,106,135,167` — signup/OTP/invite journeys and `/signup` in the mobile-overflow loop.

The assignment §7 says *"Add focused tests without weakening or deleting existing tests"*, and the standing user constraint says *"do not weaken or remove existing tests to achieve a passing result"*. But the blueprint §9 Batch 2 says *"rewrite `auth-flow.test.jsx` signup cases into first-login cases; … e2e `auth.spec.js` update"*. These conflict. **Ruling needed:** (a) keep the service methods and page files, retire only the routes, and **rewrite** the UI/e2e assertions into explicit retirement assertions (approved as a rewrite, not a weakening); (b) keep the routes as informational redirects and leave the tests intact; or (c) another approach. `auth-mode.test.js:18` uses `/signup?x=1` and `/join/CODE` only as examples that `safeReturnPath` must reject — those remain valid either way.

**C2 — Blueprint discrepancy (BLOCKING).** The assignment attributes a 12-character length and ambiguous-character exclusions to "the blueprint"; the approved blueprint file explicitly says no password algorithm specification exists (line 537). **Ruling needed:** are the assignment's proposals now the authoritative proposed defaults, or is there a separate specification document to use?

**C3 — Redirect-loop hazard (design, handled in plan but noted).** `GuestOnly` (`guards.jsx:35`) redirects any authenticated user to their dashboard, and `safeReturnPath` (`roles.js:18`) does not reject `/setup-account`. Both must be addressed together or first-login users will loop or lose their intended destination. No policy decision is required, but it is called out because blueprint §4.6 explicitly warns about it.

---

## 7. Environment limitations (carried from Batch 1, unchanged)

* Chromium/Chrome/Firefox/WebKit are unavailable; `npx playwright install chromium` fails with `ECONNRESET` from `cdn.playwright.dev`; `~/.cache/ms-playwright` is absent. The 56 collected e2e tests previously failed at **browser launch**, not on product assertions.
* Therefore real-browser verification, responsive widths, browser console, axe in a real browser, camera/media and multi-tab behaviour remain **unverified** and will be reported as such. No browser results will be fabricated.
* All route/guard verification available here is jsdom + `MemoryRouter` via `tests/unit/helpers.jsx renderRoute`.

---

## 8. What I will NOT do before confirmation

No application source file will be created, edited or deleted. Specifically: no `accounts.js`, no `SetupAccountPage.jsx`, no `RequirePasswordChange`, no schema/session/store/auth-service/LoginPage/AppRoutes/guards edits, no route retirements, no test rewrites, no generated ID or password algorithm, no invented policy text or version string, no commit/push/merge/PR, no Batch 3 UI, no backend, no dependency. This report is the only new file.

---

## 9. One concise decision request

**Please confirm the five decision gates in a single reply.** Either reply `approved` to accept the defaults marked `DEFAULT`/`PARTIAL` above **and** supply the values for every item marked `REQUIRED` — most importantly: the **approved policy text + version identifier (G5.1/G5.2)**, **temporary-password length, exact alphabet, expiry and validity period (G2.1–G2.4)**, the **ID collision and year-counter rules (G1.2/G1.3/G1.5/G1.6)**, the **CSV plaintext/columns/sharing copy ruling (G3.1/G3.4/G3.5)**, the **password-request and recovery rules (G4.1–G4.8)** — or send per-item corrections using the IDs (G1.1 … G5.6, D1 … D7). I also need one ruling each on **C1** (how to handle the existing signup/invite/OTP tests) and **C2** (whether the assignment's password proposals supersede the blueprint's stated specification gap).

Until that reply arrives, Batch 2 remains **stopped**. No implementation will begin and no Batch 3 work will be started.
