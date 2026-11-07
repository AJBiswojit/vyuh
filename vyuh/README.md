# Vyuh

Exam-preparation and live-learning platform for NTA / JEE / NEET institutes.
React + Vite, plain JavaScript with JSDoc contracts, Tailwind CSS v4 tokens,
TanStack Query for server state, Zustand for client state, framer-motion,
Recharts, and a mock service layer that behaves like a real network.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # architecture check + production build
npm run check:architecture
```

## Demo seats

`VITE_USE_MOCK=true` (the default) lists three seats on the sign-in screen.
Password for all three: `vyuh2026`.

| Seat | Email | Lands on |
|---|---|---|
| Student | ananya.sahoo@vidyutacademy.in | Overview: next paper, six-mock trend, study log, report, live class, notices |
| Faculty | snehasish@vidyutacademy.in | Batches led, roster and paper counts |
| Academic office | academic.office@vidyutacademy.in | Batch register with search and ordering |

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `true` reads `src/mock-data`; `false` calls `VITE_API_BASE_URL` and validates every response with Zod |
| `VITE_MOCK_ERRORS` | `false` in `.env` | Enables random failures so error states are exercised |
| `VITE_MOCK_ERROR_RATE` | `0.03` | Failure share per call. Set `1` to force every data call to fail |
| `VITE_API_BASE_URL` | `http://localhost:4000` | Origin for the HTTP implementation |

Mock calls resolve in 200–800 ms. Session restore is exempt from random failure:
a dropped restore would sign the user out for no instructive reason.

## Layout

```
src/
  app/         providers, routes, guards
  features/    <name>/{components,hooks,pages} — one folder per domain
  shared/      ui/ primitives, layout/ shell, lib/ helpers, store/ zustand
  contracts/   JSDoc typedefs, one file per domain (written before the mocks)
  services/    types.js interfaces, index.js chooser, mock/, api/ (Zod)
  mock-data/   every fixture, plus latency.js and its README
  styles/      tokens.css — the whole design system, as @theme
```

Import rules are enforced by `scripts/check-architecture.mjs`, which runs before
every build. It fails on: a presentation file importing `mock-data` or
`services/mock`; any file outside `services/mock` importing `mock-data`; a
TypeScript file; emoji in source; a Tailwind palette utility outside the token
set; an unsanctioned hex literal; and more than one filled ember primary in a
view.

## Design system notes

- **Ink / Paper / Ember** carry structure, surface and signal. Semantic colours
  (Lichen, Marigold, Oxblood, Glacier, Dust) are status only, never decoration,
  and always ship with a label, a dot or a numeral so meaning survives greyscale.
- `tokens.css` defines the type scale (ratio 1.25), motion durations and easing,
  hairline borders and the two floating-layer shadows. Dark mode swaps the
  `--vyuh-*` aliases on `[data-theme='dark']`; Ember is identical in both.
- Body text never renders below 14 px; chart ticks are 12 px; controls are 44 px
  minimum (56 px for the exam keypad, which lands with the runner).
- Contrast was measured, not assumed: faint text is `#6E685C` (5.2:1 on paper),
  ember as *text* always uses the pressed tone (4.6:1 on paper), and disabled
  buttons keep their tone's foreground rather than fading the whole control.

## Phase status

Phase 1 (foundation shell) is complete: tokens, primitives, contracts, mock and
API services, routing with role-based layouts, landing, sign-in, three role
homes, batch screens, account, 404 and accessibility statement.

Next: the exam runner (Phase 4 per the brief) — KaTeX question rendering, the
56 px keypad, server-clock timer, palette state machine, and the review sheet.
