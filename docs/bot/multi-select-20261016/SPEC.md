# P-20261016-003 PlainSheet: implementation and acceptance contract

## Context allocation

| C | State | Deliverable |
|---|---|---|
| C1 | planned | One target contract for selection, context entry points, counts and keyboard handling |
| C2 | planned | Batch delete/insert/copy/cut/paste/duplicate/content-only clear |
| C3 | planned | Batch column width, block movement, visibility, history and document state |
| C4 | planned | Comprehensive candidate checks and fixes, independent review, CI and remaining local gates |

All four are required. Finish basic edits before additional movement/visibility. Shared files are serial integration work. Mark source/static results separately from real GUI/native results.

## C1: Target selection

- Distinguish whole-row selection, whole-column selection, and rectangular cell selection. If whole rows/columns are selected, right-clicking their selected cells opens that whole-row/column menu.
- Right click inside the selection preserves all selected rows/columns. Right click outside replaces it with the clicked row/column/cell. Never apply to a stale, unrelated selection.
- Support Shift range selection and Ctrl discontiguous selection. Show a menu heading such as `5 rows selected`, and identify row numbers/column letters/ranges. Action labels include the count.
- Resolve indices to actual source rows/columns, sort/deduplicate, bound to real data, and avoid treating the 100,000-row virtual grid as materialized data. Virtual-only destructive actions are disabled; insertion remains bounded.
- Snapshot document identity and target indices when opening the menu; verify before applying. Close the menu on document/structural changes rather than acting on stale targets.
- Connect row-marker, column-header, and cell context paths using the installed Glide version's public events/types. Do not guess an unsupported callback name.
- Add Shift+F10/menu-key opening, arrows/Enter/Esc, focus return, and IME guards. Position the menu inside the viewport with reachable overflow and existing styling/localization.

C1 expected files: App.tsx, components/GlideSheet.tsx, components/ContextMenu.tsx, hooks/useSelection.ts, lib/i18n.ts, styles/app.css; add a target helper only if useful. Add actual event-path/DOM tests, not only pure target shape tests.

C1 acceptance: selecting rows 2–6 and right-clicking any selected cell or row marker leaves all five selected and shows the five-row menu. Columns behave equivalently. Clicking outside shows the new single target. Keyboard invocation reaches the same actions; Esc restores focus/selection.

## C2: Batch editing

| Action | Exact behavior |
|---|---|
| Delete N rows/columns | Remove exactly the selected real targets, shift the remainder, and confirm with target count/ranges. Cancel is a no-op |
| Insert N above/below/left/right | Insert one blank block of the selection count. Above/left anchors at the minimum selected index; below/right anchors immediately after the maximum, regardless of where inside the selection was clicked |
| Copy | Serialize only the selected rows/columns, in original order. Omit intervening unselected rows/columns for discontiguous selections; preserve quoted tabs/newlines and raw strings |
| Cut | Copy successfully first, then clear only that target's content. Clipboard failure must leave data unchanged |
| Paste | For a contiguous row/column/range selection, use its top-left anchor with existing rectangular paste semantics. For discontiguous selection, disable paste with an actionable reason; do not silently distribute or overwrite gaps |
| Duplicate | Keep originals; insert selected targets in original order as one new block just after the maximum selected row/column |
| Clear contents | Empty values while keeping all targeted row/column positions, including trailing rows/columns. Distinguish this from deletion |

- One batch mutation = one Undo/Redo. Failure, cancellation, and a no-op create no data change, unnecessary dirty state, or extra history entry.
- Keep at least an editable empty grid and Undo access after deleting the last/all rows or columns. Do not corrupt ragged row shapes or emit an unusable empty state.
- Menus, toolbar, and existing shortcuts use the same target/operation policy. Column menus gain the applicable common edit actions.
- While filtering is active, retain the existing structural edit restriction for delete/insert/duplicate/move. Cut/clear stay disabled unless correct source-target mapping has been established and tested; choose a consistent visible explanation. Copy is available for the selected visible source rows. For column copy, rows are all real data rows without filtering and visible data rows with filtering; show the affected count.

C2 expected files: App.tsx, hooks/useSheet.ts, hooks/useHistory.ts, types/sheet.ts, lib/clipboard.ts, components/ContextMenu.tsx, components/ConfirmDialog.tsx, lib/i18n.ts, and tests for actual hooks/App/clipboard. Reuse existing batch operations rather than recreating them.

C2 acceptance: on synthetic rows R1–R8, selecting 2/4/6 removes/copies/clears exactly those rows, leaving 3/5 untouched. Selecting 2–6 then inserting below adds five rows after 6; duplicate reproduces those five in order. Clear keeps positions. Single Undo/Redo reverses/repeats the whole operation. Repeat for columns, last/all targets, failure and cancel paths.

## C3: Width, movement and visibility

- Column width actions: auto-fit each selected column; set all selected columns to the clicked selected column's current width, displayed in px. Leave unselected widths unchanged.
- Move one contiguous row/column block up/down/left/right by one position, retaining internal order. Disable crossing a sheet boundary and movement of discontiguous targets, with visible reasons. Move all cells belonging to each row and keep column-associated state attached to its column.
- Hide selected rows/columns as view state only. Show a reveal affordance at hidden gaps and an always-reachable `Show all` path even when every target is hidden. Selection/copy/edit must continue to resolve to the intended source positions.
- Width and visibility changes each have one Undo/Redo and do not mark unchanged CSV data dirty. Extend the actual history contract as needed; do not claim current history already restores view state.
- Visibility belongs to the document tab, survives A→B→A in this session, and does not introduce a new restart-persistence format. Normal saving includes hidden real data; never write view settings into CSV/TSV/JSON/YAML/Markdown table values.
- On insert/delete/move, remap column widths, filter indices, frozen columns, visibility, and selection so they do not attach to different data. If a state cannot be safely remapped, explain and block before mutation. Keep existing single-target behavior.

C3 expected files: App.tsx, components/GlideSheet.tsx and ContextMenu.tsx, hooks/useSheet.ts/useHistory.ts/useDocuments.ts/useFilter.ts, types/sheet.ts, lib/columnWidth.ts, lib/i18n.ts, styles/app.css, and relevant hook/history/document/filter/width/App tests.

C3 acceptance: only the three selected columns change width and Undo restores them. A contiguous block moves one position without losing values/metadata. Hidden gaps and Show all remain visible/reachable; tab state does not leak. Editing after hide/unhide affects the correct source row/column; saving and reopening preserves all data.

## C4: Comprehensive candidate acceptance and corrections

Assemble the whole candidate, then run one comprehensive review instead of asking the user to test each feature. Fix the consolidated findings and recheck affected paths.

Check single/contiguous/discontiguous selections, first/last/all targets, virtual space, header on/off, filtering, hide/unhide, tab switch, stale open menus, clipboard failure, confirmation cancellation, keyboard focus/IME, viewport bottom edge and narrow width. Assert expected versus actual values/row counts; unchanged values alone are insufficient if positions collapse.

Use synthetic fixtures containing `00123`, long digit strings, Japanese text, empty cells, tabs/newlines and ragged rows. Preserve their raw values through copy/cut/paste, movement, undo and save round trips; no implicit number conversion.

Automatic checks: `bun run test`, `bunx tsc --noEmit`, `bun run lint`, and existing PR CI. Report commands/exit codes/exact SHA, actual executed jobs and skipped steps. If dependencies are unavailable in dots, commit the tests and use the existing PR CI; do not report unrun checks as passed.

The independent reviewer follows REVIEW. Local coordinator reads all changed lines and tests at the submitted SHA, sends one consolidated list, and verifies corrected results. Real canvas/browser/Windows clipboard/IME/native save acceptance needs actual observation in an authorized running product; source, mocks, CI and cross-compilation do not substitute for it. Leave these explicitly pending when the environment cannot observe them.

Additional ideas recorded but not required: whitespace cleanup, duplicate-row deletion, selected-only file export. Do not implement these here or broaden to formula/collaboration features.
