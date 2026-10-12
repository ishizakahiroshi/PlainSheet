# P-20261012-001: independent findings and correction receipt

Initial code: `a632ef64a2631e2dd00e63a84f6e12d8effb5469`.
Corrected code: `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9`.
[Draft PR 4](https://github.com/ishizakahiroshi/PlainSheet/pull/4); [canonical Issue 3 update](https://github.com/ishizakahiroshi/PlainSheet/issues/3#issuecomment-6115549228).

This receipt records implementation changes and observed regressions. It is not an independent approval of those changes. C1/C3/C4 and C2/C5 re-review receipts are in their individual reports. **Post-fix independent C6/C7 review is NOT PERFORMED** after a tool-side safety stop; no restart, alternative reviewer or equivalent review route was used. The initial saved review and completed synthetic checks are retained. C8 is not complete and no all-28 acceptance claim is made.

## Input/search/workspace report

| Finding | Correction | Permanent regression |
|---|---|---|
| F01 paste origin | Keyboard and context text paste normalize the same selected top-left source target | App.reviewInputCorrections |
| F02 cancelled keyboard menu | Keyboard menu opens cell actions without expanding exact selection; cancellation preserves target | App.reviewInputCorrections |
| F03 JSON/YAML header bypass | Settings and first-row controls lock the serializer's key row; callback also guards it | App.reviewInputCorrections, YAML variant |
| F04 hard ceiling overflow | Formula movement and both commit boundaries enforce grid ceilings | App.reviewInputCorrections, row/column bounds |
| F05 unsupported/HTML clipboard | Unsupported types do not mutate cells; inert bounded HTML-table parsing and text/plain selection are explicit | App.reviewInputCorrections; clipboardHtml |
| F06 frozen-row stale axes | Reference click clears exact row/column markers before selecting target | App.reviewInputCorrections |
| F07 replacement newline | Controlled textarea preserves literal newline text | App.reviewInputCorrections |
| F08 scope banner | Banner derives from actual explicit search scope | App.reviewInputCorrections |
| F09 stale view filename | Explicit filename updates document-group display metadata | App.reviewInputCorrections |

## Save/recovery/validation report

| Finding | Correction | Permanent regression |
|---|---|---|
| F1 close race | Whole-workspace snapshots rechecked after the last write, including initially clean and newly opened documents; downloaded confirmation also rechecks | App.reviewCorrections |
| F2 deleted drafts recreated | Successful delete/disable invalidates pending timers while retaining observed content, so unchanged data is not silently recreated | App.reviewCorrections |
| F3 tab snapshot loss | Per-document timers survive active-tab changes and include inactive updates | App.reviewCorrections |
| F4 conversion modal covered | Close decision is suspended while conversion choice is pending | App.reviewCorrections, JSON/YAML/Markdown cancel paths |
| F5 validation before rewrite | Validate the actual final cleanup/formula-rewritten matrix before any mutation | App.reviewCorrections |
| F6 structural bypass | Structural candidate validated before transaction; rules follow column insert/delete/move and are included in local Undo history | App.reviewCorrections plus existing extension tests |
| F7 startup corruption hidden | Startup storage errors remain visible; recovery state reports ERROR rather than false OFF | App.reviewCorrections |
| F8 empty records lost silently | Conversion preview compares structured record count, including empty objects | App.reviewCorrections |
| F9 stale byte reads | Browser picker/drop operations share generation guards before preview and before commit | App.reviewCorrections |

Additional C5 integration: enum values have a local candidate picker through the same commit boundary; authoritative incoming shared values refresh the local rule report without claiming local rules are enforced at the provider. Validation metadata stays outside CSV. Bounded report display and remote schema changes remain explicit limitations.

## Saved formula/collaboration report

| Finding | Correction implemented | Functional regression; independent re-review status |
|---|---|---|
| FC-01 sharing identity/consent | Shared or pending-sharing starter cannot be reused for a new document; sharing completion is bound to the original document ID | App.sharingCorrections sample/native import/New/pending-create cases; re-review NOT PERFORMED |
| FC-02 stale editor target | FormulaBar and grid edit payload capture stable document/row/column IDs; commit resolves current coordinates; deleted targets are rejected visibly | App.sharingCorrections both axes/filtered reorder/IME/deleted targets; re-review NOT PERFORMED |
| FC-03 positional structural batches | Optional whole-operation expectedRevision, atomic stale rejection, immutable pending operations and receipt replay; structural Undo requires original revision, with conservative guarded/formula history replay | collaboration.revisionGuard real HTTP scenarios; re-review NOT PERFORMED |
| FC-04 local save versus synchronization | Browser/native close guards include pending operations in every document; Save and close cannot silently discard pending work; explicit discard explains queue loss | App.sharingCorrections offline/inactive/titlebar/delayed-ACK cases; re-review NOT PERFORMED |

## Additional bounded and platform checks

- Fill rejects source or destination over 500,000 cells before allocation and reports the limit at the UI boundary; `autofill.bounds` covers huge virtual ranges.
- Native preview reads only a regular file and at most 32 MiB plus one sentinel byte, so size growth after metadata inspection cannot bypass the bound. Native execution remains pending; existing CI compiles this command.
- The first Windows CI failure was a test portability error: `child.kill("SIGTERM")` terminates Windows children with a signal rather than a numeric zero exit. The correction checks `signalCode === "SIGTERM"` on Windows, zero on other platforms, and additionally verifies the loopback port is closed. It does not skip the runner test or weaken cleanup.
- Optional edit-identity arguments are omitted entirely in local-mode callbacks, preserving existing callback arity and baseline tests.

## Verification snapshot

At corrected code `7831c3c2`: 49 test files / 607 tests passed; TypeScript no-emit, ESLint and diff whitespace checks exit 0. Eighty modified source/test file blobs in the published Git tree match the tested local bytes exactly. No new dependencies, manifest/lock changes or workflow edits. See verification.md for CI, environment and residual acceptance; no product GUI/native behavior is inferred from these tests.

## C1–C5 re-review follow-up corrections

The independent re-review of code7831c3c2 confirmed the initial fixes and found seven additional concrete problems. Their regressions are retained in the permanent App.review* suites; a final fixed-SHA receipt follows after the new candidate is frozen.

- C2/C5 R1: validation compares final cleanup/structural values with identity-aligned original rows and columns. Untouched existing violations do not block unrelated work; genuinely inserted or rewritten values are still checked.
- C2/C5 R2: ordinary cell history does not capture or restore input rules. Rule metadata participates only in column-structure transactions; adding or modifying a rule after a cell edit survives Undo/Redo.
- C2/C5 R3: SaveOutcome separately returns actual saved serialization metadata. Final all-document close checking uses this normalized metadata for saved snapshots, still rejecting later data or serialization-setting changes.
- C1/C3/C4 R01: structured JSON/YAML formats centrally derive mandatory key-row semantics after every format transition, including Save As from headerless CSV; disabling a control alone is insufficient.
- C1/C3/C4 R02: context paste consumes the already-acquired ClipboardItem text blob, without a second read of possibly changed OS clipboard contents.
- C1/C3/C4 R04: keyboard context menu recognizes exact row/column selections and preserves them on cancellation; cell selection opens cell actions, while the explicit column-actions entry preserves its original cell target.
- C1/C3/C4 R05: sort dialog keys reset on document change and are checked against the active schema on opening; missing-column keys are never silently executed.

The prior corrected candidate's [CI run38187663662](https://github.com/ishizakahiroshi/PlainSheet/actions/runs/38187663662) completed successfully on Windows, macOS and Ubuntu. Its existing workflow runs `bun install --frozen-lockfile`, frontend checks and native build. Release publishing and artifact upload were skipped on the public PR. This evidence belongs to7831c3c2, not automatically to a newer candidate.


## Final C2/C5 surrounding corrections

The ac8194cb narrow receipt confirmed the original three follow-up fixes but reproduced two surrounding cases. Code `76ab986ceeff7fb0d2dcba17cf6096489c45ff33` addresses both without changing the acceptance assertions:

- R2a: column history now stores reversible insert/delete/move mappings and only rules actually removed with deleted columns. Undo/Redo maps the current rule set, preserving later additions/edits and parking/restoring rules attached to inserted/deleted columns. Ordinary cell history remains metadata-neutral.
- R1a: previously exempt header values are checked only against rules newly applicable to those values. Unrelated unchanged all-row violations are not rechecked, including when two different header policies apply to the same column. Genuinely changed/new invalid values are still rejected atomically.

Seven new permanent App tests and nine new validation-history/applicability tests pass. Aggregate 50 files /641 tests, TypeScript and ESLint pass. The independent C2/C5 receipt is tracked separately; implementation tests are not substituted for it. C1/C3/C4's limited final receipt on ac8194cb passed 20 independent and 180 permanent assertions. C6/C7 post-fix independent review remains NOT PERFORMED.


### R2b — rule-restoration capacity guard

The independent 76ab986 receipt confirmed R1a/R2a, then reproduced deletion → import 100 current rules → Undo producing 101 rules. This exceeded the recorded limit and blocked later valid edits/export. Latest code `6dba8bd1fb42b22b065fc9e8003d8d137e054610` preflights prospective rule count and mapped-rule validity **before** either history stack, rows or rules changes. Overflow/invalid mapping leaves the entire current state intact with an actionable remove/correct-rules notice. Nothing is clipped. Removing an unnecessary rule allows the original Undo/Redo to succeed. Three App regressions compare exact before/after stacks and full exported rule arrays, verify continued valid editing, and cover symmetric Redo and XFD overflow; two pure checks cover capacity and valid-range boundaries. Full suite: 50 files /646 tests, TypeScript/ESLint pass. The final independent capacity receipt is recorded separately.


## Final scoped independent receipts

- C1/C3/C4: fixed `ac8194cb09a79d38332ba3421dc10a15d0aa00f3` (local479a85d), 17 files /180 focused permanent tests and 20 independent archived-App assertions passed. This precedes the subsequent C2/C5-only rule-history/applicability deltas.
- C2/C5: final fixed `6dba8bd1fb42b22b065fc9e8003d8d137e054610` (localf4d0f2b), 48 focused permanent and 18 independent assertions passed. No remaining finding in this reviewed scope. The report retains all earlier failing receipts and the intermediate R1a/R2a correction evidence; it does not claim a repeated whole-product audit.
- C6/C7: previously saved initial report/results retained; corrections have ordinary functional synthetic regression evidence. Post-fix independent review is **NOT PERFORMED**. The stopped review was not restarted, reassigned or substituted.
- C8/full-28 acceptance and real GUI/native/IME/OS clipboard/accessibility/performance/separate-device acceptance remain pending.
