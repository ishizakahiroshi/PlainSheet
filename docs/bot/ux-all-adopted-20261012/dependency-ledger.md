---
type: reference
status: draft
tags: [PlainSheet, dependencies, reproducibility]
review_status: pending
last_reviewed: 2026-10-12
---

# P-20261012-001: dependency, runtime and rollback ledger

Prepared 2026-10-12 for candidate `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. C1/C3/C4 limited recheck passed at historical `ac8194cb`; current C2/C5 narrow capacity recheck passed at `6dba8bd` (48 permanent tests / 18 independent checks); post-fix independent C6/C7 review is **NOT PERFORMED**. This ledger update is documentation only. Source of truth: repository `package.json`, `bun.lock`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, project `LICENSE`, and the actual installed direct packages' manifests/license files. This is an exact local inventory, not a package security/vulnerability audit, legal opinion or proof of a frozen-lock installation.

## Decision: no new dependency

No npm/Rust dependency declaration, dependency range, package-manager declaration, lockfile, hosted-service dependency or paid SDK was added or upgraded in the repository by this task. The fallback install resolves newer versions within existing ranges, as explicitly inventoried below. The manifest and both locks are byte-identical to the verified task-start snapshot, as checked below. The task-start local snapshot is a reconstruction of the fixed published instructions/source; the integrator owns public-tree provenance and the original-publication-to-candidate diff review.

- React/React DOM and the already-declared Glide grid supply the UI. New feature panels use the existing dialog/focus system; no widget framework is added.
- Existing `yaml`, CSV/JSON/Markdown parsers and serializers supply conversion previews; native byte reading reuses Tauri commands and existing `encoding_rs`.
- Exact decimal sorting/fill uses small repository-owned BigInt-based helpers. The formula engine is a bounded repository-owned parser/evaluator with no eval/Function/network function; no large spreadsheet runtime or all-Excel compatibility package is added.
- Cleanup, safe validation patterns, named views and opt-in recovery use repository code and browser storage; no database, sidecar library or automatic cloud persistence is added. The latest validation-history fix adds only repository-owned reversible column transforms and per-rule applicability bookkeeping, with no dependency/lock change. The subsequent restoration-capacity/range preflight also uses repository-owned validation/history code only.
- Collaboration uses browser fetch/crypto and optional Node built-ins (`node:http`, `node:crypto`, `node:module`) plus repository code. It is a central authoritative relay with stable identities, roles, receipts and bounded history, not a claim of a dependency-free CRDT. No public signaling/STUN/relay or hosted authentication SDK is required.
- Existing Vitest, Testing Library and jsdom support synthetic checks. Loopback network tests and the Node child runner start/stop only test-owned relay processes; no normal PlainSheet product startup is implied.

All newly authored project source remains under the repository's MIT license. The optional relay is project code under that license, rather than a new third-party package. Keep upstream licenses/notices when distributing already-declared packages.

## Installation actually used, and the reproducibility gap

Integrator-reported environment: Linux, Node **24.19.0**, npm **11.9.0**, Python **3.12.14**. Bun and Rust/Cargo are absent.

Installation was reported successful for **314 packages**, from the already-declared dependency ranges, with lifecycle scripts disabled. The exact flags were:

```sh
npm install --ignore-scripts --package-lock=false --no-audit --no-fund --cache <temporary-cache> --fetch-retries=0 --fetch-timeout=20000
```

`<temporary-cache>` redacts only the private temporary cache location; it is not an executable literal. There was no `package-lock.json` creation or edit. `--no-audit` means this command is not vulnerability-audit evidence. `--ignore-scripts` means successful installation does not prove native/postinstall-dependent functionality.

**npm did not consume `bun.lock`.** Its resolved installed versions differ from the existing Bun lock for several direct packages, including Tauri JS packages, icons, YAML and test/lint tooling. No range/lock change was made to conceal that difference. A Node/npm test PASS applies to the actual versions below, not to a successfully reproduced Bun lock tree. A local `bun install --frozen-lockfile` and local Bun checks remain unavailable. Historical CI runs 38187663662 at `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9` and 38188225774 at `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` successfully performed the frozen install, frontend checks and native builds on Windows/macOS/Ubuntu; current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` CI run 38189101239 is in progress. Do not regenerate the lock merely to match this fallback install.

Current source candidate `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (local `f4d0f2b1479441a0c9542454da3f9b55345f5f58`) has fresh integrator-reported **50 files / 646 tests, TypeScript no-emit and ESLint PASS**. Three new App cases and two helper cases cover validation-history restoration capacity and mapped-column bounds. Undo/Redo preflights the 100-rule limit and valid mapped columns before changing rows, rules or either history stack; rejection gives an actionable notice, does not clip rules, and removing an unneeded rule permits retry. The aggregate run remains integrator-reported evidence; the separate independent C2/C5 receipt follows below.

The preceding C2/C5 R1a/R2a corrections retain seven App cases and nine helper cases for reversible current-rule mapping and per-rule header applicability. The integrator reports that the limited recheck of `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` confirmed those subcases fixed but found the restoration-capacity boundary: deleting a rule-bearing column, then adding/importing 100 rules, could make Undo restore 101 and block ordinary editing/export. The current candidate addresses that boundary; the final scoped independent receipt confirms R2b corrected.

The saved [C1/C3/C4 limited final receipt](review-input-search-workspace.md) at historical `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` (local `479a85d`) passed **20 independent assertions and 17 files / 180 focused permanent tests**, with no new blocker in its narrow scope. It does not automatically approve the current source delta. The [C2/C5 receipt](review-save-recovery-validation.md) at that earlier SHA found R1a/R2a; the subsequent limited check confirmed those fixes and found the capacity boundary described above. The final current-SHA capacity recheck passed as recorded below. Post-fix independent C6/C7 review remains **NOT PERFORMED** after the saved initial findings and tool-side stop; it was not restarted or replaced. All actual GUI/native acceptance remains pending.

The [final C2/C5 narrow receipt](review-save-recovery-validation.md#final-narrow-receipt-local-f4d0f2b1479441a0c9542454da3f9b55345f5f58) targets exact local `f4d0f2b1479441a0c9542454da3f9b55345f5f58` / public `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. The independent reviewer reports **3 files / 48 permanent tests and 18 independent archived-fixture checks passed, both exit 0**. R2b is corrected; with the preceding fixed-SHA receipts, no recorded C2/C5 finding remains in the reviewed scope. This final pass covered only the capacity-guard delta, Undo/Redo atomicity, mapped-column bounds, actionable messages and retry, including exactly 100 rules and colliding rule IDs. It is a scoped source/synthetic receipt, not whole-product, native or C6/C7 acceptance. The reviewer did not rerun the aggregate 646-test suite.

Historical candidate `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` had 50 files / 641 tests, TypeScript and ESLint PASS. Its [CI run 38188745792](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188745792) was last observed **in progress**. No terminal result is recorded for that historical run. Current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` [CI run 38189101239](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38189101239) is **in progress** at this documentation freeze; the integrator will record its terminal result on [Issue #3](https://github.com/ishizakahiroshi/PlainSheet/issues/3).

Historical candidate `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` had **49 files / 625 tests**, TypeScript and ESLint PASS. Its [CI run 38188225774](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38188225774) completed successfully on **Windows, macOS and Ubuntu**, including the existing frozen Bun installation, frontend checks and native builds. **Current `6dba8bd1fb42b22b065fc9e8003d8d137e054610` CI run 38189101239 is in progress**; historical success does not transfer.

Historical candidate `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9` had 49 files / 607 tests and successful [CI run 38187663662](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38187663662) on Windows/macOS/Ubuntu, including `bun install --frozen-lockfile`, frontend checks and native builds; release publishing and artifact upload were skipped. The initial `a632ef64a2631e2dd00e63a84f6e12d8effb5469` [run 38186806973](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38186806973) had macOS/Ubuntu build success and Windows 514/515 with the sole relay SIGTERM assertion failure. The corrected platform-specific assertion and closed-port check subsequently passed CI.

Local Bun/Rust remain unavailable; successful historical CI locked installation/native builds are separate evidence. No manual builds, product launches, workflow changes, release/deployment or new dependency occurred. This is documentation bookkeeping, not test execution or independent review.

## Direct JavaScript package inventory

The installed version and SPDX expression below come from each actual installed `package.json`; the lock version comes from the unchanged repository `bun.lock`. Root license files, when supplied by that package, were read. A listed SPDX file may include metadata rather than complete legal text; a manifest license expression alone is not a full legal audit. This table covers all 24 direct declarations; it does not purport to re-audit every transitive package.

| Package | Declaration class | Declared range | Existing Bun lock | Installed for Node checks | Installed license declaration | Root license evidence read |
|---|---|---|---|---|---|---|
| `@glideapps/glide-data-grid` | Runtime declaration | `^6.0.3` | `6.0.3` | `6.0.3` | MIT | `LICENSE` |
| `@tauri-apps/api` | Runtime declaration | `^2.9.0` | `2.11.0` | `2.12.3` | Apache-2.0 OR MIT | `LICENSE-MIT`, `LICENSE-APACHE-2.0`, `LICENSE.spdx` |
| `@tauri-apps/plugin-dialog` | Runtime declaration | `^2.4.0` | `2.7.1` | `2.8.2` | MIT OR Apache-2.0 | `LICENSE.spdx` |
| `@vitejs/plugin-react` | Runtime declaration | `4` | `4.7.0` | `4.7.0` | MIT | `LICENSE` |
| `lucide-react` | Runtime declaration | `^1.17.0` | `1.17.0` | `1.55.0` | ISC | `LICENSE` |
| `react` | Runtime declaration | `18.3.1` | `18.3.1` | `18.3.1` | MIT | `LICENSE` |
| `react-dom` | Runtime declaration | `18.3.1` | `18.3.1` | `18.3.1` | MIT | `LICENSE` |
| `yaml` | Runtime declaration | `^2.8.1` | `2.9.0` | `2.9.1` | ISC | `LICENSE` |
| `@eslint/js` | Development declaration | `^9.39.1` | `9.39.4` | `9.39.5` | MIT | `LICENSE` |
| `@tauri-apps/cli` | Development declaration | `^2.9.3` | `2.11.2` | `2.12.2` | Apache-2.0 OR MIT | `LICENSE-MIT`, `LICENSE-APACHE-2.0` |
| `@testing-library/jest-dom` | Development declaration | `^6.9.1` | `6.9.1` | `6.9.1` | MIT | `LICENSE` |
| `@testing-library/react` | Development declaration | `^16.3.0` | `16.3.2` | `16.3.3` | MIT | `LICENSE` |
| `@types/node` | Development declaration | `^24.10.1` | `24.13.1` | `24.19.2` | MIT | `LICENSE` |
| `@types/react` | Development declaration | `18.3.24` | `18.3.24` | `18.3.24` | MIT | `LICENSE` |
| `@types/react-dom` | Development declaration | `18.3.7` | `18.3.7` | `18.3.7` | MIT | `LICENSE` |
| `eslint` | Development declaration | `^9.39.1` | `9.39.4` | `9.39.5` | MIT | `LICENSE` |
| `eslint-config-prettier` | Development declaration | `^10.1.8` | `10.1.8` | `10.1.8` | MIT | `LICENSE` |
| `globals` | Development declaration | `^16.5.0` | `16.5.0` | `16.5.0` | MIT | `license` |
| `jsdom` | Development declaration | `^27.2.0` | `27.4.0` | `27.4.0` | MIT | `LICENSE.txt` |
| `prettier` | Development declaration | `^3.6.2` | `3.8.3` | `3.9.10` | MIT | `LICENSE` |
| `typescript` | Development declaration | `~5.9.3` | `5.9.3` | `5.9.3` | Apache-2.0 | `LICENSE.txt` |
| `typescript-eslint` | Development declaration | `^8.46.4` | `8.60.1` | `8.71.1` | MIT | `LICENSE` |
| `vite` | Development declaration | `5` | `5.4.21` | `5.4.21` | MIT | `LICENSE.md` |
| `vitest` | Development declaration | `2` | `2.1.9` | `2.1.9` | MIT | `LICENSE.md` |

`@vitejs/plugin-react` is declared under runtime dependencies in the existing manifest but is build tooling; this ledger reports the actual declaration without moving it. `lucide-react` and `yaml` declare ISC; the React/Glide packages declare MIT; Tauri packages retain their listed dual-license choices. No blanket “everything is MIT” assertion is made.

## Existing Rust declarations

`src-tauri/Cargo.toml` declares package license MIT, Rust edition 2021 and minimum Rust 1.77.2. The following versions are **lock resolutions, not installed or executed crate evidence**. This pass did not fetch crates or infer upstream licenses from `Cargo.lock`, which does not contain license metadata.

| Crate | Existing declared version | Existing Cargo lock | Actual verification |
|---|---|---|---|
| `tauri-build` | `2.5.1` | `2.6.2` | not installed/tested; upstream license not verified by this pass |
| `encoding_rs` | `0.8` | `0.8.35` | not installed/tested; upstream license not verified by this pass |
| `serde` | `1` | `1.0.228` | not installed/tested; upstream license not verified by this pass |
| `serde_json` | `1` | `1.0.150` | not installed/tested; upstream license not verified by this pass |
| `tauri` | `2.9.4` | `2.11.2` | not installed/tested; upstream license not verified by this pass |
| `tauri-plugin-dialog` | `2.7.1` | `2.7.1` | not installed/tested; upstream license not verified by this pass |

No new Rust crate/license decision is introduced. Actual Rust compilation, Tauri native byte-read/write/window behavior, supported toolchain compatibility and redistribution of existing transitive native licenses remain separate build/native acceptance gates.

## Lock and manifest integrity

The current bytes were compared with the task-start verified local snapshot (`d5b1a4f1b34fe173943d2e034ade599d0438d0e7`). The following SHA-256 values were computed from the files actually inspected on 2026-10-12. The integrator must also verify no later correction changes them before final submission.

| File | SHA-256 | Comparison |
|---|---|---|
| `package.json` | `7e67fbbd9adf591e27671984a70650379ea64acc78ecd9add436f98beaac0a0d` | byte-identical to verified task-start snapshot |
| `bun.lock` | `1df6a5bccba1ab7666b4503b73987810b4dc8a558b1c50c85cd244cdffcb0ff5` | byte-identical to verified task-start snapshot |
| `src-tauri/Cargo.toml` | `2835810431271ac02345582047227c3deb38fc1b5fe58111e97babc0669c11f4` | byte-identical to verified task-start snapshot |
| `src-tauri/Cargo.lock` | `7268dc8febeffa3539b7f28b51746a3ad1eaaa5704633c0f94c5c28d0b497521` | byte-identical to verified task-start snapshot |

No commit hash for these files is a substitute for the frozen-install check. Local test environment differences remain visible even though manifest/lock integrity is established.

## Bundle and operational impact

- **Third-party dependency delta: zero.** This does not mean zero application code growth. New parsers, feature panels, storage controls and collaboration client code add repository source and runtime work. Bundle bytes, compressed bytes and desktop artifact size were not measured because a product build was not run; no invented size/speed estimate is used.
- Formula calculation starts OFF. When ON, it recalculates a bounded graph from each raw snapshot; limits include 8,192 characters/formula, 10,000 formula cells and 500,000 evaluation operations. This is not cross-snapshot incremental evaluation or exact-decimal arithmetic. See formula-contract.md for all ceilings and error behavior.
- Import preview retains original bytes and a parsed table. Advanced sort creates snapshots/previews. Large-file memory, latency and interaction cost remain unmeasured; actual capacity testing is M15 in manual-acceptance.md.
- Recovery content starts OFF. Explicit consent uses edition-local browser/WebView storage, with seven-day expiry, 2 MiB serialized storage and at most 50 drafts. It is best effort, not crash-proof backup; deletion/expiry failure is surfaced. Named-view persistence is separately opt-in and capped at 256 KiB. Validation rules are session-local unless explicitly exported/imported as a sidecar. CSV contains none of these metadata stores.
- Sharing starts OFF, with no endpoint or request on construction. The optional relay uses Node 24 or an already-installed Bun runtime; only the Node entry has test evidence here. Standalone entry binds loopback and requires explicit allowed origins. Actual separate-device operation requires an independently operated TLS proxy/HTTPS endpoint and safe logging configuration. No service was deployed and no external account/payment is required by the code.
- Relay state and client queue/credentials are memory-only. Restart/close can lose them; stopping/deleting does not recall participant copies. Default room lifetime is at most 24 hours, with bounded room/member/history/operation/document sizes; poll cadence and all quotas are documented in collaboration-contract.md. This is a small optional self-host service, not a production availability/security certification.
- Desktop `connect-src` changes needed for explicitly chosen HTTPS/loopback transport are security-relevant even without a new package or default request. Review native CSP/origin pairing separately; native runtime acceptance is pending.

## Rollback

1. Identify and revert only this task's implementation/correction commits on its task branch using reviewable reverse commits. Preserve the stacked base `bot/20261005-004-excel-like-ux`, existing PR #1 and unrelated work. Do not rewrite shared history, merge, release or deploy as a rollback side effect. The current public corrected candidate is `6dba8bd1fb42b22b065fc9e8003d8d137e054610` after initial implementation `a632ef64a2631e2dd00e63a84f6e12d8effb5469` and prior corrections `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9` and `ac8194cb09a79d38332ba3421dc10a15d0aa00f3`, followed by `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`; the integrator must identify the complete task implementation/correction commit set from the public stacked diff before reverting. Documentation-only commits may follow without changing that code target.
2. Preserve needed synthetic/user-approved local copies before detaching active sharing sessions or stopping a relay; server state is volatile. Reverting code cannot undo already-transmitted data, recall another participant's copy or reverse a file already explicitly saved.
3. Restore ordinary string-editing routes and remove the task's UI/helper/server wiring together. Avoid reverting only a helper while leaving callers or metadata controls using it. Re-run the inherited regression suite and inspect the diff on the rollback candidate; do not silently delete tests to force green.
4. There is no dependency or lock migration to undo. The existing repository manifests/locks above remain the baseline. The fallback `node_modules` directory is an untracked local test environment, not a committed product artifact; environment removal/reinstallation is separate from code rollback and must respect its authorization.
5. Existing CSV/TSV raw data needs no view/rule/provider-schema migration. Opt-in `plainsheet.recovery.v1` and named-view storage may remain after a code revert. If erasure is wanted, use the current UI's explicit individual/all/OFF deletion before reverting and verify success; do not promise uninstall/revert erases those stores. Sidecar files and participant exports remain independently managed copies.

## Outstanding gates

- Current-head CI frozen Bun installation/frontend checks remain pending; historical `7831c3c2` and `ac8194cb` CI passed on all three operating systems. Local Bun remains unavailable
- Current-head native CI build remains pending; historical `7831c3c2` and `ac8194cb` native builds passed. Local Cargo and all real OS I/O/window observations remain unavailable/unaccepted
- Corrected candidate regression/typecheck/lint are integrator-reported PASS; current-head CI run 38189101239 is in progress
- Initial independent findings and implementer corrections are recorded; C1/C3/C4 limited recheck passed at historical `ac8194cb`; current C2/C5 narrow capacity recheck passed at `6dba8bd` (48 permanent tests / 18 independent checks). Post-fix independent C6/C7 review is NOT PERFORMED and must not be inferred from correction tests
- Real layout/IME/clipboard/assistive/performance and separate-device TLS/CSP checks

No dependency was added to bypass any of these gates. The submitted status remains a candidate until evidence is recorded at the appropriate layer.

Documentation frozen at this candidate; dependency/lock inventory is unchanged. The terminal CI status must be updated explicitly.
