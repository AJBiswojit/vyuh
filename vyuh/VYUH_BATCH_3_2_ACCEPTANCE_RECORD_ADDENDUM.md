# VYUH — Batch 3.2 Acceptance-Record Addendum (F-03 reconciliation)

**Status:** NEW, stand-alone addendum. Historical reports are **not** edited, not renumbered and not rewritten.
**Branch:** `arena/1763b46c-vyuh` · **HEAD:** `ced54030c336bb1041454fd8780f56f423af19f8`
**Scope:** **F-03 only** — the documentation overclaim and internal inconsistency recorded in `VYUH_FINAL_BATCH_3_ACCEPTANCE_REVIEW.md` §3.3.
**Authority:** explicit user directive (highest) > approved Batch 2 decisions > approved Batch 3 directive > approved Batch 3.1 directive > independent acceptance review > Gate 0 > blueprint. The approved Batch 3.2 Remediation Directive v2 (response-only, no artifact) authorized exactly one new document: this addendum.
**Does not:** grant acceptance, amend or supersede the `REJECT` verdict, close Batch 3, authorize Batch 4, or modify any protected file, public service signature, route, UI or historical report.

---

## 1. What this document is, and what it is not

This addendum is a **reconciliation of the acceptance record**, not a remediation report and not an independent review. It exists because the final acceptance review required, as §14 condition 4, that the Batch 3.1 report's fail-closed overclaim be reconciled "in a NEW addendum only, with separate authorization" (final review §3.3 F-03, disposition **OPEN**; §14 condition 4). That separate authorization was granted in the approved Batch 3.2 directive v2.

* It **records** the exact historical statements that overclaimed compliance.
* It **states the corrected interpretation** of those statements for the acceptance record.
* It **records the integrity evidence** that no historical document was silently rewritten.
* It **does not** claim that the code defect (F-01/F-02) is fixed by writing this document, and **does not** claim final acceptance.

Implementation evidence for F-01, F-02, F-04 and F-05 belongs to the Batch 3.2 implementation report (delivered in the response, not as a file) and to the new/updated test suites; it is referenced here only to the extent needed to explain why the corrected statements are now accurate.

---

## 2. The finding being reconciled (verbatim source)

`VYUH_FINAL_BATCH_3_ACCEPTANCE_REVIEW.md` §3.3, finding **F-03**:

> **F-03 — Batch 3.1 report overclaims fail-closed compliance and is internally inconsistent**
> * **Severity:** **Medium — documentation / acceptance-record integrity.** No code defect.
> * **File / method:** `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §5 (ruling 1 "all applied"), §7 ("Fail-closed … No demo fallback", "Lists return `[]`"), §12 ("No demo paper, attempt or submission leaks"), §18 item 10 ("still receives the demo fixtures by design"); `VYUH_BATCH_3_COMPLETION_REPORT.md` §16/U-3 claim and `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` I-3.
> * **Evidence:** `[AUDIT]` verbatim quotes in §3.1 vs `[NODE]` §3.4.
> * **Disposition:** **OPEN. Historical reports deliberately not modified** under this directive. Reconcile in a NEW addendum only, with separate authorization (§14 condition 4), or record an explicit user risk acceptance.

The final review's own §13 explains why this mattered: 365 passing jsdom tests "do not cure a confirmed fail-open boundary". This addendum therefore records the documentation correction **without** converting green tests into acceptance.

---

## 3. The historical statements, quoted exactly `[AUDIT]` `[HIST]`

The following are reproduced verbatim from the historical files. They remain in those files unchanged; this addendum does **not** delete or edit them.

| # | Location | Verbatim statement |
|---|---|---|
| A | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §5, "Four binding clarification rulings, **all applied** [REM]" | "**New shared own-workspace eligibility helper under `src/services/mock/`** with approved fail-closed semantics: honest empty/unavailable for issued students, `notFound` for unresolvable identity, no demo fallback in either case; reuse the existing identity/session model, no second identity system. → `src/services/mock/ownWorkspace.js`." |
| B | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §5, U-3 | "issued student/faculty honest empty/own workspaces, real name, correct batch/roll, no demo academic data; demo fixtures unchanged. **(This was the failed item; now remediated, §7.)**" |
| C | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §7 | "**Fail-closed:** blank/non-string id, a canonical record of the wrong role, a syntactically valid Institute ID with no issued record (forged), or an issued session addressing a different issued account → `invalid`; `requireStudentWorkspace()` throws `notFound('student')`. **No demo fallback.**" |
| D | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §7 | "`learning.js`, `live.js`, `examFlow.js`, `analysis.js`, `courses.js` now consult it for **every** student-facing method. Lists return `[]` / honest unavailable results; demo-record detail/reads/writes throw `not_found` …" |
| E | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §7 | "Demo seats `stu-ananya` / `fac-snehasish` and all existing mock scenarios keep their exact seeded behaviour — asserted in tests." |
| F | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §12 | "`examFlowService.getPaper()`, `startAttempt()`, `submitAttempt()` throw `exam_unavailable`; `syncAttempt()` is session-gated. **No demo paper, attempt or submission leaks.**" |
| G | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §12 | "The gates live in the **services**, not in route visibility … No navigation-hiding workaround." |
| H | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §18, item 10 | "`courseService` / `questionService` and `liveService`'s parameterless forms derive identity from the persisted session; **a caller with no student session (e.g. a design preview) still receives the demo fixtures by design.**" |
| I | `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` §18, closing | "**CONDITIONAL ACCEPT** of the Batch 3.1 remediation. The P0 blockers D-1 and R-1 are resolved with new tests … **REJECT** is disproportionate given the evidence." |

Statements A–G assert **fail-closed** semantics and **no demo fallback**. Statement H asserts the opposite for the parameterless catalogue readers, and the final acceptance review confirmed at runtime (F-01 / F-02) that `src/services/mock/ownWorkspace.js` classified arbitrary unknown non-Institute identifiers **as `demo`** and classified missing/expired/malformed/wrong-role sessions **as `demo`**. The B3.1 report is therefore **internally inconsistent** (A–G vs H) and its "all applied" and "No demo fallback" claims were **overclaims relative to the shipped code**.

---

## 4. The corrected acceptance-record interpretation

For the acceptance record, statements A–I are to be read with the following corrections. These are **additions to the record**, not edits to the historical documents.

1. **Ruling 1 was NOT fully applied in Batch 3.1.** Statement A's "all applied" is inaccurate. The Batch 3.1 `ownWorkspace.js` implemented fail-closed classification for blank ids, wrong-role canonical records, forged Institute IDs and issued-to-issued mismatches, but **defaulted every other identifier — including arbitrary unknown non-Institute IDs — to `demo`**, and defaulted **missing / expired / malformed / wrong-role sessions to `demo`**. Clarification ruling 1 therefore remained open at the service boundary. `[AUDIT]` `[EXEC]` (final review §3.4).

2. **"No demo fallback" (statement C) was true only for the enumerated cases.** It did not hold for unknown identifiers or invalid sessions. The phrase must be read as "*no demo fallback for the four enumerated invalid classes*", not as a global property of the boundary.

3. **"Lists return `[]`" / "No demo paper, attempt or submission leaks" (statements D and F) were true for valid issued workspaces only.** Under an invalid or absent session, and under an arbitrary unknown identifier with a valid issued session, the same readers returned seeded demo rows (6 live sessions, 3 recordings, 3 doubts, 3 study rooms, 8 attendance rows, 5 courses, 2 question samples and demo detail objects). Statement F's absolute wording is therefore an overclaim.

4. **Statement H is the accurate description of the B3.1 behaviour, but "by design" was never an approved authorization.** No explicit, verifiable demo-preview context existed; global `isMockMode` and the absence of a session were not authorization under clarification ruling 1. H must be read as a **disclosure of a fail-open defect**, not as an accepted product decision. The subsequent four confirmed Batch 3.2 identity rulings explicitly **reject** that behaviour: strict demo identity/session matching; no production demo-preview capability or consumer; a frozen demo set with mandatory valid matching demo-seat sessions; and issued identities valid only with a valid, matching issued session.

5. **The U-3 "now remediated" claim (statement B) was partial.** Issued-workspace isolation from demo data under a valid issued session was achieved; fail-closed behaviour for unresolvable identities and invalid sessions was not.

6. **The B3.1 `CONDITIONAL ACCEPT` recommendation (statement I) is superseded for acceptance purposes** by `VYUH_FINAL_BATCH_3_ACCEPTANCE_REVIEW.md` §13, whose verdict is **REJECT**. This addendum does not reinstate or re-litigate either recommendation; it records that the later, independent `REJECT` is the operative gate verdict until the user decides otherwise.

7. **The same overclaim appears in `VYUH_BATCH_3_COMPLETION_REPORT.md` §16/U-3 and `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` I-3.** Those files are historical and are likewise not modified; the corrections above apply to their U-3/fail-closed claims as well.

---

## 5. Why the corrected statements are now accurate (reference only)

The approved Batch 3.2 directive v2 (F-01–F-05) replaced the single boundary in `src/services/mock/ownWorkspace.js` with a strictly fail-closed resolver and made all seven student/faculty-facing services consult **throwing** getters before any fixture read or write:

* `learning.js`, `live.js`, `courses.js`, `examFlow.js`, `analysis.js`, `students.js`, `faculty.js`.
* Frozen `DEMO_IDENTITIES`; canonical ownership compared across every accepted identifier and alias form (safeguard 1); no preview context, no `isMockMode` authorization, no production test-ID allowlist and no `fixture:` namespace.
* Missing / expired / malformed / wrong-role / mismatched sessions resolve `invalid` and fail closed; `examFlow.syncAttempt()` performs no write on an invalid identity; `students.resolveStudent()` and `faculty.getDashboard()` no longer fall back.
* A new `tests/unit/batch-3-2-identity.test.jsx` suite and the migration of legacy fixtures to real, matching demo/issued sessions close the F-04 regression gap; the extended `tests/unit/batch-3-1-credentials.test.jsx` closes the F-05 R-1 verification gap, including pending-mutation completion after unmount/navigation (safeguard 2).

Consequently, statements A, C, D, F and G describe **only the B3.2-corrected tree**, and statement H no longer describes any shipped behaviour. This section is a **pointer**, not an acceptance claim: the operative evidence is the Batch 3.2 implementation report and the fresh verification suite, and final acceptance requires a **separate independent acceptance review** and an explicit user decision.

---

## 6. Integrity evidence — no historical report was rewritten `[EXEC]` `[AUDIT]`

SHA-256 and byte sizes recorded immediately before this addendum was created; all four values are byte-identical to the pre-B3.2 baseline. No historical report was opened for writing.

| Historical file | SHA-256 | Bytes |
|---|---|---|
| `VYUH_BATCH_3_1_REMEDIATION_REPORT.md` | `c279acd965c473bea81b027467e5857e52ab73e6531ffdbab8bbf2b276f6588e` | 40127 |
| `VYUH_BATCH_3_COMPLETION_REPORT.md` | `1c43c8ce51c0080143ec34a17d4b3aa9780b1981f9809a8c0984d30e8e4988be` | 34559 |
| `VYUH_BATCH_3_INDEPENDENT_ACCEPTANCE_REVIEW.md` | `0c0b9bcf278a8016aafa0765832559af9ec0681e49887e395f4849855e73bdb7` | 41023 |
| `VYUH_FINAL_BATCH_3_ACCEPTANCE_REVIEW.md` | `a9077caa50d79823afd8d80ef56b0692ca4f69c18c81b02e25d148ba2cc4b673` | 63495 |

This file (`VYUH_BATCH_3_2_ACCEPTANCE_RECORD_ADDENDUM.md`) is the **only** new document artifact. No directive artifact was created (the approved v2 directive remains response-only). No Git mutation, protected-file edit, dependency change, browser installation or real-browser execution was performed in producing this addendum.

---

## 7. Evidence taxonomy and remaining limitations

| Label | Meaning in this addendum |
|---|---|
| `[HIST]` | Quoted historical record; intentionally unchanged. |
| `[AUDIT]` | Static source/document inspection. |
| `[EXEC]` | Command/hash evidence from the sandbox (no browser). |
| `[JSDOM]` | jsdom unit-test evidence; not a browser result. |
| `[NODE]` | Read-only Node runtime probe with in-memory storage. |
| `[STATIC-COLLECT]` | `npx playwright test --list` collection only, never a pass. |
| `[UNVERIFIED]` | Not verified; no claim made. |

Remaining limitations, unchanged by this addendum:

1. **F-03 is reconciled in the record only.** The final review's `REJECT` verdict and §14 conditions remain open until a separate independent acceptance review and an explicit user acceptance decision. Batch 3 is **unaccepted**.
2. **F-06–F-13 are out of B3.2 scope** and remain as recorded in the final acceptance review.
3. **No real-browser evidence exists.** Chromium is absent; `npx playwright test --list` is static collection only. No browser console, viewport, media/camera, cross-tab, OS clipboard, download, real-browser axe or E2E result is claimed.
4. **Historical reports still contain their original wording.** A reader of those files alone will still see the overclaim; this addendum is the authoritative reconciliation and must be read alongside them.
5. **Passing tests are not acceptance.** The final acceptance review explicitly refuses to award acceptance on a green suite; this addendum preserves that principle.
6. **Late Batch 3 document-reconciliation order deviation**, stale protected comments, and the non-existent `src/styles/index.css` protected-list entry remain on the record unchanged.

---

## 8. Disposition of F-03

**F-03: RECONCILED IN THE ACCEPTANCE RECORD (documentation only).** The overclaim and the internal inconsistency are identified verbatim, their corrected interpretation is stated, and the integrity of every historical report is evidenced. No historical file was modified. This disposition does **not** close F-01, F-02, F-04 or F-05 (those are implementation and verification matters reported separately), does **not** change the final review's `REJECT` verdict, and does **not** constitute acceptance of Batch 3.

---

**STOP.** Final acceptance of Batch 3 remains the user's decision and requires a fresh, separate independent acceptance review. No Batch 4 authorization exists. No commit, push, merge, pull request, branch switch, publish, deployment, dependency installation or browser installation was performed.

---
