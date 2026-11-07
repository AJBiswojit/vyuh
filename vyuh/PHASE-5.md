# Phase 5 — Result summary and question-level analysis

Status: **complete.** The post-attempt surface is a result sheet, not a generic
dashboard: a ruled score hero, a question ledger with a keyboard-accessible
drawer, and charts that each ship a table alternative. Every analysis number is
produced by the analysis service from mock analysis data or a stored Phase 4
submission; components do not invent scores, counts, cohort values, or points.

## Routes and entry points

| Route | Surface |
|---|---|
| `/student/exams/:examId/result` | Result sheet: summary, release lock, ledger, drawer, charts, what-if |
| `/student/exams/:examId/result?attempt=:attemptId` | A specific stored submission |
| `/student/revision/:topicId` | Topic revision destination from the drawer |

Entry points wired in this phase:

- **Confirmation:** “View result sheet” carries the attempt id and stays disabled
  until the local-first receipt has synced.
- **Exams ledger / exam detail:** NEET practice rows offer “Result sheet”.
- **Performance:** header action “Open result sheet”; existing trend charts now
  have table toggles.
- **Dashboard Recent results:** “Result sheet” action and paper-title links.

The published question-level sheet is `exam-neet-practice`. Before the student
has submitted it, the route shows a labelled published example. After submission
it grades the stored attempt against the authored key. Other papers keep their
Phase 3 score summaries and receive a clear `analysis_unavailable` service error
if asked for a question-level sheet.

## Result summary

- Fraunces score hero counts from zero to the data-owned score; reduced motion
  lands immediately. The accessible name always states the final score/max.
- Rank, percentile and accuracy sit beside it. Percentile is a horizontal bar
  with a marker, not a bare number.
- “What it cost you” reports marks lost to negative marking, time spent on wrong
  answers, and confident mistakes, plus total sheet time.
- If the release policy is locked, the sheet is replaced by a countdown, the
  scheduled release time, and the rule in plain words. The countdown is
  server-offset corrected and refetches once when it reaches zero.

## Question ledger and drawer

- One row per question: status glyph, number, student answer vs key, time bar
  against the cohort average, mono marks delta (`+4`, `−1`, `0`), and Mistake DNA
  tag. Rows use a layout transition when filters change.
- Filter chips: All, Correct, Wrong, Skipped, Confident mistakes, Lucky guesses.
  Chip counts are computed from the same rows they filter, and the visible row
  count is announced.
- Opening a row uses the shared `Sheet` focus trap: focus moves in, Tab stays
  inside, Escape closes, and focus returns to the originating row.
- Drawer content: full KaTeX question, option/key markers, official explanation,
  batch response-distribution bars, difficulty index, and “Revise this topic”.

## Charts and table alternatives

Every chart is wrapped in `ChartFrame`, which toggles between the visual and a
`DataTable` fed the exact same rows.

| Chart | Data | Notes |
|---|---|---|
| Pacing | `details.pacing` | Student area/line draws in; cohort median band + dotted median; rushed/stalled reference dots |
| Attempt path | `details.path` | Visit-order bars with durations; stored visit log when present |
| Mistake DNA | `details.mistakeDna` | Donut with dominant category centred and one advice line |
| Accuracy heatmap | `details.heatmap` | Section/topic cells shaded by attempted accuracy |
| Historical trend | `details.attemptTrend` | Normalized from `attempts.js`; score percent vs batch average percent |
| What-if | `details.questions` | Checkbox recalculates score with negative marking removed; not a chart, values stay visible |

The what-if panel uses the same pure `calculateWhatIf` helper as the mock
builder: keep positive awards, zero penalties, skipped stays zero.

## Data and service boundary

- `src/contracts/analysis.js` defines the read models: summary, question
  analysis, pacing, visits, Mistake DNA, heatmap, what-if, trend, release policy,
  and topic revision.
- `src/mock-data/analysis.js` owns per-question fixture analysis, cohort option
  distributions, time statistics, mistake categories/advice, release policy,
  score-percentile bands, and the deterministic submission evaluator. Historical
  trend points are normalized from `attempts.js`, not duplicated.
- `src/shared/lib/analysisMath.js` holds pure filter/count/what-if/time-scale
  arithmetic shared by the mock builder and UI.
- `src/services/mock/analysis.js` reads stored Phase 4 submissions through the
  exam-flow service, applies release policy, and returns either the graded
  attempt or the published fixture. `src/services/api/` has matching Zod schemas
  and HTTP endpoints; `queryKeys.examAnalysis` / `topicRevision` namespace cache.
- Presentation imports only feature hooks/services. The architecture guard still
  passes: no feature/shared/app file imports mock-data or services/mock.

Phase 4 carry-over changes required by the sheet:

- Attempt state now records an optional `visits` log (question id, entered/left,
  duration) and submission input carries it, so the replay can show real visits
  instead of reconstructing order from saved times.
- Local final receipts start `pendingSync: true` until the service confirms, so
  the confirmation handoff cannot open a result route before the submission is
  readable. Successful submit/sync invalidates the analysis query.

## Demo configuration

| Flag | Default | Effect |
|---|---|---|
| `vyuh.mock.analysisLocked` | `false` | `true` hides details and shows the release countdown |
| `vyuh.mock.analysisReleaseInSeconds` | `7200` when locked | Countdown length |
| `vyuh.mock.analysisOffsetMs` | `0` | Simulated server clock offset for release math |
| `vyuh.mock.examQuestionCount` | `60` | Phase 4 paper size; stored submissions grade at that size |
| `vyuh.mock.examDurationSeconds` | exam duration | Short demos remain possible |

## Acceptance checklist

- [x] Analysis numbers trace to mock analysis data or stored submissions; no
      hardcoded analysis values in components.
- [x] Filter chip counts match ledger rows for every filter.
- [x] Drawer closes on Escape and returns focus to the row.
- [x] Every chart has a “View as table” toggle; table rows match chart data.
- [x] What-if score recalculates correctly (fixture 156 → 168; stored demo 4 → 4).
- [x] Locked release state shows countdown and plain-words rule.
- [x] Trend data across attempts uses `attempts.js`.
- [x] Token-only colours, ≤1 filled ember primary per view, JSDoc/no TS.

## Verification

| Check | Result |
|---|---|
| Unit (`npm test -- --run`) | **50/50** (42 prior + 8 analysis) |
| Analysis e2e | **5/5** |
| Full e2e (`npm run test:e2e`) | **40/40 in 4.6m** |
| Build / architecture | ✓ ~1.9s; **216 files, 215 colour-free**, no boundary violations |
| oxlint | **13 warnings / 0 errors** (unchanged baseline) |
| `tsc --noEmit` (typescript@5.9.3) | **97-line baseline**, no new errors |
| `git diff --check` | clean |

Logs: `/tmp/vyuh-p5-unit.log`, `/tmp/vyuh-p5-e2e-full.log`,
`/tmp/vyuh-p5-build.log`, `/tmp/vyuh-p5-oxlint.log`, `/tmp/vyuh-p5-types.log`.
Screenshots: `.arena/checks/phase5-{result-1280,ledger-wrong,drawer,charts,dna-heatmap,locked,revision,result-390}.png`.

## Deferred

- Real backend release controls and faculty publishing UI.
- Question-level sheets for historical JEE mocks (the published player and
  authored key are NEET practice; JEE history remains score/percentile trend).
- Surfacing the integrity event log on the result sheet; it is still stored with
  the submission for later phases.
