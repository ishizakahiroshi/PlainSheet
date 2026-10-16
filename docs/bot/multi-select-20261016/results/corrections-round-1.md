# Consolidated correction candidate, round 1

P-20261016-003. 2026-10-16. The enclosing code commit is the correction candidate; its canonical SHA will be recorded in the submission/re-review record after publication. Draft PR: https://github.com/ishizakahiroshi/PlainSheet/pull/6 .

Inputs: independent review of `0a0032e991ce893942564b487fb2f5ef6922ad8d` in [the separate review report](independent-review-0a0032e9.md), plus [the owner's consolidated Windows/source review](https://github.com/ishizakahiroshi/PlainSheet/issues/5#issuecomment-6206867467). Overlapping findings were fixed once.

## Corrections and actual regressions

| Finding | Correction | Executed real App/adapter regression |
|---|---|---|
| Independent R1 / owner R1 | Normalize active source after visibility changes and structural fallback. If all data on an axis is hidden, select its explicitly mapped first blank append position. | Both axes: immediately inspect Name box/formula/highlight, copy, formula edit, clear and paste without a compensating canvas click; saved hidden data stays unchanged. Delete beside a hidden target; all-hidden clear/no-op, append and Undo. |
| Independent R2 / owner R2 | Explicit Name box and search navigation clears whole-axis selection. Requested hidden cells are revealed as document view state; filtered-out navigation is refused with a reason. Adapter navigation effects only scroll; App owns the selection. | Prior row and column selections replaced by a single cell or rectangular range; search reveals a hidden hit and copies just that hit. |
| Independent R3 / owner R3 | Paste anchors must be inside real data or its immediate next row/column; distant virtual targets are disabled. Compare destination shape as well as values before deciding a no-op. | Menu/shortcut/native adapter reject row 100000 without reading clipboard, dirty state or history. Three quoted empty rows and three empty columns retain dimensions; truly unchanged shape/value creates no entry. |
| Independent R4 | Quote a final otherwise-empty CSV/TSV record, distinguishing it from a trailing line ending or empty file. | Clear the last single-column value, save through App's data boundary, then use the actual serializer/parser to reopen with four rows and unchanged raw strings. All-empty one/three-row cases also retain positions. |
| Independent R5 | Use installed Glide `onColumnResizeStart` / `onColumnResizeEnd`; accumulate the drag and selected-column callbacks in one view-only history transaction. | Intermediate widths 200/250 and both selected-column mouseup callbacks produce one Undo/Redo; unchanged final width produces no history; CSV remains clean. |
| Independent R6 | Reposition gaps using public viewport `tx`/`ty` arguments, widths, zoom, container ResizeObserver and window resize. | Same cell rectangle with a -10px smooth-scroll offset moves the overlay; width and resize changes also recompute it. This is adapter/DOM evidence, not real canvas acceptance. |
| Owner sort source note | Replace repeated findIndex/splice matching with stable per-value index queues and cursors. Mapping is linear after the existing sort. | Actual App sort of 4,000 synthetic rows, including exact duplicates and one hidden duplicate, retains stable visibility identity and one-step Undo. This is a functional workload, not a calibrated performance benchmark. |

Also preserve inside-selection range state on context opening, guard the remaining sort/filter/freeze menu callbacks, execute keyboard menu Enter explicitly once, and guard formula/Name box Enter during IME composition. All source and test changes remain within frontend feature scope.

## Checks on the frozen correction source

Linux cloud workspace, the same existing installed cache documented in [implementation.md](implementation.md); no install, build or product launch.

- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node node_modules/vitest/vitest.mjs run --reporter=dot`: exit 0, **15 files / 152 tests passed**. Actual App tests increased from 15 to 32; hook tests remain 10. All 135 original candidate tests pass.
- `git diff --check`: exit 0.
- Initial regression development exposed two fallback-coordinate expectations and three test callback type errors; these were corrected before the full passing run. No failed run is represented as acceptance.
- Only synthetic fixtures are included. Scoped publication scan checks secrets/private paths/attachment data; workflows, manifests, locks, native code and dependencies remain unchanged.

## Initial candidate CI, separate from this correction

Exact initial code: `0a0032e991ce893942564b487fb2f5ef6922ad8d`. [Run 38840971238](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38840971238):

- [Windows job](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38840971238/job/116780714063): success, including frontend checks, native compilation and Windows staging.
- [macOS job](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38840971238/job/116780714252): success, including frontend checks, app bundle compilation and macOS staging.
- [Ubuntu job](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38840971238/job/116780714364): frontend checks and portable native compilation succeeded; unchanged `Stage release files (Linux)` failed with exit 2. The `ls` pipeline probes two differently cased binary names under `pipefail`; one missing path makes that pipeline fail. No workflow change is authorized or made.
- Non-platform build/staging steps were skipped as expected. Artifact upload skipped on all three PR jobs. Publish GitHub Release skipped. Ubuntu post-Bun cleanup skipped following failure; checkout cleanup succeeded.

The correction needs its own exact-SHA CI observation, independent re-review and owner recheck. Real canvas/layout/IME, Windows OS clipboard and native save/reopen remain unobserved and cannot be closed by these tests or CI. The cancelled Issue progress-comment call remains held without retry; new coordination goes through the owner in the established task thread.
