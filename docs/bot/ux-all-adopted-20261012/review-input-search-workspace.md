# C8 independent review: input, search, and workspace

## Verdict and fixed target

Changes requested. Nine concrete findings remain on the reviewed candidate, including four high-priority target/data-integrity defects. Ten independent synthetic regression assertions reproduce the findings. Passing the existing suite does not cover these cases.

- Local candidate: `4e264500c34216398f39067b86cbf55c89c8b887`.
- Corresponding remote candidate, as verified and supplied by the integrator: `a632ef64a2631e2dd00e63a84f6e12d8effb5469` (Draft PR #4; the same 71 source/test blobs).
- Local baseline: `d5b1a4f1b34fe173943d2e034ade599d0438d0e7`, mapped by the integrator to fixed instructions `8204b5442f602164148b725c3ad07190630e33c4`. The remote review origin is `bf7e54689742c35a2158c16f79823a66cb59ad85`; the intervening instruction update is documentation-only.
- Review date: 2026-10-12. This reviewer did not implement the reviewed code. Production and committed tests were not edited by this reviewer. Once integration fixes began, remaining inspection and all final reproductions used a `git archive` of the fixed local candidate, not the moving worktree.

## Prioritized findings

### F01 — P1: keyboard paste uses the active anchor instead of the selected range origin

**Locations:** `src/App.tsx:1047–1051,2173`; compare `src/App.tsx:1030–1034` and the installed Glide 6.0.3 `data-editor.tsx:3357–3364`.

Select A1:B2 by dragging from B2 to A1, so the active cell remains B2. Paste `X\tY\nZ\tW` through the keyboard event. The new capture route defaults to `selectionRef.current`, and writes B2:C3. C2/B3/C3 are changed outside the selected range. The existing context-paste route and Glide's own target calculation start at A1.

The production App/GlideSheet synthetic reproduction returns `[["a","b","c"],["d","X","Y"],["g","Z","W"]]` instead of `[["X","Y","c"],["Z","W","f"],["g","h","i"]]`.

**Minimal fix:** have both paste routes resolve the same normalized source-coordinate destination, retaining visible/source mapping exactly once. **Regression:** reversed row, column and two-axis anchors; compare keyboard/context output, filtered destinations, unaffected neighbors and one Undo. This is a new route regression affecting UX-008/014.

### F02 — P1: the keyboard context-menu key expands a cell selection to the entire column, even when cancelled

**Locations:** `src/components/GlideSheet.tsx:590–595`; `src/App.tsx:1151–1162,2211–2216`.

Select A2 in `header,keep / first,keep / second,keep`. Press Shift+F10, then Escape, then Delete. The keyboard entry always asks for a `column` menu. App replaces A2 with A1:A3 and sets the exact column axis; dismissal does not restore the selection. The production deletion callback subsequently empties A1:A3. The independent test observes all three A cells empty, rather than only A2.

The column menu itself does not contain Clear; the reproduced destructive sequence is **open, cancel, then clear**, not a nonexistent menu item. Opening the menu also drops multi-column/header selection gaps.

**Minimal fix:** distinguish cell, row and column keyboard contexts from the actual selected axes, and preserve the original point/range/exact axes through cancellation and menu-to-filter transitions. A separately labeled column-action button need not masquerade as a cell context menu. **Regression:** single-cell, reversed rectangle and disjoint header selections; Escape is selection-neutral; subsequent Copy/Cut/Clear acts on the unchanged target. Violates UX-024's explicit target-preservation requirement.

### F03 — P1: Settings bypasses the JSON/YAML header lock and allows property names to be sorted into data

**Locations:** `src/App.tsx:1868–1871,2300–2308,1464–1470`; `src/components/SettingsModal.tsx:161–169`; serializer boundary `src/lib/formats.ts:92–113`.

Open `[{"z":"b"},{"z":"a"}]` as JSON. The new First row control is correctly disabled, but Settings still offers an enabled header checkbox backed by an unrestricted callback. Turn it off, close Settings, and sort ascending. Actual rows become `a / b / z`, instead of `z / a / b`. JSON/YAML serialization always uses row zero as property names, so the next export has keys `a`, data `b` and `z`, and loses the intended key/data relationship.

This is a surviving legacy route overlooked by the new partial lock, not a claim that the old Settings component was newly introduced.

**Minimal fix:** derive/enforce effective header semantics centrally for object-list formats and apply the same policy to every settings route; explain the format constraint. **Regression:** JSON and YAML through both header controls, quick/multi-key sort, filters, tab switches and serialized round trip. Required by UX-004's structured-format distinction.

### F04 — P1: FormulaBar navigation crosses the hard ceiling and writes a column the grid cannot display

**Locations:** `src/App.tsx:2096–2106,861–868`; `src/components/GlideSheet.tsx:204–217,447–454`; `src/components/FormulaBar.tsx:167–178`.

Use the name box to go to XFD1, the last valid column. Focus the FormulaBar and press Tab without changing the empty value. App advances to XFE1; the controlled grid clamps back to XFD1. Focus the FormulaBar again, enter `outside`, and blur. The raw matrix now contains that value at column 16384, beyond the 16384-column grid limit. The test records `{address:"XFE1", canvas:[16383,0], overflow:"outside"}`. That cell is saved but cannot be selected through the name box, which correctly rejects XFE1.

**Minimal fix:** use one bounds policy for movement and all mutation entry points; reject an out-of-bounds mutation atomically with an explanation rather than silently clamp the canvas. **Regression:** Tab/Shift+Tab and Enter/Shift+Enter at both ceilings, invalid callback coordinates, unchanged dirty state on rejected movement, and no invisible rows/columns. The row boundary has the same source defect; the reproduction intentionally used the column boundary to avoid allocating a million rows. Violates UX-014.

### F05 — P2: unconditional paste capture turns unsupported clipboard content into a destructive empty-cell paste and discards HTML tables

**Location:** `src/components/GlideSheet.tsx:708–717`; `src/App.tsx:1047–1080`; `src/lib/clipboard.ts:72–78`.

With A1=`original`, dispatch a clipboard paste containing only `image/png` and no `text/plain`. `getData("text/plain")` returns an empty string, which is accepted as `[[""]]`; A1 is erased and becomes dirty. A second reproduction supplies a valid `text/html` table containing `new/value`, but no plain-text type: actual output is `[["","neighbor"]]`, not the table. The wrapper prevents the downstream grid paste handler from using that available format. The installed Glide implementation has explicit type checks and HTML-table decoding; this capture bypasses them. The exported custom-MIME helper is also not connected to this route.

**Minimal fix:** inspect supported clipboard types before preventing/committing; unsupported content must leave values/history/dirty untouched. Consume validated app metadata or safe HTML table data when available, preserving the existing raw-value/scope limits; distinguish an intentional empty `text/plain` cell from an absent text type. **Regression:** image/file-only data, HTML-only and HTML+plain tables, explicit empty plain text, self-copy blanks/trailing rows, and both paste routes. UX-008 HTML interoperability is an implementation gap, while the erasure is a reproduced product defect.

### F06 — P2: clicking a frozen-row reference retains the old exact header selection and copies the wrong cell

**Locations:** `src/components/GlideSheet.tsx:738–743`; `src/App.tsx:915–918,2165–2167`.

Load `header,other / first,keep`, freeze the first row, and select column B through its header. Click the frozen reference button `A: header`, then Copy. The application point/range changes to A1, but `selectedColumns` remains `[1]`; copy returns `other` from B1. The independent production test reproduces this mismatch.

**Minimal fix:** frozen-reference cell navigation must clear exact row/column axes through the same selection transition used by normal cell navigation. **Regression:** prior single/disjoint row and column selections, click a different frozen reference, then Copy/Clear and Undo; name box, grid selection and affected cells must agree. Applies to UX-014/021/024.

### F07 — P2: the replacement input silently removes literal newlines

**Location:** `src/components/SearchPanel.tsx:132–136`.

In literal replacement mode, paste `line1\nline2` into Replacement and replace `match`. Because this is a single-line HTML input, its value is sanitized to `line1line2` before the replacement callback receives it. The actual cell loses the newline. The helper's ability to handle newlines does not make them reachable from this UI.

**Minimal fix:** provide a multiline replacement editor, or an explicit, documented literal-newline insertion path that preserves the entered string. **Regression:** real component input events with LF/CRLF, literal `$1`, regex capture mode, preview/apply equivalence and one Undo. This is an unfulfilled UX-007 acceptance requirement in an inherited control, not a new helper arithmetic bug.

### F08 — P2: the search-scope banner contradicts the actual mutation scope

**Location:** `src/components/SearchPanel.tsx:83–85`; actual scope dispatch `src/App.tsx:730–742,1567–1575`.

Filter out one row, open search and explicitly choose All cells. The panel still says `検索・置換の対象: 表示中の行のみ` / `Search and replace: visible rows only`, although replacement includes hidden rows. A selected-cell scope similarly retains the all-data/visible-only banner. The reproduction confirms the contradictory visible-only message remains after switching to all-sheet scope.

**Minimal fix:** derive the banner from the effective selected scope, including no-target and hidden-row inclusion states; do not derive it solely from whether filters exist. **Regression:** filtered/unfiltered × sheet/visible/selection, stale selection invalidation, and both single/all replacement. Violates UX-023's target explanation contract; the later replace-all preview does not correct the always-visible contradiction for single replacement.

### F09 — P2: first-opened documents persist named views under the stale `untitled` label

**Locations:** `src/App.tsx:396–407,1644–1647`; `src/lib/namedViews.ts:117–119`.

Start the app, open the sample into the pristine starter tab, save a named view and opt into device persistence. The stored group's `fileName` is `untitled`, although the tab and dialog show `sample.csv`. App creates a named-view group during its initial empty render; replacing the blank starter retains the document ID, and `document(id,fileName)` ignores all later filenames. Save As has the same stale-label exposure. On reopening, the explicit document chooser therefore lacks the correct document display name, making the required intentional rebind harder and potentially ambiguous.

**Minimal fix:** update the session group's display filename when its document metadata changes, without using that name as an identity key or automatically applying/importing any preset. Persist the updated label only through already-opted-in storage operations. **Regression:** first import into starter, subsequent open into new tab, Save As, same-name isolated documents, and the reopened stored-group picker. The test reads actual stored JSON and observes `untitled` instead of `sample.csv`.

## Verification and artifacts

The temporary reproduction file is `review.test.tsx` in the review harness retained by the integrator. It imports the archived candidate's production App, GlideSheet, hooks, parsers and helpers. Only the DataEditor canvas renderer and native/clipboard I/O are mocked. HTML inputs, event propagation, application state and mutation handlers are real React/jsdom execution. The harness configuration and full `results.log` are retained alongside it; their exact temporary paths were sent directly to the integrator.

Final independent reproduction command, with the temporary root substituted for `<review-root>`:

```sh
node node_modules/vitest/vitest.mjs run --root <review-root> --config <review-root>/vite.config.ts --reporter=verbose
```

Result: **exit 1, one test file, ten failed regression assertions**, each failing on the expected wrong state described above. Seven earlier assertions were repeated after moving to the frozen archive, then three additional assertions were added; the final ten-test result is against that archive. An initial harness collection error was corrected by configuring Vite's allowed source roots; it is not counted as a product failure. An early menu reproduction attempted a nonexistent Clear menu item, was corrected to open/Escape/Delete, and is not the reported evidence.

The integrator separately reports, for the same frozen candidate: `node node_modules/typescript/bin/tsc --noEmit --pretty false` exit 0; `node node_modules/eslint/bin/eslint.js .` exit 0; `node node_modules/vitest/vitest.mjs run` exit 0 with 43 files / 515 tests. This reviewer did not independently rerun that complete suite. The targeted failures demonstrate uncovered integration cases, not that the reported aggregate run failed.

## Scope actually reviewed

- Read the fixed task README, parent/C1/C3/C4 plans, all proposal sections assigned to C1/C3/C4 (UX-008/013/014/015, 002/007/011/023/025/026, 001/004/016/021/022/024/028), FACTS, review instructions, research-review retractions, root README/CLAUDE/AGENTS, and relevant implementation/named-view contracts. The research's historical defer/reject wording was not treated as the current scope.
- Read all of `App.tsx`, `GlideSheet.tsx`, `SearchPanel.tsx`, `Toolbar.tsx`, `HelpModal.tsx`, `CommandSearch.tsx`, `FeatureDialog.tsx`, `NamedViewsPanel.tsx`, `useDialogFocus.ts`, `useFilter.ts`, `clipboard.ts`, `autofill.ts`, `decimal.ts`, `sort.ts`, `search.ts`, `gridOperations.ts`, `commands.ts`, `viewState.ts`, and `namedViews.ts`, including existing as well as new logic. Checked the changed-file diffs and supporting ContextMenu, FilterPopover, FormulaBar, selection/sheet helpers, limits, formats and installed Glide clipboard contracts.
- Read the C1/C3/C4 portions of `App.adoptedUx.test.tsx`, `App.extendedUx.test.tsx`, `App.integration.test.tsx`; the selection-history, GlideSheet/input-safety, SearchPanel IME, named-view helper/panel, clipboard, autofill, decimal, sort, search, filter, cell-reference and relevant dual-edition UI tests. Save/recovery/collaboration-specific suite coverage is owned by the other review scopes, although adjacent App integration was inspected.
- No additional arithmetic defect was found in the inspected exact-decimal sort/fill implementation. Seed exclusion, directional fill construction, literal/capture replacement helpers, whole-cell end matching, bounded search navigation with uncapped totals, and named-view cloning/schema checks were inspected without reviving the research's retracted hidden-row-fill diagnosis.

## Remaining acceptance boundaries

No product build, normal product launch, GPU/canvas interaction, real OS clipboard, native filesystem/window-close, real Japanese IME, assistive-technology, 640px/zoom or performance acceptance was performed. These remain pending and are not automatically product bugs. In particular, the alternative frozen-reference strip's actual scrolling/usability, its interplay with frozen columns, native reserved-key behavior and real dialog focus transitions still need the requested manual acceptance.

The general bulk-fill allocation ceiling also merits an explicit bounded test: `buildFillUpdates` currently builds a synchronous update for every destination cell before any App rejection, while virtual selections can be very large. This review did not execute a stress/OOM test and does not count that observation among the nine reproduced findings.

Re-review must bind the fixes and permanent regressions to a new code SHA; none of these findings is marked resolved by an unreviewed working-tree edit.

## Re-review — corrected candidate 6998073

### Target, result and original findings

- Fixed local code: `699807364a7fc8a9e285b2ad85a10cae298288aa`; integrator-supplied remote mapping: `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9`, Draft PR #4. Review date: 2026-10-12.
- **Changes still requested: one P1 and three P2 findings below.** All ten original independent regression assertions now pass on this corrected snapshot. Thus the specific original F01–F09 reproductions are corrected, but the broader F03 header-policy and F02 keyboard-menu contracts still have the additional failures below.
- Source inspection and independent challenge execution were pinned to a retained `git archive` of this SHA. Later integrator working-tree corrections are not credited by this addendum. This reviewer edited no production/test files.

### RR01 — P1: saving a headerless CSV as JSON/YAML locks in the wrong header interpretation

**Locations at this fixed SHA:** `src/App.tsx:489–498,766,1619,2022–2024,2527–2532`.

Load the one-column CSV `z\nb\na`, set First row to Data, then Save As `converted.json`. The format metadata changes, and both header controls become disabled, but `view.useHeaderRow` remains false. Quick ascending sort produces `a / b / z` instead of `z / a / b`. The newly written JSON used `z` as its key; a subsequent sort/save can therefore change that key and move it into the data. The real App integration reproduces this with mocked native I/O (test R01). The same false-view/locked-control path applies to YAML by source; the retained dynamic reproduction is JSON.

**Minimal fix:** enforce one effective header policy centrally for every object-list format, including metadata transitions and inactive-tab restoration, rather than only blocking header-control events. Keep CSV's explicit setting document-local. **Regression:** CSV Data → JSON and YAML, both header controls, quick/multi-key sort and filters, tab round trip, and raw/serialized key preservation. The original imported-JSON/YAML Settings tests pass but do not cover this transition.

### RR02 — P2: context paste checks one clipboard snapshot but commits bytes from a second read

**Location:** `src/App.tsx:1208–1231`.

When `navigator.clipboard.read()` returns a text/plain ClipboardItem, the implementation does not read that item's bytes. It calls `readText()` again. The acquired type/origin snapshot can therefore disagree with the committed text. In the reproduction, the first item contains `snapshot`; the later read returns an empty string, modelling a clipboard change before the second read completes. Context Paste erases A1=`original` instead of pasting `snapshot`. HTML-only paste already consumes the acquired item and does not have this particular split-read problem.

**Minimal fix:** consume `plain.getType("text/plain")` from the successfully acquired item and validate the captured destination after reading its bytes; use `readText()` only as the legacy single-read route when item reading is unavailable. **Regression:** assert one coherent acquisition, a plain item with empty/nonempty content, changed clipboard between APIs, plain+HTML priority, and unchanged destination/history on rejection. Retained test R02 fails with actual `""` versus expected `"snapshot"`. This is synthetic API sequencing evidence, not a claim about measured native clipboard race frequency.

### RR03 — P2: the keyboard menu fix removes column operations from column selections

**Locations:** `src/components/GlideSheet.tsx:609–615`; `src/components/ContextMenu.tsx:252–253`; selection transition `src/App.tsx:1327–1367`.

Select column B through the grid header and press Shift+F10. The new handler always requests a cell menu, so Sort/Filter are absent. The original single-cell cancellation problem is fixed, but UX-024's keyboard path from a column selection to its column/filter operations is no longer implemented. Retained test R04 uses the real wrapper and menu and fails to find Sort ascending.

**Minimal fix:** derive cell/row/column kind from exact selected axes, and carry a selection-preserving invocation mode rather than sending a column request through the old target-resetting transition. Do not reintroduce F02 when correcting the menu kind. **Regression:** cell, row, single/disjoint columns, reversed range; menu kind and first enabled focus; Escape preserves point/range/exact axes; Copy/Clear after cancellation still uses that exact target; separately test the Column actions button and menu-to-filter transition.

### RR04 — P2: advanced-sort keys from another document silently sort a missing column

**Locations:** `src/App.tsx:157–159,388–403,2699–2715,2772,2781`; `src/lib/sort.ts:37–40`.

Open a three-column document, choose C as sort key 1, then cancel. Open a one-column document containing `name / b / a` and reopen Sort. The only dropdown option is A and its DOM value is `0`, but the global `sortKeys` state still contains `colIndex: 2`. Confirm/Apply actually sorts nonexistent C, leaving `name / b / a` unchanged instead of `name / a / b`. The displayed column and executed key disagree. Retained test R05 confirms the dropdown displays A before demonstrating the unchanged output.

**Minimal fix:** bind draft keys to a document/schema, or reset/validate them before displaying or applying the dialog. Invalid keys must not silently fall through to an all-empty comparison. **Regression:** wide → narrow tab, same-tab column deletion, key reorder/removal, displayed preview matching the actual validated keys, and no-op/cancel history neutrality. Normal two-key full-row sort, preview cancellation and one Undo pass independently.

### Independent verification

Focused permanent suite command, executed while production/test files were frozen at the reviewed SHA:

```sh
node node_modules/vitest/vitest.mjs run src/tests/App.reviewInputCorrections.test.tsx src/tests/clipboardHtml.test.ts src/tests/autofill.bounds.test.ts src/tests/GlideSheet.inputSafety.test.tsx src/tests/GlideSheet.test.tsx src/tests/clipboard.test.ts src/tests/autofill.test.ts src/tests/decimal.test.ts src/tests/sort.test.ts src/tests/search.test.ts src/tests/namedViews.test.ts src/tests/namedViewsPanel.test.tsx src/tests/SearchPanel.ime.test.tsx src/tests/useFilter.test.ts src/tests/App.selectionHistory.test.tsx src/tests/exactSelection.test.ts src/tests/cellref.test.ts
```

**Result: exit 0, 17 files / 170 tests passed.** Read the full permanent `App.reviewInputCorrections`, `clipboardHtml` and `autofill.bounds` additions. These exercise the original fixes, HTML-table limits/shape, raw string priority, explicit empty versus absent plain text, header locks on import, navigation edges, frozen references, literal newline and scope labels.

Independent archived-App challenge command:

```sh
node node_modules/vitest/vitest.mjs run --root /tmp/plainsheet-c8-input-rereview --config /tmp/plainsheet-c8-input-rereview/vite.config.ts --reporter=verbose
```

**Final result: exit 1, one file / 18 assertions: 14 passed, four failed on the specific RR01–RR04 wrong states above.** All ten original assertions pass. Additional passing checks cover explanatory bulk-fill rejection without mutation, disabled command reasons and IME Enter, filtered structural-command disabling, Mac Command+H left unclaimed/Command+Shift+H replacement, repeated Find focus, and normal two-key sort/cancel/Undo. Two early harness expectations were corrected (the native tab's accessible name includes its path, and filter choices include counts); neither is counted as a product failure.

Artifacts retained for regression adoption: `/tmp/plainsheet-c8-input-rereview/review.test.tsx`, `vite.config.ts`, `results.log`, `header-transition.log`, and the `frozen/` candidate archive. The original `/tmp/plainsheet-c8-input-review/` artifacts remain intact.

The integrator reports the corrected whole-candidate commands separately: TypeScript `--noEmit` exit 0, ESLint exit 0, and Vitest exit 0 with **49 files / 607 tests**. Those aggregate facts are not an independent full-suite rerun by this reviewer and do not cover the four new cases.

### Re-review scope and remaining coverage

Re-read the fixed task README, C1/C3/C4 plan contracts and applicable proposal acceptance sections. Inspected the actual input/search/workspace corrections and their integration paths: keyboard/context clipboard parsing and destination origin, header policy, local FormulaBar navigation/mutation bounds, frozen-reference selection reset, multiline replacement, scope labels, named-view display naming, bounded fill, and the central command/menu/advanced-sort flows. Re-read the complete command helpers, CommandSearch, FeatureDialog/useDialogFocus, and relevant unchanged Toolbar/Help, ContextMenu, filter and named-view code rather than relying on the new tests alone.

The named-view first-open filename reproduction now passes and source refreshes the in-session display filename; no claim is made that a filename is a document identity. Both original paste origins, unsupported keyboard types, literal newlines, frozen axes and maximum-column navigation pass. Bulk fill now rejects oversized source/destination areas with a visible explanation in the App integration. Central command and advanced-sort integration had no matching committed regression coverage for the new challenges located during this review; the retained temporary tests supply specific evidence but should be adopted permanently. Full real-OS key routing, all command target labels, actual assistive-technology semantics, dialog/menu focus visibility, advanced-sort stale-preview mutation paths and physical canvas interactions remain acceptance gaps, not assumed failures.

No formula-engine, sharing-implementation or C6/C7 security re-review was performed. C2/C5 save/cleanup/recovery review remains separately owned; the Save As sequence above was used only to reproduce C4's effective-header-policy violation. No build, normal product launch, dependency change, external traffic, GPU/native OS clipboard, real IME or performance acceptance was performed. Later fixes require a newly fixed SHA and narrow recheck.

## Final narrow recheck — candidate 479a85d

**Result: RR01–RR04 are resolved on the fixed candidate; no new blocker was identified within this narrow C1/C3/C4 recheck.** This does not convert the pending GUI/native acceptance areas into passes.

- Local candidate: `479a85d62d5e9871baccf629ad2de79526ad887d`.
- Integrator-supplied exact remote mapping: `ac8194cb09a79d38332ba3421dc10a15d0aa00f3`, Draft PR #4.
- Review date: 2026-10-12. Compared the source delta from `699807364a7fc8a9e285b2ad85a10cae298288aa`, read the complete new permanent input-review regressions, and executed checks against a retained archive of the final candidate.

### Findings disposition

- **RR01 resolved:** `src/App.tsx:107–116` centrally derives the effective JSON/YAML header policy, so sort/filter/UI/view restoration consume `useHeaderRow: true` even after Save As changes the format. The original transition reproduction passes. Permanent JSON and YAML conversion tests also pass for quick sort, tab restoration, filter choices excluding the key row, and advanced sort.
- **RR02 resolved:** `src/App.tsx:1225–1250` consumes plain text from the already acquired ClipboardItem and uses `readText` only when item reading is unavailable. The original split-read assertion passes, and the permanent regression asserts that `getType("text/plain")` was used and `readText` was not called. An additional independent deferred-text check changes the selected destination before completion: no cells/history/dirty state change, and the context-change explanation appears.
- **RR03 resolved:** `src/components/GlideSheet.tsx:610–625` chooses cell/row/column from exact selected axes. `src/App.tsx:1346–1392` and the ContextMenu state carry selection-preserving invocation through cancellation and clipboard actions. Original cell cancellation and column-menu regressions pass. Permanent disjoint row/column cancellation-and-Copy tests pass. A further independent reversed-rectangle check verifies the Column actions button's initial menu focus, Escape neutrality and subsequent exact Copy target.
- **RR04 resolved:** `src/App.tsx:408,441,2091–2100` resets keys on document/content changes and removes invalid column keys when opening Sort. The original wide-to-narrow document reproduction now displays and executes A consistently. The normal multi-key whole-row sort, preview cancellation and one-Undo assertion still passes. Actual cross-document rendering/canvas interaction remains outside jsdom proof.

### Executed evidence

1. Repeated the **same 17-file focused permanent command recorded in the preceding addendum**, from the archived candidate: **exit 0, 17 files / 180 tests passed**. `App.reviewInputCorrections.test.tsx` now contributes 26 passing tests.
2. Repeated all 18 independent archived-App assertions and added the two bounded surrounding checks described above:

```sh
node node_modules/vitest/vitest.mjs run --root /tmp/plainsheet-c8-input-finalcheck --config /tmp/plainsheet-c8-input-finalcheck/vite.config.ts --reporter=verbose
```

**Result: exit 0, one file / 20 tests passed.** This includes the ten original reproductions, all four rereview failures, fill-limit feedback, command disable/IME/Mac shortcut checks, sort cancel/Undo, deferred ClipboardItem target rejection, and Column actions selection preservation.

Retained evidence: `/tmp/plainsheet-c8-input-finalcheck/review.test.tsx`, `vite.config.ts`, `results.log`, `permanent-results.log`, and `frozen/`. Earlier failing-candidate artifacts remain intact. The integrator separately reports final whole-candidate **49 files / 625 tests**, TypeScript `--noEmit`, and ESLint all exit 0; this reviewer independently ran the focused commands above, not the complete suite.

Scope remained the four findings and surrounding local input/search/workspace behavior. C2/C5 corrections are separately reviewed. No formula-engine, sharing-implementation or C6/C7 security review was restarted. No production/test edits, build, normal product launch, dependency change or external traffic were performed. Real OS clipboard permissions/timing, reserved keys, native window behavior, physical canvas/GPU, real IME, screen readers, focus visibility, narrow-width/zoom/high-contrast rendering and performance acceptance remain pending. No blanket release-readiness or accessibility-conformance conclusion is implied.
