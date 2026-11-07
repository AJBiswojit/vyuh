# Phase 2 — Authentication

Status: **complete.** Mock sessions, role guards, student signup, OTP, password
reset, faculty invitations, and the split-screen auth shell are implemented.

## Routes

| Route | Purpose |
|---|---|
| `/login` | Email/password, inline Zod errors, five-attempt mock lockout, demo seats |
| `/signup` | Student registration: institute code, batch, strength meter, required consents |
| `/verify-otp` | Six-digit code with auto-advance, paste, resend cooldown |
| `/forgot-password`, `/reset-password` | Generic reset request and token-based new password |
| `/join/:inviteCode` | Faculty invitation acceptance |
| `/student`, `/faculty`, `/admin` | Role-specific protected layouts |
| `/access-denied` | Mismatched role, rendered inside the user’s own workspace chrome |

`/sign-in` redirects to `/login`; legacy `/app/*` links redirect to `/student/*`.
`RequireAuth` preserves the intended path, query, and hash. Logout clears the
persisted session and returns to `/`.

## Demo accounts

All demo passwords are `vyuh2026`. Quick-login buttons appear only when
`VITE_USE_MOCK=true`.

| Role | Email | Home |
|---|---|---|
| Student | `ananya.sahoo@vidyutacademy.in` | `/student` |
| Faculty | `snehasish@vidyutacademy.in` | `/faculty` |
| Academic office | `academic.office@vidyutacademy.in` | `/admin` |

Useful fixtures: institute `VYUH2026`; OTP `123456`; expired OTP `000000`;
faculty invite `VYUH-FACULTY-2026`; pre-locked account
`locked.student@vidyutacademy.in`; network-failure account
`offline@vidyutacademy.in`. Five wrong passwords lock an account for 15 minutes.
Mock sessions expire after an absolute eight hours.

## Service boundary

`services/AuthService.js` exposes login, signup, OTP, reset, invitation, session,
and logout operations. The mock adapter persists a validated Zustand session in
`localStorage` (`vyuh.session`) and stores lockouts/challenges/reset tokens in
`vyuh.mock.auth.v1`. New mock passwords are salted and digested before storage;
fixture credentials remain public. This is a demo, not production authentication.

With `VITE_USE_MOCK=false`, the HTTP adapter calls `/auth/*` endpoints under
`VITE_API_BASE_URL`, validates responses with Zod, and hides all demo shortcuts.
No backend was supplied with this phase; the endpoint shapes are documented in
`src/services/api/index.js` and `src/services/types.js`.

## Accessibility

Forms use native labels, `aria-describedby` error links, `aria-invalid`, alert
regions, visible focus rings, 44px targets, and keyboard submission. Route changes
focus the page heading. OTP inputs preserve normal Tab order and support paste.
The brand pane collapses to a compact header on mobile. Login and signup pass
automated axe WCAG A/AA checks; browser tests cover keyboard login and overflow.

## Verification

```bash
npm test                 # 29 Vitest service/session/UI/axe tests
npm run test:e2e         # 14 Playwright acceptance tests (install Chromium first)
npm run build            # architecture check + production bundle
npx oxlint src tests     # lint
```

For a fresh machine, run `npx playwright install chromium` before `test:e2e`.
The Playwright config also accepts `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and
`PLAYWRIGHT_BASE_URL` for constrained CI environments.
