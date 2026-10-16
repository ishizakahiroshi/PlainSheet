# P-20261016-003 PlainSheet: final evidence board

Updated 2026-10-16. Source/automated review is complete; GUI/native acceptance and the owner's final disposition remain separate.

- Branch: `dots/multi-select-P-20261016-003`; [Draft PR #6](https://github.com/ishizakahiroshi/PlainSheet/pull/6), base `develop`.
- Final product/test code and independent reviewed SHA: `8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb`.
- This board/report commit is documentation-only; the submitted head SHA is recorded after publication, with product/test blob equality checked against the code SHA.
- Fixed instructions: `5ee020fcd9aece26c7b74196959ba18958485746`; review baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
- Oracle/unchanged develop: `037c29ea4649efc81acc8f28824dca3df08e7450`.
- [Management Issue #5](https://github.com/ishizakahiroshi/PlainSheet/issues/5); [formal receipt](https://github.com/ishizakahiroshi/PlainSheet/issues/5#issuecomment-6206514827).
- Implementation owner: dots multi-select coordinator; separate reviewer: dots `review_multiselect_context_actions`.

| Stage | Actual evidence | Separate remaining gate |
|---|---|---|
| C1 selection/targets | Actual App/GlideSheet callbacks and DOM; whole row/column/rectangle preservation, counts, context/keyboard, stale-target guards and shared visible source invariant | Real canvas/modifiers/focus/IME |
| C2 batch editing | Real App/hooks for exact discontiguous targets, insert/duplicate anchors, clipboard failure, cancel/no-op, bounded virtual paste, empty dimensions and CSV/TSV reopen | OS clipboard/native file save |
| C3 width/movement/visibility | Selected widths and grouped drag Undo; block movement/state remap; document-local hidden state, gap/Show all, immediate formula/copy/edit/delete and all-hidden histories | Real pointer/layout/frozen-gap/smooth-scroll observation |
| C4 local automated | Exact-source TypeScript noEmit, ESLint and diff check exit 0; 15 files /156 tests passed | Does not substitute for GUI/native |
| Independent review | [Final exact-8dfc2 report](results/independent-review-8dfc2b10.md): no unresolved code findings; fresh 46/46 App tests including ten independent probes | Documentation-only source-equivalence verification after publication |
| Owner Windows recheck | Owner reports 15 files /161 tests (156+5), lint and noEmit pass; final App SHA-256 matches; full correction diff read | Owner final acceptance record |
| Exact-code CI | [Run 38843935107](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38843935107); see [final record](results/final-record.md) for per-job executed/skipped results | Pre-existing Linux staging failure remains outside feature scope; no all-green claim |
| Real product GUI/native | Unobserved, no product launch/build authorized locally | Canvas/layout/IME, OS clipboard and native save/reopen |

## Review history and final record

- [First implementation](results/implementation.md), initial code `0a0032e991ce893942564b487fb2f5ef6922ad8d`.
- [Six initial independent findings](results/independent-review-0a0032e9.md) and [owner consolidated findings](https://github.com/ishizakahiroshi/PlainSheet/issues/5#issuecomment-6206867467).
- [First correction](results/corrections-round-1.md), code `30213e268bd9141ea91a634de381a8714ecb566c`; [owner's initial Windows recheck](https://github.com/ishizakahiroshi/PlainSheet/issues/5#issuecomment-6207030593).
- [Later independent R1/R2 boundary failures](results/independent-review-30213e26.md) and [minimal final corrections](results/corrections-round-2.md). Earlier passes are not used to hide those failures.
- [Final record](results/final-record.md): exact identities, command/exit/count evidence, source equality, CI, unobserved gates, scope and rollback.

One Issue progress-comment call was cancelled and has not been retried or delegated. Distinct authorized Git/PR submissions succeeded. Coordination continues in the established task thread; the owner's final Issue record is separate. No changes to workflows, manifests, locks, native code, dependencies, persistence schema, other candidates or shared branches. No merge, release or deployment.
