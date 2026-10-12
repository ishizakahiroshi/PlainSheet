---
type: reference
status: draft
tags: [PlainSheet, UX, manual-acceptance]
review_status: pending
last_reviewed: 2026-10-12
---

# P-20261012-001: integrated manual acceptance

Prepared 2026-10-12. Target code: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent review/re-review: SHA-scoped receipts below; current C2/C5 narrow capacity receipt passed (48 permanent / 18 independent checks). Every checkbox below is **not run / not accepted** until a named observer records the exact build/source SHA, environment, procedure and result. This checklist authorizes no product build, normal product launch, deployment, external account or real-data use. Use an already authorized test artifact/environment and synthetic data only; obtain any separately required launch/environment authorization first.

Current source candidate `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (local `f4d0f2b1479441a0c9542454da3f9b55345f5f58`) has fresh integrator-reported **50 files / 646 tests, TypeScript no-emit and ESLint PASS**. Three new App cases and two helper cases cover validation-history restoration capacity and mapped-column bounds. Undo/Redo preflights the 100-rule limit and valid mapped columns before changing rows, rules or either history stack; rejection gives an actionable notice, does not clip rules, and removing an unneeded rule permits retry. The aggregate run remains integrator-reported evidence; the separate independent C2/C5 receipt follows below.

The preceding C2/C5 R1a/R2a corrections retain seven App cases and nine helper cases for reversible current-rule mapping and per-rule header applicability. The integrator reports that the limited recheck of `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` confirmed those subcases fixed but found the restoration-capacity boundary: deleting a rule-bearing column, then adding/importing 100 rules, could make Undo restore 101 and block ordinary editing/export. The current candidate addresses that boundary; the final scoped independent receipt confirms R2b corrected.

The saved [C1/C3/C4 limited final receipt](review-input-search-workspace.md) at historical `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` (local `479a85d`) passed **20 independent assertions and 17 files / 180 focused permanent tests**, with no new blocker in its narrow scope. It does not automatically approve the current source delta. The [C2/C5 receipt](review-save-recovery-validation.md) at that earlier SHA found R1a/R2a; the subsequent limited check confirmed those fixes and found the capacity boundary described above. The final current-SHA capacity recheck passed as recorded below. Post-fix independent C6/C7 review remains **NOT PERFORMED** after the saved initial findings and tool-side stop; it was not restarted or replaced. All actual GUI/native acceptance remains pending.

The [final C2/C5 narrow receipt](review-save-recovery-validation.md#final-narrow-receipt-local-f4d0f2b1479441a0c9542454da3f9b55345f5f58) targets exact local `f4d0f2b1479441a0c9542454da3f9b55345f5f58` / public `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. The independent reviewer reports **3 files / 48 permanent tests and 18 independent archived-fixture checks passed, both exit 0**. R2b is corrected; with the preceding fixed-SHA receipts, no recorded C2/C5 finding remains in the reviewed scope. This final pass covered only the capacity-guard delta, Undo/Redo atomicity, mapped-column bounds, actionable messages and retry, including exactly 100 rules and colliding rule IDs. It is a scoped source/synthetic receipt, not whole-product, native or C6/C7 acceptance. The reviewer did not rerun the aggregate 646-test suite.

Historical candidate `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` had 50 files / 641 tests, TypeScript and ESLint PASS. Its [CI run 38188745792](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188745792) was last observed **in progress**. No terminal result is recorded for that historical run. Current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` [CI run 38189101239](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38189101239) is **in progress** at this documentation freeze; the integrator will record its terminal result on [Issue #3](https://github.com/ishizakahiroshi/PlainSheet/issues/3).

Historical candidate `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` had **49 files / 625 tests**, TypeScript and ESLint PASS. Its [CI run 38188225774](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188225774) completed successfully on **Windows, macOS and Ubuntu**, including the existing frozen Bun installation, frontend checks and native builds. **Current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` CI run 38189101239 is in progress**; historical success does not transfer.

Historical candidate `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9` had 49 files / 607 tests and successful [CI run 38187663662](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38187663662) on Windows/macOS/Ubuntu, including `bun install --frozen-lockfile`, frontend checks and native builds; release publishing and artifact upload were skipped. The initial `a632ef64a2631e2dd00e63a84f6e12d8effb5469` [run 38186806973](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38186806973) had macOS/Ubuntu build success and Windows 514/515 with the sole relay SIGTERM assertion failure. The corrected platform-specific assertion and closed-port check subsequently passed CI.

Local Bun/Rust remain unavailable; successful historical CI locked installation/native builds are separate evidence. No manual builds, product launches, workflow changes, release/deployment or new dependency occurred. This is documentation bookkeeping, not test execution or independent review.

[Coverage](coverage.md) retains all 135 original acceptance conditions and the exact automated evidence/gaps. [Dependency ledger](dependency-ledger.md) records the runtime/lock gap. [Formula contract](formula-contract.md), [C5 contract](c5-contract.md), [named views](named-views-contract.md), and [collaboration contract](collaboration-contract.md) define the deliberate boundaries.

## Observation record

For each run, fill in:

- Case IDs and exact source/artifact SHA; CI run/artifact provenance if applicable
- Date/time/time zone, observer, OS/version, browser/WebView/version, desktop versus web
- Physical keyboard/layout, IME/version, assistive tool/version, display dimensions and zoom
- Initial fixture/settings, every changed setting, observed result and expected comparison
- Screenshots or short recording without credentials, invitation tokens or private paths; only synthetic filenames
- Result: PASS, FAIL, BLOCKED or NOT RUN; defect link and retest SHA; browser download is not a confirmed disk write

Platform matrix is currently unobserved: Windows desktop/web, macOS desktop/web, Linux desktop/web. Record unsupported combinations as BLOCKED with the actual reason. Do not infer one platform's result from another or from a mocked API. Prioritize Windows/macOS key contracts; label Linux/keyboard-layout coverage explicitly.

## Reusable synthetic fixtures

Make disposable copies; never overwrite a user's original. Keep before/after raw strings and output bytes for comparison.

- **S1, targets.csv:** header `value,group,id,note`; data `"North,East",A,00123," a "`; `hidden,B,9007199254740993,"　b　"`; `"South,West",A,9007199254740992,"line1\nline2"`; `"a""b",A,00042,`; a final explicitly quoted empty value. Here `\n` in the note denotes an actual in-cell newline and the spaces around b are U+3000. Filter group to A so displayed original row numbers include 1/2/4/5/6. Also use exact visible original rows 1/2/4 by reducing the fixture. Protect a neighboring column with unique `keep-N` strings.
- **S2, series.csv:** separate blocks `1/2`, `10`, `00123`, `9007199254740993/9007199254740994`, `0.1/0.2`, `item-001`, `2026-10-11`, quotes, blanks and multiline text. Keep a blank area to the left/above each seed for reverse fill.
- **S3, sort.csv:** `地域,数量,ID` plus `A,2,a`, `B,8,b`, `A,10,c`, a second `A,10,d`, blanks, long adjacent IDs and Japanese text. Separately use headerless `3/1/2` and headered `数量/3/1`.
- **S4, search.csv:** 50 rows with the B2:B50 range containing `A`, `AA`, `A` followed by an actual newline, `a`, `[`, `AB-12` and blanks. Put matching A values outside that range and in adjacent columns. A second file has 5,003 cells containing `match match` with protected neighbors. Have 2,000- and 2,001-ASCII-unit query strings ready.
- **S5, source.json / source.yaml:** records containing number 7, boolean true, null, `['x']`, nested object, missing property and empty string; make an all-string control and duplicate/header-only table cases. Markdown control: one pure table; loss case: Intro, aligned first table, Footer and a second table separated by prose.
- **S6, encoding files:** actual original-byte fixtures from `src/tests/importPreview.test.ts`, expected rows `名前,値` and `東京,7`. CP932 bytes are `[150,188,145,79,44,146,108,13,10,147,140,139,158,44,55,13,10]`; EUC-JP bytes are `[204,190,193,176,44,195,205,13,10,197,236,181,254,44,55,13,10]`. Also UTF-8 LF, UTF-8 CRLF, physical UTF-8 BOM, genuine U+FFFD text, unsupported UTF-16 and invalid bytes. Changing the preview decoder must reread the same bytes.
- **S7, formula.csv:** header OFF; A1:A3 = `1,2,3`; B1 `=1+2`, B2 `=SUM(A1:A3)`, B3 `=$A$1+A2`, C1 `=IF(A1>0,SUM(A1:A3),1/0)`, C2 `=1/0`, C3 `=UNKNOWN(1)`, D1 `=D2`, D2 `=D1`. Add literal leading-space ` =1+2`, leading-apostrophe `'=1+2` and long raw ID `9007199254740993`. Numeric calculation uses finite JavaScript numbers; exact sort precision does not imply arbitrary-precision formula arithmetic.
- **S8, sharing:** small raw-string table with distinct row IDs expressed as ordinary fixture data, repeated row values, `00123`, a hidden row and same-sheet formulas. Test participants are Owner, Editor and Viewer. Use only explicitly configured test destinations and disposable room/invitation data; never put actual tokens in evidence.

## Corrected synthetic evidence to carry into real-device retests

These exact cases are included in the reported corrected suite; they are regression evidence, not checked manual boxes and not post-fix C6/C7 independent review.

- M05: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 must not destroy after a previously saved A receives a late shared update during B write`
- M05/M06: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F4 lossy save-and-close leaves an actionable conversion prompt for %s`
- M12: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F2 deleting an inactive document cancels its pending snapshot but permits a distinct later edit`
- M05/M12: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F3 switching tabs preserves a pending originating-document snapshot`
- M11/M13: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F5 structural formula rewrite must be validated after rewriting`
- M11: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F6 reject-mode rules also cover structural insertions before history changes`
- M06: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F9 older byte reads cannot replace a newer pending import preview`
- M09: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `keyboard menu should preserve single-cell clear target`
- M01: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `available HTML-only table paste should not be treated as an empty cell`
- M07: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `literal replacement preserves a pasted newline`
- M04: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `object-list headers cannot be sorted into data by Settings: %s`
- M03: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `formula-bar navigation cannot create a column beyond the grid ceiling`
- M01: [`src/tests/clipboardHtml.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/clipboardHtml.test.ts) — `removes executable embedded content without inserting clipboard markup into the page`
- M02/M15: [`src/tests/autofill.bounds.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/autofill.bounds.test.ts) — `rejects an oversized destination before materializing seeds or changes`
- M16: [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `does not reuse or attach a new file to a blank document whose create response is still pending`
- M03/M13/M16: [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `keeps a distant name-box target through remote insertion and IME composition`
- M05/M16: [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `guards browser and native close with a saved offline queue (inactive document: %s), including cancel and save-close`
- M13/M16: [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `atomically accepts only one concurrent %s batch with relative, absolute and range formulas`
- M16: [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `does not let a forged current-revision guard bypass the original structural Undo revision`

The correction also adds per-document recovery scheduling/deletion barriers, reversible current-rule mapping in column-structure history, an enum-value picker, bounded HTML/plain/image paste handling and guarded structural/history batches. Check the remaining UI/native behaviors below rather than assuming the synthetic case covers every entry/platform.


Final C1–C5 retest additions at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (all actual manual boxes remain NOT RUN):

- UX-008: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R02 a context text paste uses the already acquired ClipboardItem snapshot`
- UX-004: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 maintains mandatory object-list header when a headerless CSV is saved as %s`
- UX-004: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 keeps saved %s key rows through tab switching, filters and advanced sort`
- UX-005: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R3 save-and-close accepts native serialization metadata normalization`
- UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 sorting preserves an untouched invalid value while moving the complete row`
- UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 permits cleanup of unrelated valid data when a preexisting required value is missing`
- UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R2 Undo of an earlier cell edit must not silently remove a subsequently added input rule`
- UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R4 enum candidate selection commits through validation and a single Undo`
- UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R5 column movement remaps rules and Undo restores the original column`
- UX-022: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R05 multi-sort resets invalid previous-document keys instead of presenting A while sorting a missing column`
- UX-022: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 keeps saved %s key rows through tab switching, filters and advanced sort`
- UX-022: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 sorting preserves an untouched invalid value while moving the complete row`
- UX-024: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R04 the keyboard menu exposes column actions for an exact column selection`
- UX-024: [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R04 keyboard-menu cancellation preserves disjoint exact %s and the Copy target`


Latest C2/C5 retest additions at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (seven App cases and nine helper cases; manual boxes remain NOT RUN):

- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `structural Undo preserves and reverse-maps a later rule addition, and Redo maps it forward`
- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `a rule added to an inserted column returns with Redo without leaking onto surviving columns`
- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `column deletion Undo restores its removed rule and preserves a later surviving-column rule`
- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `header %s does not revalidate an unchanged all-rows violation in another column`
- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `header %s still rejects a newly applicable skip-header rule atomically`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `preserves later rule additions and edits across move undo and redo`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `restores only deleted-column rules while preserving later rules on survivors`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `keeps newly inserted column rules detached during undo and restores them on redo`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `inverts a noncontiguous deletion at original indexes`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `keeps ordinary cell history metadata-neutral`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `copies mutable rule values and change indexes`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `does not revalidate unchanged all-row violations when another rule becomes applicable`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `checks newly applicable rules independently even on the same column`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `still rejects new invalid values and does not double-count applicability checks`


Latest C2/C5 capacity/range retest additions at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (three App and two helper cases; manual boxes remain NOT RUN):

- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Undo preflights the 100-rule limit, preserves both stacks, and succeeds after one rule is removed`
- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Redo preflights restored inserted-column rules without clipping or consuming either stack`
- M11 / UX-018: [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Undo rejects a rule mapped past XFD before changing rows, rules or history`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `preflights capacity without clipping rules or changing restoration metadata`
- M11 / UX-018: [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `preflights mapped rules outside the supported column range`

## Cases

### M01 — self-copy, external clipboard and fixed target (UX-008/014)

- [ ] In S1, copy a comma-containing 2×1 selection through keyboard and context routes; paste into a protected region. Expect 2×1, unchanged neighboring values, and one Undo restoring the entire operation.
- [ ] Repeat 1×1 quotes, tabs, actual newlines, trailing blank rows, empty columns and reversed selections. The paste anchor must be the selected intended origin, never a stale or reversed-range endpoint. Test both normal and filtered views.
- [ ] Copy from an external text editor, spreadsheet and HTML table. Ambiguous comma text must show explicit single-column/CSV/TSV choice; cancel changes nothing. Record HTML-only versus text/plain priority separately: bounded HTML parsing now has helper/App regression evidence, but actual cross-application clipboard interoperability remains unobserved.
- [ ] For context paste, confirm the acquired ClipboardItem snapshot is used once even if OS contents later change; no second read silently replaces it. Deny/cancel OS clipboard permission, switch tabs during permission wait, or edit data after preview. Expect no partial write, no stale-target application and an actionable result. Too few visible destination rows rejects the complete paste.

### M02 — actual fill gestures and Undo (UX-013/014/015)

- [ ] Drag S2's 1/2 block down to five rows in Preview series: source remains 1/2 and applied extension is 3/4/5. Cancel must preserve rows/dirty/history. Ctrl+D/R always copies even when series is selected.
- [ ] Repeat above, left, right, multiple columns, blank and text seeds. Check padded IDs, >2^53 values and 0.1/0.2; source/raw formatting remains intact under the documented policy.
- [ ] Filter out interleaved rows, then fill visible destinations and Undo once. Hidden rows and selected source seeds remain untouched. Real IME composition must not trigger a fill shortcut.

### M03 — virtual addresses and limits (UX-014/016)

- [ ] In a 1×1 sheet, reach A100, Z1 and A100:B101 by name box, pointer and keyboard. Name box, selected rectangle, editor and context actions must refer to the same address; navigation alone leaves data and dirty/history unchanged.
- [ ] Commit empty and nonempty input at the same target through name box and pointer. Inspect serialized extent; no full 100000×702 preallocation. Beyond the supported bounds, require explicit rejection rather than silent relocation.
- [ ] Repeat on empty and all-filtered tables; ensure no hidden/virtual unintended edit or inaccessible dead-end focus. Record far-corner memory/latency separately in M15.

### M04 — header and advanced sort (UX-004/015/022)

- [ ] Save headerless CSV as JSON/YAML and confirm mandatory key-row semantics persist through tab/filter/advanced sort; invalid sort keys from a wider previous document reset visibly. Headerless 3/1/2 sorts to 1/2/3; headered 数量/3/1 preserves 数量. A's header choice never changes B's; reopening follows the documented fresh-session policy. JSON/YAML keys must stay consistent through both main selector and Settings.
- [ ] In S3 choose 地域 ascending then 数量 descending. Expected first rows A/10/c, A/10/d, A/2/a, B/8/b, preserving stable ties and whole rows. Change key priority/direction/mode and confirm preview changes.
- [ ] Verify filename, header choice, complete data-row count, hidden-row inclusion, whole-row motion and comparison explanation before Apply. Test auto/text/numeric with long IDs, grouped numbers, blanks, negative decimals and Japanese text.
- [ ] Cancel without changes; apply and Undo once. While confirmation is open, alter source data/header/columns or switch tabs; stale preview must not apply. Test pointer, keyboard and command entry where exposed.

### M05 — save/close/checkpoint races (UX-003/005/012, C8 save combination)

- [ ] Create dirty A.csv and B.csv, including same-name documents in different disposable directories. Save A and switch/edit B while its dialog/write is pending. Every outcome identifies A and the operation; target navigation returns to A; B stays dirty.
- [ ] Test native Save, Save As, cancel, controlled write failure and duplicate save. Direct save→edit→Undo becomes clean only when rows and all serialization settings match; changing encoding/newline/delimiter/format/formula guard/omit-empty keeps it dirty. Include history-cap trimming.
- [ ] Close tab/titlebar/OS window with both dirty documents, an uncommitted editor and real IME. Show every affected target. Repeated close during saving/composition cannot destroy the window; cancel/failure/new edits retain all relevant documents. Check a save dialog overlay cannot bypass or resolve the wrong close request.
- [ ] Close or add another dirty tab while a save-and-close sequence is waiting. Re-evaluate the final live workspace before closing the window; do not only trust the originally captured list.
- [ ] Web download initiation leaves dirty/checkpoint state unchanged. Verify the actual downloaded file before explicit close acknowledgement. Download cancellation/failure must not silently close or erase recovery.
- [ ] Enable recovery on synthetic A, save A while editing/switching to B, then inspect drafts and restore A's copy. Drafts/checkpoints/notifications must remain attached to their original documents; later edits survive. This is the required save-in-flight×tab×checkpoint×recovery scenario.

### M06 — original bytes and lossy overwrite (UX-006/009/010)

- [ ] Open S6 in web and desktop, switch encodings repeatedly and confirm exact Japanese output. Distinguish ambiguous decoder detection, parse failure and unsupported input. Cancel preserves the original document; inspect BOM metadata and exported bytes.
- [ ] Open S5 JSON/YAML. Check before/after numeric/boolean/null/array/missing/empty examples and current output, not stale import data. All-string input avoids unnecessary warning; duplicate/header-only cases remain usable.
- [ ] Native same-name overwrite requires the loss confirmation; Save As defaults to an alternative. If the picker returns the original path, require confirmation again. Cancel must issue no write. Also switch tabs/edit after opening a dialog to check snapshot isolation.
- [ ] Markdown warning accurately distinguishes removed prose/second tables/alignment and any contiguous table flattening. A pure table avoids needless warning. Check Save As and deliberate overwrite output/reopen; full document preservation is not promised.
- [ ] JSON/YAML output remains UTF-8; existing BOM/CSV settings retain their documented meaning. Two overlapping import requests must not commit an older choice into a newer request/document.

### M07 — search and exact replace (UX-002/007/011/023, C8 target combination)

- [ ] Open/reopen/already-open Find and Replace from grid and active editors. Each invocation focuses/selects the defined query input. Real IME Enter/Escape belongs to composition until committed; ordinary Escape returns to the intended cell.
- [ ] On S4, freeze B2:B50 and enable whole-cell A. Next/previous hits must not shrink/move the scope. Adjacent/outside cells, AA and A-with-terminal-newline are unchanged. Combine literal/regex/case and current/all replacement.
- [ ] Distinguish empty query, no target, valid zero hits, invalid regex `[`, literal `[` and 2000/2001 UTF-16-unit input without losing text. Correction removes the error and enables only valid operations.
- [ ] Literal replacement preserves `$1` and actual newline; capture mode explicitly supports $1/$2/$$ and the defined missing-group behavior. Preview and actual output/Undo must agree.
- [ ] All 5,003 matching cells are replaced, with 5,000-only navigation clearly distinguished, and one Undo restores all. Filtered visible/selection scope excludes hidden rows; explicit all-sheet scope warns and includes them.
- [ ] Change data, structure or tab after preview; require invalidation. Combine filter×fixed selection scope×self-copy×reverse fill×rejecting validation, one Undo per accepted action. This is the required filter×scope×copy/fill C8 scenario.

### M08 — live views, source orientation and row references (UX-001/004/016/021)

- [ ] Set at least two column filters in A; switch A→B→A and inspect all conditions/counts. Clear only A. Close/reopen a same-name file and confirm no accidental live-view reuse; rows/CSV/dirty are unchanged.
- [ ] Filter source rows to 1/2/4. Grid orientation must clearly distinguish visible third row from source row 4/A4. Copy/clear/paste/search use source coordinates, and unfilter returns natural numbering.
- [ ] Set frozen rows 0, 1 and multiple while keeping frozen columns. Candidate design is a bounded reference strip above the editable grid; it shows raw values and routes editing back to the grid. Observe whether this actually meets the persistent-reference need while vertically and horizontally scrolling.
- [ ] Hide a data row within the frozen prefix; it must not leak back through the strip. Click a reference and verify source selection. Unfreeze rows without changing column freeze/header/order/dirty. Check 24vh cap, source labels, column alignment and explicit release at 640px/200%.

### M09 — menu, commands and platform keys (UX-024/025/026)

- [ ] From exact cell/row/column and reversed selections, use ContextMenu key/Shift+F10 and the named Column actions button. The intended selection/target must remain exact, without expanding to an unintended row/column; initial focus is first enabled action.
- [ ] Use arrows/Enter, then filter Tab/Space/Apply. Escape/Cancel discards unapplied checks. Returning from filter preserves same-column orientation if the original row disappears. Menu→filter/confirmation transitions must not steal focus back to the grid.
- [ ] Test real IME and text-input editing. macOS bare Command+H remains OS hide; Command+Shift+H follows the chosen Replace contract. Compare actual handlers with tooltip/Help for Save/Save As/Find/Replace/Undo/Redo. Switch Help platform labels; test Windows/macOS and label Linux/layout gaps.
- [ ] Open Commands through button and platform key; search 列幅 / 幅を自動調整 and other declared aliases. Show current document/column and disabled reason. Filter-blocked structure actions must stay blocked through command dispatch.
- [ ] Arrow/Enter selects the intended enabled command, composition Enter never executes, Escape runs nothing and restores origin. Delete goes through the same confirmation and Save the same snapshot contract as buttons. Confirm a local query produces no external search request.

### M10 — named views and explicit persistence (UX-028/001)

- [ ] Save at least two presets, rename/duplicate/select/delete them. Apply exact filters/widths, preserving raw rows/order/dirty/CSV. Show active name/conditions/counts/modified status; changing the live view never silently overwrites its saved version.
- [ ] Exercise duplicate/blank header names, reorder/delete/count changes, same-name files and headerless data. Unsafe matching requires recreation or explicit position/schema confirmation. Missing filter values remain explained, not silently removed.
- [ ] Check session-only default, explicitly enable persistence, then close/reopen and explicitly select/confirm the old group before apply. Test individual/all deletion, opt-out and denied storage. CSV alone carries no preset. All rows exits the active filter.

### M11 — cleanup and validation (UX-017/018)

- [ ] In S1, preview ASCII trim with U+3000 unchecked, then explicitly enable fullwidth trim. Only selected visible cells change; padded/long IDs stay strings. Cancel is zero change; Apply is one Undo.
- [ ] Dedupe with chosen key columns, case and header options. Require complete-row removal consent; hidden/unselected rows do not participate. Preview deleted source indexes and formula reference rewrite; Undo restores rows/formulas once. Column splitting is not implemented; record whether the reviewer requires that example.
- [ ] Add/edit/remove required/pattern/allowed-values rules and use the enum-value picker. Insert/delete/move columns and Undo/Redo: rules follow their intended columns and share only those structural history transactions. Add/edit rules after an ordinary cell edit, then Undo/Redo that cell edit; the later rules must survive. Existing unchanged violations must not block unrelated valid cleanup/sort work. Warning default preserves invalid input. Reject mode blocks the entire grid/formula-bar/paste/clear/replace/fill/cleanup transaction without history/dirty change. Check atomicity when the last error lies beyond the first 200 displayed issues; all errors must be counted and the display cap explicit.
- [ ] Start with `id,value,extra` / `11,keep,last`. Move a column, then add or edit a rule; structural Undo/Redo must map the current rules to the same intended columns and preserve later edits. Delete a column with a rule, add a rule to a survivor, then Undo/Redo: restore the removed-column rule only when its column returns; preserve the survivor's later rule. Add a rule to a newly inserted column, Undo insertion and Redo: detach it while the column is absent, restore it with that column, and never attach it to a neighboring survivor. Repeat with noncontiguous deleted columns and an ordinary intervening cell edit.
- [ ] For header applicability, use `bad,value` / `11,keep`. Add an all-row rejecting `[0-9]*` pattern to column A and a rejecting required rule that skips the header to B. Insert before row 1, or set header OFF and sort: the unchanged old A violation must not block the operation merely because B's rule becomes applicable. Undo once restores the original rows. Repeat with `bad,` / `11,keep`: B's newly applicable empty value must reject the whole operation without dirty/history changes. Include multiple rules on the same column; unchanged violations stay visible without duplicated counts, and new invalid edits are still rejected.
- [ ] Capacity/range boundary: delete a column that has a rule, then configure/import 100 valid rules on surviving columns and request Undo. A 101-rule restoration must be rejected with an actionable explanation before rows, current rules or either history stack change; do not clip/drop rules. Export the still-valid current rules and verify ordinary editing still works. Remove an unneeded rule, retry Undo, then Redo and verify exact round-trip state. Repeat the symmetric Redo case with rules detached from an inserted column, and a rule that a reverse column transform would map beyond the supported rule-column range; rejection must leave both stacks available for a valid retry.
- [ ] Export/import the separate versioned rules sidecar into an explicitly chosen document; malformed import leaves current rules intact. Closing the document ends session rules; deleting a sidecar does not remove an already imported rule. CSV/sharing does not silently include rules. Review the complete-list requirement versus the 200-entry cap.

### M12 — recovery and storage boundaries (UX-027/003/005/012)

- [ ] Fresh OFF state writes no document content to recovery storage. Before ON, read content/location/seven-day expiry/2 MiB/50-document bounds and best-effort limitations. Editing and normal saving stay usable when storage reads/writes are denied.
- [ ] Only committed snapshots appear, identified by name/time/expiry and distinct identity for same-name files. Restoring creates a new dirty pathless document with formula/sharing OFF and Save As as the initial save route.
- [ ] Change the original disposable file externally, then restore. No automatic overwrite or original-path rebinding. On restart/crash recovery, promise only the last completed snapshot, never uncommitted IME or newest keystrokes.
- [ ] Individual/all/OFF deletion and expired cleanup must actually succeed or report failure. A failed OFF deletion must stop further content writes and disclose surviving content; no background deletion guarantee while the app is stopped.
- [ ] Test corruption, quota, private mode and simulated eviction in a disposable profile. No false “draft saved” status. A web download, restoration or ordinary save does not implicitly erase a draft. Repeat the combined delayed-save case M05.

### M13 — real formula editing and structural safety (UX-019, C8 formula combination)

- [ ] S7 opens calculation OFF, showing all raw strings. Explicit ON shows =1+2→3, SUM→6 and separate raw editor/results; changing A1 recalculates dependent cells. Cycle/unsupported/division/reference/limit errors stay visible, with original formula recoverable.
- [ ] Real cell and formula-bar editing across selection/tab changes must never commit a draft to a stale target. Real IME survives mode switches/commit/search/save boundaries.
- [ ] Check relative/absolute copy/fill; insert/delete rows/columns adjusts references as contracted and Undo/Redo restores raw formulas atomically. In OFF mode formula-looking text must not be rewritten. Sort/move follows the documented positional-reference policy, without silent copy translation.
- [ ] Combine formulas×filter×sort×row/column structure×Undo, then save while switching/editing another tab. Results recompute from current raw source; snapshots/dirty state remain isolated. This is the required C8 formula combination.
- [ ] Export raw formulas and a separate values copy; reopen both OFF. Raw source/checkpoint is not replaced or marked saved by derived export. Values cannot overwrite the original path. Check formula errors, formula-looking result strings and CSV injection-guard behavior explicitly; no all-Excel compatibility claim.

### M14 — actual layout and assistive technology (all IDs; especially UX-016/021/024/026)

- [ ] At 640px and 200% zoom, every feature entry/confirmation/cancel remains keyboard reachable, with a usable grid area. Inspect wrapped feature controls, long Japanese filenames, long errors, frozen-reference height, command list and sharing history.
- [ ] Use a real screen reader to navigate grid, source/visible row orientation, active filter/counts, save target/results, errors, validation, dialogs and sharing roles/status. Verify spoken meaning and focus order, not just ARIA attribute presence.
- [ ] Check visible focus, disabled reasons, high contrast and keyboard-only completion/cancellation; no focus loss behind dialogs or activation by composition keys. Record platform-specific shortcomings without treating source/unit PASS as accessibility certification.

### M15 — measured responsiveness and capacity (UX-014/021/023/027/019/020)

- [ ] Record hardware, input dimensions/bytes, formula count/dependency depth, viewport, elapsed time, peak memory and responsiveness for small/medium synthetic tables, 5,003 replacement targets and distant single-cell edit.
- [ ] Measure import preview (whole original bytes plus parsed table), multi-key preview/sort, 100k virtual-row navigation without materialization, formula recalculation, recovery serialization and frozen-reference scrolling. Deliberately exceed documented formula/recovery/sharing bounds; expect explicit safe errors and intact raw values.
- [ ] No performance threshold was empirically agreed for this task. Report actual measurements and any UI stall instead of inventing a PASS budget or extrapolating microbenchmarks to product-scale behavior.

### M16 — separate-device sharing and ordinary-save isolation (UX-020/019, C8 collaboration combination)

- [ ] Fresh mode is OFF, endpoint blank and content upload absent. Use the optional self-host instructions in collaboration-contract.md only in an approved test setup. The included relay binds loopback; actual separate devices need an explicitly operated TLS proxy and exact origin allowlist. Do not deploy one automatically.
- [ ] On two independent approved devices, explicitly share S8 and join Editor; separately join Viewer. Verify endpoint/content/roles/status/local-save destination/24-hour volatile retention/history/copy-deletion boundaries before consent. Invitation tokens stay out of screenshots/logs/URLs.
- [ ] Edit same and different cells concurrently; insert/delete/reorder rows and columns concurrently, including identical-value rows and formula references. Compare authoritative revision, stable identities, raw matrix, formula results and retained displaced values. Conflicts are surfaced/recoverable; structural formula rewrites cannot overwrite intervening remote edits. For coordinate-derived structural batches, expect exact-revision rejection of the entire stale batch, retained blocked pending work and explicit recomputation against the new snapshot; retrying an unchanged rejected payload must not silently rebase it.
- [ ] Disconnect Editor, queue operations, edit from Owner, then reconnect; inspect ordering, duplicate/lost-ACK retry and rejected-operation state. Local Undo is a guarded compensating operation and cannot erase another participant's later edit; deliberate history restore is separately confirmed.
- [ ] Forge a viewer write, revoke an offline editor before replay, revoke while a request body is pending, leave, stop and delete. Server/provider must deny authority, not merely disable UI. Stop/delete cannot recall copies already received. Restarting the volatile relay loses rooms; surviving sessions disclose failure and permit explicit local recovery.
- [ ] Save/download a local snapshot during remote changes/tab switches; sharing success is not durable save. Joining creates an isolated document; a shared blank starter must not be reused for a new ordinary document or silently upload that document. Values/structure/Undo/viewer/revocation/disconnect×normal save is the required C8 combination.
- [ ] Verify actual native CSP/browser CORS/TLS, origin-specific failures and error recovery. Record the relay's synthetic test process start/stop and ensure it is stopped after use. Existing loopback tests already own/close their sockets and child; do not infer any public service deployment.

## Closure gate

A manual PASS belongs only to its recorded SHA/platform/case. Failed or blocked cases stay open with exact symptoms and safe next step. C8 requires final regression/lint/typecheck, frozen dependency/runtime evidence, full independent diff review and correction re-review, CI head/run evidence, and the above actual-device observations or an explicit unaccepted list. Post-fix independent C6/C7 review is NOT PERFORMED and remains an acceptance gap; this checklist does not restart, replace or authorize that review. Do not silently lower scope because an environment is unavailable; report a candidate with remaining gates.

Documentation frozen for this source candidate; the terminal CI receipt remains for explicit integrator update.
