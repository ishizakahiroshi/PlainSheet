# Independent re-review: correction round 1

P-20261016-003 · 2026-10-16 · Reviewer: dots `review_multiselect_context_actions`, separate from the implementation owner.

**Outcome: the original six reproductions are corrected, but two related filtered-active-source and range-normalization boundaries still require correction.** Original R1/R2 cannot be considered fully closed until these boundaries are rechecked.

## Exact scope

- Reviewed canonical code SHA: `30213e268bd9141ea91a634de381a8714ecb566c`.
- Full bounded diff baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
- Prior reviewed code SHA: `0a0032e991ce893942564b487fb2f5ef6922ad8d`.
- Fixed instructions: `5ee020fcd9aece26c7b74196959ba18958485746`.
- Exact-source local correction snapshot: `65c8952b925882d960caf31d3303c70f6c017084`, matched to canonical corrected source by the implementation owner.
- Independently re-read `develop`: `037c29ea4649efc81acc8f28824dca3df08e7450`, unchanged.
- [Draft PR 6](https://github.com/ishizakahiroshi/PlainSheet/pull/6).
- [Full bounded compare](https://github.com/ishizakahiroshi/PlainSheet/compare/e676daae5224842ae238d4e0a8047cb0f2307f89...30213e268bd9141ea91a634de381a8714ecb566c).
- [Owner consolidated review read in full](https://github.com/ishizakahiroshi/PlainSheet/issues/5#issuecomment-6206867467).

The reviewer independently queried the canonical compare: 22 paths, three commits ahead, zero behind, with the expected baseline as merge base. The full prior review remains in [independent-review-0a0032e9.md](independent-review-0a0032e9.md). All ten correction paths were read against the prior exact-source candidate: App, ContextMenu, FormulaBar, GlideSheet, CSV serializer, i18n, App tests, PROGRESS, corrections-round-1 and the published prior independent report. Unchanged paths from the prior 18-path review were retained in the bounded scope. The four added bounded paths are FormulaBar, CSV, corrections-round-1 and the prior independent report. No workflows, manifests, lockfiles, native code, dependencies, persistence schema or old branches entered the scope.

No source/test edits, Git changes, external comments, builds or product launch were performed by this reviewer. Only this report was written.

## Rechecked corrections

| Original finding / owner addition | Recheck at this SHA |
|---|---|
| R1: hidden active source | Immediate actions after hiding the first row/column now use the correct visible source. Both delete-beside-hidden cases pass. Four additional independent App probes cover row/column delete, Undo/Redo and subsequent formula edits, plus all-hidden append, Undo/Redo and formula edits. All four pass and preserve hidden original data. Range/filter interaction below remains open. |
| R2: stale whole-target navigation | Name-box cell/forward-range and search navigation clear whole-target arrays. Hidden search hits are revealed. Existing revised App regressions pass. Reversed/filter-spanning ranges below remain open. |
| R3: distant virtual paste | Menu, keyboard and adapter paths reject row 100000 before clipboard read/data/history mutation. Bounded append remains available, including all-hidden view. |
| R4: trailing empty record persistence | Actual CSV/TSV serialization/parsing retains final cleared one-column records and all-empty records by quoting the final empty record. Raw identifier/Japanese values remain unchanged in the exercised round-trips. |
| R5: width transaction history | Installed public resize-start/end boundaries group selected-column callback bursts into one history transaction. Intermediate drag, Undo/Redo, no-op drag and clean CSV-state tests pass. |
| R6: gap pixel offsets | Public separate tx/ty arguments are included in the viewport key. Same-cell-region offset changes, width changes and window resize recalculate gap positions in the adapter/DOM tests. Actual canvas layout remains unobserved. |
| Owner R3: all-empty paste shape | Three quoted-empty rows/columns change shape, survive serialization, and undo once. Unchanged shape/value remains a no-op; the distant-virtual guard is retained. |
| Owner sort note | Source inspection confirms stable index buckets/cursors replace quadratic repeated findIndex/splice matching. The 4,000-row App workload with exact duplicates/hidden identity passes; this is functional evidence, not calibrated performance measurement. |

The revised DOM test explicitly executes menu Enter once and checks the formula input's composing-Enter guard. These remain simulated events rather than real keyboard/IME acceptance.

## Remaining findings

### R1/R2-A · P1 · Filtered active-source alignment is not enforced across navigation, filter changes and column contexts

Paths: `src/App.tsx:914–920`, `handleJump`, filter application and `openContextMenu` column-selection callers; `src/components/GlideSheet.tsx` source-to-visible selection synchronization.

Reproduction through actual App/GlideSheet hooks and DOM:
1. Load `[["keep","A"],["drop","B"],["keep","C"]]`.
2. Filter column A to `keep`.
3. Enter `A1:A2` in the Name box and press Enter.
4. Change Cell content to `edited visible` and press Enter.

Expected: either refuse the incompatible range with an actionable explanation and leave the prior valid selection intact, or establish a consistent visible-source range. A displayed active cell must not edit filtered-out data.

Observed: prepareNavigation validates only the first row. The requested range ends in filtered-out source row 2; selection state selects that endpoint, while Glide clamps its missing visible mapping to `[0,0]`. Probe output before edit: reference `A1:A2`, formula `drop`, grid current `[0,0]`, canvas value `keep`. After Enter, saved data is `[["keep","A"],["edited visible","B"],["keep","C"]]`: filtered-out data changed.

Two further actual App probes confirm this is broader than the Name box:
- Load `[["keep","A"],["drop","B"]]`, open column A context and apply a `keep` filter. Formula remains `drop` with reference `A1:A2`, while the visible selected column contains `keep`. Formula Enter edits filtered-out source A2.
- After that filter, open column B context and dismiss with Escape. Formula contains `B` and reference `B1:B2`, while visible column B contains `A`. Formula Enter edits filtered-out source B2.

Both assertions that source row 2 stays unchanged failed. These paths need the same visibility invariant as direct navigation; only validating Name-box ranges would leave them open.

Correction criterion: enforce a shared active-source visibility invariant after filtering and column context selection as well as navigation; normalize the requested range and validate its active endpoint and the whole source-target visibility policy under filters before changing selection. Add permanent forward/reversed filtered-range tests proving rejection is a no-op or all representations remain aligned. This is the same source-target correctness contract as original R1/R2, not an additional feature request.

### R2-B · P2 · Reversed Name-box ranges do not reveal the same hidden targets

Path: `src/App.tsx:914,922–925`.

Reproduction: hide source row 2 in the R1–R8 fixture, then navigate with the equivalent reversed range `B3:A1` and copy.

Expected: the same source range/reveal behavior as `A1:B3`, including R1, R2 and R3 in the copy.

Observed: hidden row 2 stays hidden because `r < row || r > endRow` is applied before endpoints are normalized. The grid range is two visible rows; copied text is `R1\tB1\nR3\tB3`, omitting R2. `parseCellRef` accepts reversed endpoint syntax, and useSelection normalizes it only after prepareNavigation has already made the wrong visibility decision. Columns have the analogous endpoint condition.

Correction criterion: normalize both axes once before filter validation and visibility changes; prove forward/reversed equivalents use the same targets, history behavior and copy results.

## Verification commands and outcomes

Existing installed Linux/Node dependencies only; no new dependency, download, build or product launch. Bun wrappers remain unavailable locally.

- `node node_modules/vitest/vitest.mjs run --reporter=dot`: exit 0, 15 files / 152 tests passed.
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `git diff --check`: exit 0.
- Node stdin invoking `startVitest('test', ['src/tests/multiSelectApp.test.tsx'], {run:true,watch:false}, {plugins:[in-memory probe transform]})`, range-boundary probes: exit 1. All 32 committed App tests passed; two additional independent assertions failed with the exact outputs recorded above.
- The same in-memory method, filter-change/column-context probes: exit 1; all 32 committed App tests passed and both additional independent assertions failed as recorded above.
- The same in-memory method, hidden-history probes: exit 0; all 32 committed App tests plus four additional independent row/column deletion/all-hidden Undo/Redo/formula checks passed (36 total).

The extra probes were injected only into the existing harness's in-memory transform. No product or test file was modified. External canvas/file-IO boundaries remain mocks; actual App, adapter, hooks and DOM handlers execute.

## Unobserved/separate gates

Real canvas hit testing and modifier selection, browser/window geometry and smooth scrolling, Japanese IME behavior, Windows OS clipboard and native file save/reopen remain unobserved. Source and DOM tests cannot close them. Exact corrected-SHA CI and owner/local recheck are separate and are not claimed passed by this report. The parent has reported a pre-existing Linux staging failure in prior CI; no workflow change was made or requested by this reviewer.

Re-review the two remaining boundaries at the next exact published code SHA. Do not describe whole-task acceptance as complete from the passing 152 committed tests.
