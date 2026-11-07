# Phase 7 — The faculty workspace

Status: **complete.** Eleven faculty screens on the same design system as the
student workspace, deliberately denser: ledger tables instead of cards, filters in
a top bar, and a split view where the reader keeps their place.

Everything a screen shows comes from `services.faculty` or a pure helper in
`shared/lib/facultyMath.js`. No component invents a mark, a count or a percentage.

## Routes

| Route | Surface |
|---|---|
| `/faculty` | Dashboard: today's sessions, doubts waiting, papers needing a decision, cohort snapshot |
| `/faculty/bank` | Question bank: top-bar filters, ledger, preview pane on the right |
| `/faculty/bank/new` | Question editor (single, multi, numerical, subjective, image) |
| `/faculty/bank/:questionId` | The same editor, bound to an existing item |
| `/faculty/exams` | Papers ledger with a create form seeded by a pattern preset |
| `/faculty/exams/:examId` | Exam builder: sections, marks, limits, window, release rule, integrity, live palette |
| `/faculty/exams/:examId/monitor` | Live monitor wall, counts, submission progress, event feed |
| `/faculty/analysis` | Cohort and item analysis (`?exam=` selects the sitting) |
| `/faculty/classes` | Class scheduler + session list |
| `/faculty/classes/:sessionId/host` | Host console: presence, chat moderation, question queue, attention checks |
| `/faculty/recordings` | Recording library + mock upload |
| `/faculty/recordings/:recordingId` | Trim handles, chapter editor, transcript preview, publish |
| `/faculty/attendance` | Register with defaulter filter and CSV export |
| `/faculty/doubts` | Doubt inbox, longest wait first |
| `/faculty/doubts/:doubtId` | Threaded view, timestamp link, reply composer with templates |

The Phase 0 scaffolds (`FacultyHomePage`, `FacultyEvaluationPage`) are gone; the
sidebar carries nine destinations, each one a screen that exists.

## Question bank

- **Filters are a bar, not a rail.** Search, subject, topic, difficulty, type and
  source sit above the ledger; the count is announced, and *Clear filters* appears
  only when a filter is actually on.
- **Split view.** `QuestionTable` is a ruled ledger (code, stem, type, usage,
  quality). Selecting a row renders it in `QuestionPreview` — KaTeX stem, options
  with the key marked by a tick and the answer tone, explanation, analysis and
  tags — without losing the filter or the scroll position.
- **Editor.** One column of decisions and one of evidence: the LaTeX renders under
  the stem while typing, the option list shows the key inline, and a readiness
  list states what is still missing. Saving writes to the seat's store; a created
  question is placed first in the bank, so it is visible immediately. Discarding a
  draft that has been typed into asks first; an untouched one just closes.
- **Five types exactly:** single correct, multi correct, numerical, subjective,
  image based. Type switching keeps only the fields that type needs.
- **Fonts of truth.** Marks, negative marks, difficulty, Bloom level and source are
  stored on the item; the analysis panel shows `p` and `r` when the item has been
  sat.

## Exam builder

- **Pattern presets:** NEET, JEE Main, JEE Advanced, GATE, custom. A preset seeds
  sections, marks, negative marking, duration and section limits; every one of
  them is editable afterwards.
- **Sections** carry their own marks per question, negative marking and time
  limit; the paper total is derived by `examTotals`, never typed.
- **Add from bank** opens a sheet filtered to the section's subject with a search
  over code, topic, tag and stem. Adding commits the local draft first, then
  inserts — so a rename made a second ago is not reverted by the insert.
- **Live palette preview** renders the student's palette with the same five status
  shapes and the same numbering, grouped by section, with build warnings (empty
  section, unknown question, section limits longer than the paper, missing
  window). Removing a cell asks first and removes the question from that section.
- **Rules:** schedule window, duration, result-release rule (immediate, after the
  window, at a set time, manual), integrity mode (standard, strict, open book) and
  six integrity switches, plus the instructions students read before starting.
- **Delete paper** sits in the rules column behind a confirmation that spells out
  what goes and what stays; a live paper cannot be deleted.
- Status flow is enforced by the service: draft → pending approval → approved →
  scheduled → live → completed. A live or completed paper is read-only.

## Monitor wall

- One tile per candidate, each drawing the palette status at a larger size, with a
  name, roll number, answer count, review count and progress bar. Colour is never
  the only carrier: every tile states its status in words and repeats the numerals.
- Counts (in the hall, writing, submitted, not started, connection lost, integrity
  flags) and submission progress are derived by the service from the tiles, so a
  tile and a total cannot disagree.
- The feed is pushed, not polled: `subscribeMonitor` runs a mock ticker (5 s by
  default, `vyuh.mock.monitorIntervalSeconds`) and writes each snapshot into the
  query cache. Counts therefore change because an event happened.
- Selecting a tile opens that candidate's progress and integrity notes; a flagged
  list gives direct access to everyone with a flag.

## Item analysis and the fault policy

- Scatter of difficulty (`p`) against discrimination (`r`) with a dashed policy
  line at `r = 0.10`; flagged items are diamonds, faulty items are filled danger
  dots. The chart has a table alternative with every number.
- The ledger defaults to *flagged and faulty*: for each item, strong-third versus
  weak-third percentages and a reading — "weak separation", a reason string, or a
  normal judgement.
- **Mark as faulty asks for confirmation**, states the item and its statistics, and
  then applies the faulty policy: a correct response keeps its award as grace, a
  wrong response loses its penalty. The score register below the ledger
  recalculates — 16 of 32 candidates move on the seeded item — and the fault
  register is mirrored to `vyuh.mock.faults.<examId>` so the student's own result
  sheet applies the same rule. The published example sheet is 156 out of 240;
  marking **q-neet-p03** faulty (the first flagged row) moves it to 157, and
  restoring it puts the score back. That round trip is covered by a unit test and
  an e2e test that signs in as both seats. Restoring an item is confirmed too,
  with the neutral tone.
- Weak topics are ranked by accuracy with a re-teach suggestion (minutes and the
  material to bring). A recording resource is linked to the faculty studio rather
  than a student route.

## Classes and the host console

- Scheduler: title, mode (interactive/broadcast), batch, subject, start time,
  duration and the attendance threshold that decides defaulter status.
- Host console: presence list with attention scores and mute/unmute, chat
  moderation (hiding asks first), the question queue (approve → *On screen*), an
  attention check that opens a 15-second window, and a room log. **End session**
  asks for confirmation and freezes attendance. Muting and lifting a mute both ask
  first — danger tone to close a microphone, neutral to reopen it.

## Recordings

- Upload is a two-stage simulation (transfer, then processing) because a real file
  transfer cannot be exercised in this build; the bar runs locally and one write
  marks the file ready. Trim, chapters, transcript and the publish flag are real
  state kept in the seat's store and survive a reload.
- Trim handles are two range inputs over a proportional timeline with chapter
  marks — keyboard-trimmable, and readable by a screen reader.
- Chapters are validated against the trim window by the same helper the service
  uses, so the inline message and a rejected save cannot disagree.
- Publishing is separate from uploading. Unpublishing and deleting both ask first.

## Attendance

- One batch, one filter: defaulters. The summary (average, defaulters, sessions
  held, threshold) is computed from the unfiltered batch so it does not change when
  the filter narrows.
- Each row carries present/held, a proportional bar, the percentage as a numeral, an
  attention average, the last date present and a labelled verdict chip.
- Export builds the CSV from the rows on screen and downloads it; the mock never
  writes a file server-side.

## Doubts

- Inbox ordered by how long a student has waited, filtered by status in the top
  bar. Reply moves a thread to *answered*; resolving is confirmed and keeps the
  thread readable.
- Thread: the student's question, the timestamp link into the recording at that
  second, the conversation, then the composer. Six saved reply templates fill the
  box without sending — an answer is always edited before it goes out.

## Data and contracts

| File | Contents |
|---|---|
| `src/contracts/faculty.js` | Every Phase 7 typedef: bank, exams, preview, monitor, analysis, classes, host console, recordings, attendance, doubts |
| `src/mock-data/questionBank.js` | 92 items across four subjects, five types, all difficulties, with analysis on the sampled ones |
| `src/mock-data/facultyExams.js` | Five papers covering the whole lifecycle + five pattern presets |
| `src/mock-data/monitorEvents.js` | Roster, scripted event feed, chat, question queue |
| `src/mock-data/itemAnalysis.js` | 40 items, response matrix for 32 candidates, four flagged items, KR-20 reliability |
| `src/mock-data/facultyWorkspace.js` | Dashboard, classes, recordings, doubts, attendance, reply templates, re-teach plans |
| `src/shared/lib/facultyMath.js` | Palette preview, totals, monitor counts, faulty policy, weak topics, KR-20, chapter validation, CSV |
| `src/services/mock/faculty.js` | The faculty service; per-seat persistence keyed `vyuh.mock.faculty.<id>.v1` |

Mutations persist in `localStorage`. That means the demo is additive: a created
question, a marked fault, a started session or a hidden chat message survives a
reload. `localStorage.clear()` (or a private window) returns the fixtures.

The API implementation stubs every faculty method with a 501
`faculty_api_unavailable`, so flipping `VITE_USE_MOCK=false` fails loudly rather
than silently serving fixtures.

## Acceptance, verified

| Claim | Where it is proven |
|---|---|
| A created question appears in the bank and can be added to a paper, and the paper's palette shows it | `tests/unit/faculty-workspace.test.jsx` ("carries a new question…"), `tests/e2e/faculty.spec.js` |
| Monitor counts change as mock events arrive | unit ("feeds the monitor…", 1 s ticker) and e2e (12 s budget) |
| Marking a question faulty updates the scores students see | unit: faculty marks q-neet-p03, then the student result sheet renders 157; e2e repeats it across both seats |
| Every destructive action asks first | `ConfirmAction` wraps delete question, remove section, remove question, cancel session, end session, hide chat, unpublish, delete recording, mark faulty, restore, resolve; unit and e2e both open and dismiss one |

`npm run check:architecture` passes (no presentation imports of fixtures, one
ember primary per view, labelled icon buttons, every nav target routed).
`npm test` covers 80 unit tests; `npm run build` passes.
