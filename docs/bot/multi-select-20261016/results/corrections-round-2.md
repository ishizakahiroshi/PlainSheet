# Final source-target correction candidate

P-20261016-003. 2026-10-16. This is a bounded continuation of original R1/R2, not a feature addition. The owner clarified that routine defect corrections and independent re-review remain within the original branch/PR delegation. Publication was held until that clarification; no held operation was retried or bypassed.

## Why 30213e2 was not the final accepted source

The [independent exact-SHA report for 30213e268bd9141ea91a634de381a8714ecb566c](independent-review-30213e26.md) confirms the original six reproduction cases were corrected, but found two related groups with four new failure assertions:

1. Filter `[["keep","A"],["drop","B"],["keep","C"]]` to `keep`, then enter Name box `A1:A2`. Only the first endpoint was validated; FormulaBar could edit filtered-out source row 2 while the grid highlighted visible row 1.
2. After filtering `[["keep","A"],["drop","B"]]` to `keep`, filter application itself could leave the active formula target on excluded row 2.
3. Opening column B's context after that filter likewise left the formula edit target on hidden B2.
4. Hide source row 2 and enter reversed range `B3:A1`. Reveal decisions preceded endpoint normalization, so copying omitted source row 2.

The owner's [Windows recheck of 30213e2](https://github.com/ishizakahiroshi/PlainSheet/issues/5#issuecomment-6207030593) passed all 152 published tests plus the five initial owner challenges (157 total). That result and these later independent failures are both retained; passing the earlier challenges did not close the newly found boundaries.

## Minimal correction and evidence

Product change: `src/App.tsx` only.

- Enforce the shared active-source visibility invariant after filter/view/structural/selection changes. Excluded whole-row/column targets are pruned; the formula source cannot remain on a hidden cell while the adapter paints another one. No-visible-data state maps explicitly to the blank append coordinate.
- Normalize both range axes before validation, reveal, selection and scrolling.
- Under filtering, reject a requested Name box range if any requested source row is excluded. Refusal keeps the prior valid selection and displays the existing actionable filter explanation.

Four additional actual App regressions cover filtered endpoint/interior/reversed refusal, reverse-range reveal/copy/Undo/Redo, filter application, and new-column context with formula edit and Undo/Redo. Test helpers use actual DOM focus so native blur and canonical Name box text participate in the event path.

Checks on the frozen local correction, before publication:
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node node_modules/vitest/vitest.mjs run --reporter=dot`: exit 0, **15 files /156 tests passed**, including 36 App tests and all previous 152 tests.
- `git diff --check`: exit 0.
- Separate reviewer local preparation: all four original additional failure probes now pass (36 committed-candidate App tests + 4 independent probes = 40/40); two further all-filtered/edit-transition/Undo/Redo probes pass in a separate 38/38 run. No additional inconsistency found in that bounded preparation. This is not yet canonical-SHA approval; the final published SHA must be independently checked.
- Local reviewed App SHA-256: `abfba4f482beb3299786c57d5a5de3c80c98309125891a7c773005173b322297`.

## Prior correction CI, not this final source

[Run 38842737993](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38842737993) belongs to exact code `30213e268bd9141ea91a634de381a8714ecb566c`:
- [Windows 116786292037](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38842737993/job/116786292037): success.
- [macOS 116786291698](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38842737993/job/116786291698): success.
- [Ubuntu 116786292019](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38842737993/job/116786292019): 15 files/152 tests and native release compilation passed; unchanged Linux staging failed exit 2.
- Artifact upload skipped on all platforms; release publication skipped; non-platform steps skipped. Ubuntu post-Bun cleanup skipped, checkout cleanup passed.

The Linux staging issue predates this feature per the owner's historical comparison and remains outside scope. Workflow, other candidates and main/develop are unchanged. Real canvas/layout/IME, OS clipboard and native save/reopen are unobserved. No local build or launch was performed. The cancelled Issue progress-comment call is still held without retry. Final exact-head independent review, owner recheck and CI evidence will be recorded separately.
