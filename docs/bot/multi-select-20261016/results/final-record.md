# Final source and review record

P-20261016-003 · 2026-10-16. Draft PR: https://github.com/ishizakahiroshi/PlainSheet/pull/6 .

## Identifiers and disposition

- Final product/test code SHA: `8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb`.
- Independent reviewed SHA: the same `8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb`.
- Code tree: `954b8738e8ae2f58a9d2a3c97841bb07f94aae08`.
- The commit containing this final record is documentation-only. Its final head SHA is returned in the submission/PR record after publication; it is distinct from the code/review SHA above. All product and test blobs must remain identical.
- Fixed instructions: `5ee020fcd9aece26c7b74196959ba18958485746`; full bounded review baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
- Oracle/unchanged develop: `037c29ea4649efc81acc8f28824dca3df08e7450`.
- Implementation owner: dots multi-select coordinator. Separate independent reviewer: dots `review_multiselect_context_actions`.

[Final independent report](independent-review-8dfc2b10.md): **no unresolved code finding in the bounded source/automated review**. All six initial findings and both later R1/R2 groups are closed. The historical [initial failures](independent-review-0a0032e9.md) and [30213e2 remaining failures](independent-review-30213e26.md) are preserved with their reproductions, not erased by later passes.

## Executed checks

On the exact final source, existing Linux/Node cache only:
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node node_modules/vitest/vitest.mjs run --reporter=dot`: exit 0, **15 files /156 tests passed**.
- `git diff --check`: exit 0.
- Independent fresh App probe run: **46/46 passed**, consisting of 36 committed App tests and ten independent probes. See the report for every probe and its boundaries.

Owner-reported separate Windows recheck at the same `8dfc2b1` source: **15 files /161 tests passed**, comprising the published 156 plus the original five temporary owner challenges; `bun run lint` and installed TypeScript `--noEmit` also passed. The owner read all five final changed paths and all App/test deltas. This is attributed owner execution, not a claim that dots ran Windows locally.

Independent canonical read-back verified all 24 bounded-diff paths and all 74 materialized text paths against Git blob hashes. Local-only dependency cache links were not published. Final App SHA-256 `abfba4f482beb3299786c57d5a5de3c80c98309125891a7c773005173b322297` also matches the owner's Windows check; test SHA-256 `a4a1c22055dbdeda4bc070dd816c585f3547780011420f90b0924a1c70ae0959` matches independent probes.

## Exact-code CI

[Tauri Build run 38843935107](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38843935107) is for final code `8dfc2b105bfe0449f7b8e78a4d8b9405ea86bffb`:

- [Windows job 116790035213](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38843935107/job/116790035213): success, including frontend checks, native portable compilation and Windows staging.
- [macOS job 116790035493](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38843935107/job/116790035493): success, including frontend checks, native app bundle and macOS staging.
- [Ubuntu job 116790035488](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38843935107/job/116790035488): frontend checks and native portable compilation passed; unchanged Linux staging failed with exit 2.
- Non-platform steps skipped; build artifact upload skipped on all three PR jobs; GitHub Release publishing skipped. Ubuntu post-Bun cleanup skipped after failure; checkout cleanup passed.

The Linux staging problem predates this feature according to the owner's historical run/main comparison. Its two-case-name `ls` pipeline can fail under `pipefail` after successful compilation. No workflow fix was authorized or made. Therefore this record does **not** claim all-green CI. Any automatic run for the documentation-only head is a separate run of unchanged product blobs, not evidence of a new source implementation. The owner explicitly requested no further CI wait after the terminal exact-code result; no documentation-head CI result is claimed here.

## Remaining acceptance and scope

Source, tests, independent code review, owner Windows recheck and CI compilation are separate from these **unobserved** gates:
- Real canvas hit testing and modifier selection; actual pointer dragging, frozen/hidden-gap placement, narrow-window overflow and smooth scrolling.
- Native keyboard focus and Japanese IME composition.
- Windows OS clipboard and native file save/reopen.

No product build or launch occurred in the dots workspace or owner recheck. CI performed only its existing authorized build steps. Do not claim whole-product acceptance from source/mocks/compilation. Final acceptance belongs to the owner with those gates explicitly retained.

No workflow, manifest, lockfile, dependency, native-code, persistence-schema or unrelated feature change is included. No other branch, merge, tag, release, deployment, real-data or secret operation was performed. Public examples are synthetic. Scoped publication scans found no forbidden private paths or secret-like tokens; the owner separately classified its one unchanged `matcher.test(...)` scanner hit as a structural false positive, rather than calling that raw scan zero-hit.

The single cancelled Issue progress-comment call remains held without retry or alternate posting. Later permitted Git publication and Draft PR updates were distinct actions; the established task thread carries reports while Issue comments are held. No new publication refusal occurred.

Rollback: leave Draft PR #6 unmerged. If a future authorized integration must be reversed, revert this case's product commits on the authorized branch. No persistence migration or dependency rollback is required; no force/reset/merge is proposed.
