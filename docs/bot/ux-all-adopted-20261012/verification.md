# P-20261012-001 verification record

Date: 2026-10-12 UTC. Canonical procedure: [Issue 3](https://github.com/ishizakahiroshi/PlainSheet/issues/3). Candidate: [Draft PR 4](https://github.com/ishizakahiroshi/PlainSheet/pull/4).

## Fixed evidence boundaries

- Instruction source: `8204b5442f602164148b725c3ad07190630e33c4`.
- Behavior oracle: `8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6`.
- Required review origin: `bf7e54689742c35a2158c16f79823a66cb59ad85`.
- First implementation candidate: `a632ef64a2631e2dd00e63a84f6e12d8effb5469`.
- All materialized baseline text files were checked against their Git blob hashes. Publication builds on the authoritative full remote tree, preserving untouched binaries and files.

## Fresh observed commands

| Target | Command | Observed result |
|---|---|---|
| Fixed instruction source before edits | `node node_modules/vitest/vitest.mjs run` | 24 files / 190 tests passed, exit 0; new execution for this task |
| Fixed source before edits | `node node_modules/typescript/bin/tsc --noEmit`; `node node_modules/eslint/bin/eslint.js .` | Both exit 0 |
| First implementation candidate | `node node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| First implementation candidate | `node node_modules/eslint/bin/eslint.js .` | exit 0 |
| First implementation candidate | `node node_modules/vitest/vitest.mjs run` | 43 files / 515 tests passed, exit 0 |
| First implementation candidate | `git diff <verified-baseline> <candidate> --check` | exit 0 |
| First implementation candidate added lines | Private-key, GitHub/OpenAI token, AWS key-ID and personal absolute-path pattern scan | 12,782 added lines checked, 0 matching findings; heuristic, not a complete security guarantee |

Environment: Linux x86_64, Node 24.19.0, npm 11.9.0, Python 3.12.14, Git 2.52.0. Bun/Rust/Cargo are absent. Existing declared dependencies were installed with lifecycle scripts disabled, no package/lock modifications and no newly added dependency. See dependency-ledger.md for version/license and reproducibility limits.

The integration harness uses production App and GlideSheet logic with canvas and native API mocks. Collaboration model/client/provider, hook and App tests additionally exercise real HTTP requests against ephemeral loopback listeners, which are closed after tests. The server runner test starts and stops the synthetic relay. These tests do not launch the normal product.

## Test expectation correction, not a product workaround

The toolbar's existing `insertRow(1)` command inserts **after** the selected source row. A new formula test initially selected the formula's own row but expected insertion before it. It was corrected to select header row 0, then assert the inserted blank row, movement and reference rewrite from `=A2*2` to `=A3*2`, calculated value, and Undo. The formula behavior assertion was retained. Independent review was given this rationale.

## Independent review and corrections

The first candidate is intentionally not accepted. Independent full changed-file review is split into input/search/workspace, save/recovery/validation, and formula/collaboration/security, including shared App crossings and test deltas. Reports name the fixed candidate SHA. Findings, remediation and fresh-candidate re-review will be recorded separately; green synthetic tests do not erase observed defects.

## CI observation

Existing workflow, unmodified and not manually dispatched: [Tauri Build run 38186806973](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38186806973), pull_request event, head `a632ef64a2631e2dd00e63a84f6e12d8effb5469`, in progress when first read at 2026-10-12 00:07 UTC. Final state and later candidate runs must be appended before handback. This automated run is distinct from a locally authorized product build; no local build was executed.

## Explicit pending acceptance

- Product GUI, real IME, OS clipboard and canvas focus/scroll behavior.
- Native read/write encoding dialogs, window-manager close, save-failure behavior and platform CSP.
- Assistive technology, 640px/200% display, scaling and performance.
- Bun frozen-lock reproducibility, local Rust/Cargo compilation and native OS test execution.
- Separate-device TLS provider, proxy/CORS and native communication acceptance.
- Final consolidated user-side review of the complete candidate diff.

See manual-acceptance.md for synthetic fixtures and expected observations. No pending item is represented as PASS. Formula, recovery content storage and sharing stay initially OFF. No real data, accounts, secrets, public signaling, deployment, release or merge are part of this evidence.

## Corrected candidate receipt

Code `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9`, 2026-10-12 00:20 UTC: whole `tsc --noEmit`, `eslint .`, `vitest run` chain exit 0; **49 files / 607 tests passed**. `git diff --check` exit 0. Eighty source/test blobs match the public tree exactly. The 92 additional regressions cover all 22 grouped initial findings and related boundary cases; see remediation.md.

Initial CI run38186806973 completed: macOS and Ubuntu frontend checks/native build succeeded; Windows514/515 tests passed with sole runner SIGTERM exitCode assertion failure. Its OS-specific termination/port-cleanup correction is documented in remediation.md. Automated CI also observes Bun and Rust in its own environment; this does not make local Bun/Rust available or establish native GUI acceptance. Corrected candidate [run38187663662](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38187663662) is in progress as of00:22 UTC.

Independent post-fix scope: C1/C3/C4 and C2/C5 re-review in progress. C6/C7 post-fix independent review **NOT PERFORMED** following a tool-side safety stop after the initial report had been saved. The stopped review was not restarted or reproduced through another route. Ordinary authorized bug fixes and functional synthetic regressions continued. Full independent approval and C8 completion are withheld.

## Final source candidate (C1–C5 follow-up)

Code `ac8194cb09a79d38332ba3421dc10a15d0aa00f3`,2026-10-12 00:29 UTC: `tsc --noEmit`, `eslint .` and `vitest run` exit0; **49 files /625 tests passed**. No source changes after this fixed code snapshot. The additional seven C1–C5 re-review defects are corrected with permanent regressions; independent narrow recheck is pending its saved receipts. The stopped C6/C7 review remains unperformed after fixes.

Prior corrected-code CI run38187663662 is fully successful: Windows/macOS/Ubuntu each completed locked Bun dependency installation, frontend checks and native build. The workflow file is unchanged; actual commands are `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, and platform Tauri builds. This establishes those CI checks for7831c3c2, not actual GUI acceptance or local Bun/Rust availability. PR artifact upload and release publishing were skipped.


## Latest source receipt

Code `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` (local fixed `8d695acca750ba9fbbb226f9940be7a77d362427`), 2026-10-12 00:37 UTC: fresh `tsc --noEmit`, `eslint .`, `vitest run` chain exit 0; **50 files /641 tests passed**. The final delta corrects C2/C5 R1a/R2a and adds seven App plus nine pure regression tests. Exact published-tree comparison confirms all 83 changed source/test blobs match the tested local bytes. No dependencies, locks or workflows changed.

Earlier ac8194cb [CI run38188225774](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188225774) completed successfully on all three OS, including frontend checks and native compilation. Latest-source [CI run38188745792](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188745792) is in progress at this receipt. C1/C3/C4 limited final receipt on ac8194cb: 20 independent /180 permanent assertions passed. C2/C5 latest-source limited recheck is pending. C6/C7 post-fix independent review remains NOT PERFORMED; GUI/native acceptance is unchanged.

The brief exec transport disconnection affected a read-only status request, before any new write was attempted. A subsequent status read confirmed the original code HEAD and all uncommitted task docs were retained. Work continued in the same environment without switching environments or retrying a cancelled write.


## Capacity-guard source receipt

Latest source `6dba8bd1fb42b22b065fc9e8003d8d137e054610`, local `f4d0f2b1479441a0c9542454da3f9b55345f5f58`, 2026-10-12 00:43 UTC: `tsc --noEmit`, `eslint .`, `vitest run` chain exit 0; **50 files /646 tests passed**. The previous 641-test receipt remains historical. The new five assertions cover atomic Undo/Redo rule-capacity and mapped-column preflight, preserved rows/rules/both stacks, valid editing after rejection and retry after removing a rule. All 83 changed source/test blobs match the public Git tree exactly.

[Latest-source CI run38189101239](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38189101239) is in progress when recorded. Its terminal result and any documentation-only head run are recorded on canonical Issue 3 rather than inferred from prior runs. Independent C2/C5 capacity recheck is pending; C6/C7 post-fix independent review remains NOT PERFORMED.


## Final scoped independent receipts

- C1/C3/C4: fixed `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` (local479a85d), 17 files /180 focused permanent tests and 20 independent archived-App assertions passed. This precedes the subsequent C2/C5-only rule-history/applicability deltas.
- C2/C5: final fixed `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (localf4d0f2b), 48 focused permanent and 18 independent assertions passed. No remaining finding in this reviewed scope. The report retains all earlier failing receipts and the intermediate R1a/R2a correction evidence; it does not claim a repeated whole-product audit.
- C6/C7: previously saved initial report/results retained; corrections have ordinary functional synthetic regression evidence. Post-fix independent review is **NOT PERFORMED**. The stopped review was not restarted, reassigned or substituted.
- C8/full-28 acceptance and real GUI/native/IME/OS clipboard/accessibility/performance/separate-device acceptance remain pending.


## Pre-publication integrity check

Task source/test and documentation added lines were checked before publication: 20088 lines, zero private-key, GitHub/OpenAI token, AWS-key-ID or personal-home-path pattern matches. This is a bounded heuristic, not an independent security review. `git diff --check` passed. All 83 source/test blobs match the fixed tested source; dependency manifests/locks and CI workflow remain unchanged. Final documentation QA preserves 28 rows, all 135 original acceptance bullets and 277 exact test citations.
