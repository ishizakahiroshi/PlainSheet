# Independent final code review

P-20261016-003 · 2026-10-16 · Reviewer: dots `review_multiselect_context_actions`, separate from the implementation owner.

**Outcome: no unresolved code findings in the bounded reviewed scope. All six original findings and the two later R1/R2 groups are corrected and rechecked at the exact code SHA below.** This is source/automated-test acceptance, not whole-product GUI/native acceptance or a claim that CI has finished.

## Exact source and independent verification

- Reviewed canonical code SHA: `8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb`.
- Canonical tree: `954b8738e8ae2f58a9d2a3c97841bb07f94aae08`; parent: `30213e268bd9141ea91a634de381a8714ecb566c`.
- Full bounded diff baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
- Fixed instructions: `5ee020fcd9aece26c7b74196959ba18958485746`.
- Local exact-source snapshot: `11db8304104cc0cb5e6f809334bfc6efaca78e21`. This synthetic local history is distinct from canonical GitHub history.
- Independently re-read `develop`: `037c29ea4649efc81acc8f28824dca3df08e7450`, unchanged.
- [Draft PR 6](https://github.com/ishizakahiroshi/PlainSheet/pull/6).
- [Full bounded compare](https://github.com/ishizakahiroshi/PlainSheet/compare/e676daae5224842ae238d4e0a8047cb0f2307f89...8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb).

The reviewer independently fetched the canonical Git commit, recursive tree and full/incremental compares. The full compare contains 24 paths, four commits ahead, zero behind, and the expected baseline as merge base. The final incremental compare contains five paths, one commit ahead and zero behind.

All 24 bounded-diff paths have the same Git blob hashes locally and in the canonical recursive tree. All 74 materialized canonical text paths match; the sole extra local tracked entry is the intentional cached-dependency `node_modules` symlink, which is absent from the canonical tree. The recursive response was not truncated. No source discrepancy was found. The working tree was clean before this report.

The final App and test files also exactly match the independently probed pre-publication source:
- `src/App.tsx` Git blob `dfda70419bb69ad7e3332981779f0c55b3e5527e`; SHA-256 `abfba4f482beb3299786c57d5a5de3c80c98309125891a7c773005173b322297`.
- `src/tests/multiSelectApp.test.tsx` Git blob `0fb1b72f7cd5f253b830cd49bf99561d51b27515`; SHA-256 `a4a1c22055dbdeda4bc070dd816c585f3547780011420f90b0924a1c70ae0959`.

## Paths and review coverage

The full review incorporates the [initial independent review](independent-review-0a0032e9.md) and [first correction review](independent-review-30213e26.md), with all subsequent product/test changes reread. The final five-path delta was read completely: App, App tests, PROGRESS, corrections-round-2 and the published first correction review.

The full 24-path bounded scope is:
- Case documents: `docs/bot/multi-select-20261016/{FACTS.md,README.md,PROGRESS.md}`; `results/{implementation.md,corrections-round-1.md,corrections-round-2.md,independent-review-0a0032e9.md,independent-review-30213e26.md}`.
- Product components: `src/App.tsx`, `src/components/{ContextMenu.tsx,FormulaBar.tsx,GlideSheet.tsx}`.
- Hooks: `src/hooks/{useDocuments.ts,useFilter.ts,useHistory.ts,useSheet.ts}`.
- Libraries: `src/lib/{clipboard.ts,csv.ts,i18n.ts,selectionTarget.ts}`.
- Styles/types: `src/styles/app.css`, `src/types/sheet.ts`.
- Tests: `src/tests/{multiSelectApp.test.tsx,multiSelectHooks.test.tsx}`.

README/FACTS contain the two scoped instruction corrections predating product work. Relevant unchanged callers, selection/filter contracts, CSV/format paths and installed Glide public event implementation/types were also examined during the review series. No workflow, manifest, lock, dependency, native-code, persistence-schema or old-branch change entered the full diff.

Coverage includes actual App/GlideSheet/hook calls for selected row-marker/header/cell context preservation, outside-target replacement, Glide's follow-on selection callback, target counts, discontiguous gaps, insert/duplicate anchors, clipboard failure/stale-target handling, hidden/filtered source mapping, widths/frozen state/document identity, no-op/cancel/history behavior, menu keyboard handlers and serialization. External canvas and file IO remain mocked; helper-only assertions are not the sole integration evidence.

## Finding disposition at the reviewed SHA

| Finding | Disposition and evidence |
|---|---|
| R1 · P1 · Hidden active source differs from visible edit target | Closed on source/automated evidence. Immediate formula/keyboard actions after hiding the first row/column use visible sources. Fresh independent row and column probes delete beside hidden index 0, Undo/Redo, then edit through FormulaBar without changing the hidden original. All-hidden append, Undo/Redo and formula-edit probes also pass. |
| R2 · P1 · Name-box navigation retains stale whole-row/column targets | Closed. Cell/range/search navigation replaces whole-target arrays; hidden search hits are revealed. Actual App tests exercise subsequent Copy/Delete rather than only the selection helper. Later range boundaries are covered below. |
| R3 · P2 · Distant virtual Paste materializes skipped rows | Closed. Menu, shortcut and adapter paths reject distant virtual anchors before clipboard/model/history changes; immediate append remains bounded and works in all-hidden views. |
| R4 · P2 · Cleared trailing one-column rows disappear on serialization | Closed. CSV/TSV serialize/parse tests retain the final empty record, including all-empty data and raw identifier/Japanese values. Native file save/reopen remains unobserved. |
| R5 · P2 · Resize callback bursts create multiple Undo steps | Closed. Public resize-start/end boundaries form one transaction; selected-column burst, Undo/Redo, no-op drag and clean CSV-state tests pass. Actual pointer dragging remains unobserved. |
| R6 · P2 · Reveal overlays ignore same-region pixel offsets | Closed on adapter evidence. Public separate tx/ty parameters invalidate the cached viewport key. Same-cell-region scrolling, width changes and window resize recalculate mocked bounds. Real canvas placement/scrolling remains unobserved. |
| Later R1/R2-A · P1 · Filtered active-source inconsistency | Closed. Shared App visibility normalization handles filter application, new whole-column context and excluded active sources. Name-box ranges are refused with the actionable filter explanation if any requested source row is excluded. Independent endpoint/filter-Apply/new-column-context reproductions now preserve filtered-out data. An edit that itself excludes the active source stays aligned through Undo/Redo, including transition to no visible rows. |
| Later R2-B · P2 · Reversed Name-box range skips hidden reveal | Closed. Both axes normalize before filter validation/reveal/selection/scroll. Independent `B3:A1` copy includes hidden interior row 2; committed two-axis reverse-range tests cover copy and Undo/Redo. |
| Owner addition · All-empty pasted shape is treated as a no-op | Closed. Three quoted-empty rows/columns expand shape, survive serialization and undo once; unchanged shape/value remains a no-op and distant-virtual allocation stays blocked. |
| Owner note · Quadratic source remapping in sort | Addressed. Stable index buckets/cursors replace repeated findIndex/splice matching. The 4,000-row duplicate/hidden-identity App test passes. This is functional/source evidence, not a calibrated performance benchmark. |

No additional reproducible code defect was found in this final bounded pass. Original severity/reproduction/expected-versus-actual details remain in the linked prior reports; they have not been rewritten as though those failures never occurred.

## Final checks and exit statuses

Existing installed Linux/Node dependencies only; no download, new dependency, local build or product launch. Bun remains unavailable locally. After canonical blob verification:

- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `git diff --check`: exit 0.
- `node node_modules/vitest/vitest.mjs run --reporter=dot`: exit 0; **15 files / 156 tests passed**, including 36 committed App tests.
- Node stdin invoking `startVitest('test', ['src/tests/multiSelectApp.test.tsx'], {run:true,watch:false}, {plugins:[in-memory probe transform]})`: exit 0; **46 App tests passed**, comprising the 36 committed tests plus ten independent probes below.

The fresh ten-probe run covered:
1. Filtered Name-box endpoint refusal preserving a prior valid active source and excluded data.
2. Reversed Name-box reveal/copy including the hidden interior row.
3. Filter Apply followed by a formula edit.
4. New column context under filtering followed by a formula edit.
5. Editing a source out of the filter, Undo/Redo, then editing the next visible source until none remain.
6. All-filtered blank append coordinate, Copy no-op and new-column context.
7–8. Row/column deletion beside a hidden first target, Undo/Redo and formula edit.
9–10. All-hidden rows/columns, bounded append, Undo/Redo and formula edit preserving hidden originals.

The reviewer injected these probes into the existing harness only through an in-memory transform. No product or test file was changed. No Git ref, external comment or publication was performed by the reviewer; only this report was written.

## Separate acceptance gates

- Exact-code CI: independently read [Tauri Build run 38843935107](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38843935107) for `8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb`; it was **in progress** at the review's 03:08 UTC observation. This report does not claim its eventual result. Prior-SHA CI and the reported pre-existing Linux staging failure are not substituted for final-SHA evidence.
- Owner/local final recheck: coordinated separately and not claimed completed by this report.
- Real canvas hit testing/modifier selection, pointer resizing, viewport/frozen-gap geometry, smooth scrolling, native keyboard focus and Japanese IME remain **unobserved**.
- Windows OS clipboard and native save/reopen remain **unobserved**. Automated clipboard/file boundaries do not establish these behaviors.

Any later documentation-only head must be identified separately and verified source-equivalent before reusing this code review. It is not a new source build. Whole-task acceptance remains contingent on the explicitly separate gates and the owner's decision.
