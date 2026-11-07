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
npm test             # Vitest service, session, UI and axe checks
npm run test:e2e     # Playwright acceptance flows (npx playwright install chromium first)
```

## Demo seats

`VITE_USE_MOCK=true` (the default) lists three demo seats on `/login`.
Password for all three: `vyuh2026`.

| Seat | Email | Lands on |
|---|---|---|
| Student | ananya.sahoo@vidyutacademy.in | Overview: next paper, six-mock trend, study log, report, live class, notices |
| Faculty | snehasish@vidyutacademy.in | Today's sessions, the doubt queue, papers needing a decision, and a cohort snapshot; nine destinations from bank to attendance |
| Academic office | academic.office@vidyutacademy.in | Institution overview, then users and CSV import, batches, approvals, policies, integrity, reports, moderation, audit log and settings |

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `true` reads `src/mock-data`; `false` calls `VITE_API_BASE_URL` and validates every response with Zod |
| `VITE_MOCK_ERRORS` | `false` in `.env` | Enables random failures so error states are exercised |
| `VITE_MOCK_ERROR_RATE` | `0.03` | Failure share per call. Set `1` to force every data call to fail |
| `VITE_API_BASE_URL` | `http://localhost:4000` | Origin for the HTTP implementation |
| `VITE_EXAM_QUESTION_COUNT` | `60` | Phase 4 paper size, clamped 3–60; browser override `vyuh.mock.examQuestionCount` |

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
  minimum (56 px for the exam keypad).
- Contrast was measured, not assumed: faint text is `#6E685C` (5.2:1 on paper),
  ember as *text* always uses the pressed tone (4.6:1 on paper), and disabled
  buttons keep their tone's foreground rather than fading the whole control.

## Phase status

Phases 1–7 are complete: tokens, primitives, contracts, mock/API services,
role-based routing and guards, landing, login/signup/OTP/reset/invite flows,
three role homes, batch screens, account, 404 and accessibility statement; the
responsive student shell, command palette, dashboard, exams ledger, performance
trends, profile preferences, and routed list/summary sections; the Phase 4
exam flow — detail, instructions/system check/declaration, NTA-style hall,
KaTeX questions, 56 px keypad, worker timer, persisted attempt state, offline
sync, light integrity logging, movable tools, submit sheet, and confirmation;
the Phase 5 result sheet — score hero, release lock, question ledger and
drawer, pacing/path/Mistake DNA/heatmap/trend charts with table alternatives,
what-if scoring, and topic revision; and the Phase 6 learning module — live
schedule and rooms (Interactive/Broadcast), automatic attendance with random
attention checks, a recording player with chapters/transcript/bookmarks/notes
and an end quiz, timestamped doubt threads, and interactive study rooms, all
driven by a mock realtime event emitter; and the Phase 7 faculty workspace — a
question bank with a split preview, a five-type editor with live LaTeX, a paper
builder with the student palette, a live exam monitor, item analysis with a
fault policy that moves student scores, class scheduling and hosting, a recording
editor, an attendance register with CSV export and a doubt inbox; and the Phase 8
academic office — an institution overview, user management with a four-step CSV
import that validates every row before it writes, batch and faculty assignment,
an exam approval queue, policies with live impact counts, integrity decisions that
require a note, mock report exports, content moderation, an audit ledger and
institute branding.
See `PHASE-2.md` for auth fixtures, `PHASE-3.md` for the student workspace,
`PHASE-4.md` for the exam player, `PHASE-5.md` for result analysis,
`PHASE-6.md` for live classes, attendance, recordings, doubts and study rooms,
`PHASE-7.md` for the faculty workspace, and `PHASE-8.md` for the academic office.

To try the player: sign in as the student, open **Exams → Live → NEET Practice
01 → Exam detail**. The dashboard Next Up card also opens exam detail; the
published Phase 4 player is the live NEET practice paper.

To try the result sheet: submit the NEET practice paper and choose **View result
sheet**, or open **Exams → Result sheet**, **Performance → Open result sheet**,
or the dashboard Recent results **Result sheet** link. Before a submission exists
the route shows a published example sheet; after submission it grades the stored
attempt. Browser demo flags: `vyuh.mock.analysisLocked=true`,
`vyuh.mock.analysisReleaseInSeconds` (default 7200 when locked), and
`vyuh.mock.analysisOffsetMs` exercise the release countdown.

To try the learning module: sign in as the student and use **Live classes**,
**Recordings**, **Attendance**, **Doubts**, or **Study rooms** in the sidebar.
Two live rooms are seeded — *Rotational Dynamics* (Interactive) and *Chemical
Kinetics* (Broadcast). The dashboard Continue watching card and the recording
library open the player; doubts link back to the exact timestamp. Attention checks
fire every 8–15 minutes by default; set `vyuh.mock.attentionMinSeconds=3` and
`vyuh.mock.attentionMaxSeconds=5` in `localStorage` to see one within seconds.
Related flags: `vyuh.mock.presenceTickSeconds`, `vyuh.mock.chatIntervalSeconds`,
`vyuh.mock.approvalDelaySeconds`, `vyuh.mock.roomIntervalSeconds`. Sample lecture
media is original, generated by `scripts/generate_sample_media.py` (dev-only).

To try the faculty workspace: sign in as Dr. Snehasish Mohapatra and use the
sidebar. The bank (**Question bank**) opens as a split view — filters in the top
bar, ledger on the left, the candidate's page on the right. **New question** saves
straight into the bank; the preview pane's **Add to exam** puts it in any draft and
the paper's palette shows it immediately. **Exams → NEET Mock 08** is the draft to
build in, **NEET Mock 07** is live (open **Monitor**), and **NEET Practice 01** has
the completed sitting behind **Item analysis**. Marking an item faulty asks once,
then recalculates the score register under the ledger — and the student's own
result sheet (**Exams → Result sheet**) moves from 156 to 157 for the same
voided item. **Classes** schedules a
session and opens its **Host console**; **Recordings** uploads a mock file whose
transfer finishes in the editor; **Attendance** exports the visible rows as CSV.
Browser demo flags: `vyuh.mock.monitorIntervalSeconds` (default 5) and
`vyuh.mock.hostTickSeconds` (default 6) speed up the live feeds.

To try the academic office: sign in as the academic office seat. The console opens
on the institution overview. **Users → Import a CSV** offers two samples — the
second is deliberately broken, and the validation step lists every bad row before
the commit button will move. **Policies → Attendance threshold → Change** counts
the batches and students the new value touches before it applies; the change then
appears in **Audit log**. **Integrity** holds decisions still needing a note:
`int-0601` on NEET Mock 06 is the one to try. Nothing in the console
writes without leaving a ledger entry, and the colour system on **Settings** is
deliberately read-only.
