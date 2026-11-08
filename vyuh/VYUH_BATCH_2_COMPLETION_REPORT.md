# Vyuh — Batch 2 Completion Report
## Approved Authentication & Institute Identity Foundation

**Branch:** `arena/1763b46c-vyuh` (status `active`) · **HEAD:** `ced54030c336bb1041454fd8780f56f423af19f8` (unchanged; no commit, push, merge, PR or publish)
**Source of truth:** `VYUH_BATCH_2_UPDATED_DECISION_PLAN.md` Revision 2 · **Authority:** `VYUH — BATCH 2 FINAL IMPLEMENTATION DIRECTIVE`
**Date:** 2026-11-07 · **Status:** ✅ IMPLEMENTED AND VERIFIED (unit/build/lint/oxlint); ⚠️ browser E2E unverified — no Chromium
**Baseline:** Batch 1 accepted regression baseline preserved. Batch 3 NOT started.

> **Prototype security disclaimer (repeated wherever credentials are discussed):** browser `localStorage` holds demonstration data only. It is not encrypted at rest, not tamper-proof and not suitable for real institutional credentials. The salted SHA-256 digest used by the mock is **NOT a password KDF and is NOT production-grade credential security**. There is no backend, API server, database or external auth provider in this repository.

---

## 1. Summary

Batch 2 delivers the **approved authentication and institute identity foundation** for exactly one institute and exactly three roles (`admin | faculty | student`, with `admin` as highest authority). It adds an institute-wide, never-reused Institute ID system; a 12-character temporary-credential generator; a mandatory first-login password change with a role-agnostic route guard; strict credential non-exposure across storage, sessions, logs and audit; retirement of public self-registration, OTP signup and self-service invitations; and a versioned, credential-free account registry with additive migration.

Account creation and full Admin People management are **outside Batch 2** and were not implemented. Policy acceptance (G5) remains **explicitly blocked** because the institute has not supplied approved wording or a version identifier. No consent checkbox, legal text, fake version or automatic acceptance was added. Batch 1 exam/learning/analysis work, IST calendar math, 33 v2 aliases, canonical routes, deep links and the design system are intact.

All four required commands pass on the final state: `npm test` **24/24 files, 262/262 tests**, `npm run build` **EXIT 0**, `npm run lint` **EXIT 0**, `npx oxlint src tests` **38 warnings / 0 errors** (identical warning count to the Batch 1 baseline).

---

## 2. Workstream 0 — green baseline verification (before any source edit)

| Command | Result on the untouched Batch 1 state |
|---|---|
| `npm ci --no-audit --no-fund` | `added 166 packages in 11s`, EXIT 0; manifests unchanged |
| `npm test` | EXIT 0 — **19 files / 209 tests**, 79.59 s |
| `npm run build` | EXIT 0 — `✓ built in 2.17s` |
| `npm run lint` | EXIT 0 — `Architecture check passed: 317 files, 316 colour-free, no boundary or token violations.` |
| `npx oxlint src tests` | EXIT 0 — `Found 38 warnings and 0 errors.`, 342 files / 104 rules |

This matched the accepted Batch 1 baseline (19/209; build 317/316 + 3300 modules; lint 317/316; oxlint 38/0). A zod 4.6.7 behaviour probe confirmed uppercase emails are lowercased, Institute IDs are uppercased, and empty identifiers produce both `.min()` and `.refine()` issues — so the first error message could be preserved verbatim for the existing inline-validation regression. Only after this verification were source edits made.

---

## 3. Scope compliance and protected-file audit

The implementation stayed inside Revision 2 §11's prospective file list. **`git diff --name-only` was checked against the protected list; every protected file is UNCHANGED:**

`src/mock-data/users.js`, `src/mock-data/institution.js`, `src/services/mock/admin.js`, `src/features/admin/pages/AdminUsersPage.jsx`, `src/features/admin/pages/AdminImportPage.jsx`, `src/app/routes/v2RouteTable.js`, `src/app/routes/v2Aliases.jsx`, `src/styles/tokens.css`, `src/index.css`, `package.json`, `package-lock.json`, all Batch 1 exam/learning/analysis files, and every exam-hall / live-studio / live-viewer file.

No file was renamed, deleted or reset. No existing user change was discarded. No new npm dependency, TypeScript, backend, API server, database, external auth provider, unrelated redesign or whole-app refactor was introduced. `git diff --check` is clean; no generated artifacts (`dist/`, `node_modules/`, `.arena/`, coverage, `/tmp` logs) appear in Git status.

**Architecture note:** the earlier read-only scan found **zero** Super Admin / tenant / multi-institute references. `AdminRole` is a three-role users-ledger filter (documented, not renamed); `AdminService` has no account-lifecycle mutations; `commitImport` still writes `invited` rows without Institute IDs or passwords; `adminUsers` still combines student/faculty/office users. These are deliberately left for the Admin People batch rather than refactored in Batch 2.

---

## 4. Decision status (do not re-ask)

| ID | Decision | Status |
|---|---|---|
| **G1** | Institute ID generation | ✅ Implemented exactly as approved |
| **G2** | Temporary password policy | ✅ Implemented exactly as approved (**C2 correction retained**) |
| **G3** | Credential delivery / non-exposure | ✅ Implemented; no delivery UI (future batch) |
| **G4** | Password recovery | ✅ Contract, audit helper and documented out-of-band model; **no UI/state/lifecycle operations** |
| **G5** | First-login policy acceptance | ⛔ **BLOCKING — DEFERRED**. No wording, version, acknowledgement structure or attendance-retention statement supplied |
| **C1** | Test migration | ✅ Rewrites into retirement/security assertions; every changed case listed in §14 |
| **C2** | 12-character requirement | ✅ Corrected: **user-selected in the final directive, NOT blueprint-confirmed**. Recorded verbatim in `credentialPolicy` |
| 11 open details | All resolved by the final directive | ✅ Implemented; none re-litigated |

Explicitly approved and implemented: exact alphabet `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789`, `crypto.getRandomValues` + rejection sampling, deterministic generator **test only**, no time expiry, mandatory first-login change, old temp password invalid after success, reuse of `newPasswordSchema` (min 10 / letter / digit / max 128) + confirmation + rejection of the current temp password, salted SHA-256 with the required disclaimer, out-of-band Admin recovery with mandatory reason, no automatic lockout clear, demo-seat-only self-service reset, additive shared status enum, **no Admin-created Admin accounts in Batch 2**, and the strict protected-file list.

No excluded-file dependency was encountered, so the stop-and-await-approval rule was never triggered.

---

## 5. G1 — Institute ID system

`src/mock-data/accounts.js` owns one institute-wide registry for the single institute (no tenant id, no per-institute namespace, no institute switching).

- **Shapes:** `VYU-S-YY-NNNN`, `VYU-F-NNNN`, `VYU-A-NNN` (admin is exactly 3 digits). Registry patterns and validation-layer patterns are kept in sync by a drift test, without `mock-data` importing `services` (see §17).
- **Separate identifiers:** `instituteId`, `rollNumber` (academic identifier) and the legacy `instituteCode` demo field remain distinct fields; tests assert they never collapse.
- **Year token:** `DEFAULT_INSTITUTE_ID_CONFIG.year = null`. It is institute-supplied config, never derived from `Date`, never auto-rolled, and never invented. A source-level test asserts the module contains no `Date`-derived year expression. Student provisioning with no configured year fails with `institute_year_not_configured` and issues **no** ID and **no** account. Test-only configuration values (`'99'`) are explicitly labelled as **not institute policy**.
- **Reconciliation:** `nextCounter = max(configuredSeed, lastAllocatedCounter, highestExistingNumericSuffix) + 1`, where `highestExistingNumericSuffix` scans seeded `users.js` fixtures, `institution.js` `adminUsers` records, the persisted registry and the permanent `issuedInstituteIds` ledger.
- **Non-reuse:** `issuedInstituteIds` is permanent. Suspended and archived accounts retain their records and IDs; counters never decrement (raising a seed can only move forward, lowering it cannot move back); allocation skips any candidate already issued or in use; exhaustion returns an explicit `institute_id_range_exhausted` error instead of wrapping.
- **State transitions:** explicit `ALLOWED_TRANSITIONS` for `active | invited | suspended | locked | archived`, with archived terminal and `locked → active` requiring an explicit unlock. Invalid transitions and unknown accounts are rejected. Every transition is regression-tested.
- **Admin accounts:** `provisionInstituteAccount({ role: 'admin' })` fails with `admin_provisioning_not_available`; the `VYU-A-NNN` shape is still allocated and tested for future use.

A counter-semantics robustness fix was made during the diff review: `counters[role]` now means **last allocated suffix** and is actually read during allocation (it had been written but unused), so non-reuse survives even if another reconciliation source is lost.

---

## 6. G2 — Temporary credential policy

- Exactly **12 characters** from the exact approved alphabet; `credentialPolicy` records that this is a user-selected/final-directive decision, **not** a blueprint requirement.
- `crypto.getRandomValues` with rejection sampling (`limit = floor(256 / alphabetLength) * alphabetLength`) gives a uniform distribution. Whole candidates are resampled until they also contain at least one letter and one digit, so a generated credential can never be weaker than the `newPasswordSchema` replacement policy. If 100 attempts fail the generator throws rather than emitting an off-policy or predictable value.
- If a secure generator is unavailable, `defaultRandomBytes` returns `false` and a **clearly labelled mock-only, predictable, NOT cryptographically secure** fallback is used. It is never described as secure.
- The injectable deterministic generator exists **exclusively for unit tests**; the product never injects it.
- **No time expiry.** An unused temporary credential remains valid until a future revocation/re-issuance is implemented; this is recorded as a documented security dependency (§18).
- A successful `changePasswordWithSetup` rotates salt + digest; the old temporary password fails login with the generic `invalid_credentials` error. Re-using the current temp password as the new one is rejected with `password_reuse_rejected`.
- Salted SHA-256 (`crypto.subtle.digest`) is deliberately reused with the mandated disclaimer in `src/services/mock/auth.js`, `src/mock-data/accounts.js`, `src/contracts/auth.js` and `SetupAccountPage.jsx`.

---

## 7. G3 — Credential non-exposure and storage separation

Three deliberately separate, versioned keys:

| Key | Contents |
|---|---|
| `vyuh.mock.accounts.v1` | Identity + lifecycle metadata only. **No passwords, hashes or salts.** |
| `vyuh.mock.auth.v1` | Salt, digest, lockout counters, legacy challenge/reset state. |
| `vyuh.session` | Active session envelope — metadata only. |

Migration is **additive**: `loadAccountsDb()` preserves existing keys, overlays stored records on the seeded demo projections, ignores corrupt/unversioned data rather than deleting fixtures, and never overwrites `vyuh.mock.auth.v1` or `vyuh.session`. A test sets sentinels in both pre-existing keys and proves they survive.

There is **no** `revealPassword`, `getPlaintext`, `retrievePassword` or password-retrieval API; source-level tests strip comments first and assert no such identifier is compiled. `projectSafeAccount` / `listAccounts` use a strict field whitelist, so even an accidental `passwordHash`/`salt` on a raw record cannot leave a normal account-list response. No credentials sheet, copy, download, CSV export or persistent plaintext cache exists. No password appears in URLs, query params, analytics, logs or audit entries. The first-login form clears both `useZodForm` values and the in-memory `useMutation` variables (`reset()`) on success, and `useCommitSession` clears the TanStack Query cache. The pre-existing `useLogin` mutation pattern was left unchanged.

**No delivery UI was built** — one-time viewing of credentials belongs to the future Admin People batch. `provisionInstituteAccount` is a **foundation helper**, not a facade method and not reachable from any route: it returns `{ instituteId, temporaryPassword }` once **in memory** so the login → setup → dashboard rule can be regression-tested. Nothing is persisted, logged, audited or retrievable afterwards.

---

## 8. G4 — Recovery and audit

Recovery remains **Admin-controlled and out-of-band**: the user contacts the Admin through an approved channel, the Admin verifies identity, issues a **NEW** temporary password with a mandatory reason, and the user repeats first-login setup. Lost credentials are never retrievable; the demo `ConsentFields.jsx` copy was not reused as policy.

- `PasswordRequest` is a **typedef only** in `src/contracts/admin.js`, with an explicit comment that there is no request state, request UI, public recovery route, Admin recovery UI or approve/decline/fulfil operation. Its `reason` field is mandatory.
- `IssueTemporaryPasswordInput` and `CredentialAuditEvent` in `src/contracts/auth.js` are contracts only; there is **no** `issueTemporaryPassword` public method or implementation.
- `createAccountAuditEntry` / `appendAccountAudit` whitelist exactly `id, at, actorId, target, action, reason` and require a non-empty reason (`audit_reason_required`). An injected `temporaryPassword` in a test does not survive into the stored entry.
- There is **no automatic lockout clear**: `writePassword(..., { clearAttempts: false })` is used for setup/recovery, while only the legacy demo-seat self-service reset keeps its original lockout-clearing behaviour. A separate explicit Admin unlock is required.
- The demo email self-service reset is preserved **only for the three seeded demo accounts**; Institute-ID accounts are excluded and receive the same generic response with no token stored.
- Login and setup produce distinct notices for suspended, archived, locked and expired-session states, while wrong/unknown credentials share one generic message (no account enumeration).

---

## 9. G5 — Policy acceptance (explicitly deferred / blocking)

No approved policy wording, version identifier, acknowledgement structure or attendance-retention statement was supplied, so **only** first-login password change, validation, session refresh, the protected route, completion and dashboard redirect were implemented.

`SetupAccountPage.jsx` is password-only. Tests assert: no checkbox, no "I accept the Terms" text, no attendance-consent text, no `ConsentFields` import, no `termsConsent`/`attendanceConsent`, no `ATT-…`/`policyVersion` assignment, and that the page explicitly says the institute "has not supplied approved wording or a version identifier". `acknowledgedPolicyVersion` is reserved as `null` in records/schemas with no invented value. The gate is **data-driven** on `mustChangePassword`, so an approved acknowledgement step can later be inserted without rebuilding authentication.

Pre-existing demo policy fixtures (`src/mock-data/policies.js`, `auditLog.js`, `institution.js`, `AdminPoliciesPage.jsx`, `ConsentFields.jsx`) were **left untouched** and were **not** used as the Batch 2 first-login policy. When G5 is supplied, the acknowledgement must be explicitly unchecked by default, store the approved version and timestamp, explain attendance tracking (what, why, retention, contact) using the institute's exact text, and never auto-accept.

---

## 10. WS1–WS8 implementation map

| WS | Outcome |
|---|---|
| **1** | Created credential-free, versioned `src/mock-data/accounts.js`; barrel export added to `src/mock-data/index.js`. Additive migration and storage separation. |
| **2** | Extended `src/contracts/user.js`, `auth.js`, `admin.js` (all original typedefs preserved), `src/services/authSchemas.js`, `src/services/types.js`, `src/services/api/schemas.js`. |
| **3** | `src/services/mock/auth.js`: unified email/Institute-ID resolver, status + lockout + first-login enforcement, `loginByInstituteId`, `changePasswordWithSetup`, `getAccountStatus`, old-temp invalidation, refreshed session, safe status projection, generic errors, demo preservation, retired `signup`/signup OTP/`acceptInvite`, no hash/plaintext in responses. |
| **4** | `sessionPersistence.js` (validated envelope, expiry, `setAccountEligibilityCheck` status revalidation), `sessionStore.js` (`mustChangePassword`), `useSession.js` (`useAccountSetup`). |
| **5** | `LoginPage.jsx`: Institute-ID/email text identifier, accessible labels/hints/errors, caps-lock hint, registration-retired notice, no public signup CTA, demo seats preserved. `DemoAccounts.jsx` invitation link removed. |
| **6** | Created password-only `SetupAccountPage.jsx`: clear explanation, shared validation, temp-password rejection, loading/error/success, cleared sensitive state, role dashboard redirect, `safeReturnPath`-validated destination, prototype disclaimer. |
| **7** | `guards.jsx` gained role-agnostic `RequirePasswordChange` and gated-user handling in `GuestOnly`; `AppRoutes.jsx` wires `RequireAuth → RequireRole → RequirePasswordChange` into all three workspace trees plus the access-denied/legacy branch. `safeReturnPath` rejects `/setup-account`. |
| **8** | `/setup-account` under `RequireAuth` only, outside `GuestOnly` and outside the setup guard (no loops). `/signup`, `/verify-otp`, `/join/:inviteCode` retired as provisioning mechanisms; old page files kept on disk; legacy redirects and all aliases preserved. |

---

## 11. Routes, aliases, redirects and demo preservation

- **Canonical routes unchanged:** `/student`, `/faculty`, `/admin`, `/app/*` compatibility, `/sign-in` → `/login`, `/student/papers`, `/student/account`, `/student/batch`, `/access-denied`. `HOME_FOR_ROLE` is unchanged (`git diff` shows only the `safeReturnPath` regex edit in `roles.js`).
- **All 33 Batch 1 v2 aliases preserved** (`{"student":11,"faculty":12,"admin":10}`, 5 provisional). The existing 77-test `v2-routes.test.jsx` suite passes unchanged, and `registration-retirement.test.jsx` additionally asserts `V2_ROUTE_MATRIX.length === 33` plus working `/s/exams`, `/sign-in` and `/app/account` redirects.
- **Retired routes** now render `RegistrationRetired` → `/login` with `state.registrationRetired`, which shows an accessible info notice: "Accounts are issued by your academic office … Public sign-up and self-service invitations are closed." No account, challenge or session is created. `SignupPage.jsx`, `VerifyOtpPage.jsx` and `JoinInvitePage.jsx` remain on disk, unrouted; their internal links are unreachable. No public "Create your account" CTA exists anywhere reachable.
- **No redirect loops:** `/setup-account` is outside `GuestOnly` and `RequirePasswordChange`; `GuestOnly` sends gated users to setup; finished sessions go to their own dashboard; `safeReturnPath` rejects `/setup-account`, `/setup-account?next=…`, `/login`, `/sign-in`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password` and `/join`. Guard-order source assertions and a stable-route test cover this.
- **Three demo seats preserved** with `DEMO_PASSWORD='vyuh2026'`; no forced setup (`mustChangePassword: false`), quick demo login, deep links, lockout/network scenarios, logout and role isolation all still pass. The demo Admin seat (`academic.office@vidyutacademy.in`) uses the existing email + demo-password path — the Admin auth distinction was inspected and documented, not assumed to share the first-login workflow.

---

## 12. Contracts, schemas, service facade and compatibility

- All original typedefs and exports were preserved: a HEAD-vs-current export diff shows **only additions** (`AccountStatus`, `InstituteAccount`, `LoginByInstituteIdInput`, `SetupAccountInput`, `AccountStatusInfo`, `IssueTemporaryPasswordInput`, `CredentialAuditEvent`, `PasswordRequest`; `INSTITUTE_ID_PATTERNS`, `instituteIdSchema`, `loginIdentifierSchema`, `setupAccountSchema`, `instituteAccountInputSchema`, `accountStatusSchema`, `provisionInstituteAccount`, `setAccountEligibilityCheck`).
- **`FirstLoginPolicy` was deliberately NOT added** even though Revision 2 §11.2 listed it prospectively: G5 withholds the acknowledgement *structure* as well as the wording and version, so defining that shape would invent a policy contract. `acknowledgedPolicyVersion` is reserved as `null` only, with no version value anywhere.
- `authSessionSchema` and `userSchema` gained **optional** identity/first-login metadata (`instituteId`, `mustChangePassword`, `acknowledgedPolicyVersion`), so legacy/demo envelopes still validate. `loginSchema` uses one `loginIdentifierSchema`; its empty-value message stays exactly `Enter a valid email address.` so the existing inline-validation regression is untouched.
- `AuthService` facade parity: `src/services/api/index.js` adds `loginByInstituteId` (delegating through the single `/auth/login` adapter after `instituteIdSchema` validation) and returns an honest `501 / setup_api_unavailable` for `changePasswordWithSetup` and `getAccountStatus` — **no backend endpoints are pretended to exist**. `src/services/api/schemas.js` re-exports the new schemas. `auth-mode.test.js` asserts parity in both mock and HTTP modes.
- `src/mock-data/index.js` barrel exports the registry; `src/services/mock/auth.js` imports fixtures only through that barrel, satisfying the architecture guard.

---

## 13. First-login flow and guard matrix

`login → mustChangePassword → /setup-account → changePasswordWithSetup → refreshed session → role dashboard`.

- Identity for setup comes **only** from the persisted authenticated session (`readPersistedSession`), never from UI-supplied role or Institute ID.
- `MustChangePassword` survives refresh in `vyuh.session` and cannot be bypassed by a direct protected URL. All three workspace trees and the access-denied/legacy branch enforce it.
- Guard ordering is asserted in source and in behaviour: `RequireAuth → RequireRole → RequirePasswordChange`. Non-gated wrong-role sessions still get `/access-denied` in their own layout; gated sessions are always diverted to setup.
- Session restoration revalidates account status via `setAccountEligibilityCheck`: suspended, locked and archived accounts cannot continue; a legacy envelope with no registry record is left alone.
- `SetupAccountPage` shows the issued Institute ID read-only, uses labelled password fields with show/hide and strength feedback, announces errors via `role="alert"`, disables/announces loading, shows a success notice, and passes automated WCAG A/AA axe checks together with `/login`.

---

## 14. C1 test migration — every changed test case, individually

**No test was weakened or deleted to make the suite pass.** All 209 baseline tests are still present; 8 obsolete cases were **rewritten into stronger retirement/security assertions**, 1 was extended, 1 was added, and 52 new focused tests were added (209 → 262).

### `tests/unit/auth-flow.test.jsx` (16 tests; 4 rewritten, 12 unchanged)

| # | Before | After | Why |
|---|---|---|---|
| 1 | `signup validates consent, supports the Terms dialog, then paste-verifies OTP` | `public signup is retired: no self-created account and no plaintext credential` | Asserts `/signup` → `/login` + notice, no CTA, `registration_retired`, no account created, no plaintext in all three storage keys. |
| 2 | `shows an expired OTP message and offers resend` | `the OTP verification route is retired and leaves no challenge state` | Asserts `/verify-otp` → `/login`, no OTP UI, `verifyOtp` fails with `challenge_not_found` for both expired and valid demo codes, challenge store empty. |
| 3 | `accepts a faculty invite and reaches the faculty layout` | `the invitation route cannot activate an account or reach the faculty layout` | Asserts `/join/…` → `/login`, no faculty nav, `acceptInvite` → `registration_retired`, read-only expired invite preserved, no session or plaintext. |
| 4 | `login and signup pass automated WCAG A/AA checks` | `login and the retired-signup notice pass automated WCAG A/AA checks` | Preserves axe coverage on `/login` and now scans the retirement notice; the setup page is axe-tested in `first-login.test.jsx`. |

Unchanged: 3 × quick-login layouts, deep link with query/hash, inline Zod errors + focus, 3 × distinct errors, 5-attempt lockout, mismatched-role access denied, demo reset journey, logout.

### `tests/unit/auth-service.test.js` (11 tests; 4 rewritten, 7 unchanged)

| # | Before | After | Why |
|---|---|---|---|
| 1 | `requires signup consent and a valid institute/batch, then verifies OTP` | `retires signup: schema input still validates, but no account, OTP or plaintext can be stored` | **C1 no-plaintext assertion retained here** across `vyuh.mock.auth.v1`, `vyuh.mock.accounts.v1` and `vyuh.session`; asserts `registration_retired`, no challenge, no account, generic `invalid_credentials`. Pure signup schema validation moved to `registration-retirement.test.jsx`. |
| 2 | `enforces resend cooldown and invalidates the old code` | `a resend cannot recreate a retired signup challenge` | Asserts `resendOtp`/`getChallenge` → `challenge_not_found` and empty challenge store. |
| 3 | `expires OTPs after ten minutes without extending them on read` | `no OTP challenge exists to expire, and a stale legacy challenge cannot activate an account` | Injects an old-build signup challenge into localStorage and proves `verifyOtp` still fails with `registration_retired` and removes it — a no-bypass assertion. |
| 4 | `accepts a faculty invitation once and rejects expired/unknown codes` | `keeps invitation records read-only and refuses account activation` | Preserves expired/unknown negative coverage; asserts no acceptance, no password stored, no session. |

Unchanged: 3 × sign-in with 8-hour expiry, 5-attempt lockout persistence/unlock, locked vs network distinctness, generic reset/token consumption, persisted-session expiry/malformed-envelope handling.

**Retired with explicit documentation (not ported):** OTP resend-cooldown timing, 10-minute OTP expiry, OTP auto-advance/paste and expired-OTP UI. No public challenge can be created in Batch 2, so a "pure challenge-logic" test would require exporting internals that no longer have a product path; the replacement assertions above are stronger for the retired surface.

### `tests/unit/auth-mode.test.js` (2 → 3 tests)

| # | Change |
|---|---|
| 1 | `hides demo seats and selects the HTTP adapter when mocks are disabled` — **unchanged**. |
| 2 | `rejects external, protocol-relative, backslash, and auth return paths` — **extended** with `/setup-account` and `/setup-account?next=/student`. |
| 3 | **Added** `keeps AuthService facade parity for the new identity methods in both modes` — asserts `login`, `loginByInstituteId`, `changePasswordWithSetup`, `getAccountStatus` exist on both adapters and that the HTTP setup method rejects with `setup_api_unavailable`. |

### `tests/e2e/auth.spec.js` (11 tests; 5 rewritten, 6 unchanged; **unverified — no Chromium**)

| # | Before | After |
|---|---|---|
| 1 | `signup, consent, OTP paste, and student session` | `public signup is retired and creates no student session` |
| 2 | `OTP auto-advance and paste support` | `the OTP verification route cannot complete a retired signup` |
| 3 | `expired OTP shows its own message` | `no OTP challenge or plaintext credential survives the retired routes` |
| 4 | `faculty invitation reaches faculty layout` | `the invitation route cannot activate an account or reach the faculty layout` |
| 5 | `mobile auth pages have no horizontal overflow and keyboard login works` | Overflow loop now treats `/signup` and `/join/…` as redirects that must not overflow, adds `/setup-account` using an **injected gated session (metadata only, never a credential)**, then clears it before the unchanged keyboard-login assertion. |

Unchanged: 3 × demo layouts, deep-link reload, distinct error messages, 5-attempt lock across reloads, forgot-password inbox/reset, mismatched-role access denied, logout.

> **Deviation disclosed:** Revision 2 §11.2 suggested leaving `tests/e2e/auth.spec.js` alone if Chromium was unavailable. It was rewritten anyway because leaving five tests that assert a **forbidden** public signup capability would ship a misleading, stale suite. The rewrites are reported as **unverified**; no browser result is claimed. `npx playwright test --list` still reports **56 tests in 7 files** (unchanged count).

---

## 15. New focused tests added (52)

| File | Tests | Coverage |
|---|---:|---|
| `tests/unit/account-model.test.js` | 12 | Registry init, additive migration/sentinels, approved shapes, year-token requirement, counter reconciliation, permanent non-reuse on suspend/archive, exhaustion, non-decrementing counters, 12-char alphabet generator (200 samples + deterministic test-only injection), explicit transitions, safe account projection, credential-free audit with mandatory reason, no retrieval API. |
| `tests/unit/institute-auth.test.js` | 10 | Institute-ID login, generic unknown/wrong credential errors, suspended/archived/locked notices, session-restore status revalidation, no Admin-created Admin, year-token gate, temp-password rejection + old-temp invalidation + persistence, no hash/plaintext exposure, three demo seats, demo-only reset exclusion. |
| `tests/unit/first-login.test.jsx` | 7 | Forced setup from every protected URL, refresh persistence/no bypass, validation + temp rejection + role redirect + cleared state, demo seats unaffected, **C1 no-plaintext port** across storage/logs/audit/session, G5 deferral hard-gates, WCAG A/AA axe on login + setup. |
| `tests/unit/guard-matrix.test.jsx` | 15 | 3 roles × (anonymous / correct-role / wrong-role / must-change-password), guard-order source assertions, loop prevention, return-path safety. |
| `tests/unit/registration-retirement.test.jsx` | 8 | 3 retired routes → `/login` notice, no signup CTA, no account/challenge/session, pure `signupSchema` consent/validation, read-only invitations, 33 aliases + `/sign-in` + `/app` regression. |

Plus the 1 added facade-parity test in `auth-mode.test.js` = **53 new tests**, giving **262** total.

---

## 16. Verification results on the final state

| # | Command | Exit | Result |
|---|---|---:|---|
| 1 | `npm test` | **0** | **24 passed (24) files, 262 passed (262) tests**, 62.49 s |
| 2 | `npm run build` | **0** | `✓ 3297 modules transformed`, `✓ built in 1.57s`, `dist/index.html 3.24 kB` |
| 3 | `npm run lint` | **0** | `Architecture check passed: 319 files, 318 colour-free, no boundary or token violations.` |
| 4 | `npx oxlint src tests` | **0** | `Found 38 warnings and 0 errors.` on **349 files / 104 rules with 2 threads** |

**Comparison with the Batch 1 baseline:** tests 19/209 → **24/262** (+5 files, +53 tests, zero failures); build 3300 → 3297 modules (three unrouted legacy auth pages and their now-unreferenced components leave the bundle, while two Batch 2 modules are added; the old page files remain on disk); architecture lint 317/316 → 319/318 (two new source files); oxlint **38/0 unchanged** (342 → 349 files because of the 5 new unit test files plus 2 new source files). No warnings were hidden or suppressed; all four commands were rerun on the final state after the last source edit.

**E2E / browser verification — NOT RUN, honestly reported.** `npm run test:e2e` was not executed because Chromium is unavailable: `~/.cache/ms-playwright` absent, no `chromium`/`chrome`/`firefox` executable on `PATH`, `PLAYWRIGHT_BROWSERS_PATH` unset. Earlier attempts to `npx playwright install chromium` failed with `ECONNRESET` because outbound access does not include `cdn.playwright.dev`. `npx playwright test --list` succeeds (56 tests in 7 files) but that is a static listing, **not** a run. Therefore: no real desktop/tablet/mobile width checks, no browser console check, no axe-in-real-browser result, no media/camera/cross-tab verification. jsdom + axe-core unit checks are the only accessibility evidence.

---

## 17. Full diff review and security evidence

`git status`, `git diff --stat`, `git diff --name-only`, `git diff --check`, a HEAD-vs-current export/typedef diff, a protected-file check, a boundary scan, a credential-literal scan, and source-level hard-gate tests were all performed.

- **Tracked diff:** 39 files, `1236 insertions(+), 397 deletions(-)` (includes all pre-existing Batch 1 changes). Batch 2 touched only files on the prospective list. Final working tree: **39 modified tracked + 22 untracked** = 5 markdown reports/plans (blueprint, Batch 1 report, decision gate report, Revision 2 plan, this Batch 2 report), 4 new Batch 1 source files (`v2Aliases.jsx`, `v2RouteTable.js`, `examDefinitions.js`, `examAvailability.js`), 2 new Batch 2 source files (`accounts.js`, `SetupAccountPage.jsx`), 6 new Batch 1 test files and 5 new Batch 2 test files.
- **No dropped typedefs/exports:** every original `export` and `@typedef` in `contracts/user.js`, `contracts/auth.js`, `contracts/admin.js`, `authSchemas.js`, `mock/auth.js`, `sessionPersistence.js`, `sessionStore.js`, `types.js` and `api/schemas.js` is still present; only additions appear.
- **Architecture boundary fix:** an earlier draft had `src/mock-data/accounts.js` importing `INSTITUTE_ID_PATTERNS` from `../services/authSchemas.js`. Although the architecture script did not flag it, this was a layering inversion. It was removed: the registry now owns its own patterns, `authSchemas.js` owns validation patterns, and `account-model.test.js` asserts their `.source` values agree. `grep` confirms **no `mock-data → services` imports remain**.
- **Credential/hash leakage scan:** no `revealPassword`/`getPlaintext`/`retrievePassword` compiled identifiers; no `console.*` of passwords/hashes/salts in any Batch 2 file; no `localStorage.setItem` of a plaintext credential; no password in URLs/query params/query cache/analytics; no credential literal in new source. The only password-like literals are the pre-existing public demo fixture `DEMO_PASSWORD='vyuh2026'` and test inputs.
- **Runtime assertions:** `first-login.test.jsx`, `institute-auth.test.js` and `auth-service.test.js` assert that neither the temporary nor the new plaintext password appears in `vyuh.mock.auth.v1`, `vyuh.mock.accounts.v1`, `vyuh.session`, the session object, `listAccounts()`, `getAccountStatus()`, spied `console.log/warn/error` calls, or audit entries. Audit entries are whitelisted to actor/target/action/reason/timestamp.
- **Fixture preservation:** `users.js` and `institution.js` untouched; the registry projects all four seeded demo accounts with `status: 'active'`, `mustChangePassword: false`, `instituteId: null`. No seeded user was deleted or silently altered.
- **Unintended changes:** no redesign, no token/CSS change, no `HOME_FOR_ROLE` change, no canonical-route change, no alias deletion, no redirect loop, no demo login regression. `git diff --check` clean. Known benign stderr during tests: Reduced Motion notice, Recharts width/height warnings, jsdom canvas `getContext` not implemented — none are failures.
- **C2 evidence:** `credentialPolicy` docblock states verbatim that 12 characters is a user-selected final-directive decision, **NOT** a blueprint requirement. This report does not attribute it to the blueprint.

---

## 18. Known limitations, remaining work and final stop condition

**Deliberate Batch 2 limitations (not defects):**
- Browser/E2E verification is unverified (no Chromium); see §16.
- `provisionInstituteAccount` is a non-UI foundation helper; **no Admin-created Admin accounts**, no Admin People UI, no credentials sheet/copy/download/CSV, no password-request queue, no full CSV-import-to-credentials bridge, no Admin-controlled invitations.
- Recovery/`issueTemporaryPassword` implementation, explicit Admin unlock action, and the audit UI are contract/helper only.
- **Unused temporary credentials remain valid until a future revocation/re-issuance is implemented** (documented security dependency of the approved "no time expiry" decision).
- No automatic lockout clear on recovery; the demo-seat self-service reset remains the only exception and applies to the three seeded demo emails only.
- The HTTP adapter has no real identity endpoints; setup methods return an explicit `501`.
- G5 policy acceptance is blocked pending institute-supplied wording, version, acknowledgement structure and attendance-retention/contact statements.
- `src/services/mock/admin.js`, `adminUsers` in `institution.js`, `AdminRole` (three-role ledger filter) and `commitImport`'s `invited` rows were documented, not refactored, to avoid unrelated Admin People changes.

**Remaining Batch 3+ work (list only — NOT implemented):** Admin People tabs; Create User; one-time credential viewing; CSV export; suspend/reactivate/unlock/edit/move-batch; password-request queue and Admin-issued new temporary passwords with mandatory reason and audit UI; explicit Admin unlock; full import→credentials bridge; Admin-controlled invitations; G5 consent step with approved version/timestamp; faculty live studio; student live viewer; cross-tab transport; exam hall work; real-browser E2E once Chromium is available.

**STOP.** Batch 2 is complete and verified to the extent this environment allows. No commit, push, merge, pull request, publish or deployment was performed. No Batch 3 work, backend, unrelated feature or redesign was started. Awaiting an explicit next-batch instruction from the user.
