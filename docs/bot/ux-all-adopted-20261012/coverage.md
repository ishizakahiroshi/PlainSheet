---
type: reference
status: draft
tags: [PlainSheet, UX, acceptance]
review_status: draft
last_reviewed: 2026-10-12
---

# P-20261012-001 PlainSheet: 28-feature acceptance coverage

## Status and source boundaries

Implementation-candidate evidence inventory, prepared 2026-10-12 for P-20261012-001. All 28 adopted features have inspected UI and processing paths, with exact meaningful test names or explicit test gaps below. This is not an independent code review, feature-complete assertion, or real-device acceptance report. The integrator reports a fresh complete regression run on this corrected candidate; test PASS is still distinct from independent re-review and real-device acceptance. No product build, normal product launch, real user data or remote write was performed by this documentation pass.

The original 135 proposal acceptance bullets remain unchanged. Numbered evidence annotations cover every bullet, including historically superseded formula/collaboration language. Source/helper/React integration, mocked native/canvas and real loopback HTTP evidence are separate layers. See [manual acceptance](manual-acceptance.md) and [dependency ledger](dependency-ledger.md).

- Fixed instruction SHA: `8204b5442f602164148b725c3ad07190630e33c4`.
- Behavior oracle: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`.
- Required implementation-review diff starts at original instruction publication `bf7e54689742c35a2158c16f79823a66cb59ad85` and ends at the submitted code SHA. Do not recount inherited PR #1 changes.
- All 28 IDs are adopted. Historical defer/not-implemented/separate-project language in research is superseded by README and child plans. Formula evaluation and actual network collaboration are required. Adoption does not turn calculation, recovery-content persistence or sharing on by default.
- Corrected candidate code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` ([Draft PR #4](https://github.com/ishizakahiroshi/PlainSheet/pull/4)); corresponding local source commit `f4d0f2b1479441a0c9542454da3f9b55345f5f58`. C1/C3/C4 limited recheck passed at historical `ac8194cb`; current C2/C5 narrow capacity recheck passed at `6dba8bd` (48 permanent tests / 18 independent checks). Post-fix independent C6/C7 review: **NOT PERFORMED**. Unit/source evidence never substitutes for actual GUI/native acceptance.

## Candidate verification record

Current source candidate `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (local `f4d0f2b1479441a0c9542454da3f9b55345f5f58`) has fresh integrator-reported **50 files / 646 tests, TypeScript no-emit and ESLint PASS**. Three new App cases and two helper cases cover validation-history restoration capacity and mapped-column bounds. Undo/Redo preflights the 100-rule limit and valid mapped columns before changing rows, rules or either history stack; rejection gives an actionable notice, does not clip rules, and removing an unneeded rule permits retry. The aggregate run remains integrator-reported evidence; the separate independent C2/C5 receipt follows below.

The preceding C2/C5 R1a/R2a corrections retain seven App cases and nine helper cases for reversible current-rule mapping and per-rule header applicability. The integrator reports that the limited recheck of `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` confirmed those subcases fixed but found the restoration-capacity boundary: deleting a rule-bearing column, then adding/importing 100 rules, could make Undo restore 101 and block ordinary editing/export. The current candidate addresses that boundary; the final scoped independent receipt confirms R2b corrected.

The saved [C1/C3/C4 limited final receipt](review-input-search-workspace.md) at historical `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` (local `479a85d`) passed **20 independent assertions and 17 files / 180 focused permanent tests**, with no new blocker in its narrow scope. It does not automatically approve the current source delta. The [C2/C5 receipt](review-save-recovery-validation.md) at that earlier SHA found R1a/R2a; the subsequent limited check confirmed those fixes and found the capacity boundary described above. The final current-SHA capacity recheck passed as recorded below. Post-fix independent C6/C7 review remains **NOT PERFORMED** after the saved initial findings and tool-side stop; it was not restarted or replaced. All actual GUI/native acceptance remains pending.

The [final C2/C5 narrow receipt](review-save-recovery-validation.md#final-narrow-receipt-local-f4d0f2b1479441a0c9542454da3f9b55345f5f58) targets exact local `f4d0f2b1479441a0c9542454da3f9b55345f5f58` / public `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. The independent reviewer reports **3 files / 48 permanent tests and 18 independent archived-fixture checks passed, both exit 0**. R2b is corrected; with the preceding fixed-SHA receipts, no recorded C2/C5 finding remains in the reviewed scope. This final pass covered only the capacity-guard delta, Undo/Redo atomicity, mapped-column bounds, actionable messages and retry, including exactly 100 rules and colliding rule IDs. It is a scoped source/synthetic receipt, not whole-product, native or C6/C7 acceptance. The reviewer did not rerun the aggregate 646-test suite.

Historical candidate `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` had 50 files / 641 tests, TypeScript and ESLint PASS. Its [CI run 38188745792](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188745792) was last observed **in progress**. No terminal result is recorded for that historical run. Current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` [CI run 38189101239](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38189101239) is **in progress** at this documentation freeze; the integrator will record its terminal result on [Issue #3](https://github.com/ishizakahiroshi/PlainSheet/issues/3).

Historical candidate `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` had **49 files / 625 tests**, TypeScript and ESLint PASS. Its [CI run 38188225774](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188225774) completed successfully on **Windows, macOS and Ubuntu**, including the existing frozen Bun installation, frontend checks and native builds. **Current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` CI run 38189101239 is in progress**; historical success does not transfer.

Historical candidate `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9` had 49 files / 607 tests and successful [CI run 38187663662](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38187663662) on Windows/macOS/Ubuntu, including `bun install --frozen-lockfile`, frontend checks and native builds; release publishing and artifact upload were skipped. The initial `a632ef64a2631e2dd00e63a84f6e12d8effb5469` [run 38186806973](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38186806973) had macOS/Ubuntu build success and Windows 514/515 with the sole relay SIGTERM assertion failure. The corrected platform-specific assertion and closed-port check subsequently passed CI.

Local Bun/Rust remain unavailable; successful historical CI locked installation/native builds are separate evidence. No manual builds, product launches, workflow changes, release/deployment or new dependency occurred. This is documentation bookkeeping, not test execution or independent review.

- Full local commands reported by the integrator: `node node_modules/vitest/vitest.mjs run`; `node node_modules/typescript/bin/tsc --noEmit --pretty false`; `node node_modules/eslint/bin/eslint.js .`; each exit 0.
- The 22 grouped initial findings, seven subsequent C1–C5 findings and the C2/C5 R1a/R2a subcases and subsequent restoration-capacity boundary remain separately documented in [remediation](remediation.md), [C1/C3/C4](review-input-search-workspace.md), [C2/C5](review-save-recovery-validation.md) and the saved [initial C6/C7 report](review-formula-collaboration-security.md). Initial reports target `a632ef64a2631e2dd00e63a84f6e12d8effb5469`; later receipts identify their own SHA. No full-28 acceptance claim is made.
- Local environment: Linux, Node 24.19.0, npm 11.9.0 and Python 3.12.14. npm-resolved versions differ from Bun lock versions; manifests/locks are unchanged. See the ledger.
- Test boundary: production App/editor tests use mocked canvas/clipboard/native I/O; selected collaboration model/provider/runner and App/hook tests execute test-owned real loopback HTTP with synthetic participants and cleanup. None proves separate devices, packaged CSP, real IME/OS clipboard/window close, assistive technology or performance.
- Documentation checks preserve 28 rows/sections, all 135 original proposal bullets, exact test names and current-source links. Documentation is frozen after this update; the final CI status must be entered explicitly by the integrator.

### Remaining review-sensitive and acceptance gaps

HTML-table parsing and non-text paste rejection, keyboard-menu single-cell targeting, multiline literal replacement, object-list header locking, grid-ceiling navigation, recovery scheduling/deletion, save-close overlay/race and sharing consent/structural guards now have correction evidence rather than blanket “not implemented” labels. Remaining boundaries include command-search/platform dedicated integration; complete menu-to-filter/dialog focus coverage (disjoint-selection cancellation now tested); detailed-sort cancel/staleness/Undo; multi-filter live restore/counts; exact source-row announcements; validation’s first-200 issue display versus “complete list”; trim/dedupe versus the column-split example; same-path native Save As; history-cap/checkpoint interactions; the full C8 cross-products and all real-device observations. The independent C6/C7 post-fix review gap remains explicit.

## Traceability matrix

### C1: 4 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-008](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L86) コピーした表を同じ形で貼り戻す | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Copy/context Paste and Paste format dialog; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): keyboard copy/paste capture | [`src/lib/clipboard.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/clipboard.ts): createClipboardSnapshot, resolveClipboardText; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): clipboardContextValid, pasteGrid; [`src/lib/gridOperations.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/gridOperations.ts): pasteIntoView; `src/lib/clipboard.ts: clipboardHtmlRows` bounded HTML fallback | [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `keyboard paste should use the same top-left destination as context paste`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Bounded HTML/plain/non-text paste has correction tests; real OS clipboard, permission prompts and cross-application round trips remain pending (M01). |
| [UX-013](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L145) フィルで元のセルを変えない | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Fill Copy/Preview series selector and apply preview; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): drag fill and Ctrl+D/R | [`src/lib/autofill.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/autofill.ts): buildFillUpdates/fillSeries; [`src/lib/decimal.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/decimal.ts): exact decimal series; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): applyUpdates/previewUpdates | [`src/tests/GlideSheet.inputSafety.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.inputSafety.test.tsx) — `previews only 3,4,5 when Glide supplies a destination containing seeds 1,2`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Real canvas drag in all directions, OS shortcut dispatch and IME are pending; combined filtered series-preview plus Undo merits a dedicated App scenario (M02). |
| [UX-014](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L208) 見えるセルと編集対象を一致させる | [`src/components/FormulaBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FormulaBar.tsx): name box; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): controlled selection/click/edit; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): handleJump | [`src/types/sheet.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/types/sheet.ts): MAX_GRID limits; [`src/lib/cellref.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/cellref.ts): parseCellRef; [`src/hooks/useSheet.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useSheet.ts): on-edit row growth; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): commitCell/editCell | [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `formula-bar navigation cannot create a column beyond the grid ceiling`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Real grid/name-box/keyboard equivalence, upper-limit rejection, far-cell memory/latency and empty/all-filtered rendering pending (M03, M15). |
| [UX-015](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L269) 大きな番号を正しい順序で並べる | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): detailed Sort mode selectors and existing column quick sort | [`src/lib/sort.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/sort.ts): sortRows/sortRowsByKeys; [`src/lib/decimal.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/decimal.ts): parseExactDecimal/compareExactDecimals | [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `orders adjacent long integers exactly without changing raw cell strings`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Detailed sort UI, Undo and stale-preview end-to-end cases pending; large-table comparator cost unmeasured (M04, M15). |

### C2: 6 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-003](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L326) 保存結果に対象ファイルを必ず添える | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): editionNotice/saveNotice and Open target button; [`src/components/Toolbar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/Toolbar.tsx): Save/Save As | [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): performSave captures document/rows/meta; [`src/lib/saveState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/saveState.ts): completedSaveMeta; [`src/hooks/useDocuments.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useDocuments.ts): completeSave | [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `keeps completion notice and checkpoint attached to A while B is active and dirty`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Real native file pickers/writes, same-name target clarity and all outcome labels remain manual/review gates (M05). |
| [UX-005](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L382) 閉じる前に保存へ進める | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): tab/window Save before closing dialog; [`src/components/TitleBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/TitleBar.tsx): guarded close | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): approveWindowClose, saveThenClose, finishClose; [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): explicit SaveOutcome; native onCloseRequested registration | [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 must not destroy after a previously saved A receives a late shared update during B write`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Native titlebar/OS close, repeat close during real IME/save, actual disk failure and browser download completion remain pending (M05). |
| [UX-006](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L438) 文字コードと読込結果を確かめて開く | [`src/components/ImportPreview.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ImportPreview.tsx): encoding/delimiter/format/newline choices and original-byte preview; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): importRequest | [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): loadPath/loadBrowserFile; [`src-tauri/src/main.rs`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src-tauri/src/main.rs): read_file_bytes; [`src/lib/importPreview.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/importPreview.ts): previewImport | [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F9 older byte reads cannot replace a newer pending import preview`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Older browser byte-read supersession now has App regression evidence; corrected-head native Rust/I/O, real file import/cancel behavior, browser decoder compatibility and memory footprint remain pending (M06, M15). |
| [UX-009](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L498) JSON/YAMLの上書き前に変換内容を示す | [`src/components/ImportPreview.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ImportPreview.tsx): conversion impact; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): overwrite-conversion dialog with Save As/Overwrite/Cancel | [`src/lib/conversionPreview.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/conversionPreview.ts): createConversionPreview; [`src/lib/formats.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/formats.ts): production serialization; [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): beforeSave and same-path Save As recheck | [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F4 lossy save-and-close leaves an actionable conversion prompt for %s`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | App save-close conversion cancellation/no-write now has regression evidence; Save As-to-original-path and fresh-after-edit overwrite combinations, native confirmation/actual disk output remain pending (M06). |
| [UX-010](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L555) Markdownは表だけを保存すると伝える | [`src/components/ImportPreview.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ImportPreview.tsx): Markdown conversion impact; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): overwrite-conversion confirmation | [`src/lib/conversionPreview.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/conversionPreview.ts): Markdown loss analysis; [`src/lib/formats.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/formats.ts): parseMarkdownTable/serializer; [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): beforeSave | [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F4 lossy save-and-close leaves an actionable conversion prompt for %s`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | App Markdown save-close conversion cancel/no-write has regression evidence; same-path Save As, actual native bytes and reopen remain pending (M06). |
| [UX-012](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L617) 保存地点へ戻ったことを区別する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): dirty tab/status and Undo/Redo routes | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): checkpointsRef, onSaved and sameSaveContent effect; [`src/lib/saveState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/saveState.ts): full serialization-setting comparison | [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `returns to a direct-save checkpoint only when data and serialization settings match`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Actual filesystem persistence/close remains pending; history truncation and full setting cross-product merit additional synthetic coverage (M05). |

### C3: 6 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-002](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L674) 検索を呼ぶたび入力欄へ戻す | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Find/Replace commands and searchFocusNonce; [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): focus/select and IME guard | [`src/lib/commands.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/commands.ts): shared dispatch; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): finishPendingEdit/openSearch and focusCell on close | [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `refocuses and selects the query on repeated Ctrl+%s without consuming composition Enter/Escape`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Actual Windows/macOS key delivery, real Japanese IME and canvas return focus pending (M07, M09). |
| [UX-007](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L731) 正規表現の置換ルールを明示する | [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): Capture references option and rule text; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): replace preview | [`src/lib/search.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/search.ts): replaceSearchValue; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): replaceCurrent/replaceAll and snapshot guard | [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `uses the same replacement rules in preview and mutation with capture references %s`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Literal multiline input and each replacement entry need real-editor/manual verification; JavaScript regex behavior is documented, not RE2 equivalence (M07). |
| [UX-011](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L785) 検索エラーと一致なしを分ける | [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): query aria-invalid, error/empty/zero-match state and disabled replace | [`src/lib/search.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/search.ts): compileSearch and collectSearchMatches; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): compiledSearch/result wiring | [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `distinguishes literal bracket hits, invalid regex, no matches and the 2000/2001 query boundary`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Screen-reader error/zero-target announcements, typing behavior and expensive valid regex performance remain pending (M07, M14–M15). |
| [UX-023](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L841) 選択範囲だけで検索・置換する | [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): sheet/visible/selection scope and Whole cell; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): scope label and replace preview | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): changeSearchScope/inSearchScope/invalidateSearchScope/replaceAll; [`src/lib/search.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/search.ts): whole-cell matcher and navigation cap | [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `freezes the exact whole-cell scope across next-hit navigation and invalidates it after a structure change`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | B2:B50 terminal-newline and full option matrix, real keyboard selection and large-table timing pending (M07, M15). |
| [UX-025](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L904) 端末に合うショートカットを表示する | [`src/components/Toolbar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/Toolbar.tsx): shortcut tooltips; [`src/components/HelpModal.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/HelpModal.tsx): Windows/Linux/macOS selector; command search labels | [`src/lib/commands.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/commands.ts): currentPlatform/shortcutLabel/shortcutCommand; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): handleKeyDown | [`src/tests/dualEditionUi.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/dualEditionUi.test.tsx) — `uses Download/Download as for browser and presents a keyboard-focus tooltip`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | No dedicated commands/platform test suite at this inventory; real Windows/macOS/Linux layouts and OS reservation behavior pending (M09). |
| [UX-026](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L962) 操作名で探せるコマンド検索を用意する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Commands button / Ctrl-or-Command+Shift+P; [`src/components/CommandSearch.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/CommandSearch.tsx): query/list/targets/disabled reasons | [`src/lib/commands.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/commands.ts): dispatchCommand; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): shared command registry; [`src/components/FeatureDialog.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FeatureDialog.tsx): focus lifecycle | No dedicated test found; source only. Reported aggregate PASS is not feature-specific coverage. | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Dedicated command-search alias/disabled/confirmation/IME/Escape tests and actual narrow-screen/assistive acceptance remain pending (M09, M14); keyboard-menu target corrections are separate evidence. |

### C4: 7 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-001](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1025) タブを戻ったときに絞込みを保つ | [`src/components/TabBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/TabBar.tsx): A→B→A; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): filter bar and Clear filters | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): viewStatesRef/applyDocument; [`src/lib/viewState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/viewState.ts): DocumentView; [`src/hooks/useFilter.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFilter.ts): restore/clearAll | [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `isolates header meaning, filter and independent row/column freezes without dirtying data`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Multiple-filter counts and closed/same-name live-state reset need explicit integrated/manual checking; actual tab/canvas state pending (M08). |
| [UX-004](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1080) 先頭行の意味をファイルごとに選ぶ | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): First row selector and sort header summary; [`src/components/SettingsModal.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SettingsModal.tsx): document header choice | [`src/lib/viewState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/viewState.ts): per-document defaults; [`src/lib/sort.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/sort.ts): headerRow; [`src/hooks/useFilter.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFilter.ts): header handling | [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 maintains mandatory object-list header when a headerless CSV is saved as %s`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | JSON/YAML Settings/header and Save As→filter/tab/advanced-sort transitions have correction evidence; real discoverability and exact quantity-header reopen remain pending (M04, M08). |
| [UX-016](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1137) 絞込み後も元の行番号を分かるようにする | [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): rowOrientation status (visible position / original row / address); [`src/components/FormulaBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FormulaBar.tsx): source address | [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): toSourceRow/toVisibleRow; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): rowSourceIndexes and filtered selection fallback | [`src/tests/GlideSheet.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.test.tsx) — `restores source header axes through a filtered view without selecting hidden markers`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Exact source-row orientation, unfilter numbering and screen-reader interpretation pending (M08, M14). |
| [UX-021](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1194) スクロールしても見たい行を固定する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Frozen rows numeric 0–10, Freeze to row, Unfreeze rows; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): frozen reference strip | [`src/lib/viewState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/viewState.ts): document-local freezeRows independent of freezeColumns; GlideSheet filters references by original row; [`src/styles/app.css`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/styles/app.css): max-height 24vh | [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `isolates header meaning, filter and independent row/column freezes without dirtying data`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Verify that the reference-strip design satisfies persistent-on-scroll acceptance, column alignment, 0/1/multiple rows, filter exclusion and 640px/200% limits in the actual product (M08, M14). |
| [UX-022](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1541) 複数列の並べ替えを対象確認して実行する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Multi-column sort dialog, priority-key controls, first-eight-row preview and second apply confirmation | [`src/lib/sort.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/sort.ts): sortRowsByKeys; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): clipboardContextValid/header recheck, applySortedRows and atomic history | [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R05 multi-sort resets invalid previous-document keys instead of presenting A while sorting a missing column`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Integrated sort preview controls/cancel/Undo/staleness tests and real product preview/performance pending (M04, M15). |
| [UX-024](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1600) メニューをキーボードで開き元の場所へ戻る | [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): ContextMenu/Shift+F10 capture; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Column actions button; [`src/components/ContextMenu.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ContextMenu.tsx) and FilterPopover.tsx | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): context/filter onClose and focusCell fallback; [`src/components/ContextMenu.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ContextMenu.tsx): enabled-item focus/arrow dispatch; FilterPopover keeps draft selections | [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R04 the keyboard menu exposes column actions for an exact column selection`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Keyboard-menu single-cell and disjoint row/column target/cancel/Copy now have correction evidence; focus-transition/filter-draft/IME cases and real OS/canvas/assistive acceptance remain pending (M09, M14). |
| [UX-028](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1251) 絞込みに名前を付けて切り替える | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Named views button/current-name/modified/count display; [`src/components/NamedViewsPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/NamedViewsPanel.tsx): CRUD/apply/storage controls | [`src/lib/namedViews.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/namedViews.ts): session store/schema comparison/explicit local persistence/import; [`src/hooks/useFilter.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFilter.ts): restore; sheet colWidths | [`src/tests/namedViewsPanel.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/namedViewsPanel.test.tsx) — `saves two views, applies exact filters/widths, renames, duplicates, deletes and returns to all rows`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C1/C3/C4 limited PASS at `ac8194cb`; current delta not independently rechecked here | Actual browser/native persistent storage/restart behavior, screen-reader and narrow-layout usability remain pending (M10, M14). |

### C5: 3 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-017](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1313) 選んだ範囲だけを確認して整形する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): exact selected visible cells → Cleanup; [`src/components/CleanupPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/CleanupPanel.tsx): trim/dedupe preview/options/whole-row consent | [`src/lib/cleanup.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/cleanup.ts): previewCleanup/previewDedupe; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): stale identity/rows check, validateNext, formula structural rewrite, one history transaction | [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `trims only visible selected cells, leaves hidden rows raw, and undoes atomically`; included in reported 50-file/646-test run, exit 0 | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Column-split example remains outside the implemented toolbox and requires a review decision if treated as mandatory; actual selection/preview readability pending (M11). |
| [UX-018](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1369) 入力ルールを任意で確かめる | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Validation button/report; [`src/components/ValidationPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ValidationPanel.tsx): required/pattern/allowed-values, warning/reject, add/edit/remove and sidecar controls | [`src/lib/validation.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/validation.ts): bounded pattern matcher, validateMutation/document and versioned sidecar; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): rulesById/validateNext at central mutations; identity-aligned final validation, enum picker and column-structure rule history; [`src/lib/validationHistory.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/validationHistory.ts): current-rule reversible transforms and removed-rule restoration; validationHistoryError preflight before Undo/Redo | [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Undo preflights the 100-rule limit, preserves both stacks, and succeeds after one rule is removed`; reported 50-file/646-test run, exit 0; 3 new App/2 helper capacity/range cases plus prior rule-history cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Review whether the capped issue list satisfies the child-plan complete-list wording; actual sidecar picker/download/reopen and accessibly locating violations remain pending (M11, M14). |
| [UX-027](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1662) 任意のローカル復元下書きを残す | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Recovery OFF/ON/status/startup candidates; [`src/components/RecoveryPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/RecoveryPanel.tsx): consent/list/restore/delete/Later | [`src/lib/recovery.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/recovery.ts): createRecoveryStore, versioned edition-local store, TTL/quota/failure guards, pathless restoreCopy; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): committed snapshot scheduling; per-document recovery timers and deletion barriers | [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F2 deleting drafts cancels pending content snapshots`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C2/C5 scoped PASS at `6dba8bd`; 48 permanent / 18 independent checks | Real restart/crash, private mode/eviction/quota/WebView persistence, external original update and save-in-flight×tab×recovery/download combination pending (M12). |

### C6: 1 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-019](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1425) セルの数式を計算する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Calculate formulas opt-in, result/error summary and Export values copy; [`src/components/FormulaBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FormulaBar.tsx): raw input; GlideSheet result display | [`src/lib/formula.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/formula.ts): bounded parser/evaluator/dependencies, reference translation/structure rewrite, exportFormulaRows; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): recalculation/history and save snapshot | [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `commits to the original target after a peer $axis $change without changing a neighbor`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C6/C7 post-fix independent review NOT PERFORMED | Native exports/reopen, real canvas/editing, integrated delayed-save cross-product and formula latency/capacity pending; no Excel-all-functions or exact-decimal formula arithmetic claim (M13, M15). |

### C7: 1 features

| ID / subject | UI entry evidence | Processing evidence | Test / command / exit | Source / code SHA | Independent review SHA | Residual acceptance |
|---|---|---|---|---|---|---|
| [UX-020](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1483) 複数人で同時編集する | [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Sharing OFF/status and per-document attachment; [`src/components/SharingPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SharingPanel.tsx): destination consent/create/join/roles/history/leave/stop/delete | [`src/hooks/useCollaboration.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useCollaboration.ts); [`src/lib/collaboration/model.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/collaboration/model.ts) and client.ts; [`server/relay.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/server/relay.ts); [`server/run.mjs`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/server/run.mjs) and serve.ts: optional self-host HTTP transport; expected-revision atomic/history guards | [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `opens a sample as a fresh unshared document and leaves the original room unchanged after edits and refresh`; reported 50-file/646-test run, exit 0; additional cases below | instruction `8204b544`; code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` | C6/C7 post-fix independent review NOT PERFORMED | Loopback TCP is real transport evidence, not separate-device acceptance. Operator TLS proxy, actual native CSP/origin pairing, two devices, durable-save isolation, performance and security review remain pending (M16). |

### C8: integrated acceptance, not a twenty-ninth feature

- Run old regression suite and meaningful new boundary/component/integration cases at the final code SHA; 190 old tests and 16 old documentation cases are historical baselines only.
- Report every command, exit code, fixture, installed-dependency state and exact existing CI run/head SHA. Separate passed, failed, blocked and never run. No workflow edits, deleted tests, skipped checks or assumed install/build success.
- Independent code reviewer must be separate from implementers and this requirements advisor. Review the entire original-publication-to-code diff, then fix findings and re-review the new SHA. Old SHA PASS does not transfer automatically.
- Cross-feature mandatory sets: filter×scope×copy/fill; save-in-flight×tab switch×checkpoint×recovery; formula×sort/structure×Undo; collaboration×viewer/revocation/disconnect×normal save.
- Deliver Draft PR stacked on `bot/20261005-004-excel-like-ux`, code SHA, 28-row traceability, full initial/re-review reports, command/CI evidence, dependency/license/lock/rollback ledger, all unobserved UI/native gates. No merge/release/deploy permission is implied.
- Keep source/unit/component/loopback transport evidence separate from actual canvas, IME, OS clipboard, native closing/saving, screen reader, 640px/200% and performance evidence. A C is not done merely because code exists.

## Shared integration ownership and invariants

- One integration owner serially owns App, GlideSheet, useSheet and useFile. Parallel workers may own independent helpers/tests only. Cross-feature decisions belong in design documentation, not conflicting shared-file edits.
- Raw cell strings are authoritative and must not be silently coerced or replaced by calculated values. Data edits produce explicit new state; preserve immutable snapshots.
- Stable source identity/indices and visible row mapping are distinct. Freeze/filter/view state must never turn visible position into an unintended write address.
- Async save/preview snapshots contain document ID, rows, all serialization settings and version/revision. Revalidate before apply/close; late completion cannot update another document or erase newer edits.
- View and optional extension state are separate from CSV/TSV values. Formula/recovery/sharing opt-in and deletion/privacy policies apply to each document and storage lifetime.

## Highest-risk shared integration contracts

1. **Identity and coordinate domains (C1→C7).** Fix `documentId`, content revision, structural revision, source row/column identity and visible-order mapping before integration. Display index must never become write identity. Stable collaborative row/column IDs cannot be bolted onto positional array replacement later without explicit mapping. Every bulk operation resolves a fixed source-cell target; filtered rows stay unchanged except explicit whole-table sort/search. Hidden-row mapping was already correct at the oracle and must not be “fixed” as a supposed existing defect.
2. **Atomic guarded mutation (C1/C3/C4/C5/C6/C7).** Copy, paste, fill, replace, cleanup, sort and validation need a shared atomic apply/Undo boundary. A preview carries document ID plus data/structure revision and targets; a tab or structural/data change invalidates it. No partial rejected paste, no stale preview applied to a new tab, no command-route bypass of disabled operations. A local Undo must not silently erase unrelated remote edits: specify collaborative undo semantics and test two participants.
3. **Raw model versus derivations (C1/C4/C6).** Persisted raw strings remain authoritative; view/filter/header/freeze settings and formula results are separate derived state. Merely navigating to a virtual cell creates no data/dirty state. Formula reference behavior after row/column insert/delete/move/sort must be designed explicitly, including absolute-reference interpretation; do not let a positional cache silently change dependencies. Exporting calculated values must not falsely imply that the raw formula document was durably saved in recoverable form.
4. **Save lifecycle (C2/C5/C6/C7).** Capture document ID, raw rows, serialization settings, export mode and revision at save start. Completion updates only that captured document/snapshot; newer edits stay dirty. Durable native success, initiated download, cancel, failure and busy are different results. Close consumes the result only when it proves the still-current target is safe. Checkpoints include all serialization options, not rows alone. Web downloads never independently clear dirty, close documents or remove recovery snapshots.
5. **Document-local metadata and privacy (C4/C5/C7).** Session state, explicit named presets, validation rules, opt-in recovery content and shared state have distinct lifetimes. Version/capacity/corruption/migration/deletion policies are part of implementation. Filename/path alone is not identity; schema changes and same-name reopen require explicit binding. Named filters can contain data-derived values and therefore must not be silently persisted. CSV never silently contains view/rule/permission/history metadata. Recovery OFF writes no content, and OFF/delete/expiry cannot report success if storage failed.
6. **Input and focus ownership (C3/C4).** A common command definition should drive button/palette/key labels, dispatch, target and disabled reason. Composition blocks semantic Enter/Esc/shortcut actions. Repeated opening requires an invocation token or equivalent focus trigger, not only `open=true`. Close must distinguish return-to-grid from transition-to-another-popup so focus is not stolen. macOS Command+H must stay outside replace dispatch. Component mocks cannot establish OS/canvas delivery or screen-reader success.
7. **Actual collaborative authority (C7).** Separate operation model from network provider. Server/provider verifies authenticated role and room membership for every write, including queued/replayed operations; client-supplied role flags are not authority. Revocation and stop-sharing must reject delayed offline replay, avoid resurrecting deleted membership/state and correctly close streams. Deterministic convergence and conflict recovery require concurrent structural-operation tests, not just sequential cell mirroring. Transport encryption alone does not prove authorization. Default has zero public signaling/STUN/relay endpoints. Participant copies may survive stop/delete and the UI/manual must state this honestly.
8. **No accidental scope inflation or contraction.** Full JSON type preservation, full Markdown-document editing, all Excel functions, hosted deployment, cloud accounts and public signaling are not required. Conversely, real capture replacement, deduplication, top-row freezing, formula calculation and network collaboration cannot be replaced by labels/schema/disabled controls/mock state. If an operation family is deliberately narrowed (for example cleanup subtypes), record the exact operative interpretation and preserve every specified acceptance condition.

## Highest-value adversarial combined fixtures

- A filtered document with source rows 1/2/4, commas/quotes/empty cells and long numeric IDs: self-copy, ambiguous external paste, reverse fill, range search, exact replacement, reject-validation and one Undo each; hidden rows and neighbors remain unchanged.
- A native save begins in document A; switch to B, edit A again, change export settings, then finish/cancel/fail save and request tab/window close. Confirm notification target, checkpoint, dirty and recovery are all for the correct snapshot. Repeat as Web download with no durable-save claim.
- Freeze multiple rows and columns in A, filter out a frozen source row, switch A→B→A, then load a named view with a changed column schema. No hidden content reappears, state leaks or automatic preset misapplication.
- Select B2:B50, start exact-A search, navigate matches and open the command finder. Insert/delete a column before applying a replacement/sort/cleanup preview. Stale scopes and previews must be rejected or explicitly rebuilt.
- Formula chains with absolute/range references, cycle, invalid function and division by zero; perform sort, row/column edits and Undo/Redo while an async formula/value save is in flight. Check raw values and computed results separately after reopening each export.
- Two real transport clients: edit the same cell, concurrently insert/delete/move structure, reorder/duplicate messages, disconnect/reconnect, undo a local change, change an editor to viewer/revoke membership, and replay queued writes. Confirm convergence, recoverable conflicts and server refusal; then stop sharing and verify no further propagation.
- Recovery enabled: quota full, malformed/old schema, interrupted snapshot write, expired draft, externally changed original. Editing continues, last complete snapshot is distinguishable, isolated recovery never overwrites original, and explicit/off/delete paths remove only intended data.

## Withdrawn diagnoses and non-regressions

Do not reintroduce claims that filtered fill originally wrote hidden rows, jump navigation originally allocated data, modal focus/Toast live/grid accessibility DOM/column freeze/toolbar wrapping/BOM export were absent, or an unobserved ~600px product layout was broken. Preserve oracle fixes for uncommitted-edit commit and IME guards, document-ID save snapshots, native all-tab close guards, visible/source mapping, filtered paste all-or-nothing rejection, exact noncontiguous header selection, tooltip/dialog handling and total search count versus navigation cap.

## Complete per-ID acceptance conditions

Each section has an operative summary incorporating child-plan additions, followed by every original proposal acceptance bullet. The last historic “not implemented/separate approval” bullets under UX-019/020 are preserved as historical source text only and are superseded by C6/C7; their functional requirements are mandatory. C3 likewise strengthens UX-007's conditional capture-mode wording into an implemented mode. Old independent adoption alternatives describe separation of features, not permission to omit adopted IDs.

### C1 / UX-008 — コピーした表を同じ形で貼り戻す

Source: [proposal.md line 86](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L86).

Required UI-to-processing route: Copy/paste routes and ambiguous external-format preview.

Operative acceptance and child-plan additions: Preserve self-copy provenance and rectangular dimensions; allow explicit external TSV/CSV/single-column interpretation and usable HTML. Test one-cell quotes, comma-containing 2×1, trailing blank rows, empty cells/columns, tabs/newlines; keyboard and context routes separately. Neighbor cells unchanged; one Undo; reject filtered paste atomically when visible destinations are insufficient.

Original proposal acceptance conditions (complete):

1. 1×1引用符、2×1comma、末尾空行、空cell、tab/newline/空列がcopy→pasteで一致
2. 自copyと外部CSV/TSV/HTML、keyboard/context routeをそれぞれ検査
3. 隣接既存cellを想定外に変えず、一括Undoできる
4. filtered pasteのvisible destination不足時は既存の全体拒否を維持

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Copy/context Paste and Paste format dialog; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): keyboard copy/paste capture → [`src/lib/clipboard.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/clipboard.ts): createClipboardSnapshot, resolveClipboardText; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): clipboardContextValid, pasteGrid; [`src/lib/gridOperations.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/gridOperations.ts): pasteIntoView.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `keeps self-copy one column through %s paste and one Undo`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `preserves multiline, quotes and a trailing blank self-copied row`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `previews ambiguous external text, cancels without edits, then explicitly applies CSV atomically`
- [`src/tests/dualEditionData.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/dualEditionData.test.ts) — `rejects the complete paste at a missing/virtual target or beyond the visible end`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `keyboard paste should use the same top-left destination as context paste`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `non-text clipboard payload must not erase an existing value`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `explicit empty plain text clears one cell and remains one-step undoable`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `plain text retains priority when HTML is also available`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `available HTML-only table paste should not be treated as an empty cell`
- [`src/tests/clipboardHtml.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/clipboardHtml.test.ts) — `expands rowspans and colspans with text only in their top-left cell`
- [`src/tests/clipboardHtml.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/clipboardHtml.test.ts) — `removes executable embedded content without inserting clipboard markup into the page`
- [`src/tests/clipboardHtml.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/clipboardHtml.test.ts) — `rejects span or final rectangular output exceeding 500,000 cells`

F01/F05 corrections add a normalized shared paste origin, supported-type checks, plain-text priority and bounded HTML-table parsing (`src/lib/clipboard.ts: clipboardHtmlRows`) without inserting clipboard markup into the page. Image/non-text absence no longer means intentional empty text. The HTML-only App case checks atomic Undo; helper cases cover raw strings, blank/trailing rows, spans, executable embedded content and allocation caps. Real OS clipboard permission/interoperability remains M01.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R02 a context text paste uses the already acquired ClipboardItem snapshot`

R02 consumes the acquired ClipboardItem text blob instead of making a second OS clipboard read; the regression asserts readText is not called and the original snapshot/protected neighbor is preserved.

Evidence against original acceptance numbers: 1, 3: production App tests cover self-copy shape, quotes/newlines/trailing blanks, protected neighbors and atomic Undo; clipboard unit cases extend empty/tab handling. 2: keyboard/context text routes and explicit CSV/TSV choices are covered synthetically; the corrected candidate also adds bounded HTML-only table parsing and explicit non-text/empty-plain distinction, with cases below. 4: production paste helper rejects the complete filtered operation when targets are insufficient.

Residual: Bounded HTML/plain/non-text paste has correction tests; real OS clipboard, permission prompts and cross-application round trips remain pending (M01). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C1 / UX-013 — フィルで元のセルを変えない

Source: [proposal.md line 145](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L145).

Required UI-to-processing route: Explicit drag-series versus Ctrl+D/R copy.

Operative acceptance and child-plan additions: Seed stays immutable: 1,2→1,2,3,4,5; Ctrl+D 10→10,10,10 and Ctrl+R copies. Define upward/leftward/multicolumn/text/date/blank behavior. Preserve 00123, >2^53 and decimals; preview ambiguous suffix/date inference. Read filtered visible order, write mapped source rows, never hidden rows, one Undo.

Original proposal acceptance conditions (complete):

1. 1,2→A5が1,2,3,4,5でseed不変
2. Ctrl+Dの10は10,10,10、Ctrl+Rもコピー
3. 上/左/複数列/文字列/日付/空値の方針が明示される
4. filter中は表示順で読み、元行へ正しく書き、hidden rowを変えず単一Undoを維持する
5. 00123/2^53超/小数/数字suffix/日付風textについてコピーと連番のモードを明示し、元値を守る
6. 曖昧な型推定は事前表示し、意図しない先頭0消失や桁丸めを避け、まとめて1Undo

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Fill Copy/Preview series selector and apply preview; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): drag fill and Ctrl+D/R → [`src/lib/autofill.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/autofill.ts): buildFillUpdates/fillSeries; [`src/lib/decimal.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/decimal.ts): exact decimal series; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): applyUpdates/previewUpdates.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/GlideSheet.inputSafety.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.inputSafety.test.tsx) — `previews only 3,4,5 when Glide supplies a destination containing seeds 1,2`
- [`src/tests/GlideSheet.inputSafety.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.inputSafety.test.tsx) — `maps visible fill coordinates once and never includes hidden source rows`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `captures Ctrl+%s as copy fill even when series mode is selected`
- [`src/tests/autofill.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/autofill.test.ts) — `fills backward and horizontally without replacing the source rectangle`
- [`src/tests/autofill.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/autofill.test.ts) — `retains leading zero width, grouping and meaningful decimal padding`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/autofill.bounds.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/autofill.bounds.test.ts) — `rejects an oversized destination before materializing seeds or changes`
- [`src/tests/autofill.bounds.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/autofill.bounds.test.ts) — `rejects an oversized seed even with a small destination`

The follow-on bulk-fill ceiling is now tested before allocating source seeds or destination changes. This bounds unsafe requests but does not establish real-device responsiveness or replace the pending actual filtered-drag/Undo case.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R03 a bulk-fill limit rejection explains why nothing was changed`

Supplemental input regression verifies the visible Fill limit explanation, unchanged source/dirty/history and no partial operation for a request above the bound.

Evidence against original acceptance numbers: 1–2: production wrapper/App tests pin seed exclusion and copy shortcuts. 3, 5: helper tests cover reverse/horizontal/multiple columns, empty/text/date-like strings, padded IDs, large integers and exact decimals. 4: wrapper tests inspect one source-mapped transaction; App copy-fill tests verify one Undo. 6: actual preview callback and atomic App mutation are exercised, but real drag gestures and interpretation/readability of the preview are unobserved.

Residual: Real canvas drag in all directions, OS shortcut dispatch and IME are pending; combined filtered series-preview plus Undo merits a dedicated App scenario (M02). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C1 / UX-014 — 見えるセルと編集対象を一致させる

Source: [proposal.md line 208](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L208).

Required UI-to-processing route: Grid, name-box, keyboard, selection, context/edit targets.

Operative acceptance and child-plan additions: A100/Z1 mean the same cell from all entrances in a 1×1 document. Explain out-of-range rejection rather than silently clamp to another address. Navigation/range selection alone never change rows/dirty. Virtual empties stay distinct from stored cells; no preallocated 100000×702 matrix. Test distant empty/nonempty edit, empty document, all-filtered document, and mapped rows.

Original proposal acceptance conditions (complete):

1. 1×1でA100/Z1のclick/namebox/keyboard/編集対象が一致
2. 上限超過は説明つき拒否、別番地へ黙って丸めない
3. 遠方1cell編集で不要な巨大データ生成がないか検査
4. filtered source行対応と空表/全行filterの既存回帰を維持
5. A100/A100:B101/Z1への移動・範囲選択だけではrows/dirtyを変えない
6. 実値のあるcellとvirtual emptyを分離し、100000×702の配列を事前実体化しない
7. 名前boxとclickで同じ対象へ空入力/編集できるか合成と実GUIを別に検査

Implementation candidate: [`src/components/FormulaBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FormulaBar.tsx): name box; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): controlled selection/click/edit; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): handleJump → [`src/types/sheet.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/types/sheet.ts): MAX_GRID limits; [`src/lib/cellref.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/cellref.ts): parseCellRef; [`src/hooks/useSheet.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useSheet.ts): on-edit row growth; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): commitCell/editCell.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/GlideSheet.inputSafety.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.inputSafety.test.tsx) — `keeps controlled $address, clicked selection and edit coordinates equal in a 1x1 sheet`
- [`src/tests/GlideSheet.inputSafety.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.inputSafety.test.tsx) — `selects virtual A100:B101 without materializing any cells`
- [`src/tests/GlideSheet.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.test.tsx) — `limits filtered rows to the view and refuses to edit virtual rows`
- [`src/tests/editors.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/editors.test.tsx) — `restores an invalid reference and visibly marks it invalid`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `formula-bar navigation cannot create a column beyond the grid ceiling`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `formula navigation preserves valid bounds without editing at %s with %s`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `clicking a frozen reference resets stale whole-column selection before Copy`

F04/F06 correction tests cover both navigation ceilings, rejection without invisible writes/dirty/history changes, and clearing stale exact header axes when selecting a frozen reference. Reversed paste and keyboard-menu target cases add cross-entry target evidence. Actual pointer/canvas behavior and far-cell memory remain pending.

Evidence against original acceptance numbers: 1, 5, 7: wrapper callbacks at A100/Z1 and A100:B101 establish coordinate/no-write contracts, not real canvas navigation; editor tests separately exercise invalid name-box feedback. 2: parser/grid limits and visible rejection are source evidence; new FormulaBar upper/lower ceiling tests add integration evidence; exhaustive all-entry callback combinations and actual GUI remain pending. 3, 6: row growth is on editing only; wrapper selection does not materialize cells, but far-corner allocation/latency is unmeasured. 4: existing filtered mapping and virtual-target tests remain present; empty/all-filtered real-screen behavior is pending.

Residual: Real grid/name-box/keyboard equivalence, upper-limit rejection, far-cell memory/latency and empty/all-filtered rendering pending (M03, M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C1 / UX-015 — 大きな番号を正しい順序で並べる

Source: [proposal.md line 269](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L269).

Required UI-to-processing route: Sort comparison choice and explanation.

Operative acceptance and child-plan additions: Expose automatic/text/numeric comparison with an exact or explicit safe fallback for high-precision values. Adjacent >2^53 integers sort correctly without rewriting strings. Cover leading zeros, comma grouping, negatives, decimals, blanks, Japanese, and Undo. Fixtures must use header OFF or a real header plus data rows.

Original proposal acceptance conditions (complete):

1. 2^53近辺の隣接整数が正しく並ぶ
2. 先頭0/カンマ/負数/小数/空/日本語を列型方針別に検査
3. sortでセル文字列は変わらずUndo可能
4. 合成再現はheader OFF、または見出し付き3行で比較する

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): detailed Sort mode selectors and existing column quick sort → [`src/lib/sort.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/sort.ts): sortRows/sortRowsByKeys; [`src/lib/decimal.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/decimal.ts): parseExactDecimal/compareExactDecimals.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `orders adjacent long integers exactly without changing raw cell strings`
- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `compares signs, decimals, correctly grouped numbers and zero-padded values exactly`
- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `makes text mode lexical and numeric mode exact with invalid text last`


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 sorting preserves an untouched invalid value while moving the complete row`

R1 provides a production-App quick-sort and Undo case with an existing invalid cell. Validation follows original row identity so moving an unchanged violation does not falsely reject sorting. Advanced-sort whole-workflow Undo remains a separate boundary.

Evidence against original acceptance numbers: 1–2: exact comparator tests cover adjacent >2^53 integers, leading zeros, commas, signs, decimals, blanks and Japanese fallback. 3: helpers clone complete raw rows; App records history before applying sort, but the new quick-sort/validation case verifies one Undo; dedicated advanced-sort Undo evidence remains missing. 4: cited numeric fixtures are headerless; the suite separately tests explicit headers.

Residual: Detailed sort UI, Undo and stale-preview end-to-end cases pending; large-table comparator cost unmeasured (M04, M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C2 / UX-003 — 保存結果に対象ファイルを必ず添える

Source: [proposal.md line 326](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L326).

Required UI-to-processing route: Document-addressed save status and result navigation.

Operative acceptance and child-plan additions: Every success/failure/cancel/duplicate request identifies snapshot document and operation; A saving while B active still reports A. Preserve document-ID metadata updates and dirty edits made during save. Global serial save locking may remain; per-document feedback does not require concurrent writes.

Original proposal acceptance conditions (complete):

1. A保存中にBへ移動しても通知名はA
2. 失敗/取消/重複保存要求がどの対象か分かる
3. 既存の文書ID snapshot保護とdirty保持を回帰させない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): editionNotice/saveNotice and Open target button; [`src/components/Toolbar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/Toolbar.tsx): Save/Save As → [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): performSave captures document/rows/meta; [`src/lib/saveState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/saveState.ts): completedSaveMeta; [`src/hooks/useDocuments.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useDocuments.ts): completeSave.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `keeps completion notice and checkpoint attached to A while B is active and dirty`
- [`src/tests/useFile.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/useFile.test.ts) — `captures document/rows before a deferred Save As dialog and never switches to another same-name tab`
- [`src/tests/useFile.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/useFile.test.ts) — `does not patch metadata on cancellation or failure and retains an actionable notice`
- [`src/tests/useFile.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/useFile.test.ts) — `does not issue a second write while the first is pending`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 must not destroy after a previously saved A receives a late shared update during B write`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 also blocks close when an initially clean document changes during another write`

The save result remains bound to the originating snapshot; the final close decision now checks the complete live workspace after later writes. Tests deliver late changes to an already-saved and an initially clean document. Exact success/operation label cross-product and real native I/O remain pending.

Evidence against original acceptance numbers: 1, 3: deferred synthetic native I/O tests prove originating-document data/checkpoint isolation, dirty B preservation and target navigation. 2: cancellation/failure/busy hook tests exist; explicit assertions that each outcome includes the operation and target label are incomplete. Successful notices identify filename; the operation label is not asserted for every success variant.

Residual: Real native file pickers/writes, same-name target clarity and all outcome labels remain manual/review gates (M05). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C2 / UX-005 — 閉じる前に保存へ進める

Source: [proposal.md line 382](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L382).

Required UI-to-processing route: Save-and-close / discard / return for tab and all-window close.

Operative acceptance and child-plan additions: Show every dirty document. Cancellation or failure never closes or loses edits. Repeated window/tab close while saving or composing is guarded. Only the matching successful save can satisfy close, and later edits remain protected. Web download initiation neither clears dirty nor closes unconditionally; explicit user acknowledgement is required for closing after export.

Original proposal acceptance conditions (complete):

1. 保存取消/失敗で閉じず、元文書と編集を維持
2. A/B双方dirtyの終了で全対象が明示される
3. window closeは保存中/IME中の繰返し終了を抑え、tab close側も保存して閉じる導入時に対象保存完了との整合を検査する
4. Web download開始だけでdirty解除/無条件closeしない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): tab/window Save before closing dialog; [`src/components/TitleBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/TitleBar.tsx): guarded close → [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): approveWindowClose, saveThenClose, finishClose; [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): explicit SaveOutcome; native onCloseRequested registration.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `keeps the dirty tab and original edits when save-and-close ends with %s`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `lists every dirty document and waits for every direct write before window destruction`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `does not close when the document changes while save-and-close is pending`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `requires explicit confirmation after browser download before removing a dirty tab`
- [`src/tests/App.integration.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.integration.test.tsx) — `blocks OS close during composition and commits a pending draft before asking to discard`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 must not destroy after a previously saved A receives a late shared update during B write`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 also blocks close when an initially clean document changes during another write`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F4 lossy save-and-close leaves an actionable conversion prompt for %s`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `guards browser and native close with a saved offline queue (inactive document: %s), including cancel and save-close`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `guards a locally saved in-flight operation until its real relay acknowledgement arrives`

F1/F4 and FC-04 regression evidence covers whole-workspace final close rechecking, one actionable JSON/YAML/Markdown conversion dialog with cancel/no write, and saved-but-unsent sharing queues across active/inactive tabs and delayed real relay ACK. Native windows/files are still mocked; the post-fix C6/C7 independent review was NOT PERFORMED.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R3 save-and-close accepts native serialization metadata normalization`

R3 compares final close snapshots with actual saved serialization metadata returned by SaveOutcome, including expected normalization, while preserving the prior late-data/settings rejection contract. The synthetic BOM JSON plus second-document write case now permits correct completion.

Evidence against original acceptance numbers: 1–4: production App tests cover cancel/failure, two dirty documents, repeat close while writes await, late edit protection, synthetic IME guard and browser download acknowledgement. Tauri dialogs/window events/destruction are mocked; no actual OS termination or download completion was observed.

Residual: Native titlebar/OS close, repeat close during real IME/save, actual disk failure and browser download completion remain pending (M05). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C2 / UX-006 — 文字コードと読込結果を確かめて開く

Source: [proposal.md line 438](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L438).

Required UI-to-processing route: Import preview from retained original bytes.

Operative acceptance and child-plan additions: Choose UTF-8/Shift_JIS/other supported decoders, distinguish unsupported format/encoding/parse errors, and show uncertainty. Re-decode original bytes on every choice, never already-decoded text. Fixtures: UTF-8, BOM, CP932, EUC-JP, line endings. Cancel changes no document; describe BOM detection/retention and respect existing BOM export. JSON/YAML output stays UTF-8.

Original proposal acceptance conditions (complete):

1. UTF8/BOM/合成CP932/EUC-JPと改行をfixture化
2. 指定を変えると元bytesから再decodeし二重変換しない
3. cancel時は既存文書を変更しない
4. encodingを一意判定できない場合は確度と選択肢を示す
5. BOM付き入力の検出/保持方針を示し、既存BOM書出し選択を尊重する

Implementation candidate: [`src/components/ImportPreview.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ImportPreview.tsx): encoding/delimiter/format/newline choices and original-byte preview; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): importRequest → [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): loadPath/loadBrowserFile; [`src-tauri/src/main.rs`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src-tauri/src/main.rs): read_file_bytes; [`src/lib/importPreview.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/importPreview.ts): previewImport.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/importPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/importPreview.test.ts) — `decodes synthetic %s bytes and CRLF`
- [`src/tests/importPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/importPreview.test.ts) — `preserves the physical UTF-8 BOM as save metadata while parsing BOM JSON`
- [`src/tests/ImportPreview.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/ImportPreview.test.tsx) — `redecodes original CP932 bytes, changes delimiter/newline, and confirms the shown result`
- [`src/tests/ImportPreview.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/ImportPreview.test.tsx) — `cancel and Escape never commit or mutate the caller's existing document`
- [`src/tests/importPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/importPreview.test.ts) — `does not mistake a genuine UTF-8 replacement character for malformed encoding`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F9 older byte reads cannot replace a newer pending import preview`

The corrected browser import generation guard has a regression that resolves an older arrayBuffer after a newer pending preview and checks that the newer filename/preview remains. Native byte reading and real file picker/decoder compatibility remain unobserved.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R3 save-and-close accepts native serialization metadata normalization`

The normalized-save regression uses BOM JSON import and the actual App save/close flow with mocked native I/O; local Rust execution and real file bytes remain unobserved.

Evidence against original acceptance numbers: 1–2, 4–5: helper/component tests execute actual TextDecoder and parser with UTF-8/BOM/CP932/EUC-JP bytes, explicit uncertainty and output policy. 3: component cancellation leaves the callback untouched. App/useFile/native original-byte wiring is present; older browser byte-read supersession now has an App regression, while actual Tauri read_file_bytes still requires native acceptance.

Residual: Older browser byte-read supersession now has App regression evidence; corrected-head native Rust/I/O, real file import/cancel behavior, browser decoder compatibility and memory footprint remain pending (M06, M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C2 / UX-009 — JSON/YAMLの上書き前に変換内容を示す

Source: [proposal.md line 498](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L498).

Required UI-to-processing route: JSON/YAML import notice and lossy-overwrite preview.

Operative acceptance and child-plan additions: Keep string-table semantics; preview numbers/true/null/array/missing/empty string transformations. Prefer Save As; cancellation performs no write. Warn according to actual transformation, not an indiscriminate generic banner. Retain header-only/duplicate-name regressions. Full type-preserving editing is not required and values must never be silently type-inferred.

Original proposal acceptance conditions (complete):

1. 数値/true/null/array/missing/空文字の変換前後が分かる
2. 取消で書込しない、別名保存を選べる
3. 型保持を実装する場合も編集値の型を無言推定しない
4. JSON/YAMLのheader-only/重複列名等の既存回帰検査を保持

Implementation candidate: [`src/components/ImportPreview.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ImportPreview.tsx): conversion impact; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): overwrite-conversion dialog with Save As/Overwrite/Cancel → [`src/lib/conversionPreview.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/conversionPreview.ts): createConversionPreview; [`src/lib/formats.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/formats.ts): production serialization; [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): beforeSave and same-path Save As recheck.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `shows concrete numeric, boolean, null, array, object, missing and empty examples`
- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `inspects YAML types using the same parser and output serializer`
- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `shows output based on the current save snapshot rather than stale imported values`
- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `reports serializer header normalization, preserving duplicate and header-only output`
- [`src/tests/ImportPreview.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/ImportPreview.test.tsx) — `focuses the safer Save As choice and returns each explicit action`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F4 lossy save-and-close leaves an actionable conversion prompt for %s`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F8 conversion preview warns before empty-object records are removed`

F4 now exercises the actual App JSON/YAML conversion overlay during save-and-close, checking a single actionable dialog, cancel, no write and no destruction. F8 adds an exact empty-object-row loss warning for [{},{}]→[]. This supplies previously missing integrated cancellation/overlay evidence; same-path Save As and actual disk bytes remain separate gates.

Evidence against original acceptance numbers: 1, 4: production conversion/serializer tests cover types, missing keys, omit rules, duplicate/header-only output and all-string no-warning. 2: reusable ConversionPreviewDialog has cancel/Save As tests, while the new F4 App regression separately proves save-and-close conversion overlay/cancellation/no-write for JSON/YAML. Same-path picker handling and every overwrite route remain distinct checks. 3: full typed editing is deliberately absent; raw strings remain authoritative.

Residual: App save-close conversion cancellation/no-write now has regression evidence; Save As-to-original-path and fresh-after-edit overwrite combinations, native confirmation/actual disk output remain pending (M06). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C2 / UX-010 — Markdownは表だけを保存すると伝える

Source: [proposal.md line 555](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L555).

Required UI-to-processing route: Markdown table-only import/export warning.

Operative acceptance and child-plan additions: Preview loss of surrounding prose, subsequent tables and alignment; distinguish same-name overwrite from separate table export. Prefer Save As, cancel performs no write, and reduce unnecessary warnings for pure tables. Full document-preserving Markdown editing is not required.

Original proposal acceptance conditions (complete):

1. 前後本文/複数表/alignmentの合成fixtureで出力範囲を明示
2. 純粋な表だけの場合は不必要な警告を減らす
3. 同名上書きと別名書出しで対象・影響が分かる
4. cancel時は元ファイルに書かない

Implementation candidate: [`src/components/ImportPreview.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ImportPreview.tsx): Markdown conversion impact; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): overwrite-conversion confirmation → [`src/lib/conversionPreview.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/conversionPreview.ts): Markdown loss analysis; [`src/lib/formats.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/formats.ts): parseMarkdownTable/serializer; [`src/hooks/useFile.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFile.ts): beforeSave.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `reports body, subsequent tables and alignment with actual before/after examples`
- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `does not warn on a pure table without alignment metadata`
- [`src/tests/conversionPreview.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/conversionPreview.test.ts) — `explains contiguous additional tables as flattening rather than falsely claiming omission`
- [`src/tests/ImportPreview.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/ImportPreview.test.tsx) — `treats Escape as cancellation and does not act on an IME confirmation`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F4 lossy save-and-close leaves an actionable conversion prompt for %s`

The Markdown parameter of F4 now exercises the actual App conversion overlay during save-and-close, cancellation/no write/no destruction and return to the close decision. Native same-path Save As, actual output/reopen and full destination parity remain pending.

Evidence against original acceptance numbers: 1–2: exact parser/serializer-backed loss examples include surrounding prose, later tables, alignment and pure-table warning suppression. 3–4: the new F4 Markdown App case proves the conversion overlay and cancellation/no-write using synthetic native I/O. The isolated dialog test alone would not establish this path; actual native writes and same-path/different-destination output acceptance remain open.

Residual: App Markdown save-close conversion cancel/no-write has regression evidence; same-path Save As, actual native bytes and reopen remain pending (M06). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C2 / UX-012 — 保存地点へ戻ったことを区別する

Source: [proposal.md line 617](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L617).

Required UI-to-processing route: Document-local durable saved checkpoint.

Operative acceptance and child-plan additions: After direct save→edit→Undo, clean only when rows AND all serialization settings match the saved snapshot. Cover save-in-flight edits, Undo/Redo, history truncation and settings-only differences. A Web download is not a durable checkpoint. Do not replace existing async snapshot safeguards.

Original proposal acceptance conditions (complete):

1. 直接保存→編集→Undoでrowsと全保存設定一致時のみclean
2. 保存中の新編集とUndo/Redoを混同しない
3. download開始だけをdurable checkpointにしない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): dirty tab/status and Undo/Redo routes → [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): checkpointsRef, onSaved and sameSaveContent effect; [`src/lib/saveState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/saveState.ts): full serialization-setting comparison.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `returns to a direct-save checkpoint only when data and serialization settings match`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `never treats a browser download or Undo back to it as a durable checkpoint`
- [`src/tests/dualEditionData.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/dualEditionData.test.ts) — `marks only an unchanged snapshot clean, retaining edits and settings made during a write`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F1 must not destroy after a previously saved A receives a late shared update during B write`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `guards a locally saved in-flight operation until its real relay acknowledgement arrives`

A later remote edit cannot reuse an old clean checkpoint to satisfy whole-window close. Local durable save is now tested separately from outstanding sharing acknowledgement. History-cap/checkpoint comparison and every serialization-setting combination remain additional checks.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R3 save-and-close accepts native serialization metadata normalization`

R3 records actual serialized metadata separately from the captured input snapshot for final close comparison. Expected format/encoding normalization no longer creates a false mismatch; this does not weaken guards against later user changes.

Evidence against original acceptance numbers: 1: App tests cover direct save/edit/Undo/Redo and settings-only mismatch. 2: snapshot tests and deferred-save App cases protect later edits and inactive documents. 3: browser download cannot create a durable checkpoint. History-cap truncation combined with checkpoint return is not specifically evidenced.

Residual: Actual filesystem persistence/close remains pending; history truncation and full setting cross-product merit additional synthetic coverage (M05). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C3 / UX-002 — 検索を呼ぶたび入力欄へ戻す

Source: [proposal.md line 674](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L674).

Required UI-to-processing route: Repeated Find/Replace invocation and focus return.

Operative acceptance and child-plan additions: Initial, reopened and already-open invocations move to the defined input every time. Uncommitted cell edits and IME composition survive. Escape has a defined return target. Keep this focus contract consistent with OS-specific keys, independent of mere shortcut-label changes.

Original proposal acceptance conditions (complete):

1. 開閉前後と既に開いた状態のCtrl/Cmd+F/Hで狙った入力欄へ移る
2. セル未確定編集とIME変換を失わない
3. Escで閉じた後のfocus先が明確
4. UX-025のOS別キー方針と組み合わせても、検索入力への復帰契約が変わらない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Find/Replace commands and searchFocusNonce; [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): focus/select and IME guard → [`src/lib/commands.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/commands.ts): shared dispatch; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): finishPendingEdit/openSearch and focusCell on close.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `refocuses and selects the query on repeated Ctrl+%s without consuming composition Enter/Escape`
- [`src/tests/SearchPanel.ime.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/SearchPanel.ime.test.tsx) — `does not navigate or close search while Enter/Escape belongs to composition`
- [`src/tests/editors.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/editors.test.tsx) — `does not navigate or permit saving during composition; a later commit uses the latest draft`

Evidence against original acceptance numbers: 1–2: repeated Ctrl+F/H and synthetic composition retain input and target in production App/component tests. 3: App sets focusCell to the current source selection on close, but the mocked canvas cannot prove actual focus restoration. 4: shortcut mapping is shared in source; explicit macOS repeated-open integration remains pending.

Residual: Actual Windows/macOS key delivery, real Japanese IME and canvas return focus pending (M07, M09). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C3 / UX-007 — 正規表現の置換ルールを明示する

Source: [proposal.md line 731](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L731).

Required UI-to-processing route: Literal/capture replacement modes and preview.

Operative acceptance and child-plan additions: Literal remains default and preserves $1/newlines. Child plan requires explicit capture mode; define $1/$2/$$/missing groups and explain JavaScript regex rather than promise RE2 compatibility. Current replacement, all-replacement preview and actual bulk update use identical rules and one Undo.

Original proposal acceptance conditions (complete):

1. literalモードで$1と改行文字列をそのまま入れられる
2. 参照モードを追加するなら$1/$2/存在しない群/$$を定義
3. 全置換previewとUndoが同じ置換規則を使う

Implementation candidate: [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): Capture references option and rule text; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): replace preview → [`src/lib/search.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/search.ts): replaceSearchValue; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): replaceCurrent/replaceAll and snapshot guard.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `uses the same replacement rules in preview and mutation with capture references %s`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `literal replacement preserves a pasted newline`

F07 changes Replacement to a textarea and tests literal LF through the real React input and single replacement. This closes the previous single-line control gap. LF/CRLF platform input normalization, multiline capture/all-replacement parity and actual IME remain manual/additional test boundaries.

Evidence against original acceptance numbers: 1–3: production App parameterized cases distinguish literal $2-$1-$$-$3 from capture expansion b-a-$-$3, verify preview/result identity and one Undo. Literal replacement is default. The corrected textarea plus an App single-replacement case now preserve a literal newline; exhaustive current/all and CRLF/capture parity remain unasserted.

Residual: Literal multiline input and each replacement entry need real-editor/manual verification; JavaScript regex behavior is documented, not RE2 equivalence (M07). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C3 / UX-011 — 検索エラーと一致なしを分ける

Source: [proposal.md line 785](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L785).

Required UI-to-processing route: Inline search diagnostics and replace availability.

Operative acceptance and child-plan additions: Distinguish empty query, valid zero matches, invalid regex, too-long query and empty scope. Literal [ is valid; regex [ gives an error. Preserve entered text and explain 2000/2001 UTF-16-unit boundary. Corrected input clears errors; disabled replace and messages agree. Preserve existing total-match versus 5000-navigation-cap distinction.

Original proposal acceptance conditions (complete):

1. [はregexエラー、literalモードでは通常検索
2. 空queryは未入力、正常不一致は0件
3. 2000/2001文字境界を説明し入力を保持
4. 修正後はerrorが消え、replace disabled状態と通知が一致

Implementation candidate: [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): query aria-invalid, error/empty/zero-match state and disabled replace → [`src/lib/search.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/search.ts): compileSearch and collectSearchMatches; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): compiledSearch/result wiring.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `distinguishes literal bracket hits, invalid regex, no matches and the 2000/2001 query boundary`
- [`src/tests/search.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/search.test.ts) — `counts every matching cell after the navigation limit without retaining unbounded coordinates`

Evidence against original acceptance numbers: 1, 3–4: App tests establish bracket literal/regex distinction, 2000/2001 UTF-16-unit guard, preserved input, corrected error state and replacement availability. 2: compileSearch returns an empty matcher without error for empty query; dedicated empty-input announcement assertions remain incomplete.

Residual: Screen-reader error/zero-target announcements, typing behavior and expensive valid regex performance remain pending (M07, M14–M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C3 / UX-023 — 選択範囲だけで検索・置換する

Source: [proposal.md line 841](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L841).

Required UI-to-processing route: Whole table / visible rows / frozen selected-cell scope; whole-cell match.

Operative acceptance and child-plan additions: Freeze source cell set at search start; next-result navigation never moves/shrinks scope. Filtered selection excludes hidden rows; whole-table mode explicitly includes them. B2:B50 exact A excludes neighbors, AA and A+newline. Case/regex/literal matching is shared across search/current/all replace. Replace all exceeds 5000 results and is one Undo. Tab/structural changes invalidate stale snapshots.

Original proposal acceptance conditions (complete):

1. B2:B50を選んで完全一致Aを置換しても、隣列・範囲外・AA・末尾改行つきAは変わらない
2. 検索の次候補へ移動しても開始時の対象範囲が縮んだり移動したりしない
3. filter中の選択scopeは非表示行を除外し、全表へ切替える場合は含まれることを表示する
4. 対象なし・一致なし・無効regexを区別し、空queryは従来どおり置換を開始しない
5. literal/regexとcase設定を組み合わせてもセル全体の一致判定が検索と置換で同じになる
6. 全置換は総対象を処理し5000件の移動上限に引きずられず、1回のUndoで戻る
7. 別タブ・行列挿入削除で古いsnapshotの範囲を黙って使わず、対象を再設定できる

Implementation candidate: [`src/components/SearchPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SearchPanel.tsx): sheet/visible/selection scope and Whole cell; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): scope label and replace preview → [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): changeSearchScope/inSearchScope/invalidateSearchScope/replaceAll; [`src/lib/search.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/search.ts): whole-cell matcher and navigation cap.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `freezes the exact whole-cell scope across next-hit navigation and invalidates it after a structure change`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `previews and replaces all 5003 matching cells beyond the navigation cap and restores them with one Undo`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `keeps hidden rows out of visible replacement and includes them only with explicit all-sheet scope`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `rejects a replace-all preview after switching documents`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `refuses an old replace-all preview after cells change in the same document`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `an all-sheet search cannot simultaneously claim visible-only scope`

F08 makes the always-visible scope explanation follow the effective scope, and the regression checks that filtered All cells does not retain the visible-only claim. The B2:B50 terminal-newline/full option cross-product remains a separate gap.

Evidence against original acceptance numbers: 1–2: smaller B2:B4 analogue proves exact column/range scope and next-hit stability; exact B2:B50/terminal-newline fixture is not separately present. 3: visible versus all-sheet hidden-row inclusion is tested. 4: invalid regex/no-match/invalidated selection are covered across App tests; empty-scope messaging needs focused checking. 5: common matcher source supports case/regex/whole-cell combinations; exhaustive combination tests are absent. 6–7: 5003 replacements use one Undo; tab/structure/data changes invalidate previews.

Residual: B2:B50 terminal-newline and full option matrix, real keyboard selection and large-table timing pending (M07, M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C3 / UX-025 — 端末に合うショートカットを表示する

Source: [proposal.md line 904](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L904).

Required UI-to-processing route: Platform-specific shared key definitions, tooltips, help, handlers.

Operative acceptance and child-plan additions: Save/Save As/Find/Replace/Undo/Redo labels and real dispatch agree. Do not intercept macOS Command+H for replacement. Offer Windows/Mac help switching and button alternatives for reserved/unavailable keys. Protect text inputs and IME. Actual OS/keyboard-layout/native behavior remains a separate manual gate.

Original proposal acceptance conditions (complete):

1. 保存・別名保存・検索・置換・Undo/Redoの表示と実handlerが対象platformで一致する
2. MacでCommand+Hを置換として要求せず、採用する置換キーは実機で確認する
3. 入力欄・IME・OS予約キーを妨げず、キーが使えない環境でも同じ操作へbuttonで到達できる
4. helpでWindows/Macの表示を切替えて確認でき、tooltipと相反する説明を出さない
5. UX-002を未採用でも割当/表記を整えられ、再focusの修正済みとは主張しない

Implementation candidate: [`src/components/Toolbar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/Toolbar.tsx): shortcut tooltips; [`src/components/HelpModal.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/HelpModal.tsx): Windows/Linux/macOS selector; command search labels → [`src/lib/commands.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/commands.ts): currentPlatform/shortcutLabel/shortcutCommand; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): handleKeyDown.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/dualEditionUi.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/dualEditionUi.test.tsx) — `uses Download/Download as for browser and presents a keyboard-focus tooltip`
- [`src/tests/App.adoptedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.adoptedUx.test.tsx) — `refocuses and selects the query on repeated Ctrl+%s without consuming composition Enter/Escape`

Evidence against original acceptance numbers: 1: shared source defines Save/Save As/Find/Replace/Undo/Redo; existing tests cover some Ctrl routes and tooltip presence, not the full platform matrix. 2: source explicitly excludes bare Command+H. 3: App guards input/IME and retains buttons, with related synthetic IME tests. 4: Help platform selector is source-present; focused selector/tooltip parity tests are absent. 5: platform mapping and repeated-focus mechanisms are separate source paths; the historical independent-adoption statement does not remove either adopted feature.

Residual: No dedicated commands/platform test suite at this inventory; real Windows/macOS/Linux layouts and OS reservation behavior pending (M09). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C3 / UX-026 — 操作名で探せるコマンド検索を用意する

Source: [proposal.md line 962](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L962).

Required UI-to-processing route: Always-reachable local command finder.

Operative acceptance and child-plan additions: Button plus keyboard entrance; aliases such as 列幅 and 幅を自動調整 reach the same dispatcher as existing controls. Show document/column target and disabled reason; never bypass filtered structural guards, delete confirmations or save semantics. Arrow/Enter select, Esc executes nothing and restores origin, IME Enter never runs commands. No network/telemetry. Verify 640px and 200% separately.

Original proposal acceptance conditions (complete):

1. 640px・拡大時も入口が隠れず、keyboardだけで開く/検索/選択/取消ができる
2. 「列幅」「幅を自動調整」等の決めたaliasで既存の同じ操作に到達する
3. 候補には対象文書/列と無効理由が示され、filterで禁止中の構造操作を迂回できない
4. Escで何も実行せず呼出し元へ戻り、IMEのEnterでコマンドを誤実行しない
5. 削除は既存確認へ、保存は既存保存契約へ進み、shortcut/button経路と結果が同じ
6. ローカル文字列検索だけで機能し、セル値・検索語・履歴を外部送信しない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Commands button / Ctrl-or-Command+Shift+P; [`src/components/CommandSearch.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/CommandSearch.tsx): query/list/targets/disabled reasons → [`src/lib/commands.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/commands.ts): dispatchCommand; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): shared command registry; [`src/components/FeatureDialog.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FeatureDialog.tsx): focus lifecycle.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- No dedicated automated test for this feature was found. Related common dialog/toolbar tests must not be counted as full feature coverage.

Evidence against original acceptance numbers: 1: bounded/wrapping feature bar and dialog keyboard handling are source evidence only, not 640px/zoom acceptance. 2–3: local aliases/targets/disabled reasons and shared dispatch guard exist; no dedicated alias/disabled-bypass integration assertions were found. 4: CommandSearch composition guard and FeatureDialog cancellation/focus are source-present. 5: registry calls the same save/delete handlers as toolbar/shortcuts; end-to-end palette parity is untested. 6: query filtering is local string matching with no network call in this component; this is scoped source evidence, not a whole-product traffic audit.

Residual: Dedicated command-search alias/disabled/confirmation/IME/Escape tests and actual narrow-screen/assistive acceptance remain pending (M09, M14); keyboard-menu target corrections are separate evidence. All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-001 — タブを戻ったときに絞込みを保つ

Source: [proposal.md line 1025](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1025).

Required UI-to-processing route: Document-local live filter state and clear action.

Operative acceptance and child-plan additions: A→B→A restores multiple column conditions plus counts. Clear affects only A; rows/dirty/CSV unchanged. Closing A never leaks its conditions into another document. Existing widths/selection/history preservation is retained; this is distinct from explicitly named presets.

Original proposal acceptance conditions (complete):

1. A→B→Aで列別複数条件と件数が復元される
2. filter解除はその文書だけ、データ/dirty/CSV出力は変わらない
3. 閉じた文書の条件を別文書へ再利用しない

Implementation candidate: [`src/components/TabBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/TabBar.tsx): A→B→A; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): filter bar and Clear filters → [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): viewStatesRef/applyDocument; [`src/lib/viewState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/viewState.ts): DocumentView; [`src/hooks/useFilter.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFilter.ts): restore/clearAll.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `isolates header meaning, filter and independent row/column freezes without dirtying data`
- [`src/tests/useFilter.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/useFilter.test.ts) — `applies AND across columns`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `saves, reapplies and isolates explicit presets without mutating rows or leaking to same-name reopened documents`

Evidence against original acceptance numbers: 1: App tests restore a live filter after tab round-trip, and helper tests combine columns; a single App test combining multiple column conditions/counts is missing. 2: App test clears A and checks unchanged rows/clean state. 3: fresh document identities and view map source prevent filename binding; named-view reopen tests are adjacent evidence, not a dedicated close/reopen live-filter test.

Residual: Multiple-filter counts and closed/same-name live-state reset need explicit integrated/manual checking; actual tab/canvas state pending (M08). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-004 — 先頭行の意味をファイルごとに選ぶ

Source: [proposal.md line 1080](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1080).

Required UI-to-processing route: Visible document-level first-row/header choice and preview.

Operative acceptance and child-plan additions: Header-off 3/1/2 sorts to 1/2/3; header-on 数量/3/1 retains header. Changing A never changes B; reopening policy is explicit. Header interpretation, row freeze, column freeze and highlighting remain separate. JSON/YAML serializer keys are not blindly treated as headerless CSV.

Original proposal acceptance conditions (complete):

1. headerなし3/1/2の昇順が1/2/3
2. headerあり「数量」/3/1は見出しを維持
3. Aのheader変更でBを変えず、再openの扱いを明示
4. 行固定・列固定・見出しハイライトを混同しない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): First row selector and sort header summary; [`src/components/SettingsModal.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SettingsModal.tsx): document header choice → [`src/lib/viewState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/viewState.ts): per-document defaults; [`src/lib/sort.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/sort.ts): headerRow; [`src/hooks/useFilter.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFilter.ts): header handling.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `sorts numbers ascending and descending`
- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `keeps the header row fixed when requested`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `isolates header meaning, filter and independent row/column freezes without dirtying data`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `object-list headers cannot be sorted into data by Settings: %s`

F03 tests JSON and YAML import, disables both header controls, attempts the legacy Settings route, and verifies quick sort keeps the property-name header. Final R01 adds advanced sort/filter/tab combinations after format transition; real reopen remains separate.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 maintains mandatory object-list header when a headerless CSV is saved as %s`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 keeps saved %s key rows through tab switching, filters and advanced sort`

R01 centrally derives JSON/YAML key-row semantics after format transitions, including headerless CSV Save As. Both formats have permanent quick/advanced sort, tab-switch and filter-option regression evidence. Native serialization is mocked; real output/reopen remains pending.

Evidence against original acceptance numbers: 1–2: actual sort helper tests cover 3/1/2 and explicit header retention. 3–4: App tests isolate header/filter/freeze across tabs without dirtying; reopening defaults to createDocumentView. JSON/YAML now disable both main and Settings header controls, with an attempted-Settings-bypass and quick-sort regression for both formats.

Residual: JSON/YAML Settings/header and Save As→filter/tab/advanced-sort transitions have correction evidence; real discoverability and exact quantity-header reopen remain pending (M04, M08). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-016 — 絞込み後も元の行番号を分かるようにする

Source: [proposal.md line 1137](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1137).

Required UI-to-processing route: Consistent source-row address display and accessibility text.

Operative acceptance and child-plan additions: Filtered source rows 1/2/4 must identify row 4 consistently with name-box and selection, either direct original markers or explicit visible/source labels. Existing copy/clear/paste/search mappings remain correct; unfilter returns natural numbering. Screen-reader explanation requires actual observation, not only an aria attribute.

Original proposal acceptance conditions (complete):

1. 1/2/4の表示で元行4を示す番地が一貫
2. copy/clear/paste/searchが元行へ正しく作用する既存動作を維持
3. filter解除後に参照番号が自然に戻る
4. 読み上げが表示位置と元番地の意味を伝える

Implementation candidate: [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): rowOrientation status (visible position / original row / address); [`src/components/FormulaBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FormulaBar.tsx): source address → [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): toSourceRow/toVisibleRow; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): rowSourceIndexes and filtered selection fallback.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/GlideSheet.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/GlideSheet.test.tsx) — `restores source header axes through a filtered view without selecting hidden markers`
- [`src/tests/App.integration.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.integration.test.tsx) — `filters nonadjacent rows, protects hidden data for paste/search/replace, and clears from an explicit control`
- [`src/tests/App.integration.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.integration.test.tsx) — `clears exact header selections when a filter moves a hidden selection to the first visible cell`

Evidence against original acceptance numbers: 1: source supplies explicit visible/source/address text instead of changing Glide ordinal markers; exact 1/2/4 announcement assertion is missing. 2: existing App filtered copy/paste/replace/clear mapping tests remain. 3: status appears only while filtered and source mapping resets. 4: role=status exists, but actual assistive reading order/meaning is wholly pending.

Residual: Exact source-row orientation, unfilter numbering and screen-reader interpretation pending (M08, M14). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-021 — スクロールしても見たい行を固定する

Source: [proposal.md line 1194](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1194).

Required UI-to-processing route: Freeze first row / through selected row / clear rows.

Operative acceptance and child-plan additions: Actual persistent-on-scroll top-row display, with independent column freeze and visible boundary; supports 0/1/multiple rows. Never change header semantics, row order, dirty or CSV. Never re-expose filtered-out rows; source selection stays consistent after unfreeze. Cap frozen height at narrow/zoomed layouts and keep a clear unfreeze route. State stays document-local.

Original proposal acceptance conditions (complete):

1. 先頭1行・複数行・0行を指定でき、縦スクロール時も指定範囲を識別できる
2. 列固定を維持したまま行だけ解除でき、行固定でuseHeaderRowや行順を変えない
3. filterで除外したデータ行を固定表示で漏らさず、解除後も選択の元行参照が一致する
4. 狭幅・拡大で固定部が画面全体を占めないよう制限と解除経路がある
5. 変更してもdirty・CSV/TSV出力値を変えず、別タブへ固定を無断適用しない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Frozen rows numeric 0–10, Freeze to row, Unfreeze rows; [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): frozen reference strip → [`src/lib/viewState.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/viewState.ts): document-local freezeRows independent of freezeColumns; GlideSheet filters references by original row; [`src/styles/app.css`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/styles/app.css): max-height 24vh.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `isolates header meaning, filter and independent row/column freezes without dirtying data`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `clicking a frozen reference resets stale whole-column selection before Copy`

F06 now verifies frozen-reference navigation clears the previous whole-column selection before Copy. The reference-strip design and actual persistent-on-scroll/filter/zoom behavior remain unobserved; the test proves the App target transition only.

Evidence against original acceptance numbers: 1: implemented as a bounded reference strip above the editable grid, with source-row buttons returning to the main grid; it is not a second editable frozen canvas. 2, 5: App test covers independent document/header/column state, reference rendering and unchanged raw rows/dirty. 3: source includes only currently visible rows whose original index is in the frozen prefix; dedicated hidden-frozen-row regression is missing. 4: CSS caps the strip at 24vh and explicit unfreeze exists; actual scrolling/zoom is unobserved.

Residual: Verify that the reference-strip design satisfies persistent-on-scroll acceptance, column alignment, 0/1/multiple rows, filter exclusion and 640px/200% limits in the actual product (M08, M14). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-022 — 複数列の並べ替えを対象確認して実行する

Source: [proposal.md line 1541](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1541).

Required UI-to-processing route: Advanced multi-key sort preview and existing quick sort.

Operative acceptance and child-plan additions: Add/delete/reorder sort keys and directions; fixture A/2/a,B/8/b,A/10/c→A/10/c,A/2/a,B/8/b. Preview document, header, all data rows, hidden-row inclusion, whole-row motion and sample. Stable ties; no isolated-column sorting. Cancel preserves values/order/dirty; apply is one Undo. Document/data/column change after preview requires revalidation; retain exact comparison rules.

Original proposal acceptance conditions (complete):

1. 例の結果がA/10/c、A/2/a、B/8/bとなり、優先キーの順を変えるとpreviewも変わる
2. 見出し有無・対象文書・全データ行数・非表示行を含む範囲を適用前に表示する
3. 各行の全列を一緒に移動し、全キー同値なら元の順序を維持する
4. 取消では値・順序・dirtyを変えず、適用は1回のUndoで戻せる
5. preview後にデータ・列構造・対象タブが変わった場合は再確認し、古い対象へ適用しない
6. 空値・長い番号・日本語の比較説明を示し、UX-015の数値精度受入を回帰させない

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Multi-column sort dialog, priority-key controls, first-eight-row preview and second apply confirmation → [`src/lib/sort.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/sort.ts): sortRowsByKeys; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): clipboardContextValid/header recheck, applySortedRows and atomic history.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `keeps the header, sorts whole rows, and uses each key's mode and direction`
- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `retains stable ordering for equal numeric values including padding`
- [`src/tests/sort.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/sort.test.ts) — `uses subsequent keys for equally empty first keys`


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R05 multi-sort resets invalid previous-document keys instead of presenting A while sorting a missing column`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R01 keeps saved %s key rows through tab switching, filters and advanced sort`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 sorting preserves an untouched invalid value while moving the complete row`

R05 resets sort keys on document change and validates the active schema before opening, with a three-column→one-column App regression that checks visible key A and actual result. R01 exercises advanced sorting after object-list Save As; R1 adds quick-sort/validation/Undo evidence. Full advanced-preview cancel/data-change/Undo combinations remain pending.

Evidence against original acceptance numbers: 1, 3: helper fixtures prove multi-key direction/stable full-row ordering; exact proposal rows and priority-control changes are not fully tested through the UI; final R05 covers cross-document invalid-key reset and R01 covers structured-header advanced sort. 2: document/header/data count/hidden inclusion and sample are rendered in source. 4–5: cancellation and captured-data/header revalidation precede history/apply in source, but final R05 covers previous-document schema/key reset; detailed sort-dialog cancel/Undo and same-document stale data/structure combinations remain incomplete. 6: exact modes and explanatory text exist; long-number helpers cover the comparator.

Residual: Integrated sort preview controls/cancel/Undo/staleness tests and real product preview/performance pending (M04, M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-024 — メニューをキーボードで開き元の場所へ戻る

Source: [proposal.md line 1600](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1600).

Required UI-to-processing route: ContextMenu/Shift+F10 plus named column-action button.

Operative acceptance and child-plan additions: Correct selected target; initial focus on first enabled item; menu arrows/Enter and filter Tab/Space/apply work. Esc/cancel discards unapplied checkboxes. Apply/cancel restores origin, or announces a visible same-column replacement if original row is filtered away. Do not steal focus mid-transition into filter/confirmation dialog. Protect IME and text inputs; retain button fallback.

Original proposal acceptance conditions (complete):

1. gridのセル/列選択からマウスなしで正しい対象のmenuを開き、最初の利用可能項目へfocusする
2. menuの矢印/Enter・filterのTab/Space/適用で値を選択でき、focus位置が視認できる
3. filterの未適用checkbox変更をEsc/取消で捨て、元の適用条件は変えない
4. 適用後と取消後に呼出し元へ戻り、元の行が非表示なら同じ列の見える対象を明示する
5. menuからfilterや確認dialogへ移る途中でgridへfocusを奪い返さない
6. IME変換中のキーや入力欄の通常操作を妨げず、予約キー競合時も名前付きbuttonで到達できる

Implementation candidate: [`src/components/GlideSheet.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/GlideSheet.tsx): ContextMenu/Shift+F10 capture; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Column actions button; [`src/components/ContextMenu.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ContextMenu.tsx) and FilterPopover.tsx → [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): context/filter onClose and focusCell fallback; [`src/components/ContextMenu.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ContextMenu.tsx): enabled-item focus/arrow dispatch; FilterPopover keeps draft selections.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/dualEditionUi.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/dualEditionUi.test.tsx) — `retains unshown filter choices while searching values and presents per-value counts`
- [`src/tests/App.integration.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.integration.test.tsx) — `clears exact header selections when a filter moves a hidden selection to the first visible cell`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `keyboard menu should preserve single-cell clear target`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `clicking a frozen reference resets stale whole-column selection before Copy`

F02/F06 add dedicated production-App regressions for keyboard menu open/cancel then clear and frozen-reference selection then copy, closing the blanket no-keyboard-target-test gap. Final R04 adds disjoint exact row/column cancellation and Copy coverage; menu→filter/dialog focus, reversed-selection variants and real keyboard/IME/assistive behavior remain separate.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R04 the keyboard menu exposes column actions for an exact column selection`
- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `R04 keyboard-menu cancellation preserves disjoint exact %s and the Copy target`

R04 preserves the exact row/column axes and exposes their matching menu; parameterized disjoint-row/column Escape then Copy cases assert unchanged selection, exact copied values, no dirty/history change. Actual menu→filter/dialog focus and real keyboard/IME remain unobserved.

Evidence against original acceptance numbers: 1–2: source implements key/button entry and existing menu navigation; the new keyboard-menu open/cancel/clear test additionally proves single-cell targeting, but not the whole menu/focus route. 3: FilterPopover uses local unapplied state and cancel; a menu Escape/clear target regression exists; filter-draft Escape-discard specifically still lacks a dedicated case. 4–5: App queues focus restoration and avoids an existing dialog/filter transition, but a mocked canvas and related selection test do not establish focus ownership. 6: IME/input guards and button fallback exist; platform conflicts are unobserved.

Residual: Keyboard-menu single-cell and disjoint row/column target/cancel/Copy now have correction evidence; focus-transition/filter-draft/IME cases and real OS/canvas/assistive acceptance remain pending (M09, M14). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C4 / UX-028 — 絞込みに名前を付けて切り替える

Source: [proposal.md line 1251](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1251).

Required UI-to-processing route: Explicit named filter-view create/rename/duplicate/apply/delete.

Operative acceptance and child-plan additions: At least two named views; save filter and widths only, never sort/row order. Show current view, conditions, counts, unsaved view changes without silently overwriting preset. Duplicate names/column moves/deletion/count changes/same-name other files must not auto-apply; confirm mapping or reset. Explain storage and CSV non-portability; optional persistence, individual/all deletion, all-rows exit, and missing filter-value handling.

Original proposal acceptance conditions (complete):

1. 同一文書で少なくとも2つの名前付きfilter viewを保存/改名/複製/選択/削除できる
2. 呼出しでfilterと列幅を適用し、値・行順・dirty・CSV出力を変えない
3. 現在のview名/条件/表示件数と保存後変更を表示し、保存済み条件を黙って上書きしない
4. 列名重複・列移動/削除・列数変更・同名別文書では自動適用せず、対応確認または再設定へ進む
5. 補助情報の保存場所とCSVに付属しないことを示し、保存しない利用と個別/全削除を選べる
6. UX-001だけを採用した場合も自動session復帰が使え、UX-028だけを採用した場合も明示的な呼出しが使える
7. viewを閉じる/全表示へ戻る経路があり、filter内に存在しなくなった値を含む場合も状態を説明する

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Named views button/current-name/modified/count display; [`src/components/NamedViewsPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/NamedViewsPanel.tsx): CRUD/apply/storage controls → [`src/lib/namedViews.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/namedViews.ts): session store/schema comparison/explicit local persistence/import; [`src/hooks/useFilter.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useFilter.ts): restore; sheet colWidths.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent limited re-review receipt: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` — C1/C3/C4 passed 20 independent assertions and 180 focused permanent tests; this receipt does not automatically transfer to the current source delta.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/namedViewsPanel.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/namedViewsPanel.test.tsx) — `saves two views, applies exact filters/widths, renames, duplicates, deletes and returns to all rows`
- [`src/tests/namedViewsPanel.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/namedViewsPanel.test.tsx) — `requires selecting a previous document, reviewing schema and confirming import without automatic apply`
- [`src/tests/namedViews.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/namedViews.test.ts) — `rejects duplicate, blank, reordered, deleted and changed columns and header mode`
- [`src/tests/namedViewsPanel.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/namedViewsPanel.test.tsx) — `reports values no longer present and never silently edits the saved filters`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `saves, reapplies and isolates explicit presets without mutating rows or leaking to same-name reopened documents`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewInputCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewInputCorrections.test.tsx) — `persisted named-view groups carry the loaded document display name`

F09 verifies the actually persisted group uses the loaded document display filename instead of a stale untitled label. Filename stays presentation metadata, not document identity; schema/explicit import and same-name isolation remain the existing contract.

Evidence against original acceptance numbers: 1–3, 7: real panel/store/App tests cover two presets, CRUD, widths/filters, modified/missing-value status, all-rows exit and unchanged content. 4: unsafe schemas and explicit reopen/import binding have direct tests. 5: no-storage-before-opt-in, deletion and storage failures are tested. 6: live document view and explicit preset store are distinct paths; both are adopted together, so hypothetical separately shipped configurations are not product-tested.

Residual: Actual browser/native persistent storage/restart behavior, screen-reader and narrow-layout usability remain pending (M10, M14). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C5 / UX-017 — 選んだ範囲だけを確認して整形する

Source: [proposal.md line 1313](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1313).

Required UI-to-processing route: Selection cleanup preview, including deduplication.

Operative acceptance and child-plan additions: Preview before/after and affected count for chosen range/columns, with explicit header/hidden-row/full-/half-width whitespace/case semantics. Preserve all raw strings including 00123, >16 digits, full-width spaces and empty cells unless explicitly targeted. Dedup keys/case/header choice visible; cancel changes zero and apply is one Undo. Do not auto-clean on import. Include split/trim routes if adopting the full proposed toolbox; do not replace required processing with a preview stub.

Original proposal acceptance conditions (complete):

1. 対象範囲外とhidden行の扱いがpreviewと結果で一致
2. 00123/16桁超/全角空白/空cellを勝手に型変換しない
3. cancelは変更ゼロ、applyはまとめて1Undo
4. 重複判定に使う列・大小文字・headerを明示

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): exact selected visible cells → Cleanup; [`src/components/CleanupPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/CleanupPanel.tsx): trim/dedupe preview/options/whole-row consent → [`src/lib/cleanup.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/cleanup.ts): previewCleanup/previewDedupe; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): stale identity/rows check, validateNext, formula structural rewrite, one history transaction.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `trims only visible selected cells, leaves hidden rows raw, and undoes atomically`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `dedupes selected keys with structural formula rewrites and restores both with one Undo`
- [`src/tests/cleanup.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/cleanup.test.ts) — `preserves IDs and hidden / unselected cells without mutating before Apply`
- [`src/tests/cleanup.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/cleanup.test.ts) — `deduplicates selected rows using explicit keys/header/case without hidden participation`
- [`src/tests/c5Panels.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/c5Panels.test.tsx) — `dedupe requires complete-row consent and submits deleted source indexes`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F5 structural formula rewrite must be validated after rewriting`

F5 checks rejecting enum rules against the final cleanup result after structural formula rewriting, leaving the entire original table/formulas unchanged on rejection. This extends the existing trim/dedupe atomicity evidence; splitting remains outside the implemented toolbox.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 permits cleanup of unrelated valid data when a preexisting required value is missing`

R1 aligns original and final identities before checking cleanup/structure mutations, so unchanged existing violations do not block unrelated work while genuinely new/rewritten values remain checked.

Evidence against original acceptance numbers: 1–4: real helper/panel/App tests establish exact visible scope, string preservation, cancel/no-edit, atomic Undo, explicit keys/case/header and whole-row deletion consent. Implemented toolbox is trim plus deduplication; column splitting is not implemented. The proposal lists splitting as an example, while its four formal conditions concern scope/text/preview/Undo/dedupe; this bounded interpretation needs review rather than an implied full-toolbox claim.

Residual: Column-split example remains outside the implemented toolbox and requires a review decision if treated as mandatory; actual selection/preview readability pending (M11). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C5 / UX-018 — 入力ルールを任意で確かめる

Source: [proposal.md line 1369](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1369).

Required UI-to-processing route: Optional rule configuration and real validation path.

Operative acceptance and child-plan additions: Warn by default; rejection only explicitly selected. Preserve invalid raw value in warn mode. Validate bulk paste against the same target set and show complete error list with consistent atomicity/Undo. Rules remain separate from CSV, initially session-scoped; explain local/sidecar persistence and what survives session end or deletion. Provide actual rules and removal, not only metadata fields.

Original proposal acceptance conditions (complete):

1. 警告/拒否が明示され警告中も文字列値を失わない
2. bulk pasteの対象・エラー一覧・Undoが一貫
3. session終了/local消去/sidecar削除で何が残るか説明
4. CSV単体へルールを埋め込まず共有時に欠落を明示

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Validation button/report; [`src/components/ValidationPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/ValidationPanel.tsx): required/pattern/allowed-values, warning/reject, add/edit/remove and sidecar controls → [`src/lib/validation.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/validation.ts): bounded pattern matcher, validateMutation/document and versioned sidecar; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): rulesById/validateNext at central mutations; [`src/lib/validationHistory.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/validationHistory.ts): remapValidationRules, invertValidationChanges, validationHistoryBefore, restoreValidationHistory, validationHistoryError.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `rejects the entire %s transaction with no history or dirty state`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `warns while preserving raw text and keeps one Undo for bulk paste`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `keeps validation rules attached to document identity across tab switches`
- [`src/tests/validation.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validation.test.ts) — `rejects a whole paste, counts every error, and keeps reports bounded`
- [`src/tests/validation.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validation.test.ts) — `roundtrips a versioned standalone sidecar and rejects malformed metadata`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F5 structural formula rewrite must be validated after rewriting`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F6 reject-mode rules also cover structural insertions before history changes`

The corrected path validates final rewritten cleanup/structural output before mutation/history, with rejecting-rule regressions. The integrator also reports column-index rules remapped on column-structure changes and included only in those history transactions, plus an enum-value picker; the final R2/R4/R5 App cases now provide dedicated rule-history, picker and remapping/Undo evidence. The first-200 display cap and full-list requirement remain review-sensitive.


Final C1–C5 correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (documentation only; see SHA-scoped review receipts above):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 sorting preserves an untouched invalid value while moving the complete row`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R1 permits cleanup of unrelated valid data when a preexisting required value is missing`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R2 Undo of an earlier cell edit must not silently remove a subsequently added input rule`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R4 enum candidate selection commits through validation and a single Undo`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `R5 column movement remaps rules and Undo restores the original column`

R1 compares final cells with identity-aligned originals; R2 excludes rules from ordinary cell history and includes metadata only in column-structure transactions. Permanent cases verify subsequently added/edited rules survive cell Undo/Redo, enum picker commits through validation with one Undo, and column move/Undo remaps/restores rules. This replaces the earlier source-only picker/remapping evidence and broad raw-history wording.


Retained C2/C5 R1a/R2a correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (R1a/R2a confirmed at the preceding SHA; current capacity receipt passed within its stated scope):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `structural Undo preserves and reverse-maps a later rule addition, and Redo maps it forward`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `a rule added to an inserted column returns with Redo without leaking onto surviving columns`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `column deletion Undo restores its removed rule and preserves a later surviving-column rule`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `header %s does not revalidate an unchanged all-rows violation in another column`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `header %s still rejects a newly applicable skip-header rule atomically`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `preserves later rule additions and edits across move undo and redo`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `restores only deleted-column rules while preserving later rules on survivors`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `keeps newly inserted column rules detached during undo and restores them on redo`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `inverts a noncontiguous deletion at original indexes`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `keeps ordinary cell history metadata-neutral`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `copies mutable rule values and change indexes`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `does not revalidate unchanged all-row violations when another rule becomes applicable`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `checks newly applicable rules independently even on the same column`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `still rejects new invalid values and does not double-count applicability checks`

The five App test titles expand to seven cases because both header operations run for insert and sort. Nine helper cases cover later additions/edits, deleted/inserted columns, noncontiguous inverses, metadata-neutral ordinary edits, defensive copies and per-rule header applicability. These are part of the reported 646-test run, not independent review results. `src/lib/validationHistory.ts` records reversible column transforms plus only removed-column rules; Undo/Redo maps the current rule set rather than restoring a stale whole-rule snapshot. `src/lib/validation.ts: validateMutation` checks newly applicable row/rule pairs independently, including multiple rules on one column. Existing violations remain reported, while unrelated unchanged violations do not block a mutation and genuinely new invalid values remain atomic rejections.


Latest C2/C5 capacity/range correction evidence at `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (limited independent capacity recheck passed: 48 permanent tests / 18 independent checks):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Undo preflights the 100-rule limit, preserves both stacks, and succeeds after one rule is removed`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Redo preflights restored inserted-column rules without clipping or consuming either stack`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `Undo rejects a rule mapped past XFD before changing rows, rules or history`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `preflights capacity without clipping rules or changing restoration metadata`
- [`src/tests/validationHistory.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/validationHistory.test.ts) — `preflights mapped rules outside the supported column range`

`src/lib/validationHistory.ts: validationHistoryError` supplies preflight before App commits an Undo/Redo. The reported regressions assert exact rows, rules and both real history stacks remain unchanged when restoration exceeds 100 rules or maps outside the supported rule-column range. No rules are silently clipped. The UI explains the failed operation and allows retry after removing an unneeded rule; successful retry remains reversible. These five cases are implementer evidence within the 646-test total; the independently passing capacity receipt above is separate from still-unaccepted manual/native behavior.

Evidence against original acceptance numbers: 1–2: seven App mutation-route cases reject atomically; warn/paste retains strings and one Undo. All issues are counted, but only the first 200 are listed: a complete unbounded error list is not implemented. 3–4: panel explains session lifetime, explicit sidecar import/export and CSV omission; helper round-trip tests exist. Rules are not persisted in localStorage. The corrected UI adds an enum-value picker; dedicated final R2/R4/R5 App cases verify picker commits, remapping/Undo and preservation of later rule changes across ordinary cell Undo/Redo. Column-structure history stores reversible transforms and removed-column rules only; current surviving rules, including later additions/edits, are mapped on Undo/Redo. Ordinary cell history remains metadata-neutral. R1a adds rule-specific header applicability with unchanged-violation and newly-invalid countercases.

Residual: Review whether the capped issue list satisfies the child-plan complete-list wording; actual sidecar picker/download/reopen and accessibly locating violations remain pending (M11, M14). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C5 / UX-027 — 任意のローカル復元下書きを残す

Source: [proposal.md line 1662](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1662).

Required UI-to-processing route: Explicit opt-in recovery, candidate list and isolated restore-copy.

Operative acceptance and child-plan additions: OFF writes zero document content. Before ON disclose content/location/expiry/capacity/best-effort limits. Store only committed snapshots separately; list name/time/expiry, open copy/delete/later. Restored copy has no original-path binding and defaults to Save As, stays dirty. Individual/all/OFF deletion and expiry cleanup; no promise of deletion while app stopped. Quota/corruption/write failure never interrupts edit or falsely claims saved draft. External source updates remain isolated; downloads do not delete drafts.

Original proposal acceptance conditions (complete):

1. OFFのままでは文書内容を新しい復元領域へ書かず、ONにする前に内容・場所・期限・容量と限界が読める
2. snapshotは元ファイルと別で、復元しても自動上書きや保存済み扱いをしない
3. 復元候補を文書名・時刻・期限で区別し、復元copyの保存は別名保存を初期経路にする
4. 個別削除・全削除・OFF時の削除を実行でき、期限切れは次回起動/動作中に整理し、アプリ未起動中に必ず削除されるとは表示しない
5. 容量超過・書込失敗・破損時は通常編集を維持し、下書きが残ったという虚偽の成功表示をしない
6. 異常終了後の復元は最後に完了したsnapshotまでと明示し、未確定IME/直近入力が戻ると保証しない
7. 元ファイルが外部で更新済みでも復元copyを隔離し、元ファイルへの保存は明示的な利用者判断を必要とする
8. Web download開始だけで復元下書きを消さず、ユーザーの明示破棄/削除と整合させる

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Recovery OFF/ON/status/startup candidates; [`src/components/RecoveryPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/RecoveryPanel.tsx): consent/list/restore/delete/Later → [`src/lib/recovery.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/recovery.ts): createRecoveryStore, versioned edition-local store, TTL/quota/failure guards, pathless restoreCopy; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): committed snapshot scheduling.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent scoped re-review receipt: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — final capacity delta passed 48 permanent tests / 18 independent checks; preceding receipts resolve the other recorded C2/C5 findings. This is not whole-product/native acceptance.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `writes no content while OFF, snapshots only after consent and restores a dirty pathless formula-OFF copy`
- [`src/tests/recovery.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/recovery.test.ts) — `expires drafts on read and supports individual/all/OFF deletion`
- [`src/tests/recovery.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/recovery.test.ts) — `keeps the last completed snapshot after quota errors, without success or editor mutation`
- [`src/tests/recovery.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/recovery.test.ts) — `reports deletion failure and blocks further writes even if persisted ON remains`
- [`src/tests/c5Panels.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/c5Panels.test.tsx) — `lists identical names by identity/time and opens dirty isolated copies`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F2 deleting drafts cancels pending content snapshots`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F2 deleting an inactive document cancels its pending snapshot but permits a distinct later edit`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F2 turning recovery off deletes drafts and blocks pending or subsequent snapshots`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F3 switching tabs preserves a pending originating-document snapshot`
- [`src/tests/App.reviewCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.reviewCorrections.test.tsx) — `F7 startup storage corruption is surfaced instead of reporting OFF`

F2/F3/F7 replace the active-tab-only timer with per-document snapshot scheduling and explicit cancellation barriers. Tests cover deleting all/individual inactive drafts, OFF blocking queued/subsequent writes, tab-switch origin retention and startup corruption visibility. Real restart/crash/storage eviction and full save×checkpoint×recovery combined acceptance remain pending.

Evidence against original acceptance numbers: 1–3: integration/panel tests exercise opt-in, snapshot contents, name/time identity and dirty pathless formula-OFF restore; native Save As defaults follow from missing path but real picker is pending. 4–5: injected storage failures, quota, corruption, expiry and individual/all/OFF deletion have helper tests; actual browser/WebView failure handling is unobserved. 6–7: source/panel explicitly promise only completed snapshots and isolate originals; no real crash/external-update experiment was run. Per-document queued writes, deletion barriers and corrupt-startup reporting now have App regression coverage. 8: no download-delete link exists; App recovery test plus source boundary is not a complete download/recovery cross-feature test.

Residual: Real restart/crash, private mode/eviction/quota/WebView persistence, external original update and save-in-flight×tab×recovery/download combination pending (M12). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C6 / UX-019 — セルの数式を計算する

Source: [proposal.md line 1425](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1425).

Required UI-to-processing route: OFF-by-default calculation mode, raw/result display, formula/value export.

Operative acceptance and child-plan additions: Required real parser/evaluator: same-sheet A1, ranges, absolute references, arithmetic/comparison, SUM/AVERAGE/MIN/MAX/COUNT/IF. =1+2→3; SUM(A1:A3), dependency edits, cycles, invalid references, unknown function, divide-by-zero. No eval/Function/external reference/network function. Keep raw formula independent of computed cache; implement dependency recalculation and raw Undo/Redo; define and test sort/row-column structural semantics, filter, tabs, async save and both exports/reopen.

Original proposal acceptance conditions (complete):

1. 採用を再検討する場合：式と文字列を明示的に分け、=1+2の結果3と入力式をそれぞれ確認できる
2. 参照先の変更で再計算し、循環参照・未対応関数・計算エラーを値の無言置換ではなく表示する
3. CSVへ式を出すか計算値を出すか選択し、別名保存と再openで契約どおりの内容を確認する
4. 式の編集・再計算をUndo/Redoやfilter、タブ、保存中変更と組み合わせても元値を失わない
5. 今回は未実装。説明改善だけの採用と本格計算機能の採用は分けて見積り・承認する

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Calculate formulas opt-in, result/error summary and Export values copy; [`src/components/FormulaBar.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/FormulaBar.tsx): raw input; GlideSheet result display → [`src/lib/formula.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/formula.ts): bounded parser/evaluator/dependencies, reference translation/structure rewrite, exportFormulaRows; [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): recalculation/history and save snapshot.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent re-review target: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — C6/C7 post-fix independent review NOT PERFORMED; original report targets the earlier candidate.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `starts calculation OFF, separates raw editing and results, and keeps the toggle per document`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `exports calculated values as a separate copy while preserving the raw save checkpoint`
- [`src/tests/formula.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/formula.test.ts) — `recalculates transitive dependencies after edit, undo and redo snapshots`
- [`src/tests/formula.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/formula.test.ts) — `reports direct, indirect and range cycles and propagates errors`
- [`src/tests/formula.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/formula.test.ts) — `does not execute JS, external references, or network functions`
- [`src/tests/formula.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/formula.test.ts) — `reopens CSV formula/value exports with the chosen content and no metadata`
- [`src/tests/formula.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/formula.test.ts) — `sorts raw rows with positional refs and does not apply copy translation`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `commits to the original target after a peer $axis $change without changing a neighbor`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `keeps the source-row identity through a filtered view and a peer reorder`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `keeps a distant name-box target through remote insertion and IME composition`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `retains a draft when its %s was deleted and never writes into the replacement coordinate`
- [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `atomically accepts only one concurrent %s batch with relative, absolute and range formulas`
- [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `rejects structural Undo after a peer adds a new formula, even after syncing the latest revision`

FC-02/FC-03 implement stable row/column identity for pending drafts and exact-revision guards for coordinate-derived formula/structure batches, including original-context history guards. New App/HTTP regressions cover insert/delete/reorder, filtered/distant synthetic IME, deleted draft targets, competing structural batches and stale structural Undo. These are implementer regression results, not a resumed independent C6/C7 review: post-fix independent C6/C7 review NOT PERFORMED.

Evidence against original acceptance numbers: 1–2: actual parser/evaluator/helper and App tests establish OFF default, raw/results separation, arithmetic, references/aggregates/IF, recalculation and visible errors without eval/network. 3: helper CSV reopen and App values-copy snapshot tests exist; real native/browser reopen remains pending. 4: helper sort/structure/Undo plus App dedupe and sharing-structure tests cover interactions, but one integrated filtered-formula sort/save-in-flight/tab scenario is absent. 5: the historical not-implemented/separate-approval sentence is preserved verbatim and superseded by this task’s explicit all-adopted decision; it is not a remaining permission blocker.

Residual: Native exports/reopen, real canvas/editing, integrated delayed-save cross-product and formula latency/capacity pending; no Excel-all-functions or exact-decimal formula arithmetic claim (M13, M15). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

### C7 / UX-020 — 複数人で同時編集する

Source: [proposal.md line 1483](https://github.com/ishizakahiroshi/PlainSheet/blob/8204b5442f602164148b725c3ad07190630e33c4/docs/bot/ux-all-adopted-20261012/proposal.md#L1483).

Required UI-to-processing route: OFF-by-default explicit share mode and actual self-hostable transport.

Operative acceptance and child-plan additions: Display destination/participants/roles/status/save destination/retention/deletion. Separate data model/provider with stable row/column IDs. Two participants synchronize values, concurrent row/column structure and undo. Test same-cell conflict recovery, offline queue, delay/reorder/duplicate/retry/reconnect. Enforce viewers and revocation in provider/server, not UI only; leave/stop-sharing actually terminate authority. Explain surviving participant copies and absent CSV metadata. Ship optional relay/config/test instructions; no default public signaling/STUN/relay or paid auto-connect; BroadcastChannel/mock alone cannot pass.

Original proposal acceptance conditions (complete):

1. 採用を再検討する場合：共有を明示的に開始し、参加者・閲覧/編集権限・保存先を確認できる
2. 同時編集の競合を検出し、無言で他人の変更を失わず解決または履歴から回復できる
3. ネット切断中の編集と再接続後の反映順、重複・競合・再送を合成参加者で検査する
4. 権限取消・退出・共有停止・内容/コメント/履歴の削除で何が誰に残るか検査する
5. CSV単体に同期/権限/履歴は残らないことを説明し、端末内編集の通常モードを維持する
6. 今回は未実装。認証・同期・保存期間・運用を別案件で承認してから開始する

Implementation candidate: [`src/App.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/App.tsx): Sharing OFF/status and per-document attachment; [`src/components/SharingPanel.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/components/SharingPanel.tsx): destination consent/create/join/roles/history/leave/stop/delete → [`src/hooks/useCollaboration.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/hooks/useCollaboration.ts); [`src/lib/collaboration/model.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/lib/collaboration/model.ts) and client.ts; [`server/relay.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/server/relay.ts); [`server/run.mjs`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/server/run.mjs) and serve.ts: optional self-host HTTP transport.

Source/code SHA: `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. Independent re-review target: `6dba8bd1fb42b22b065fc9e8003d8d137e054610` — C6/C7 post-fix independent review NOT PERFORMED; original report targets the earlier candidate.

Meaningful automated cases inspected (test presence/assertions; corrected-suite command/result is recorded separately):

- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `starts OFF, uploads only after explicit consent, syncs raw edits and structural formulas, and undoes through the provider`
- [`src/tests/App.extendedUx.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.extendedUx.test.tsx) — `joins a viewer as a fresh document, rejects local mutation routes, and preserves the original local tab`
- [`src/tests/collaboration.transport.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.transport.test.ts) — `converges two HTTP participants under concurrent cells and row/column inserts with stable identities`
- [`src/tests/collaboration.transport.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.transport.test.ts) — `queues while offline, reconnects, and resends a lost ACK without applying it twice`
- [`src/tests/collaboration.transport.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.transport.test.ts) — `rechecks revocation after receiving an in-flight request body`
- [`src/tests/collaboration.transport.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.transport.test.ts) — `supports single-use/revoked invitations, leave, stop and deletion with retained local-copy boundaries`
- [`src/tests/collaboration.runner.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.runner.test.ts) — `starts and stops only a loopback synthetic-test relay without a build or dependency`

Corrected-candidate evidence (documentation mapping, not independent review):

- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `opens a sample as a fresh unshared document and leaves the original room unchanged after edits and refresh`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `native Open and import preview create a fresh unshared document from a shared blank starter`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `New from a shared blank starter creates an independent unshared tab`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `does not reuse or attach a new file to a blank document whose create response is still pending`
- [`src/tests/App.sharingCorrections.test.tsx`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/App.sharingCorrections.test.tsx) — `guards browser and native close with a saved offline queue (inactive document: %s), including cancel and save-close`
- [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `rejects concurrent row-zero formula batches, retains blocked work, and only accepts explicit recomputation`
- [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `replays a guarded lost ACK before checking its now-stale revision and keeps retry bytes immutable`
- [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `does not let a forged current-revision guard bypass the original structural Undo revision`
- [`src/tests/collaboration.revisionGuard.test.ts`](https://github.com/ishizakahiroshi/PlainSheet/blob/6dba8bd1fb42b22b065fc9e8003d8d137e054610/src/tests/collaboration.revisionGuard.test.ts) — `validates the guard on the real wire and rejects a stale entire batch without retaining history`

FC-01–04 correction evidence separates shared-starter consent identity from newly opened/created documents, preserves stable draft targets, protects locally saved queues at every close entry and guards whole positional structural batches/history. A stale guarded operation is rejected atomically and retained as blocked work; later dependent optimistic operations are not projected through the rejected revision, and retry payload bytes remain immutable. Ordinary stable-ID edits remain mergeable. Initial C6/C7 findings are retained, but post-fix independent C6/C7 review NOT PERFORMED following the tool-side stop; no substitute review is inferred from tests.

Evidence against original acceptance numbers: 1: real App/HTTP tests require explicit destination-specific consent and preserve local tabs; UI separately states endpoint/roles/retention/local-save distinction. 2–3: actual loopback HTTP tests cover two clients, concurrent stable-ID structure/cells, conflict history restore, compensating Undo, offline/lost-ACK/reverse/duplicate/dependency requests. 4: server-enforced forged-viewer/revocation/in-flight/leave/stop/delete/expiry tests exist; retained participant copies cannot be recalled. No comment feature/data exists to delete. 5: raw CSV stays metadata-free and ordinary mode is OFF; the corrected App/real-relay tests now cover successful local save with offline/in-flight pending queues and browser/native close guards; actual native and full permission/disconnect/save cross-products remain pending. 6: historical separate-project language is superseded by this task; deployment/real accounts/data remain outside current execution authorization.

Residual: Loopback TCP is real transport evidence, not separate-device acceptance. Operator TLS proxy, actual native CSP/origin pairing, two devices, durable-save isolation, performance and security review remain pending (M16). All actual GUI/native observations remain unaccepted until recorded in [manual acceptance](manual-acceptance.md).

## Extraction check

28 unique UX IDs, grouped 4 + 6 + 6 + 7 + 3 + 1 + 1. All 135 original proposal acceptance bullets are included, with historic superseded statements explicitly identified. C8 is the integrated acceptance gate rather than a twenty-ninth feature. Read proposal SHA-256: `c2f736ee2e340f02b94a1002ea0bcace21e7f3122ad9745cf92eca8a389c5b46`.
