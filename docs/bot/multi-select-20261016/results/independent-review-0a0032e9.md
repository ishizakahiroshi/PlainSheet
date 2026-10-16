# Independent review: first multi-select candidate

P-20261016-003 · 2026-10-16 · Reviewer: dots `review_multiselect_context_actions`, separate from the implementation owner. The reviewer made no product/test edits, Git-ref changes, or public comments. The only reviewer-authored repository file is this report.

**Outcome: changes required. Six findings remain open at the reviewed SHA.** Passing existing tests is not acceptance of these missing paths.

## Exact scope and evidence

- Reviewed canonical code SHA: `0a0032e991ce893942564b487fb2f5ef6922ad8d`.
- Full canonical diff baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
- Instructions revision: `5ee020fcd9aece26c7b74196959ba18958485746`.
- Behavior oracle / independently re-read `develop`: `037c29ea4649efc81acc8f28824dca3df08e7450`, unchanged at review time.
- [Draft PR 6](https://github.com/ishizakahiroshi/PlainSheet/pull/6).
- [Canonical bounded comparison](https://github.com/ishizakahiroshi/PlainSheet/compare/e676daae5224842ae238d4e0a8047cb0f2307f89...0a0032e991ce893942564b487fb2f5ef6922ad8d).
- The local exact-source candidate is synthetic commit `c64ebef056ff5267ae726d008d16d476e66ecd52`; the implementation owner verified its 16 candidate blobs against the canonical recursive tree. Its preparation baseline is `d2f505c4849515654b4fcc90abf31ed2559bc5da`, materialized from the fixed instructions revision, not a canonical Git ancestor.
- The reviewer independently queried the canonical comparison: 18 paths, two commits ahead, zero behind, and the expected baseline as merge base. The reviewer also read the preceding instructions-only commit, which accounts for README/FACTS/PROGRESS changes before the product candidate. Local product/test diff names and per-file statistics match the canonical comparison.
- No workflows, manifests, lockfiles, native code, dependency additions, authentication, persistence schemas, or old candidate branches were part of this diff.

### All bounded paths read

- `docs/bot/multi-select-20261016/FACTS.md`
- `docs/bot/multi-select-20261016/PROGRESS.md`
- `docs/bot/multi-select-20261016/README.md`
- `docs/bot/multi-select-20261016/results/implementation.md`
- `src/App.tsx`
- `src/components/ContextMenu.tsx`
- `src/components/GlideSheet.tsx`
- `src/hooks/useDocuments.ts`
- `src/hooks/useFilter.ts`
- `src/hooks/useHistory.ts`
- `src/hooks/useSheet.ts`
- `src/lib/clipboard.ts`
- `src/lib/i18n.ts`
- `src/lib/selectionTarget.ts`
- `src/styles/app.css`
- `src/tests/multiSelectApp.test.tsx`
- `src/tests/multiSelectHooks.test.tsx`
- `src/types/sheet.ts`

Also read SPEC/REVIEW, repository guidance, existing selection/formula/file/CSV/format callers, and installed Glide 6.0.3 public types and event forwarding. Glide's supported row-marker entry is `onCellContextMenu([-1, row], event)`; its post-context selection callback is addressed by the candidate's synchronous suppression and exercised by the existing App tests.

## Findings

### R1 · P1 · Hidden active source differs from the highlighted editable cell

Paths: `src/App.tsx:738–752`, `592–627`, `1112–1117`; `src/components/GlideSheet.tsx:463–467`.

Reproduction:
1. Load synthetic rows R1–R8.
2. Select and hide source row 1.
3. Without clicking another canvas cell, inspect or edit the formula input.

Expected: the active source, displayed highlight, formula input, keyboard target and context target refer to the same surviving visible cell, or an explicitly mapped virtual cell when all data is hidden.

Observed in the actual App/GlideSheet DOM probe: canvas cell `[0,0]` displayed `R2`; formula input contained `R1`; name box showed `A1`. Entering `replacement` in the formula input changed hidden source R1 while visible R2 remained unchanged. `changeVisibility` sets source selection to `{row:0,col:0}` even when hidden; the grid independently clamps a missing visible mapping to index zero. The same source-axis problem applies to hidden column A. A second probe hid row 1, deleted the first visible row, and found the active source still in hidden row 1 after `remapState` fell back to index zero.

Correction criterion: normalize active source selection after hide/unhide and structural fallback, including all-hidden state; do not fix only the painted grid selection. Add real App tests for immediate formula edit, copy/clear/paste, and deletion fallback without a compensating canvas click. A tested filter transition did not reproduce this mismatch; that negative result does not establish every filter transition.

### R2 · P1 · Name-box navigation retains a stale whole-row/column operation target

Paths: `src/App.tsx:848–863`, `414–425`; `src/components/GlideSheet.tsx:500–520`.

Reproduction: select whole row 2, enter `B3` in the Name box and press Enter, then use Ctrl+C.

Expected: the new cell target is B3 and copied text is `B3`.

Observed: `selectedRows` remains `[1]`, the final grid selection has no current cell, and Ctrl+C copies `R2\tB2\tC2\tD2\tE2\tF2`. The newly shared operation policy prioritizes the stale whole-row selection. Clear/cut and toolbar actions can therefore affect the previous row rather than the requested cell. `handleJump` updates selection/focus but does not clear whole-target arrays; `jumpSearch` has the same unsynchronized selection pattern and should be checked.

Correction criterion: every entry point which deliberately changes selection kind must update the shared whole-target state, with tests through Name box and search navigation for both row and column selection.

### R3 · P2 · Virtual-row context paste materializes the entire virtual gap

Paths: `src/lib/selectionTarget.ts:89–98`, `src/App.tsx:522–573`, `src/components/GlideSheet.tsx:693–705`.

Reproduction: in the eight-row fixture, open the row-marker context menu at visible row index 99999 and choose Paste with one clipboard cell.

Expected: a bounded existing-data/append policy consistent with C1; the fixed 100,000-row virtual canvas must not become actual data solely from the context target. Ordinary deliberate editing/pasting into the bounded editable area should remain usable.

Observed: the menu has zero real row targets but Paste is enabled; `targetContiguous([])` permits it, the unchecked anchor remains 99999, and save receives exactly 100000 rows. The final row contains `paste`. The existing virtual-target test checks only deletion and insertion, so it misses this path.

Correction criterion: bound or explicitly disable far-virtual context paste with an actionable reason, and assert saved row/column counts. Cover both the menu and shared shortcut policy rather than changing only the label.

### R4 · P2 · Preserved trailing empty positions disappear in real save/parse round-trip

Paths: changed `src/hooks/useSheet.ts:213–223` and `src/tests/multiSelectApp.test.tsx:248–266`; shared existing `src/lib/csv.ts:81–86,89–98` and file serialization call sites.

Reproduction: load `[["00123"],["日本語"],["last"]]`, clear the last whole row, then serialize and parse through the existing CSV functions used by normal file saving.

Expected: all three rows survive, with the last row containing an empty cell.

Observed: the in-memory saved rows correctly remain `[["00123"],["日本語"],[""]]`; serialization produces `00123\n日本語\n`; parsing returns only the first two rows. The parser interprets that final newline as a record terminator, not an additional empty record. One-cell all-cleared data likewise needs an unambiguous serialized record. This is an integration gap exposed by the new content-only-clear guarantee; the unchanged serializer's prior behavior is not proof that the new position promise survives saving.

Correction criterion: preserve trailing/all-empty real records in CSV/TSV output without inventing view-state values or changing restart persistence. Add actual format round-trips with row counts, beyond the mocked Save callback that merely captures `getRows()`.

### R5 · P2 · One native column-width drag creates multiple Undo entries

Paths: `src/App.tsx:759–769,1162`; `src/components/GlideSheet.tsx:690–692`.

Reproduction: one drag emits `onColumnResize` at widths 200 and 250 from an initial width of 72, then Undo once.

Expected: one width action, one Undo restoring 72; no CSV dirty state.

Observed: Undo restores 200 and another Undo remains enabled. Each intermediate resize callback calls `recordBeforeChange`. Installed Glide exposes `onColumnResizeStart` and `onColumnResizeEnd`, and emits intermediate resize callbacks during the same drag. The candidate does not connect those transaction boundaries.

Correction criterion: group a drag (including Glide's multiple selected-column resize callbacks) into one reversible width transaction. Preserve view-only dirty semantics and context-menu batch width behavior.

### R6 · P2 · Hidden-gap overlays ignore smooth-scroll pixel offsets

Paths: `src/components/GlideSheet.tsx:158–165,217–245`.

Reproduction in the real adapter with its grid-boundary test double: hide row 2; expose gap bounds at y=80; emit visible region `{x:0,y:0,width:4,height:8}`; change reported bounds to y=70 and emit the same region with `ty=-10`.

Expected: reveal affordance moves to `top:70px` with its hidden gap.

Observed: it remains at `top:80px`. The installed public callback includes `tx`/`ty`, but `onViewportChanged` keys only on integer row/column region coordinates/dimensions and suppresses this update. This is a deterministic adapter/DOM result, not an observation of a running canvas. The always-reachable Show all path works and reduces the impact; it does not align the gap control.

Correction criterion: account for pixel transforms and relevant width/zoom/container changes when obtaining gap bounds, with a source/event test and later real scroll/layout acceptance.

## Commands and results

Environment: existing Linux/Node frontend dependencies only; no installation/download, build, product launch, or native operation. Bun is absent, so prescribed Bun wrappers were not executed.

| Command/check | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run src/tests/multiSelectApp.test.tsx src/tests/multiSelectHooks.test.tsx src/tests/clipboard.test.ts src/tests/useDocuments.test.ts src/tests/useFilter.test.ts src/tests/useSheet.test.ts` | Exit 0; 6 files, 45 tests passed |
| `node node_modules/vitest/vitest.mjs run` | Exit 0; 15 files, 135 tests passed |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 |
| `node node_modules/eslint/bin/eslint.js .` | Exit 0 |
| `git diff --check` | Exit 0 |
| Node stdin invoking `startVitest('test', ['src/tests/multiSelectApp.test.tsx'], {run:true,watch:false}, {plugins:[in-memory probe transform]})`, primary probes | Exit 1; all 15 original App tests passed; 3 added assertions failed, reproducing R1, R2 and R3 |
| Same in-memory Vitest method, secondary probes | Exit 1; original 15 tests and filter probe passed; 3 assertions failed, reproducing R1 deletion fallback, R4 and R5 |
| Same method, gap-offset probe | Exit 1; original 15 tests passed; 1 assertion failed, reproducing R6 |

The extra probes were injected only into the test-runner's in-memory transform of the existing App harness. No test files were added or edited. They execute actual App, GlideSheet, state hooks and DOM handlers; only the existing external canvas/file boundaries are mocked. R4 additionally calls actual CSV serialization/parsing. Assertions and exact observed values are recorded above so the implementer can add permanent regressions without copying a model of the implementation.

Two preliminary Node stdin attempts to run a direct CommonJS-transpilation harness exited 1 on module resolution before executing the App probes; no behavior conclusions were drawn from them. The installed Vitest harness then ran successfully and produced the failures above. No permission or policy denial occurred in this review.

## Positive coverage and remaining gates

Reviewed and exercised existing tests for inside/outside cell/marker/header contexts, synchronous post-context selection callbacks, contiguous/discontiguous targets, exact delete/copy/clear gaps, insertion/duplication after maximum, cancel/clipboard failure, trailing in-memory positions, all-row/all-column editability, source-mapped filtered copy, blocked filtered structural/content actions, view-only width dirty state, undo/redo snapshots, hidden-data save input, A→B→A view isolation, all-hidden Show all, keyboard invocation/arrows/Escape/focus, IME guard, and bounded menu DOM coordinates. Raw long identifiers/Japanese/quoted tabs and newlines are covered by actual clipboard helpers. Movement, width and metadata paths were read, including frozen-boundary blocking.

Coverage limitations remain material:
- The canvas DataEditor is mocked. Actual pointer hit testing, Shift/Ctrl interaction, native keyboard Enter activation, focus behavior and layout are not established by callback injection. The existing test title mentions Enter but does not actually assert Enter activation.
- DOM viewport tests use mocked/jsdom bounds. Real narrow-window/overflow and gap-overlay geometry are unobserved.
- Japanese IME composition, Windows OS clipboard, native save/reopen and other real product acceptance remain unobserved because product launch is not authorized.
- Source inspection confirms file saving receives all source rows, including hidden data, but native output has not been observed, and R4 shows why a mocked save is insufficient.
- Exact-SHA CI is owned by the parent coordinator; this reviewer did not independently reclassify its jobs or skipped steps as passed.
- Owner/local comprehensive review remains separate.

No finding has been fixed/rechecked at a revised SHA yet. Re-review the corrections and affected callers at the next exact canonical code SHA; do not carry this candidate's test success forward as a new-SHA pass.
