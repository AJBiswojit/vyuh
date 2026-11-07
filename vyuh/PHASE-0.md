# Phase 0 — Foundation & Design System

Status: **complete.** `npm run lint`, `npm run build` and the browser checks below all pass.

---

## What exists

**Stack.** Vite + React 19 (plain JS with JSDoc, `checkJs` on), Tailwind v4 via
`@tailwindcss/vite`, react-router-dom, @tanstack/react-query, zustand,
framer-motion, lucide-react, recharts, zod. `jsconfig.json` maps `@/*` to `src/*`.

**Type and colour.** Fraunces (display), Bricolage Grotesque (UI), JetBrains
Mono (numbers and labels), all three self-hosted variable `.woff2` with
`@font-face` + `preload` in `index.html`.

**Tokens** — `src/styles/tokens.css` is the only file in the app allowed to hold
a colour value.

| Group | Count | Notes |
| --- | --- | --- |
| Palette | 9 | Ink, Ink raised, Ink sunken, Paper, Paper raised, Paper sunken, Ember, Ember press, Ember wash |
| Semantic | 5 hues × 3 forms | fill, `-deep` (AA on paper), `-soft` (AA on ink) |
| Paper-on-ink ramp | 5 steps | strong 13.5:1 · default 9.6:1 · muted 8.2:1 · faint 6.2:1 · label 5.4:1 |
| Type scale | 2xs → display | 8 steps, each with a line height |
| Motion | 4 | micro 175ms, standard 325ms, expressive 750ms, spring |
| Elevation | 3 | float, overlay, hairline-only |

Every semantic alias is re-declared inside each theme scope, so a
`[data-theme]` **subtree** repaints — that is what makes the dual-pane
`/design-preview` honest instead of a screenshot of two themes.

**Layouts** (`src/app/layouts/`) — `PublicLayout`, `AuthLayout`, `WorkspaceLayout`
(also exports `Breadcrumb` and `PageHeader`), `StudentLayout`, `FacultyLayout`,
`AdminLayout`. Each layout owns its chrome; pages render content only. One
`<main>` per document, a skip link as the first tab stop, and focus moved to
`#main-content` on route change.

**Guards** (`src/app/routes/guards.jsx`) — `RequireAuth`, `RequireRole({allow,
redirectTo})`, `GuestOnly`, with a skeleton boot screen rather than a spinner.

**Primitives** (21 files in `src/shared/ui/`, all exported from the barrel) —
Button, IconButton, Input, Select, Checkbox, Radio, Card, Badge, Tabs, Sheet,
Dialog, Tooltip, Toast, Kbd, Skeleton, EmptyState, ErrorState, ThemeToggle,
SectionLabel, Logo, StatusDot. Each ships variants, a visible focus state and a
dark-mode rendering.

**Logo** — 3×3 grid; resting mark lights the top-right cell. `loading` walks a
single lit cell in reading order, and falls back to an opacity pulse under
reduced motion.

**`/design-preview`** — dev route, full-bleed, outside every layout. Every token,
primitive and state, each rendered twice in pinned `data-theme` panes.

**Services** — one interface per domain, a mock implementation behind
`VITE_USE_MOCK` and an HTTP implementation behind `VITE_API_BASE_URL` with Zod
validation. `VITE_MOCK_ERRORS` + `VITE_MOCK_ERROR_RATE` decide how often a mock
call rejects.

---

## The architecture guard

`npm run lint` → `node scripts/check-architecture.mjs`. 115 files, 196 lines of
rules. Nine checks:

1. **Mock boundary** — `features/`, `shared/`, `app/` may not import
   `src/mock-data` or `src/services/mock`. Data reaches a screen through a
   feature hook.
2. **Barrel** — `services/mock` imports fixtures only from `mock-data/index.js`,
   so removing the mocks stays a one-file edit.
3. No TypeScript files.
4. No emoji in source; icons come from lucide-react.
5. **No colour literal outside `tokens.css`** — no hex, no `rgb()`/`hsl()`/
   `oklch()` literal, no off-brand Tailwind palette utility. `var(--token)`,
   `rgb(var(--vyuh-…-rgb) / α)` and `color-mix()` are the permitted ways to
   compose a colour.
6. **One filled ember primary per view file.** The design preview is exempt — it
   is the page whose job is to render every variant.
7. Every `IconButton` carries a `label`.
8. **Every nav target has a route.** Verified by deleting `/admin/fees` and
   watching the guard fail.

Charts need real colour strings for Recharts, so `src/shared/lib/chartTokens.js`
reads the computed custom properties off the document at render time. The
alternative — a hex in a `stroke` prop — is exactly what rule 5 exists to stop.

---

## Verification performed

- `npm run lint` → `Architecture check passed: 115 files, 114 colour-free`.
- `npm run build` → `✓ built` (the guard runs first).
- **Console**: no page errors or console errors on `/`, `/sign-in`,
  `/accessibility`, a 404, `/design-preview`, and all twelve workspace routes, in
  both themes.
- **Overflow**: no horizontal scroll at 1440 / 768 / 390 on nine routes, in light
  and dark. Checked by comparing `scrollWidth` to `clientWidth` and listing any
  element whose right edge crosses the viewport.
- **Focus**: `outline: 2px solid rgb(228, 87, 46)` with a 2px offset on links,
  buttons, icon buttons and inputs, on both Paper and Ink, keyboard-only.
- **Guards**: a student visiting `/faculty` lands on `/app`; a signed-in user
  visiting `/sign-in` lands on their home route.
- **`VITE_USE_MOCK`**: `true` renders the demo-seat picker and signs in from
  fixtures; `false` removes the picker entirely.
- **`VITE_MOCK_ERRORS`**: with `VITE_MOCK_ERROR_RATE=1`, sign-in shows the
  "Sign-in failed" state with the transport's own sentence, and the workspace
  routes fall to `ErrorState` with a retry.

---

## Known limits, stated on purpose

- **Placeholder screens.** `/faculty/bank`, `/faculty/evaluation` and
  `/admin/fees` render a scaffold note plus an empty state rather than a fake
  table. A mock table reads as a finished feature; a stated gap does not.
- **`Slot` is not a primitive.** Buttons don't accept `asChild`; a link that
  needs button styling uses the classes directly.
- **`Skeleton` is a namespace**, not a component: `Skeleton.Line`,
  `Skeleton.Block`, `Skeleton.Circle`, `Skeleton.Region`.
- **Recharts colours** are read from CSS at render, so a chart re-renders on
  theme change but not on a root font-size change.
- **No exam runner.** `ResumeCard` stays removed until the exam phase; a resumed
  paper is a link, not an embedded runner.
- **Mock latency is real latency.** Fixtures resolve after 200–800ms on purpose,
  so a loading state that only looks right at 0ms fails visibly here.

## Next

Phase 1 — the student exam runner (paper delivery, timer, palette, autosave,
submission), built on the primitives above.
