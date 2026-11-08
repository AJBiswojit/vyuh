# Vyuh — Batch 2 Updated Architecture & Decision Plan

**Revision 2 — user decision update**
**Date:** 2026-11-08 (Asia/Calcutta)
**Branch:** `arena/1763b46c-vyuh` (status: **active**) · **HEAD:** `ced54030c336bb1041454fd8780f56f423af19f8`
**Task type:** **Planning and decision-finalization only.**
**Application source changes:** **NONE.** No implementation, no commit, push, merge or publish.
**Sources of truth:** `VYUH_COMPLETE_FRONTEND_AUDIT_AND_IMPLEMENTATION_BLUEPRINT.md`, `VYUH_BATCH_1_COMPLETION_REPORT.md`, `VYUH_BATCH_2_DECISION_GATE_REPORT.md`, the Revision-1 version of this plan, this decision update, and a fresh read-only inspection of the checkout.

> **Revision note:** Revision 2 records the institute's **user-selected decisions for G1–G4** and keeps **G5 explicitly pending**. It supersedes the G1–G4 "recommended default" column in Revision 1 where a decision has now been made. `VYUH_BATCH_2_DECISION_GATE_REPORT.md` remains the evidence record for Gate 0 and the architecture inventory; its §9 decision request is superseded by §8 below. **No user-selected decision is re-asked.**

---

## 0. Status classification — read this first

| Class | Meaning | Where |
|---|---|---|
| ✅ **CONFIRMED — FINAL** | Product direction declared FINAL in the earlier directive. No further approval requested. | §1, §2, §3, §4 lifecycle |
| ✅ **USER-SELECTED — APPROVED** | Decisions supplied in **this** update for G1–G4. Implement as-is. | §5 (marked cells), §8.1 |
| 🔧 **RECOMMENDED TECHNICAL DEFAULTS — AWAITING APPROVAL** | My simplest-safe implementation proposals. Sign-off still needed. | §5, §7, §8.2 |
| ⚠️ **INSTITUTE POLICY INFORMATION STILL REQUIRED** | G5 policy wording/version and the 11 listed open details. **Blocking.** | §5 G5, §8.3 |
| ⚠️ **REMAINING IMPLEMENTATION DEPENDENCIES** | Work or rulings that must exist before coding starts. | §8.4, §9, §10 |

**Verification state (unchanged, read-only):** `npm test` 19 files / **209 passed**, `npm run build` ✓ 3300 modules, `npm run lint` ✓, `npx oxlint src tests` **38 warnings / 0 errors** (Batch 1 baseline). Working tree contains the 20 Batch 1 source modifications plus the planning documents; no new source change was made in this revision. Chromium remains unavailable, so **no browser/e2e verification is claimed**.

---

## 1. ✅ Confirmed single-institute architecture

Vyuh serves **exactly one institute**. This is a product constraint, not a configuration option.

| Confirmed rule | Consequence for Batch 2 |
|---|---|
| One institute, one institute-wide account & identity system | `src/mock-data/accounts.js` holds a **single** flat account registry; no tenant scoping or per-institute partitioning |
| No multi-tenancy | No tenant id on accounts, sessions, storage keys or service methods |
| No institute registration or institute switching | No new route, selector, onboarding flow or config screen |
| No unnecessary institute-level configuration or isolation layers | Reuse the existing single `institute` fixture (`src/mock-data/institution.js`) |
| Existing institute identity stays intact | `DEMO_INSTITUTE_CODE = 'VYUH2026'` and `instituteCode` remain **legacy demo fields**, not tenant mechanisms (§8.3, D2) |

**Reinforced by this update:** G1 now explicitly confirms **one institute-wide unique identity system** — the ID generator is a single global series per role prefix, with no per-institute namespace.

**Evidence:** a case-insensitive scan of all `*.js`, `*.jsx`, `*.json`, `*.md` files (excluding `node_modules`/`dist`) for `tenant`, `multi-tenant`, `multi-institute`, `institute switch`, `superuser` returned **zero matches**.

---

## 2. ✅ Confirmed Admin-as-highest-authority role structure

```
ADMIN   (highest authority — "Academic office")
 ├── Faculty
 └── Students
```

* There is **no Super Admin** role, now or in the intended product.
* The existing `admin` role is the highest-authority role. Admin owns student/faculty account management, credential creation, Institute ID generation, activation/suspension/archival, password-recovery approvals, academic & examination management, course & subject management, institute settings & policies, reports & analytics.
* **G4 reinforces this:** password recovery is **Admin-controlled**, Admin verifies identity, and Admin issues the new temporary password.

**What already exists (verified — preserve it):**

| Capability | Evidence |
|---|---|
| Role model | `Role = 'student'\|'faculty'\|'admin'` (`src/contracts/user.js:4`); `roleSchema` (`src/services/authSchemas.js:56`); `HOME_FOR_ROLE` (`src/shared/lib/roles.js:7`) |
| Route protection | `RequireAuth` + `RequireRole` (`src/app/routes/guards.jsx:12-27`); all `/admin/*` under `RequireRole allow={['admin']}` |
| Admin surface | `ADMIN_NAV` (`src/app/layouts/AdminLayout.jsx:13-25`): Overview, Users, Batches, Approvals, Policies, Integrity, Reports, Moderation, Audit log, Settings, Account |
| AdminService | `src/services/types.js:189-212`, `src/services/mock/admin.js:280-1040` — users, CSV import, batch allocation, approvals, policies, integrity, reports, moderation, audit, branding; all mutations already write the audit ledger |
| Admin demo seat | `academic.office@vidyutacademy.in` / `vyuh2026` (`src/mock-data/users.js:26,59-67`); `officeUsers` (`src/mock-data/institution.js:138-156`) |

**Honest gap:** Admin authority is conceptually complete but **not** implemented for the account lifecycle. `AdminService` has no `createUser`, `suspendUser`, `unlockUser`, `resetPassword`, `resolvePasswordRequest` etc. (blueprint D-03/D-27); `commitImport` writes `invited` rows with no ID/password (D-28). Those are Admin People batch work, **not** Batch 2. Batch 2 defines the identity foundation only.

**Open (not decided by this update):** whether **Admin-created Admin accounts** are permitted (§8.3, A1). Recommended default: **no** in Batch 2 — no creation path exists and the Admin seat is a seeded fixture.

---

## 3. ✅ Super Admin removal impact assessment

**Scan result: there is nothing to remove.** No Super Admin role, flag, guard, route, fixture, permission constant, documentation statement or test exists.

| Search term | Matches in `src`, `tests`, docs, JSON |
|---|---|
| `super admin` / `super-admin` / `super_admin` / `superadmin` | **0** |
| `superuser`, `root admin`, `platform owner`, `global admin`, `isSuperAdmin` | **0** |
| `tenant` / `multi-tenant` / `institute switching` / `multi-institute` | **0** |
| Any fourth role value in `roleSchema`, `Role`, `HOME_FOR_ROLE`, `ADMIN_NAV`, `RequireRole` | **0** — exactly 3 roles |

**Naming artifact (documented, deliberately NOT changed):** `src/contracts/admin.js:12` declares `@typedef {'student'|'faculty'|'admin'} AdminRole`. Despite the name, this is the **filter type for the users ledger** (`AdminUser.role`, `UserQuery.role`) — a union of all three roles, **not** an elevated "admin-of-admins" role. Renaming would cascade through `AdminUser`, `UserQuery`, `listUsers`, admin UI filters and their tests: an unrelated refactor, so it is **documented rather than changed**.

**Files to delete/rename for Super Admin removal:** **none.** **Files to modify:** **none.** **Regression risk from this change:** **zero** (no change made).

**Dependency that cannot safely be removed in Batch 2 (documented, not refactored):** the Admin People surface (`AdminUsersPage`, `AdminImportPage`, `institution.js adminUsers`, the `admin.js` store) still models accounts independently of authentication. Wiring it to the shared registry belongs to the Admin People batch and depends on G3/G4 delivery decisions. Batch 2 must not silently rewrite that store.

---

## 4. ✅ Updated authentication lifecycle

```
1. ADMIN creates a student or faculty account        [Batch 3 UI; Batch 2 defines the contract]
2. System generates a unique Institute ID            [G1 — format approved; counters/rollover pending]
3. System generates a temporary password             [G2 — 12 chars, random, ambiguous chars excluded]
4. Admin securely provides the initial credentials   [G3 — one-time viewing; no retrieval of lost values]
5. User logs in with Institute ID + temp password    [Batch 2]
6. Account is identified as requiring first-time setup
7. User creates a new password                       [Batch 2 /setup-account — policy step PENDING (G5)]
8. User accepts the required institute policy        [⚠️ BLOCKED until wording + version supplied]
9. User enters the correct role dashboard            [Batch 2 guard + homeRouteFor]
```

**Recovery loop (G4, user-selected):**
```
user cannot sign in / loses credentials
 → Admin verifies the user's identity
 → Admin issues a NEW temporary password  (the old value is NEVER retrieved)
 → user completes first-login password setup AGAIN
 → recovery action is recorded in the audit trail
```

Confirmed constraints: **no public self-registration; no unauthorized account creation; the same authentication foundation supports Admin, Faculty and Student accounts; mandatory password change during first login; previous temporary password invalid after successful change; no permanent plaintext password storage; no credentials in logs, audit entries, normal account lists or session records.**

### 4.1 Admin authentication distinction (inspected, not assumed)

* All three demo seats authenticate identically: `AuthService.login({ email, password })` → `sessionFor(user)` → `useSessionStore.setSession` → `homeRouteFor(role)`. There is **no** first-login flag anywhere today.
* The Admin seat is a **seeded fixture**, not an admin-created account; no admin-created-account path exists at all.
* The mandatory first-login gate is therefore meaningful only for accounts carrying a temporary credential. It is **not** automatically applicable to the three demo seats.
* Recommended technical treatment: make the gate **data-driven** (`mustChangePassword === true`), not role-driven. Any account — including an Admin-created admin account, if later approved — carrying a temporary credential is gated; seeded demo seats are not. This honours "one authentication foundation" without forcing a fake first-login on the demo Admin and without hard-coding "students/faculty only" into the guard.

### 4.2 Architecture constraints (confirmed)

* Separation: `vyuh.mock.accounts.v1` (identity + lifecycle, **no secrets**) / `vyuh.mock.auth.v1` (salt, digest, lockout, challenges) / `vyuh.session` (session envelope).
* Never store plaintext passwords in account records, session storage or logs. Never include credentials in URLs, query parameters, analytics or audit entries.
* Enforce account status at **login** and at **session restoration** (`readPersistedSession` currently validates only schema + expiry — must be extended).
* Enforce mandatory setup **before** any dashboard; `/setup-account` must remain reachable for the gated user.
* **Prevent guard redirect loops:** `GuestOnly` (`src/app/routes/guards.jsx:35`) bounces any authenticated user to their dashboard, and `safeReturnPath` (`src/shared/lib/roles.js:18`) does **not** reject `/setup-account`. Both must be addressed together (§7, T5/T6).
* Mock authentication must be explicitly labelled **prototype-only, not production-grade security**. The existing salted SHA-256 digest is **not** a password KDF.

---

## 5. G1–G5 decision tables

**Legend:** ✅ **USER-SELECTED** = approved in this update, implement as-is · 🔧 **RECOMMENDED** = my simplest-safe technical proposal, **awaiting approval** · ⚠️ **OPEN** = no value may be invented; institute approval required.

> **C2 correction — still important, now resolved differently:** the approved blueprint does **not** establish a 12-character temporary-password requirement (blueprint line 537: *"no specification for the password algorithm … exists in this repository"*; line 541 marks `credentialPolicy` as *"proposed, pending confirmation"* with no values). **12 characters is now a USER-SELECTED decision from this update — not a blueprint requirement.** It must never be attributed to the blueprint.

### G1 — Institute ID generation ✅ (format approved; counters/rollover pending)

| # | Exact question | Why it matters | Decision / recommended default | Security implications | Implementation dependency |
|---|---|---|---|---|---|
| G1.1 | Approved ID format? | Drives parser, Zod schema, field width, display, tests. | ✅ **USER-SELECTED:** `VYU-S-YY-NNNN` (student), `VYU-F-NNNN` (faculty), **`VYU-A-NNN` (admin — 3 digits)**, one institute-wide unique identity system. Note the admin series is **3 digits**, not 4. | IDs are login identifiers, not secrets; predictable IDs require generic credential errors + lockout to resist enumeration. | `instituteId` typedef, generator, `LoginPage`, `authSchemas`, session fields |
| G1.2 | Student year token and academic-year rollover rules? | Without a rule `YY` cannot be derived; a wrong rollover can reissue an ID. | ⚠️ **OPEN.** ✅ User-selected constraint: the year token must be **configurable and reconciled with existing records**. 🔧 Simplest safe default: store `YY` as an **institute-supplied configuration value**; **no automatic rollover** in Batch 2; never derive it from `Date`. **Do not assume rollover rules.** | Silent reuse of an issued identity is explicitly forbidden; a hard-coded `26` would be fabricated policy. | `instituteIdCounter.year`, `issuedInstituteIds`, generator tests |
| G1.3 | Faculty numbering scope? | Decides whether `VYU-F-0042` can reappear later. | 🔧 One institute-wide, monotonically increasing faculty counter, never reset (consistent with the single-institute decision). ⚠️ Year-persistence wording still needs sign-off. | Reuse would confuse an old credential with a new identity. | counter shape, persistence |
| G1.4 | Admin numbering / can Admin-created Admin accounts exist? | Blueprint §4.4.3 has **no admin counter**; must not be invented silently. | ✅ Format `VYU-A-NNN` is approved. ⚠️ **OPEN (A1):** whether Admin-created Admin accounts are permitted. 🔧 Simplest safe default: **no** creation path in Batch 2; keep the guard data-driven so a later "yes" needs no refactor. | Avoids a counter for a role with no creation path. | counter shape, A1 ruling |
| G1.5 | Initial counter values and reconciliation? | Determines the first generated IDs and regression expectations. | ⚠️ **OPEN.** ✅ User-selected constraint: initial counters must be **configurable and reconciled with existing records**. 🔧 Simplest safe default: seed from config, then take `max(configuredSeed, highest numeric suffix observed in users.js / institution.js adminUsers / persisted accounts.v1) + 1`; record every issued value in `issuedInstituteIds`. | Starting below an already-issued ID would collide with migrated records. | seed data, migration, collision test |
| G1.6 | Should existing roll numbers remain separate from Institute IDs? | `AdminUser.rollNumber` (`VY-25-0187`) and `User.instituteCode` already exist. | 🔧 **Recommend: keep separate** — `instituteId` = login identity, `rollNumber` = academic identifier, `instituteCode` = legacy demo field. ⚠️ Awaiting approval. | Conflating identifiers risks leaking academic IDs into auth logs and breaking `/admin/users` filters. | `contracts/user.js`, `contracts/admin.js`, `userSchema` |
| G1.7 | Collision handling / uniqueness across suspended & archived records? | User-selected: **never reuse previously issued IDs**. | ✅ **USER-SELECTED:** never reuse. 🔧 Simplest safe default: maintain a **permanent `issuedInstituteIds` set** (never pruned by suspension/archival), **advance to the next free number**, and hard-fail with an explicit error if the range is exhausted. Never decrement or silently skip. | A pruned ledger would permit identity reuse; collisions must be observable. | `accounts.js`, `createUser` error contract, collision unit test |

### G2 — Temporary password policy ✅ (core rules approved; details pending)

| # | Exact question | Why it matters | Decision / recommended default | Security implications | Implementation dependency |
|---|---|---|---|---|---|
| G2.1 | Length? | Generator, validation, sheet width, tests. | ✅ **USER-SELECTED: 12 characters** (this update — **not** a blueprint requirement). | Short credentials are guessable; pair with lockout + generic errors. | `credentialPolicy.length`, generator, tests |
| G2.2 | Allowed character set / excluded characters? | A generator needs an enumerated alphabet. | ✅ **USER-SELECTED:** exclude confusing characters `0`, `O`, `1`, `I`, `l`. ⚠️ **OPEN:** the **exact alphabet**. 🔧 Simplest safe default: uppercase minus `I,O`; lowercase minus `l` (and optionally `i,o` for symmetry — **proposal only**); digits `2–9`. A concrete example is `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789`. | Ambiguous glyphs cause support failures; a weak alphabet reduces entropy. | rejection-sampling generator, `credentialPolicy.alphabet` |
| G2.3 | How is it generated / verified? | Determines whether any security claim is honest. | ✅ **USER-SELECTED:** randomly generated. 🔧 `crypto.getRandomValues` + rejection sampling (available; `webcrypto` polyfilled in `tests/setup.js`), injectable deterministic **mock-only** generator for tests; store only salt + SHA-256 digest in `vyuh.mock.auth.v1`. **Disclaimer:** salted SHA-256 is not a password KDF; not production-grade security. | Never persist plaintext; never log passwords or hashes; never expose via queries or audit. | `mock/auth.js`, `accounts.js` contract, tests |
| G2.4 | Time-based expiry? | Determines whether `temporaryPasswordIssuedAt` is a login-time check. | ⚠️ **OPEN.** 🔧 Simplest safe default: **no time-based expiry** in the mock prototype; the credential is invalidated by successful first-login setup, and Admin re-issue is the only recovery. If the institute wants time expiry, it must supply the exact period. | An unused credential stays valid until Admin revokes/suspends — Admin suspension/revocation (Batch 3) is therefore a **security dependency**. | login status check, error codes, G4 |
| G2.5 | One-time use / first-login rotation? | Defines "mandatory change" precisely. | ✅ **USER-SELECTED:** password change is **mandatory during first login**, and the **previous temporary password becomes invalid after a successful change**. 🔧 Implementation: credential authenticates only while `mustChangePassword === true`; re-login before completing setup still works; hash is replaced at setup. | Ensures the old temp password fails after setup; prevents a no-op "change". | hash replacement, session refresh, "old temp rejected" test |
| G2.6 | What happens after expiry / on loss? | Defines the recovery path. | ✅ **USER-SELECTED (G3):** if credentials are lost, **Admin issues a NEW temporary password** — the old value is **never retrievable**. 🔧 If time expiry is later approved: login blocked with a distinct message and Admin re-issues; no self-service revival. | A self-service "revive" path would bypass Admin control. | `authErrors.js`, G4, G3 |
| G2.7 | Exact new-password validation rules? | `/setup-account` must enforce an approved policy. | ⚠️ **OPEN.** 🔧 Simplest safe default: reuse existing `newPasswordSchema` (`src/services/authSchemas.js:10-14`: min 10, ≥1 letter, ≥1 digit, max 128) + confirm field + **reject the current temp password**. | Rejecting the temp password prevents a no-op change. | `setupSchema`, `SetupAccountPage`, validation tests |

### G3 — Credential delivery ✅ (approved; no Batch 2 UI)

| # | Exact question | Why it matters | Decision / recommended default | Security implications | Implementation dependency |
|---|---|---|---|---|---|
| G3.1 | How are credentials shown? | Prevents persistent plaintext. | ✅ **USER-SELECTED: one-time viewing** of generated credentials. 🔧 In-memory only, cleared on close/navigation and from any query cache. | One-time visibility limits the exposure window. | `credentialDelivery: 'pending'\|'shown'\|'delivered'` |
| G3.2 | Where may plaintext appear? | Fixes the storage split. | ✅ **USER-SELECTED:** **no permanent plaintext storage**; **no credentials in logs, audit entries, normal account lists, or session records**. | These are the highest-risk egress points; account/session stores carry only hashes and metadata. | `accounts.v1` vs `auth.v1` vs `vyuh.session`, `listAccounts` projection |
| G3.3 | What if credentials are lost? | Determines whether a retrieval path exists. | ✅ **USER-SELECTED:** Admin must **issue a NEW temporary password** rather than retrieve the old one. 🔧 No `revealPassword`/`getPlaintext` method in any contract; re-issue triggers setup again and writes an audit entry. | A retrieval API would require stored plaintext — forbidden. | `issueTemporaryPassword` contract, G4 |
| G3.4 | CSV export? | Scope boundary. | ✅ **USER-SELECTED / CONFIRMED: CSV export remains outside Batch 2.** ⚠️ Whether it is ever permitted, its allowed columns, and the exact secure-sharing warning wording remain **open** and belong to the Admin People batch. | A downloaded CSV is a persistent plaintext artifact outside app control; no legal/security copy will be invented. | `CredentialSheetRow` contract only (no UI) |
| G3.5 | Explicit Admin authorization? | Confirms authority. | 🔧 Recommend: any future credential delivery is gated on the `admin` role only (`RequireRole allow={['admin']}`), consistent with §2. | Prevents self-service credential creation. | future Batch 3 surface |

### G4 — Password recovery ✅ (approved model; open details)

| # | Exact question | Why it matters | Decision / recommended default | Security implications | Implementation dependency |
|---|---|---|---|---|---|
| G4.1 | Who controls recovery? | Defines the workflow. | ✅ **USER-SELECTED: Admin-controlled recovery. Admin verifies the user's identity.** | Removes self-service account takeover paths. | no public recovery endpoint in Batch 2 |
| G4.2 | What does Admin do? | Defines the credential transition. | ✅ **USER-SELECTED: Admin issues a NEW temporary password** (never retrieves the old one). | Consistent with G3.3. | `issueTemporaryPassword` contract |
| G4.3 | What must the user do afterwards? | Closes the loop. | ✅ **USER-SELECTED: user must complete first-login password setup again** (`mustChangePassword = true` re-applied). | A recovered account cannot keep a known temp credential. | `changePasswordWithSetup`, guard |
| G4.4 | Are recovery actions auditable? | Accountability. | ✅ **USER-SELECTED: recovery actions must be auditable.** 🔧 Write through the existing `recordAudit()` ledger; record actor, target account, action and timestamp — **never the credential value**. | Audit entries must not become a credential leak (G3.2). | `admin.js` audit bridge (Batch 3), audit schema |
| G4.5 | Are requests submitted through Vyuh or communicated directly to Admin? | Determines whether a public request route/state exists. | ⚠️ **OPEN.** 🔧 Simplest safe default: **out-of-band (direct to Admin)** in Batch 2 — no new public request route, form or state; the shared `PasswordRequest` **typedef only** may be defined. | Unauthenticated in-app requests enable enumeration unless generic + rate-limited. | `contracts/admin.js` typedef, no UI |
| G4.6 | Does recovery approval require a reason? | Audit quality. | ⚠️ **OPEN.** 🔧 Simplest safe default: **yes, mandatory reason** for every issuance decision, to make §4.4 meaningful. | An unaudited credential re-issue is a security gap. | validation + audit entry (Batch 3) |
| G4.7 | Does recovery automatically clear account lockout? | `setPassword()` currently **always clears** lockout (`src/services/mock/auth.js:80-86`). | ⚠️ **OPEN.** 🔧 Simplest safe default: **no automatic clear**; require a separate explicit Admin unlock decision recorded in the audit trail. | Automatic unlock would let repeated failed logins be washed away by recovery. | `setPassword`, `db.attempts`, existing reset test at `auth-service.test.js:79` |
| G4.8 | Does existing demo-account reset behaviour remain? | Affects 1 unit test + 2 e2e tests and the demo seats. | ⚠️ **OPEN.** 🔧 Simplest safe default: keep `/forgot-password` + `/reset-password` **for the three seeded demo email seats only**; explicitly exclude Institute-ID accounts from self-service reset. | Demo seats are public fixtures; their reset must never be mistaken for real recovery. | `LoginPage` link, `requestReset`/`resetPassword`, route scope |
| G4.9 | Is there a shared `PasswordRequest` contract/mock state in Batch 2? | Scope boundary. | 🔧 Recommend **typedef only, no state/UI**, unless the institute wants it earlier. | An unused state store adds complexity with no workflow. | `contracts/admin.js`, `types.js` |

**Invitation dependency:** `acceptInvite` / `/join/:inviteCode` is currently a **self-service password-setting route**, conflicting with "no unauthorized account creation". Recommended: retire it as a provisioning path (§6). Any Admin-controlled invite replacement is a **separate batch** and depends on the G4.5 ruling.

### G5 — First-login policy acceptance ⚠️ **EXPLICITLY PENDING — BLOCKING**

**The institute has not supplied the actual policy wording or version identifier. No legal or institutional text will be invented. Mandatory policy acknowledgement cannot be enabled until the information below is provided.**

| # | Exact question | Why it matters | Recommended default | Security implications | Implementation dependency |
|---|---|---|---|---|---|
| G5.1 | What exactly must users accept? | `/setup-account` must render approved content verbatim. | ⚠️ **NO DEFAULT.** `ConsentFields.jsx:16-38` is a **demo summary that explicitly says "not a production legal agreement"**, with no retention expectations and no named contact. Institute must supply wording covering attendance tracking, why it is tracked, retention expectations and whom to contact. | Shipping invented policy text is a compliance misrepresentation. | `firstLoginPolicy` constant, `SetupAccountPage` |
| G5.2 | Policy version identifier? | Enables version-change enforcement. | ⚠️ **NO DEFAULT.** No `policyVersion` string exists anywhere in `src`/`tests`. | Without a version, policy changes cannot be detected. | `authSessionSchema`, `accounts.v1`, guard |
| G5.3 | Is acceptance mandatory before workspace access? | Defines the guard. | 🔧 **Yes** — explicit, unchecked checkbox; no auto-consent; no completion without it. | Auto-acceptance would be invalid consent. | `RequirePasswordChange`, `changePasswordWithSetup` |
| G5.4 | One combined acknowledgement or separate Terms + attendance? | `ConsentFields.jsx` has **two** checkboxes; the Batch 2 assignment says "an explicit checkbox" (singular). | 🔧 **Recommend ONE combined institute-approved acknowledgement.** ⚠️ Awaiting approval. | Fewer explicit actions means a weaker audit trail of what was accepted. | `ConsentFields.jsx` reuse vs new control, schema |
| G5.5 | Store version + timestamp; re-accept on change? | Re-consent behaviour. | 🔧 **Yes**: `acknowledgedPolicyVersion` (account + session), `acknowledgedAt` in `vyuh.mock.accounts.v1` (not the session); re-accept when `acknowledgedPolicyVersion !== currentPolicyVersion`. ⚠️ Who may change `currentPolicyVersion` must be defined. | A silent version bump leaves stale consent; timestamps in the session would be client-tamperable. | `firstLoginPolicy.currentVersion`, guard, re-consent test |
| G5.6 | Which roles does the policy apply to? | Linked to A1 (Admin-created admin accounts). | 🔧 All accounts that complete setup, data-driven. ⚠️ Awaiting A1. | Role-based exemptions could leave a privilege gap. | guard, `InstituteAccount` |

#### Minimum information required from the institute before mandatory acknowledgement can be enabled

1. **The exact approved policy wording**, covering: what attendance data is tracked, why it is tracked, retention expectations, and whom to contact. (A reference to an institute-approved document is acceptable if its full text is provided.)
2. **The approved policy version identifier** (e.g. `ATT-2026.1`) and confirmation of the format used for future versions.
3. **Confirmation that acknowledgement is mandatory** before any role dashboard is accessible.
4. **One combined acknowledgement or two separate ones** (Terms vs attendance data policy).
5. **Whether a policy-version change requires re-acknowledgement**, and **who is authorised to change the current version**.
6. **Whether an acknowledgement timestamp must be recorded**, and whether it may appear anywhere in the UI or reports.
7. **Which roles the policy applies to** (all three, or student/faculty only) — depends on A1.
8. **Permission to retire the existing demo `ConsentFields.jsx` copy** and confirmation that no legal or regulatory statements may be shipped until (1) and (2) are supplied.

Until items 1–2 (and ideally 3–8) are supplied, the **password-change step** of `/setup-account` is the only part that can be planned; the **consent step and the consent-based guard condition remain disabled/pending**. Batch 2 must not ship placeholder policy text.

---

## 6. C1 — Test migration recommendation ✅ (approach retained and confirmed)

**This update explicitly retains the C1 approach.** Confirmed constraints: rewrite obsolete public signup and invitation tests into **retirement/security assertions**; preserve authentication, lockout, session and role-isolation coverage; **port the no-plaintext-password assertion into the first-login flow**; **do not delete tests merely to make the suite pass**. Every changed test case must be reported in the Batch 2 completion report.

**Approach:** keep the old page files and, where safe, the service methods; retire only the **routes**; **rewrite** obsolete UI/e2e assertions into stronger assertions that self-registration is impossible. This is a rewrite of intent, not a weakening.

### 6.1 `tests/unit/auth-flow.test.jsx` (16 tests)

| Line | Current test | Recommended change | Coverage preserved? |
|---|---|---|---|
| 30 | `preserves a deep link including query and hash through login` | **Unchanged** | ✅ deep-link security |
| 42 | `shows inline Zod errors and focuses the first invalid field` | **Unchanged** | ✅ validation |
| 66 | `locks after five wrong passwords and keeps the submit action locked` | **Unchanged** | ✅ lockout |
| 80 | `shows access denied in the user's own layout for a mismatched route` | **Unchanged** | ✅ role isolation |
| **89** | `signup validates consent, supports the Terms dialog, then paste-verifies OTP` | **Rewrite** → `/signup` unreachable as a registration flow (redirect / account-not-issued message); no consent dialog publicly reachable | ✅ stronger assertion |
| **123** | `shows an expired OTP message and offers resend` | **Rewrite** → `/verify-otp` cannot complete retired self-registration; port expiry/resend coverage to a pure challenge-logic test if OTP is retained for demo reset (depends G4.8) | ⚠️ conditional |
| 133 | `requests a reset, opens the mock inbox link, and signs in with the new password` | **Unchanged if G4.8 approves keeping demo-seat reset**; otherwise rewrite into "self-service reset is not available for institute accounts" | ⚠️ conditional |
| **150** | `accepts a faculty invite and reaches the faculty layout` | **Rewrite** → `/join/:inviteCode` cannot create or activate an account; redirects with an account-not-issued message (or preserve only if invitations are explicitly approved as Admin-controlled provisioning) | ⚠️ conditional |
| 161 | `logout clears persisted session and returns to the landing page` | **Unchanged** | ✅ session clearing |
| **171** | `login and signup pass automated WCAG A/AA checks` | **Rewrite** → `login and setup-account pass automated WCAG A/AA checks` | ✅ accessibility retained |

### 6.2 `tests/unit/auth-service.test.js` (11 tests)

| Line | Current test | Recommended change |
|---|---|---|
| 32 | `locks on the fifth failure, persists it, and rejects even the correct password` | **Unchanged** |
| 43 | `keeps locked and network failures distinct and does not count network failures` | **Unchanged** |
| **49** | `requires signup consent and a valid institute/batch, then verifies OTP` | **Rewrite** → `auth.signup` is no longer a provisioning path; retain **consent + institute/batch Zod validation** as a pure `signupSchema` test; add assertion that no account is created |
| **60** | `expect(localStorage.getItem('vyuh.mock.auth.v1')).not.toContain(signup.password)` (inside test 49) | ✅ **Port this no-plaintext assertion into the first-login flow** — assert no plaintext temp password or new password appears in `vyuh.mock.auth.v1`, `vyuh.mock.accounts.v1`, `vyuh.session`, logs or audit. Critical security coverage, explicitly preserved |
| **63** | `enforces resend cooldown and invalidates the old code` | **Port to pure challenge-logic test** if OTP retained; otherwise retire with explicit documentation |
| **73** | `expires OTPs after ten minutes without extending them on read` | **Port to pure challenge-logic test** if OTP retained; otherwise retire with documentation |
| 79 | `returns a generic reset response, consumes reset tokens, and clears lockout` | **Unchanged if G4.8 approves**; note G4.7 may change the "clears lockout" expectation — must be ruled on first |
| **90** | `accepts a faculty invitation once and rejects expired/unknown codes` | **Rewrite** → invite cannot self-activate an account; preserve "once/expired/unknown" negative coverage against the retired path |
| 99–… | `persisted session` suite | **Unchanged**, extended with `instituteId` / `mustChangePassword` / `acknowledgedPolicyVersion` fields and **account-status revalidation** assertions |

### 6.3 `tests/unit/auth-mode.test.js` (2 tests)

| Line | Current test | Recommended change |
|---|---|---|
| 7 | `hides demo seats and selects the HTTP adapter when mocks are disabled` | **Unchanged** |
| 18 | `rejects external, protocol-relative, backslash, and auth return paths` | **Unchanged**, plus add `/setup-account` to the rejected examples once `safeReturnPath` is updated (§7 T6) |

### 6.4 `tests/e2e/auth.spec.js` (11 tests; **currently unverified — no Chromium**)

| Line | Current test | Recommended change |
|---|---|---|
| 20 | `demo ${role} reaches its own layout` (3 roles) | **Unchanged** |
| 29 | `deep link survives a login-page reload and returns after login` | **Unchanged** |
| 38 | `wrong password, locked account, and network error have distinct messages` | **Unchanged** |
| 49 | `five failed attempts lock the account across reloads` | **Unchanged** |
| **60** | `signup, consent, OTP paste, and student session` | **Rewrite** → no public signup link on `/login`; `/signup` redirects; no student session created |
| **84** | `OTP auto-advance and paste support` | **Retire or port** depending on G4.8 — document explicitly |
| **106** | `expired OTP shows its own message` | **Retire or port** depending on G4.8 — document explicitly |
| 121 | `forgot password mock inbox and reset` | **Unchanged if G4.8 approves** |
| **135** | `faculty invitation reaches faculty layout` | **Rewrite** → invite cannot create an account |
| 144 | `mismatched role shows access denied with own workspace link` | **Unchanged** |
| 155 | `logout clears localStorage and returns to landing` | **Unchanged** |
| 165 | `mobile auth pages have no horizontal overflow and keyboard login works` | **Unchanged** |
| **167** | mobile overflow loop includes `/signup` and `/join/VYUH-FACULTY-2026` | **Rewrite** → replace those two paths with `/login` and `/setup-account` (with a valid gated session) |

### 6.5 New tests to add (Batch 2, after approval)

`account-model`, `institute-auth`, `first-login-flow`, `guard-matrix` (3 roles × anonymous / correct-role / wrong-role / must-change-password), `registration-retirement`, and Batch 1 regression (all 33 v2 aliases + legacy routes). Chromium-dependent e2e first-login journey (10 cases in the Batch 2 assignment §7) will be added **only if a browser becomes available**, otherwise reported as unverified. No fabricated browser results.

**Functionality requiring a separate batch (documented, not implemented):** Admin People tabs, Create User, credentials sheet, CSV export, suspend/reactivate/unlock/edit/move-batch, password-request queue, full CSV-import-to-credentials bridge, Admin-controlled invitations, faculty live studio, student live viewer, cross-tab transport, exam hall work.

---

## 7. 🔧 Recommended technical defaults (awaiting approval)

| ID | Area | Recommendation |
|---|---|---|
| T1 | Registry | Single flat `InstituteAccount` registry in `src/mock-data/accounts.js`; one canonical identity per account; permanent `issuedInstituteIds` set; `users.js` fixtures preserved and projected through a compatibility adapter, never deleted |
| T2 | Storage | `vyuh.mock.accounts.v1` (identity/lifecycle, **no secrets**); existing `vyuh.mock.auth.v1` (salt/digest/lockout/challenges); existing `vyuh.session` envelope. Versioned, additive migration; never delete existing keys |
| T3 | Session schema | Extend `authSessionSchema` with **optional** `instituteId`, `mustChangePassword`, `acknowledgedPolicyVersion`; keep `token/user/issuedAt/expiresAt/expiresInSeconds`. No plaintext password, no hash in the session |
| T4 | Status model | ⚠️ **Open (§8.3, S1).** Simplest safe default: one shared additive enum `active\|invited\|suspended\|locked\|archived`, reconciling `AdminUserStatus` (`src/contracts/admin.js:13`) with the Batch 2 proposal — no silent collision |
| T5 | Guard ordering | `RequireAuth` → `RequireRole` → **`RequirePasswordChange`**. `/setup-account` placed **outside** `GuestOnly` (otherwise `guards.jsx:35` creates a redirect loop). Unauthenticated → `/login`; gated authenticated → `/setup-account`; wrong role → `/access-denied` in the user's own layout |
| T6 | Return paths | Add `/setup-account` to `safeReturnPath`'s rejection list; preserve the original destination in router state through setup; never trust role/Institute ID from arbitrary UI state |
| T7 | Login API | One shared identifier resolver: `login` accepts either a demo email or an Institute ID; `loginByInstituteId` delegates to it; `changePasswordWithSetup` returns a refreshed `AuthSession`. Generic `invalid_credentials` for unknown IDs and wrong passwords (no account enumeration) |
| T8 | Errors | Add distinct codes for `account_suspended`, `credential_expired` (only if G2.4 approves), `setup_required`; extend `src/features/auth/lib/authErrors.js` copy |
| T9 | Generator | ✅ 12 chars; ✅ random; ✅ exclude `0 O 1 I l`. 🔧 `crypto.getRandomValues` + rejection sampling over the **approved alphabet**; injectable deterministic **mock-only** generator for tests; no claim of cryptographic security for demo hashes |
| T10 | Hashing | Retain existing salt + SHA-256 in `vyuh.mock.auth.v1`; label explicitly **prototype-only, not production-grade, not a password KDF**; clear sensitive component state after success/navigation |
| T11 | Session restore | `readPersistedSession` must revalidate account status (active/suspended/locked) and the first-login flag; a suspended account must lose its restored session |
| T12 | Demo seats | All three email seats (`ananya.sahoo@`, `snehasish@`, `academic.office@`) keep working with `vyuh2026`; carry `mustChangePassword: false` explicitly; no forced setup on fixtures |
| T13 | Routes | Retire `/signup` and `/join/:inviteCode` as informational redirects; retire or redirect `/verify-otp` per G4.8; keep page files; preserve `/sign-in`, `/app/*`, `/student/papers`, `/student/account` and **all 33 Batch 1 v2 aliases** |
| T14 | Credential delivery | ✅ One-time viewing; ✅ no permanent plaintext; ✅ no credentials in logs/audit/lists/session; ✅ **lost credentials → Admin issues a NEW temp password, never retrieves the old**. 🔧 No `revealPassword`/`getPlaintext` method in any contract |
| T15 | Recovery | ✅ Admin-controlled; ✅ Admin verifies identity; ✅ new temp password; ✅ setup again; ✅ auditable. 🔧 Audit via existing `recordAudit()` — **never the credential value**; out-of-band request channel in Batch 2 (no public route) |
| T16 | CSV | ✅ **Outside Batch 2.** No export UI, no sheet, no Copy/Download, no plaintext in any CSV contract field |
| T17 | Verification | `npm test`, `npm run build`, `npm run lint`, `npx oxlint src tests` on the final state; oxlint compared to the **38 warnings / 0 errors** baseline; `npm run test:e2e` only if Chromium exists |

---

## 8. Updated approval summary

The four categories below are deliberately separated. **Only §8.1 is approved for implementation as-is.**

### 8.1 ✅ User-selected decisions — approved current product direction (no further approval requested)

| Gate | Approved decision |
|---|---|
| **G1** | Student `VYU-S-YY-NNNN`, Faculty `VYU-F-NNNN`, **Admin `VYU-A-NNN`** (3 digits); **one institute-wide unique identity system**; **never reuse previously issued IDs**; **year token and initial counters must be configurable and reconciled with existing records** |
| **G2** | **12-character** temporary passwords; **randomly generated**; **exclude confusing characters such as `0`, `O`, `1`, `I`, `l`**; **mandatory password change during first login**; **previous temporary password becomes invalid after successful change** |
| **G3** | **One-time viewing** of generated credentials; **no permanent plaintext storage**; **no credentials in logs, audit entries, normal account lists or session records**; **lost credentials → Admin issues a NEW temporary password, never retrieves the old**; **CSV export remains outside Batch 2** |
| **G4** | **Admin-controlled recovery**; **Admin verifies the user's identity**; **Admin issues a new temporary password**; **user must complete first-login setup again**; **recovery actions must be auditable** |
| **C1** | Retain the test-migration approach: rewrite obsolete signup/invitation tests into retirement/security assertions; preserve auth/lockout/session/role-isolation coverage; port the no-plaintext assertion into first-login; **do not delete tests merely to make the suite pass** |
| **Architecture** | Single institute, no Super Admin, `admin` as highest authority, no backend, JS/JSX + existing mock architecture (carried from §1–§3) |

### 8.2 🔧 Recommended technical defaults — awaiting approval

| ID | Default | Why it is the simplest safe choice |
|---|---|---|
| R-1 | ID generator: permanent `issuedInstituteIds` set, advance to next free number, hard-fail on exhaustion, never decrement | Satisfies "never reuse" without a pruning rule |
| R-2 | Year token `YY` = institute-supplied config value; **no automatic rollover** in Batch 2; never derive from `Date` | Avoids inventing rollover rules while keeping the format implementable |
| R-3 | Initial counters = `max(configuredSeed, highest existing numeric suffix in users.js / institution.js / accounts.v1) + 1` | Satisfies "configurable and reconciled with existing records" with one deterministic rule |
| R-4 | Exact temp-password alphabet: uppercase minus `I,O`; lowercase minus `l` (optionally `i,o`); digits `2–9` | Enumerates the approved exclusions; the optional `i,o` removal and the final alphabet still need sign-off |
| R-5 | **No time-based expiry**; credential invalidated at successful setup; Admin re-issue is the only recovery | Simplest; removes the need to invent a validity period |
| R-6 | Reuse `newPasswordSchema` (min 10, ≥1 letter, ≥1 digit, max 128) + confirm + reject current temp password | Reuses an existing, tested schema instead of inventing a new policy |
| R-7 | Recovery requests **out-of-band (direct to Admin)** in Batch 2; `PasswordRequest` **typedef only**, no state/UI/route | No public enumeration surface; G4 remains fully Admin-controlled |
| R-8 | Recovery approval **requires a reason**; recovery **does not automatically clear lockout** (separate explicit Admin unlock) | Makes "auditable" meaningful and prevents lockout washing |
| R-9 | Keep `/forgot-password` + `/reset-password` **for the three demo email seats only**; exclude Institute-ID accounts | Preserves the working demo and existing tests without creating a real self-service recovery path |
| R-10 | One shared additive status enum `active\|invited\|suspended\|locked\|archived` | Reconciles `AdminUserStatus` without an unrelated refactor |
| R-11 | `crypto.getRandomValues` + rejection sampling; deterministic **mock-only** generator injected in tests; salted SHA-256 with explicit prototype-only disclaimer | Honest about mock security; `webcrypto` is already polyfilled in `tests/setup.js` |
| R-12 | Data-driven first-login gate (`mustChangePassword`), no role special-case; **no Admin-created Admin accounts in Batch 2** | One authentication foundation; keeps A1 reversible |
| R-13 | Keep `rollNumber` and `instituteCode` separate from `instituteId` | Avoids breaking `/admin/users` filters and leaking academic IDs into auth logs |
| R-14 | All storage/guard/route/default rows T1–T17 in §7 | Consolidated implementation defaults |

### 8.3 ⚠️ Institute policy information still required — **BLOCKING**

| # | Item | Status | Simplest safe default offered |
|---|---|---|---|
| P-1 | **Approved policy wording** (attendance tracking, why, retention, contact) — G5.1 | ⚠️ **No default; do not invent** | None — must be supplied verbatim |
| P-2 | **Policy version identifier** — G5.2 | ⚠️ **No default; do not invent** | None — must be supplied |
| P-3 | Student **academic-year token value and rollover rules** | ⚠️ Open | Config value, no automatic rollover (R-2) |
| P-4 | **Initial counter reconciliation** source of truth and seed values | ⚠️ Open | R-3 |
| P-5 | **Whether Admin-created Admin accounts are permitted** (A1) | ⚠️ Open | No in Batch 2 (R-12) |
| P-6 | **Exact temporary password alphabet** | ⚠️ Open | R-4 |
| P-7 | **Whether temporary passwords have a time-based expiry** | ⚠️ Open | No (R-5) |
| P-8 | **Exact new-password validation rules** | ⚠️ Open | R-6 |
| P-9 | **Whether recovery requests are submitted through Vyuh or directly to Admin** | ⚠️ Open | Out-of-band (R-7) |
| P-10 | **Whether recovery approval requires a reason** | ⚠️ Open | Yes (R-8) |
| P-11 | **Whether recovery automatically clears account lockout** | ⚠️ Open | No (R-8) |
| P-12 | **Existing demo-account reset behaviour** | ⚠️ Open | Demo seats only (R-9) |
| P-13 | **Account status vocabulary** | ⚠️ Open | Additive shared enum (R-10) |
| P-14 | G5 items 3–8 (mandatory acceptance, one vs two acknowledgements, re-acceptance, timestamp, applicable roles, retiring demo copy) | ⚠️ Open | §5 G5 table |

**G5 is explicitly PENDING.** The password-change step of `/setup-account` can be planned; the **consent step and consent-based guard condition cannot be enabled** until P-1 and P-2 (and ideally P-14) are supplied. No legal or institutional text will be written into the codebase.

### 8.4 ⚠️ Remaining implementation dependencies

| # | Dependency | Blocks |
|---|---|---|
| D-1 | Approval of §8.2 defaults (R-1 … R-14) | Any source edit; Step 1 of §9 |
| D-2 | Institute supply of P-1/P-2 (policy text + version) | The consent step, `firstLoginPolicy` constant, consent-based guard condition, G5 tests |
| D-3 | A1 ruling (Admin-created Admin accounts) | Admin counter series, guard applicability |
| D-4 | G4.5/G4.7/G4.8 rulings | Whether a `PasswordRequest` state exists, whether `setPassword` must stop clearing lockout, which auth tests are rewritten vs preserved |
| D-5 | C1 sign-off on the individual §6 rewrites | Test edits at Step 9 |
| D-6 | `node_modules` restore (`npm ci`, lockfile only) before verification | `npm test` / `npm run build` (sandbox snapshots exclude `node_modules`) |
| D-7 | Chromium availability | All 10 planned e2e first-login cases; real-browser axe/responsive/console verification |
| D-8 | Admin People batch (future) | Create User, credentials sheet, CSV export, account operations, recovery UI, import-to-credentials bridge, audit wiring |
| D-9 | Batch 1 regression suite at Step 9 | Confirmation that all 33 v2 aliases + legacy routes still work |

---

## 9. Updated Batch 2 implementation sequence (after approval only)

| Step | Work | Gate |
|---|---|---|
| 0 | Re-run the four verification commands to reconfirm the Batch 1 baseline; confirm no source drift | D-6 |
| 1 | Freeze ✅ user-selected decisions + approved R-defaults into `credentialPolicy`, `instituteIdCounter`, `issuedInstituteIds`. **No invented values**; `firstLoginPolicy` remains **empty/pending** | D-1, D-2 |
| 2 | Create `src/mock-data/accounts.js` + typedefs; `vyuh.mock.accounts.v1`; compatibility projection for `users.js` / `institution.js` (no deletion) | R-1…R-4, R-10, R-13 |
| 3 | Extend `authSchemas.js` session/user schemas; `sessionPersistence.js` + `sessionStore.js` status revalidation | T2–T4, T11 |
| 4 | Extend `src/services/mock/auth.js`: identifier resolver, status enforcement, `loginByInstituteId`, `changePasswordWithSetup`, `getAccountStatus`; hash handling with mock-only disclaimer | G1/G2 ✅, R-5, R-6, R-11 |
| 5 | Define **contracts only**: `CredentialSheetRow` (no plaintext field), `PasswordRequest` typedef, `issueTemporaryPassword` / audit contract. **No CSV, no sheet, no retrieval API** | G3 ✅, G4 ✅, R-7, D-8 |
| 6 | Focused `LoginPage.jsx` update: identifier field, notices, remove signup CTA and `email_unverified` → `/signup` link; keep demo seats | G1 ✅, R-9, T8/T12 |
| 7a | `SetupAccountPage.jsx` **password-change step** at `/setup-account` (confirm field, reject temp password, clear sensitive state) | G2 ✅, R-6 |
| 7b | ⚠️ **Consent step — DEFERRED until P-1/P-2 are supplied.** Do not ship placeholder text | **D-2 — BLOCKING** |
| 8 | `RequirePasswordChange` guard, `GuestOnly`/`safeReturnPath` loop fixes, route retirement redirects, preserve all Batch 1 aliases; consent-based guard condition deferred with 7b | T5, T6, T13, A1 |
| 9 | New unit tests + §6 C1 migration; port the no-plaintext assertion; Batch 1 regression suite; e2e only if Chromium exists | D-5, D-7, D-9 |
| 10 | Full verification set + oxlint baseline comparison; inspect full `git diff` for secrets/plaintext/artifacts | T17 |
| 11 | `VYUH_BATCH_2_COMPLETION_REPORT.md` (17 required sections), then **STOP** | — |

Gate 4's full recovery UI, Gate 3's CSV/sheet, and all Admin People operations are **not** in this sequence.

---

## 10. Dependencies and risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **No approved policy text or version ID** (`ConsentFields.jsx` is a demo summary disclaiming legal use) | Consent step and consent-based guard **blocked** | §8.3 P-1/P-2; Step 7b deferred; no invented text |
| R2 | 12-char rule origin | Mis-citing the blueprint | 12 chars is a **user-selected decision**, not a blueprint requirement (§5 C2 note); never attributed to the blueprint |
| R3 | `GuestOnly` + `safeReturnPath` redirect loop | First-login users bounce to dashboard or lose destination | T5/T6; explicit guard-ordering unit test for all 3 roles |
| R4 | Existing signup/invite/OTP tests vs "do not delete/weaken tests" | 4 UI + 4 service + 5 e2e assertions become obsolete | §6 C1 migration, now an approved approach; report every changed case; port the no-plaintext assertion |
| R5 | Two account stores (`vyuh.mock.auth.v1` vs `vyuh.mock.admin.v*`) with no shared identity | Duplicate records (D-12/D-28); imported accounts cannot log in | T1/T2; Batch 2 defines the canonical registry, Admin People batch bridges `commitImport`; do not refactor `admin.js` in Batch 2 |
| R6 | `AdminUserStatus` lacks `locked`/`archived` | Inconsistent status enforcement | R-10 / §8.3 P-13 |
| R7 | Salted SHA-256 is not a password KDF | Over-claiming security | R-11 / T10 mock-only disclaimer in source, report and relevant UI |
| R8 | No time-based expiry (recommended default, **not yet approved**) | Dormant credential risk | Admin suspension/revocation is a **Batch 3 security dependency**; G3 ✅ re-issue rule limits exposure |
| R9 | In-app unauthenticated recovery requests would enable enumeration | Account probing | R-7 out-of-band channel; if in-app is later approved, generic responses + rate limiting |
| R10 | `setPassword` currently clears lockout automatically | Recovery would wash away failed-login lockouts | §8.3 P-11 ruling; R-8 separate explicit unlock |
| R11 | **Chromium unavailable** — 56 collected e2e tests cannot launch | E2E, real viewports, axe, console, media, cross-tab **unverified** | Report as unverified; never fabricate browser results; jsdom `renderRoute` covers routing/guards only |
| R12 | `node_modules/` not persisted across sandbox snapshots | `npm test` fails with `vitest: not found` until `npm ci` | D-6: `npm ci --no-audit --no-fund` (lockfile only, no manifest change) |
| R13 | Role-model changes could break 3 demo seats, `RequireRole`, `HOME_FOR_ROLE`, `ADMIN_NAV` and 209 passing tests | Regression | **No role change is needed** (§3); preserve `admin` exactly; Batch 1 regression suite at Step 9 |
| R14 | Configurable counters that are not reconciled could collide with migrated records | Duplicate Institute IDs | R-1 + R-3 + collision unit test; `issuedInstituteIds` never pruned |
| R15 | A credential value could leak into an audit entry during recovery | Violates G3 ✅ | T15: audit records actor/target/action/timestamp only, never the credential; regression assertion |

---

## 11. Explicit list of files that would be affected during implementation

**No file below has been touched.** Prospective change surface only.

### 11.1 New files (would be created)

| Path | Purpose |
|---|---|
| `src/mock-data/accounts.js` | Single institute-wide account registry, configurable ID counters, `issuedInstituteIds`, credential policy, optional `PasswordRequest` typedef data — **no plaintext values** |
| `src/features/auth/pages/SetupAccountPage.jsx` | `/setup-account` password-change step; consent step **deferred** until P-1/P-2 |
| `tests/unit/account-model.test.js` | Registry init, uniqueness, no-plaintext, status validation, seeded-user compatibility, counter reconciliation |
| `tests/unit/institute-auth.test.js` | Institute-ID login, wrong/unknown credentials, suspended/locked, old-temp-password rejection, hash non-exposure |
| `tests/unit/first-login.test.jsx` | Setup gate, refresh persistence, no-plaintext port, role dashboard redirect; consent assertions **deferred** |
| `tests/unit/guard-matrix.test.jsx` | 3 roles × anonymous / correct / wrong / must-change-password; ordering and loop checks |
| `tests/unit/registration-retirement.test.jsx` | `/signup`, `/join/:inviteCode`, `/verify-otp` blocked; no signup link; Batch 1 alias regression |
| `VYUH_BATCH_2_COMPLETION_REPORT.md` | Required completion deliverable (Step 11) |

*(A small `src/features/auth/hooks/useAccountSetup.js` may be added if the setup mutation cannot cleanly live in `useSession.js`; not committed to here.)*

### 11.2 Existing files (would be modified)

| Path | Expected change |
|---|---|
| `src/contracts/user.js` | `InstituteAccount`, optional `instituteId`, status vocabulary |
| `src/contracts/auth.js` | `LoginByInstituteIdInput`, `SetupAccountInput`, `AccountStatus`, `FirstLoginPolicy` typedefs |
| `src/contracts/admin.js` | Reconcile `AdminUserStatus` (P-13); optionally `PasswordRequest` typedef; **no rename of `AdminRole`** |
| `src/services/authSchemas.js` | `authSessionSchema` optional identity/first-login fields; `userSchema`; login identifier schema; setup schema |
| `src/services/types.js` | `AuthService` methods (login resolver, `loginByInstituteId`, `changePasswordWithSetup`, `getAccountStatus`); **no `revealPassword`/`getPlaintext`** |
| `src/services/mock/auth.js` | Identifier resolver, status checks at login/restore, temp-credential rotation (old value invalid), consent recording **deferred**, hash handling, lockout behaviour per P-11 |
| `src/services/api/schemas.js` | Re-export alignment if new schemas are added |
| `src/services/api/index.js` | Method stubs / 501 parity if the HTTP adapter must match `AuthService` |
| `src/services/index.js`, `src/services/mock/index.js`, `src/shared/lib/services.js` | Re-export new auth methods/constants if required by the facade |
| `src/mock-data/index.js` | Barrel export for `accounts.js` (architecture guard requires the barrel) |
| `src/shared/store/sessionStore.js` | Carry identity/first-login fields; status-aware `initialize`/`setSession` |
| `src/shared/lib/sessionPersistence.js` | `readPersistedSession` account-status revalidation |
| `src/shared/lib/roles.js` | `safeReturnPath` rejects `/setup-account` — **no change to `HOME_FOR_ROLE`** |
| `src/features/auth/hooks/useSession.js` | Setup mutation, query invalidation, session refresh after `changePasswordWithSetup` |
| `src/app/routes/guards.jsx` | Add `RequirePasswordChange`; adjust `GuestOnly` exemption |
| `src/app/routes/AppRoutes.jsx` | Register `/setup-account` outside `GuestOnly`; retire `/signup` and `/join/:inviteCode`; redirect `/verify-otp` per G4.8; **preserve all Batch 1 v2 alias routes** |
| `src/features/auth/pages/LoginPage.jsx` | Institute ID/email identifier, notices, remove signup CTA and `email_unverified` → `/signup` link |
| `src/features/auth/lib/authErrors.js` | New error codes/copy (T8) |
| `src/features/auth/components/ConsentFields.jsx` | **Deferred** — only touched after P-1/P-2; existing demo copy must not be shipped as policy |
| `src/features/auth/components/DemoAccounts.jsx` | Only if identifier copy needs updating; demo seats preserved |
| `src/features/auth/pages/SignupPage.jsx`, `JoinInvitePage.jsx`, `VerifyOtpPage.jsx` | **Kept** (assignment §4.7); edited only if the dependency graph requires a redirect notice |
| `tests/unit/auth-flow.test.jsx` | §6.1 rewrites |
| `tests/unit/auth-service.test.js` | §6.2 rewrites + **ported no-plaintext assertion** |
| `tests/unit/auth-mode.test.js` | Add `/setup-account` to `safeReturnPath` rejection examples |
| `tests/e2e/auth.spec.js` | §6.4 rewrites (**only if Chromium becomes available; otherwise left and reported unverified**) |
| `tests/unit/helpers.jsx` | Only if a gated-session helper is needed for setup tests |

### 11.3 Explicitly **NOT** modified

`src/mock-data/users.js` (fixtures preserved; adapted only through a compatibility projection), `src/mock-data/institution.js` (`adminUsers` stays until the Admin People batch), `src/services/mock/admin.js` (import bridge is a later batch), `src/features/admin/pages/AdminUsersPage.jsx`, `AdminImportPage.jsx`, `src/app/layouts/*`, `src/app/routes/v2RouteTable.js`, `src/app/routes/v2Aliases.jsx`, `src/styles/tokens.css`, `src/index.css`, `scripts/check-architecture.mjs`, `package.json`, `package-lock.json`, all Batch 1 exam/learning/analysis files, all existing test files not listed above, and every exam-hall / live-studio / student-viewer file. **No file is renamed or deleted.**

---

## 12. Final stop condition

This is a **planning-only update**. **No application source code was modified; no Batch 2 implementation, Batch 3 work, backend, multi-tenancy, Super Admin role, unrelated UI redesign, exam-hall rebuild, commit, push, merge or publish was performed.** No policy wording or version identifier was invented.

The four categories are separated in **§8**: **8.1 user-selected decisions (approved)** · **8.2 recommended technical defaults awaiting approval** · **8.3 institute policy information still required (G5 explicitly pending, blocking)** · **8.4 remaining implementation dependencies**.

**I am stopped here and waiting for your explicit approval before starting Batch 2 implementation.**
