# Phase 8 — The academic office

Status: **complete.** Thirteen destinations sharing one rail, one
ledger vocabulary and one store. The console is built to be read at a desk: numbers
set in Fraunces, tables ruled like a register, and every action that touches a
student's record written down twice — once where it happened and once in the audit
ledger.

Everything a screen shows comes from `services.mock.admin` or a pure helper in
`shared/lib/adminMath.js`. No component invents a count, a student total or a
percentage.

## Routes

| Route | Surface |
|---|---|
| `/admin` | Institution overview: six figures, attendance trend, exam calendar, alerts |
| `/admin/users` | User management: search, role/batch/status filters, paged roster |
| `/admin/users/import` | Four-step CSV wizard: upload → map → validate → commit |
| `/admin/batches` | Batch register with track and status filters |
| `/admin/batches/:batchId` | Batch detail: members, subjects, faculty assignment |
| `/admin/approvals` | Exam approval queue with approve / reject / schedule override |
| `/admin/policies` | Six policies, impact counts, confirmation, change history |
| `/admin/integrity` | Reports per paper, flagged sessions, evidence, three decisions |
| `/admin/reports` | Attendance / results / engagement, date range, format, mock export |
| `/admin/moderation` | Reported doubts and chat messages, dismiss / warn / remove |
| `/admin/audit` | Ledger filtered by actor, action and date, 25 to a page |
| `/admin/settings` | Institute name and mark, locked colour system |
| `/admin/account` | The seat's own account |

The Phase 0 `/admin/fees` route and `features/batches/pages/AdminBatchesPage.jsx`
are gone; the console owns batches now, and the old page's "no fee totals" stance
is kept in Reports (attendance, results, engagement — nothing financial).

## Overview

- **Four figures** in Fraunces: students on roll, active batches, attendance rate
  and exams this week. What is waiting on the office is stated separately, by
  name, in the alerts card.
- **Attendance trend** — twelve weeks on a `ChartFrame` with a table alternative,
  so the chart is not the only way to read the numbers.
- **Exam calendar** lists the term's sittings with batch, window and status.
- **Alerts** are operational sentences, each linking to the screen that resolves
  it (a pending paper, an unresolved flag, an import that needs a second pass).

## User management

- Search over name, roll number and email, with role, batch and status facets. The
  count of matching accounts and the invitation count are stated above the table.
- Paged at 25, with page counts derived from the filtered total.
- Every account states its status in words — active, invited, suspended — so the
  badge shape is never the only carrier.

## CSV import

Four steps, and nothing is written until the last one.

1. **Upload** — a file input or pasted text. Two samples ship with the wizard: a
   clean office export and *what actually arrives* (renamed headers, a blank name,
   a truncated email, a duplicate roll, an unknown batch, a date that does not
   exist, a role the console does not accept).
2. **Map the columns** — seven fields, each mapped to a header. Required fields
   are labelled; a missing mapping or a column mapped twice blocks the step with
   an alert, and the first three raw rows stay visible for comparison.
3. **Validation** — `validateImport` checks every row against the *whole* roster:
   roll format `VY-26-0000`, name of at least three characters, email shape and
   uniqueness, phone's last ten digits, role `student|faculty`, a resolvable batch,
   and a real `YYYY-MM-DD` or `DD/MM/YYYY` date. Errors are attached to the row
   that produced them (`import-errors-<line>`), each cell can be fixed in place,
   and a row can be skipped. *Check again* re-runs the same validation the commit
   uses, so a preview can never disagree with the write.
4. **Commit** — the wizard states the accounts to create, the rows skipped and the
   source file. Committed accounts arrive `invited`, and the import is appended to
   the ledger as `import.commit` with its row counts.

## Batches

- Register with track (JEE / NEET / Foundation) and status filters, capacity and
  fill stated per row.
- Detail keeps the three things the office changes: **members** (searchable, with
  defaulters marked), **subjects** with faculty load, and **faculty assignment** —
  add or remove a teacher, saved as one call. The reseed bug found during smoke
  (a refetch clearing the local selection) is fixed with a `seededFor` guard.

## Approvals

Faculty-submitted papers wait here with their batch, window, marks and question
count. **Approve** schedules the paper in its submitted window after a
confirmation. **Override schedule** accepts a local `YYYY-MM-DDTHH:mm` window,
stored as UTC from IST. **Reject** opens a note dialog — the note is what the
faculty reads and what the ledger keeps. A decided paper leaves the pending tab;
*All papers* shows it with its outcome and the note.

## Policies

Six settings: attendance threshold, grace period, proctoring level, attention-check
frequency, data retention and consent version. Choosing **Change** opens a
confirmation carrying the impact summary counted from the live roster — "This
affects 5 batches and 720 students" — plus what changes in practice (defaulter
lists recomputed, existing warning letters unchanged, and so on). Out-of-range
values are refused inline and the impact is not counted; the primary stays inert
until the value is valid. Applying writes the change, appends a
`policy.update` audit entry, and adds a row to the history list with who, when and
the note.

## Integrity

Reports are grouped by paper, then by candidate, with each session's reasons and
evidence (focus, window, camera, audio) stated in words. Three decisions:

- **Clear** — the flag is explained and closed.
- **Warn** — a written warning goes to the candidate and guardian; the score stands.
- **Invalidate** — the sitting is voided and the batch average recomputed.

`RequireNoteDialog` holds all three: the primary is disabled until something has
been written, the dialog says who will read the note, and the service refuses a
`note` shorter than four characters (`note_required`) even if the UI is bypassed.
Decided flags leave the default *Without a decision* filter and appear under
*All flagged sessions* with their outcome and the note as written.

## Reports

Attendance, results and engagement over a date range, with a format selector and
a mock export. The range is validated (an inverted range is `range_invalid`), the
preview renders the same rows the CSV contains, and exporting appends a
`report.export` entry with the file name, range and row count. File names are
derived, not typed: `vyuh-attendance-2026-10-01-2026-11-07.csv`.

## Moderation

The reported-doubts and chat-message queue, open/decided/all, filterable by kind.
**Dismiss** asks once; **Warn** and **Remove** require a note that the author is
shown. The removed message's text is decoded again in the card so the decision can
be reviewed without reopening the thread. Moderation is the one place the console
touches student-authored text, so every action says what the author will see.

## Audit log

A ledger, not a feed: search across actor, action, target and summary; actor and
action facets; from/to dates that cannot invert; 25 rows a page. Each row states
the action in words (`actionLabel`), the actor with their role, the target, the
summary and the note. Read-only by construction — the page has no write path, and
every state-changing call in the service appends to this same list.

## Settings

Institute name, short name and tagline, saved as branding. Logo upload is a mock:
the file never leaves the tab, and when no mark is set the card falls back to the
institute's initial. The **colour system is locked** to Vyuh's three-colour system
— ink, ember and the signal tones — stated on the page with swatches, a disabled
palette selector and a list of what the office cannot rename. This is deliberate:
an institution can name itself, but it cannot re-tone the record.

## Data and contracts

Mock files: `institution.js` (profile, term, accounts, trend, calendar, alerts,
moderation queue, report definitions, branding), `policies.js`, `auditLog.js`
(actions, tones, 20 seeded entries), `integrityReports.js`, `batchesAdmin.js`
(faculty roster, six batches, tracks), `approvals.js`, `importCsv.js` (two sample
sheets). Every one is re-exported from `mock-data/index.js`.

`services.mock.admin` holds 23 methods over `localStorage`
`vyuh.mock.admin.v1`, returning view-model shapes declared in
`contracts/admin.js`. Errors are the product's vocabulary, not HTTP codes:
`note_required`, `window_required`, `window_invalid`, `already_decided`,
`import_invalid`, `import_empty`, `range_invalid`, `value_invalid`,
`value_out_of_range`, `not_found`.

Hooks: `useAdmin.js` (dashboard, users, batches, approvals, policies, integrity,
reports, moderation, audit, branding) and `useAdminOps.js` (the mutations and
their invalidations). Every key is prefixed `['admin', adminId, …]`, so one
invalidate refreshes everything an action touched.

## Acceptance, verified

- **CSV import shows row-level errors before commit** — unit case 2 drives the
  real wizard through the messy sample: the summary, `import-errors-3` and
  `import-errors-5` are on screen, *Continue to commit* is disabled, and only
  after skipping the invalid rows does the commit write three accounts. Service
  smoke: `previewImport` → 3 ready / 8 invalid; `commitImport` → 3 created,
  8 skipped.
- **Policy changes show impact and require confirmation** — unit case 3 opens the
  attendance-threshold dialog, types `80`, waits for "This affects … batches and …
  students", applies, and reads `80%` back off the list. The impact is a query, so
  an in-flight value shows *Counting…* rather than a stale count.
- **The audit log gains an entry when the admin acts** — asserted for policy
  changes, approvals, integrity decisions, moderation, reports and imports. Smoke:
  27 entries at rest, 3 actor and 15 action facets.
- **Integrity decisions require a note** — unit case 5 proves the primary is
  disabled with an empty note, enables it after typing, and finds *Warning issued*
  under *All flagged sessions*; the service also refuses `note_required` directly.

`npx vitest run` → 88 passing across 13 files. `npm run check:architecture` → 313
files, no boundary or token violations. `npm run build` → pass.

### A bug this phase found

`Dialog` and `Sheet` re-ran their focus trap whenever `onClose` changed identity.
Callers pass an inline closure, so every keystroke re-ran `trapFocus`, which focuses
the first control in the panel — the second character of a two-digit value landed
on the close button. Fixed by holding `onClose` in a ref and keying the effect on
`open` alone. The unit tests for policies and integrity decisions are the
regression guard.

## Running the console

Sign in as the academic office (`academic.office@vidyutacademy.in` / `vyuh2026`)
and the rail opens on the institution overview. Try, in order: the import wizard's
second sample, an attendance-threshold change from 75 to 80 and the audit entry it
leaves, a warn decision on `int-0601`, then the same decisions read back in
**Audit log**.
