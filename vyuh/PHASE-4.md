# Phase 4 — Exam flow and NTA-style exam player

Status: **complete.** A student can move from exam detail to instructions, the
exam hall, final submission, and confirmation. The hall is a full NTA/JEE/NEET
surface built on the Vyuh token system: one ember primary, status carried by
shape and label, mono only where numbers need it, and persistence that survives
refresh, backgrounding, and offline use.

## Journey

| Route | Surface |
|---|---|
| `/student/exams/:examId` | Exam detail: pattern chips, schedule, negative marking, rules |
| `/student/exams/:examId/instructions` | Rules, marking scheme, system check, declaration checkbox |
| `/student/exams/:examId/hall` | Chrome-less exam hall behind `RequireAuth` + `RequireRole student` |
| `/student/exams/:examId/confirmation` | Submission receipt inside the student workspace |

Entry points: Exams ledger rows now offer **Exam detail**, the selected rules
panel links into the flow, and the dashboard Next Up button opens detail instead
of the old readiness panel. The published Phase 4 player is the live
`exam-neet-practice` paper; other ledger entries keep their Phase 3 summaries.
Result analysis is deliberately deferred to Phase 5.

## Exam hall

- **Header:** Vyuh mark, exam name, candidate name and roll, tab-switch counter,
  legend, and the timer as the only high-contrast mono block. Digits roll;
  under five minutes the timer takes marigold and pulses slowly; under one
  minute it takes oxblood; zero auto-submits.
- **Sections:** Physics / Chemistry / Biology tabs with a completion meter under
  each. Switching sections jumps to that section’s first question.
- **Question panel:** number, type badge, `+4 / −1` mono marks chip, KaTeX body
  and options, full-width option tap targets with letter badges. Selected
  options use an ember ring plus a radio mark, never colour alone. Numerical
  questions get a decimal field and an on-screen keypad whose keys are at least
  56px. Confidence chips (Sure / Unsure / Guessing) are outlined and explain
  that they do not change marks.
- **Palette:** five status shapes — outlined square (not visited), oxblood solid
  square (not answered), lichen rounded square (answered), marigold circle
  (review), marigold circle with lichen ring (answered + review). The current
  question has an ember outline. Tiles spring-pop on status change. Counts are
  derived from the paper order and always sum to the total.
- **Action bar:** Clear response (ghost), Mark for review and next (secondary),
  Previous (ghost), Save and next (the only filled ember primary). Next slides
  left; Previous slides right. On the final question Save and next opens the
  submit sheet.
- **Tools dock:** calculator (basic/scientific, DEG/RAD, safe parser — no
  `eval`), rough sheet canvas, font-size slider, contrast toggle, dark-mode
  toggle, and shortcut sheet. Calculator, rough sheet, and font size open as
  movable non-modal panels; the exam remains usable behind them.
- **Submit sheet:** rises from the bottom with an animated receipt of answered,
  not answered, review, not visited, and total. “Submit final answers” and
  “Cancel and return” are equally prominent. Offline finals are stored locally
  and synced from the confirmation page when the connection returns.

## Timer, persistence, sync, integrity

- The timer runs in `examTimer.worker.js`, ticking every 250ms from an absolute
  server-corrected deadline. Background throttling cannot accumulate drift.
  `useExamTimer` auto-submits once at zero, even if the student is idle.
- Every answer, confidence, review, clear, visit, tool preference, and integrity
  event is written to persisted Zustand state under `vyuh.exam.flow.v1`.
  Refresh resumes the same attempt, question, selections, statuses, font size,
  contrast, and remaining time.
- Saves queue while offline. The hall shows an offline banner and sync state;
  returning online flushes the latest revision. Submission has the same
  local-first receipt and pending-sync path.
- Integrity is light mode: a fullscreen prompt, tab-switch counting, blocked
  copy/cut/right-click inside the hall, and an event log attached to the attempt.
  No camera or invasive proctoring is introduced.
- Keyboard: `1–4` select, `N` save and next, `M` mark review and next, `C` clear,
  `P` previous, `?` shortcut sheet. Shortcuts pause for inputs, textareas,
  selects, and contenteditable targets, including the calculator field.

## Mock paper and configuration

`src/mock-data/questions.js` authors 60 NEET-style questions in three contiguous
sections of 20. At least ten questions use LaTeX, numerical questions are
included, and every question carries a correct answer and explanation for
Phase 5. The public paper service strips keys and explanations before the hall
receives them.

| Control | Default | Effect |
|---|---|---|
| `VITE_EXAM_QUESTION_COUNT` | `60` | Paper size, clamped 3–60 and balanced across sections |
| `localStorage['vyuh.mock.examQuestionCount']` | unset | Browser override for the same count |
| `localStorage['vyuh.mock.examDurationSeconds']` | `10800` | Demo duration override, useful for auto-submit checks |
| `localStorage['vyuh.mock.examOffsetMs']` | `0` | Mock server-clock offset for timer tests |

Biology chapter ids used by the paper (`ch-cell`, `ch-genetics`, `ch-plant`,
`ch-human`) were added to the academic fixtures so the bank stays referentially
honest.

## Acceptance results

- Full 60-question paper completes end-to-end and confirms with a receipt.
- Refresh mid-exam restores question, answers, confidence, palette statuses,
  and timer.
- Palette counts always equal the paper total; unit tests exercise the
  answer/review/clear state machine.
- Every keyboard shortcut works; typing `n` in the calculator does not advance
  the question.
- Timer remains accurate after the tab is backgrounded and auto-submits at zero.
- Offline saves queue and sync on reconnect; submit cancel returns to the hall.
- Hall is usable at 1280px and 768px with no horizontal overflow; phones show a
  “best on a larger screen” notice. Keypad keys measure at least 56px.
- The hall passes automated axe WCAG A/AA checks.

## Verification

```bash
npm test                 # 42 Vitest tests (35 prior + 7 exam-flow)
npm run test:e2e         # 35 Playwright tests (27 prior + 8 exam)
npm run build            # architecture guard + production bundle
npx oxlint src tests     # 13 warnings, 0 errors (unchanged warning baseline)
```

TypeScript checkJs remains at the existing 97-line baseline with no new errors
in Phase 4 files. Architecture guard passes (195 files, colour-free outside
tokens). Screenshots from the final pass are under `.arena/checks/phase4-*.png`.

## Deferred by design

Phase 5 consumes the stored attempt, answer key, confidence, time-spent, and
integrity log to produce result analysis. Live room, recording player, doubt
threads, study-room detail, and the full attendance register remain later
phases.
