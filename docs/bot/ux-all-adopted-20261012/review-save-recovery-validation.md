# C8 independent review: saving, recovery, validation and cleanup

Date: 2026-10-12. Reviewer did not implement this candidate. This is a **changes-required** review of the frozen candidate, not release or native acceptance.

## Fixed target and scope

- Local candidate: `4e264500c34216398f39067b86cbf55c89c8b887`.
- Local baseline: `d5b1a4f1b34fe173943d2e034ade599d0438d0e7`, supplied as the byte-verified counterpart of remote `8204b5442f602164148b725c3ad07190630e33c4`.
- The integrator reports remote candidate `a632ef64a2631e2dd00e63a84f6e12d8effb5469` has the same 71 source/test blobs and is submitted in Draft PR #4. This reviewer independently inspected the local fixed target; remote equivalence is the integrator's evidence, not an additional remote verification by this reviewer.
- Required publication comparison starts at `bf7e54689742c35a2158c16f79823a66cb59ad85`; the supplied intervening baseline changes are instruction/link changes. Code findings below are against the fixed local code comparison.

Read the repository guidance, adopted proposal's applicable acceptance conditions, parent/C2/C5/C8 plans, research review and C2/C5/formula/shared contracts. Read complete implementations of `App.tsx`, `useFile.ts`, `useDocuments.ts`, `saveState.ts`, `importPreview.ts`, `conversionPreview.ts`, `recovery.ts`, `validation.ts`, `cleanup.ts`, their panels/types, and native `src-tauri/src/main.rs`. Followed supporting parser, sheet/history, dialog, grid and collaboration integration paths. Read the corresponding new helper/panel tests, useFile test diff and the relevant complete App integration scenarios, rather than accepting their names as proof.

No tracked source or test file was edited. A temporary frozen archive and standalone synthetic regression fixture were retained for the integrator. Only this review document was added by the reviewer. Subsequent implementation work must not be confused with the frozen target or inherit this result without re-review.

## Prioritized findings

### F1 — P1: sequential save-and-close can discard a later change to an already-saved document

Location: `src/App.tsx:640–674`, particularly `653–661` and `671–674`; incoming changes reach document state through `305–309`.

Each document is checked only immediately after its own write. The final whole-window destruction does not recheck the saved documents, any initially clean document, or the complete current workspace. A later collaboration update can invalidate an earlier successful check while a subsequent file is still being saved.

Reproduction: make A and B dirty; request whole-window Save and close; allow A's write to finish; hold B's write; deliver a new value to A through the actual App collaboration `applyRows` boundary; then finish B's write. The synthetic fixture verifies A's tab is dirty before releasing B. **Observed: native `destroy` is called once anyway.**

Fix: retain the completed snapshot/settings for every saved document and perform a final current-workspace comparison immediately before authorizing destruction. Include newly dirty documents and current pending editor state. A subsequent mutation must prevent destruction or explicitly return to the save decision; the close approval cannot be based only on the initial ID list.

Regression: the sequence above, a previously clean C receiving a new change, and a change to A while another document's conversion/save dialog is pending. Preserve successful all-documents-close and failure/cancellation behavior.

### F2 — P1: pending recovery writes recreate explicitly deleted drafts

Location: `src/App.tsx:832–847` and `2425–2428`; `src/components/RecoveryPanel.tsx:26–31,87,92`; `src/lib/recovery.ts:255–267`.

Delete-one/delete-all leaves recovery enabled. The App timer depends only on the enabled flag, rows, metadata and active ID, so a successful deletion does not cancel an already scheduled snapshot. That pending callback writes the same committed content again after the deletion, without another edit or consent action.

Reproduction: enable recovery and allow one draft to persist; edit a cell; before the one-second debounce expires, choose Delete all recovery drafts. Storage immediately contains zero drafts. Wait 1.1 seconds without editing. **Observed: storage contains one draft again.** The same timer mechanism affects individual deletion.

Fix: propagate explicit deletion to the scheduler and invalidate/cancel pending writes for the deleted document(s). Record a content/deletion generation so an unchanged document cannot be immediately recreated by old scheduled work or a routine state update. A genuinely newer user edit may start a new snapshot under the chosen, disclosed policy. Keep OFF deletion's write-blocking behavior.

Regression: individual/all deletion immediately before a debounce fires, deletion while a different tab is active, deletion with no pending work, OFF, and a subsequent distinct edit. Assert both stored content and the visible draft list.

### F4 — P1: the close dialog covers the conversion decision required to finish saving

Location: `src/App.tsx:435–453,634–648,2572–2638`; `src/styles/app.css:639–645`.

Save and close leaves `closeRequest` mounted and disables its controls while `beforeSave` waits for the conversion preview. The conversion dialog is rendered before the close dialog; both have the same fixed, full-screen backdrop with z-index 30. The later close backdrop therefore covers the conversion choice and intercepts pointer interaction. The suspended operation has no usable pointer-driven way to approve or cancel the conversion.

Reproduction: import native `/source.json` containing `[{"qty":7}]`, change the value, request window close, then Save and close. **Observed in the synthetic DOM: both modal dialogs remain mounted and the final modal is the disabled Save before closing dialog, not the conversion dialog.** The same-z-index stacking conclusion follows from the inspected CSS; no real-screen acceptance is claimed.

Fix: represent the close/save/conversion flow as one active modal step, or suspend the close backdrop while the conversion step is active. Preserve the close target and resume it after the explicit choice. Ensure cancellation returns to an actionable close decision and focus is restored correctly.

Regression: native JSON, YAML and Markdown Save and close with conversion, Cancel, Save As, same-path Save As and write failure. Test one topmost interactive modal, focus/keyboard progression and pending-close state; verify actual rendered stacking during GUI acceptance.

### F3 — P2: switching tabs drops a document's pending recovery snapshot indefinitely

Location: `src/App.tsx:832–847`.

The only recovery effect watches the active sheet. Switching away clears its timer and replaces it with the new active sheet's timer, if that sheet is dirty. There is no scheduler for the now-inactive dirty document. Its latest committed change can remain absent from recovery for the rest of the session, even while the app continues running normally. Incoming changes to inactive documents have the same coverage gap.

Reproduction: persist A with value `old`; change A to `latest committed`; immediately open a clean B; wait 1.3 seconds. **Observed: A's stored draft still contains `old`.** It does not become eligible again unless A is revisited/otherwise rescheduled. This is not a crash inside the normal one-second debounce window.

Fix: keep per-document captured timers or deliberately flush the outgoing document before cancelling its timer. Include inactive document updates, and coordinate with F2 so deletion cannot cause a flush that recreates deleted content.

Regression: rapid A/B switches, same-name tabs, inactive collaboration changes, close/discard policy, late writes, and quota failures. Assert document identity and rows, not just the presence of any recovery key.

### F5 — P2: cleanup validates before formula rewriting and then commits forbidden values

Location: `src/App.tsx:2367–2400`, particularly `2375` followed by `2377–2399`.

Dedupe first validates the helper's row-removal result, then rewrites surviving formulas and commits a different matrix. Reject-mode rules never inspect the final rewritten values. The collaborator structural path likewise transforms after this preliminary check.

Reproduction: rows `[["id","value"],["x","=B4"],["x","placeholder"],["last","9"]]`; calculation ON; column B rejecting enum permits exactly `=B4`, `placeholder`, `9`; dedupe the two x rows using column A. The pre-rewrite matrix passes validation. **Observed: dedupe commits `=B3`, which is not permitted, and removes the duplicate row.**

Fix: build the complete proposed final raw matrix, including structural formula rewrites, before validation and before history/provider mutation. Validate the matrix that will actually be committed. Preserve atomic cancellation and a single Undo.

Regression: the fixture above in local and shared modes, rejecting pattern rules on rewritten formulas, warning-only rules, disjoint deletions, hidden rows and one-step Undo restoration.

### F6 — P2: row insertion bypasses the claimed central rejecting-validation boundary

Location: `src/App.tsx:1211–1256`; related row deletion/rewrite paths at `1311–1364`.

Insertion records history and calls `sheet.insertRows` or a formula/collaboration transform without `validateNext`. Unlike paste of a new row, it can introduce new rule violations despite an explicitly rejecting rule. Structural formula rewrites also escape this boundary.

Reproduction: `id,value` / `11,keep`; column A Required rule in reject mode, header skipped; select the data row and Insert row. **Observed: a blank new row is committed, Undo becomes available, and reopening validation reports one rejecting violation.**

Fix: compute and validate the projected final rows before history or structural mutation for every local mutation route. If blank structural insertion is intentionally exempt, explicitly define and expose that exception instead of claiming all mutation routes are guarded; formula changes and nonblank values still need the final validation boundary.

Regression: insertion through toolbar/context/command, formula-mode insertion/deletion, shared structural operations, warning-only behavior and zero-history atomic rejection. Do not confuse restoring historical data through Undo with a new user edit.

### F7 — P2: recovery startup errors are discarded and the main UI incorrectly reports OFF

Location: `src/App.tsx:131–138` and `1932–1933`.

Both startup inspections discard error results. `recoveryState` becomes null and the toolbar renders OFF, with no failure notice. A previously enabled but corrupt/unreadable/expired-cleanup-failing store silently stops snapshotting until the user independently opens the recovery panel.

Reproduction: seed the recovery key with malformed JSON and render App. **Observed: no corruption/unavailable warning is present, the toolbar says OFF, and no startup recovery panel opens.** The store helper itself returns an error correctly; this is an integration error-reporting gap.

Fix: retain the inspection failure, show an actionable unavailable/corrupt state distinct from intentional OFF, and provide the existing reset/deletion controls without interrupting normal editing. Do not claim prior content has been removed or that snapshotting is active.

Regression: malformed/version-mismatched data, denied reads, failed expiry cleanup and quota failures after successful enablement; ordinary editing must remain usable.

### F8 — P2: the new conversion preview fails to disclose removal of empty-object records

Location: `src/lib/conversionPreview.ts:80–125,154`; existing parser boundary `src/lib/formats.ts:73–75`.

When every source record has no properties, the parser produces no rows. The preview iterates zero headers, so it returns no issues although serialization drops the source records. This does not allege that the parser behavior was introduced by this change; the newly promised overwrite warning fails to detect an existing lossy conversion.

Reproduction: `createConversionPreview({content:"[{},{}]",format:"json"})`. **Observed: `outputContent` is `[]\n`, while `hasLoss` is false.** Native direct save consequently skips the explicit lossy-overwrite decision for this input. YAML empty-object lists have the analogous boundary.

Fix: compare structural record preservation in addition to property types; report empty-record/cardinality loss with a concrete example, or preserve the records through a documented parser representation. Do not silently change the existing parser contract just to hide the warning defect.

Regression: JSON/YAML `[{},{}]`, a mixture of empty and nonempty objects, empty arrays, null/empty documents, header-only data and the ordinary all-string no-loss case.

### F9 — P2: stale browser byte reads replace a newer import preview

Location: `src/hooks/useFile.ts:306–317,450–475`; preview replacement in `src/App.tsx:428–433`. Contrast the native generation checks at `useFile.ts:72–79`.

Browser file reads have no generation token before awaiting `file.arrayBuffer()`. An older slow file can finish after a newer request and replace its preview. App then resolves the newer preview as cancelled, because it cannot distinguish the older read completion from a new user request.

Reproduction: drop older.csv with a deferred byte read, then drop newer.csv with an immediate read. Wait for the newer preview, then finish the older read. **Observed: the dialog changes back to older.csv and cancels the newer request.** No document is silently written, but the user's current import target is displaced.

Fix: allocate one browser import generation at the user action boundary for both picker and drop paths. Check it after every asynchronous picker/file/byte/preview step, just as the native load path does. A superseded completion must not open a preview or mutate workspace/recent-file state.

Regression: out-of-order browser reads, picker/drop overlap, cancellation of the newest request, supersession while a preview is already open, and the native equivalent.

## Additional policy and acceptance gaps

- Column insertion/deletion/move clears all validation rules (`App.tsx:1264–1268,1388–1392,2142–2146`), and Undo does not restore them. A toast after removal is present. Preserve/remap rules with columns, or explicitly document and test the chosen removal/Undo contract; this should not remain an accidental safeguard-disabling path.
- Incoming collaboration rows bypass local validation (`App.tsx:305–309`). Independently refusing authoritative remote rows would risk divergence, so this report does **not** prescribe remote rejection. Define the policy and update the visible local violation report for remote changes instead of leaving stale results.
- The C5 integration contract assigns grid enum-candidate editing to the integrator. The reviewed grid remains text-only; the panel edits an allowed-values list but does not expose those values as a cell picker. Track this as incomplete adopted UI behavior unless the accepted scope is explicitly revised.
- Conversion helper/component tests exercise the dedicated `ConversionPreviewDialog`, but App uses a separate generic dialog with JSON-stringified details. Helper focus tests therefore do not prove the integrated close/conversion flow; F4 demonstrates that gap.

## Verification and limits

The following command was newly run against the frozen working bytes before implementation resumed:

```sh
node node_modules/vitest/vitest.mjs run \
  src/tests/importPreview.test.ts src/tests/conversionPreview.test.ts \
  src/tests/ImportPreview.test.tsx src/tests/useFile.test.ts \
  src/tests/recovery.test.ts src/tests/validation.test.ts \
  src/tests/cleanup.test.ts src/tests/c5Panels.test.tsx \
  src/tests/formats.test.ts src/tests/csv.test.ts
```

Result: **10 files / 111 tests passed, exit 0**. These positive tests cover original UTF-8/BOM/CP932/EUC-JP/Windows-1252 bytes, serializer examples, cancellation, snapshot isolation, download-only semantics, helper validation bounds, cleanup precision and recovery schema/quota/expiry/restore behavior. They do not cover the nine failures above.

A separate temporary fixture imports production App/GlideSheet/hooks/helpers, mocks the canvas and native I/O, and invokes the actual App collaboration-update boundary for F1. It contains F1–F9 as assertions of the intended safe outcome. Running it with its isolated Vitest config produced **1 file / 9 failed tests, exit 1**, each at the reported behavioral assertion; this is deliberate defect reproduction, not a failing candidate-suite claim. The original focused log, reproduction source/config and failure logs were retained for the integrator. Afterward the fixture was pointed at an archive of the exact frozen commit and rerun: **the same nine behavioral failures, exit 1**. Later shared-source edits therefore do not change this review's target.

No product build, normal product launch, real-data access, external service setup, native write, real clipboard, GUI screenshot or OS/IME test was performed. Native filesystem behavior, real modal rendering/pointer interaction, IME, OS close/save dialogs, screen readers, narrow-width layout, persistence across real crashes/eviction/private mode and performance remain **pending**. A synthetic invocation of a mocked `destroy` or `write_file` is not native acceptance.

The corrected insertion test that selects source header row 0 before the toolbar's established insert-after action was inspected and accepted: it retains the `=A2*2` to `=A3*2` rewrite and Undo regression rather than deleting it. No retired hidden-row or source-coordinate diagnosis was reintroduced.

## Re-review gate

Fix the final save/close workspace check, single-active-modal sequencing, recovery scheduling/deletion/error reporting, final-matrix validation, omitted-record conversion warning and browser import supersession. Add the corresponding production regressions, rerun the full candidate suite/lint/typecheck, and independently re-review the final fixed SHA plus the unresolved policy/UI items. This report does not approve subsequent revisions automatically.

## Re-review: fixed local `699807364a7fc8a9e285b2ad85a10cae298288aa`

Date: 2026-10-12. The integrator maps this local commit to remote `7831c3c2fc7f8e89ec517b845e0b0485c9f3d2e9` in Draft PR #4. This reviewer checked the local commit and an exact `git archive` of it. The source/test working tree was frozen for this pass. The report is still **changes required**: the original nine reproductions are corrected, but three C2/C5 correction regressions remain below.

This re-review covers the original C2/C5 scope, shared App/document/history boundaries, and the new enum-selection/remote-validation presentation. It does **not** independently re-review the corrected C6 formula algorithms or C7 collaboration algorithms/security. Their independent post-fix review remains unperformed. The C5 check of the App's remote-update presentation boundary must not be described as relay/security acceptance.

### Original findings: correction verification

- **F1 corrected for the original data-loss race.** `App.tsx:654–680,711–755` now captures the entire original workspace and compares it after the final write, including initially clean documents and changed document membership. The permanent tests cover both a late update to an already-saved A and a new change to an initially clean document. Both prevent destruction. R3 below identifies a separate false-positive failure caused by comparing pre-save metadata.
- **F2 corrected.** `RecoveryPanel.tsx:94–129` propagates successful individual/all/OFF deletion to `App.tsx:913–919,2673`. Pending timers are cancelled, while the observed-content map suppresses immediate recreation of unchanged content. Permanent tests pass for all deletion, deletion of an inactive document, a distinct subsequent edit, and OFF with subsequent editing.
- **F3 corrected.** `App.tsx:921–960` now schedules captured snapshots by document ID across the workspace instead of disposing the active document's timer on a switch. The original delayed A snapshot completes after moving to B. Unmount cancels outstanding timers; edition-local store isolation and pathless restoration remain unchanged.
- **F4 corrected at source/synthetic DOM level.** `App.tsx:2816–2887` renders the close dialog only when no conversion dialog is active. JSON/YAML/Markdown cancellation scenarios each have one active modal and return to enabled close controls without writing. The mounted conversion dialog's first button remains the safer Save As choice under `useDialogFocus`. Actual GUI focus/pointer rendering remains pending.
- **F5 corrected for final rewritten values.** `App.tsx:2618–2643` computes `finalRows` before validation and history/provider mutation. The original rejecting-enum/dedupe/formula fixture leaves the whole matrix unchanged. R1 below identifies excessive scope introduced by validating every existing cell.
- **F6 corrected for new structural violations.** `App.tsx:1409–1587` constructs final inserted/deleted matrices, remaps column rules and validates before history or structural submission. The original Required/reject row-insertion fixture remains unchanged with no Undo entry. Local column movement now remaps rules and one Undo restores the previous column; see the independent positive test and R2's different rule-lifetime issue.
- **F7 corrected for detection/presentation of startup corruption.** `App.tsx:151–155,2085–2086,2167–2170` retains and displays inspection errors and distinguishes ERROR from intentional OFF. The original malformed-storage assertion passes; helper corruption/quota/expiry/restore tests also pass.
- **F8 corrected.** `conversionPreview.ts:138–151` compares source and output record cardinality and emits a `records` issue. The original `[{},{}]` to `[]` fixture now reports loss rather than silently bypassing the overwrite warning. Existing all-string and structured-format conversion tests continue passing.
- **F9 corrected.** `useFile.ts:125–143,294–310,320–348` assigns browser picker/drop generations before asynchronous reads and gates preview, load and toast callbacks. The older deferred byte read can no longer replace the newer preview. The added browser 32 MiB cap and native regular-file/bounded-read implementation at `src-tauri/src/main.rs:39–54` were inspected; no native Rust execution is claimed.

### R1 — P2: the validation correction now blocks unrelated cleanup because of existing invalid cells

Location on `69980736`: `src/App.tsx:897–903,2634–2635`; the same whole-document validation policy is used by structural/sort routes.

Passing `allCells=true` calls `validateMutation([], finalRows, rules)`, treating every cell as newly introduced. The C5 contract explicitly permits repair elsewhere when an unrelated existing cell is invalid. For ordinary trimming there is no structural identity ambiguity at all, but the new call rejects that operation based on untouched cells outside the selection.

Reproduction: load `id,value` / `, padded `; add a Required/reject rule to column A with the header skipped; select only B2 and apply whitespace cleanup. **Observed: B2 remains ` padded ` rather than `padded`, because untouched A2 was already empty.** The independent intended-safe assertion fails on the archived fixed SHA. No source was changed to create the failure.

Fix: validate the exact changed destinations against the complete final post-rewrite matrix. For trim, keep the ordinary before/after changed-cell policy. For structural changes, map surviving source cells to their destination identities and include inserted cells, genuinely changed raw values, rewritten formulas and changes to header applicability; do not classify unrelated old violations as new input. Preserve F5's post-rewrite check and F6's atomic rejection.

Regression: this trim case, a hidden invalid row outside the cleanup selection, repair of one invalid field while another remains invalid, and structural movement of unchanged invalid cells. New/rebased violations must still reject atomically with no history entry.

### R2 — P2: Undo of an ordinary earlier edit silently removes subsequently added rules

Location on `69980736`: `src/App.tsx:876–884,964–975,1640–1668`; `src/hooks/useHistory.ts:7–16`.

The structural-rule Undo fix snapshots rules for **every** ordinary cell edit and unconditionally restores that snapshot during Undo. Rule additions/edits/removals themselves do not create corresponding history entries. Consequently, Undo of an unrelated old cell edit can silently replace a more recently configured rule set, including replacing it with an empty array.

Reproduction: load `id,value` / `11,old`; edit B2 to `edited`; add a Required/reject rule for A; press Undo once. **Observed: B2 correctly returns to `old`, but the Validation count changes from 1 to 0.** The newly enabled safeguard has been removed despite not being the action undone. Independent enum-choice and column-move/Undo positive tests pass, so this is specifically the interleaving of later rule configuration with older ordinary-edit history.

Fix: couple rule-state restoration only to operations that actually transform the rule mapping, or give rule configuration an explicit coherent history contract so the latest action is undone first. Ordinary value Undo/Redo must preserve later rule additions/removals. Structural Undo still must restore/remap the appropriate rules without overwriting unrelated newer rule configuration silently.

Regression: edit → add rule → Undo; edit → remove/change/import rules → Undo/Redo; column move/insert/delete → Undo with and without later rule edits; tab-switch history restoration. Assert both raw rows and rule contents/counts.

### R3 — P2: final save-close comparison rejects the save operation's own metadata normalization

Location on `69980736`: `src/App.tsx:654–680,714,726–740`; output encoding normalization in `src/hooks/useFile.ts`'s `encodingForFormat`, and known completed metadata at `App.tsx:489–498`.

The final check compares live metadata with the original pre-save snapshot. A successful save is allowed to change serialization metadata itself, for example JSON/YAML output is always UTF-8 although an imported JSON file may carry UTF-8 BOM or a legacy decoder selection. Once an earlier document's completion renders during a later write, the check mistakes the known normalization for a new user edit and refuses to close.

Reproduction: import UTF-8-BOM `/source.json` containing `[{"qty":"7"}]`; edit it; create and edit B; request whole-window Save and close; let A finish, hold B's write, then finish B. **Observed: both writes complete but `destroy` is called zero times.** There was no concurrent edit. A's metadata legitimately changed from `utf-8-bom` to `utf-8` because of the JSON serializer contract. The independent test fails at the expected successful close, while the original late-edit protection tests pass.

Fix: update the expected close snapshot using only the exact successful save completion's known metadata patch, retaining the captured rows and preserving detection of genuine intervening user changes. Do not simply copy live metadata into the expected snapshot, which would hide concurrent changes. Browser download confirmation needs the analogous non-durable expected-output normalization without creating a saved checkpoint.

Regression: BOM/legacy-decoded JSON and YAML in multi-document close, Save As to another format, browser output encoding normalization, and real edits/settings changes during those same saves. Successful normalization should allow the requested close; concurrent changes must still prevent it.

### Additional positive boundary checks

- The new enum selector at `App.tsx:2202–2233` invokes the central `commitCell` path. A synthetic selection of the second enum option changes `11` to `22`, and one Undo restores `11` with no remaining Undo entry.
- Column move remapping at `App.tsx:2344–2368` and history restoration work for an unchanged rule set: moving column A to B moves its Required rule, and Undo returns both values and rule to A. R2 above prevents treating this happy-path check as proof for later rule edits.
- The App remote-validation effect at `App.tsx:866–870` refreshes the displayed report without independently rejecting authoritative raw rows. A stable synthetic client boundary receives an empty required cell, retains that cell and the accompanying remote value, and reports one violation. This checks presentation only; no transport, permission, merge or formula-algorithm claim follows.
- Original snapshot identity, cancellation/failure, direct-save checkpoint, browser download, source-byte decode, serializer, cleanup and recovery-helper paths were checked against the updated integration. The unchanged helpers do not inherit native acceptance from unit tests.

### Commands and evidence for this re-review

Newly executed against fixed `69980736`:

```sh
node node_modules/vitest/vitest.mjs run \
  src/tests/App.reviewCorrections.test.tsx src/tests/App.adoptedUx.test.tsx \
  src/tests/App.integration.test.tsx src/tests/importPreview.test.ts \
  src/tests/conversionPreview.test.ts src/tests/ImportPreview.test.tsx \
  src/tests/useFile.test.ts src/tests/recovery.test.ts src/tests/validation.test.ts \
  src/tests/cleanup.test.ts src/tests/c5Panels.test.tsx \
  src/tests/formats.test.ts src/tests/csv.test.ts
```

Result: **13 files / 171 tests passed, exit 0**, including all nine original intended-safe assertions and their adopted close/deletion/modal edges. The integrator's separately reported 49-file/607-test, typecheck and ESLint results were not substituted for this reviewer's actual focused execution.

The additional temporary six-case fixture was run against the archived exact commit: **R1/R2/R3 failed at their behavioral assertions; three positive enum/remapping/remote-presentation checks passed; exit 1**. Source/config/archive and final logs were retained for the integrator. An initial harness collection attempt used the wrong working directory, then a temporary unstable mock caused a rerender loop; these harness problems were corrected before the reported final six-case execution and are not product findings.

Only this report was edited by the reviewer. No build, normal product launch, dependency change, external network request, native filesystem write, source/test edit or C6/C7 algorithm/security re-review occurred. Native GUI/IME/OS dialogs/clipboard/storage durability/accessibility/performance acceptance remains pending. Resolve R1–R3, add permanent regressions, and obtain a new fixed-SHA C2/C5 receipt before considering this review closed.

## Narrow recheck: local `479a85d62d5e9871baccf629ad2de79526ad887d`

Date: 2026-10-12. The integrator maps this local commit to remote `ac8194cb09a79d38332ba3421dc10a15d0aa00f3`. This pass inspected the actual delta from `69980736`, the surrounding save/history/validation contracts, and the added permanent assertions. `git diff --quiet 479a85d -- src src-tauri` returned exit 0 at verification. Independent fixtures used an exact archive of `479a85d` rather than subsequently edited working files.

**Result: changes still required for two surrounding R1/R2 subcases.** The three previously reported R1–R3 reproductions now pass. R3 is corrected in the observed native single-document and multi-document normalization cases. The original F1–F9 production regressions continue passing. This receipt is limited to C2/C5 and does not reopen or approve C6/C7 algorithm/security review; native acceptance remains pending.

### Corrections verified

- R1's cleanup path now compares final rewritten rows with surviving original rows (`App.tsx:2677–2679`). Column insertion/deletion and movement use aligned comparisons and remapped rules; row insertion still treats genuinely new rows as new input. Permanent tests pass for unrelated cleanup, sorting existing invalid values, column insertion/movement with an existing violation, final rewritten-formula rejection and rejecting blank-row insertion. The remaining header-applicability subcase is below.
- R2's ordinary edit records omit rule metadata (`App.tsx:886–895`), and Undo/Redo only captures rules when the corresponding entry contains them (`1674–1704`). Edit → add rule → Undo preserves the new rule. Subsequent rule edits also survive ordinary Redo/Undo. Structural transactions still restore stale rule snapshots and therefore remain incomplete for later rule configuration, as reproduced below.
- R3's `SaveOutcome.savedMeta` is separate from the immutable original snapshot (`useFile.ts:39–43,222–226,280–291`). Save-close substitutes the known output metadata only for each completed target (`App.tsx:740`), while retaining captured rows and all other workspace snapshots for the final comparison (`750`). The multi-document BOM-JSON case and an additional single-document BOM-JSON case both close successfully. Earlier-document late updates and changes to initially clean documents still prevent closing. Browser output normalization is represented without adding a durable checkpoint; no browser/native filesystem completion claim is inferred from that source check.

### R2a — P2: structural Undo still silently removes rules configured after the structural change

Location on `479a85d`: `src/App.tsx:1499,1603,2407` record full rule snapshots; `982–993` restores the old array; `1674–1704` propagates those snapshots through Undo/Redo.

Reproduction: load `id,value` / `11,keep`; move A to B; add a Required/reject rule to current column A; press Undo. **Observed: rows return to their original order, but the Validation count changes from 1 to 0.** The later-added rule is silently discarded. The intended result is to preserve that rule and map it to column B, which holds the same original `value` data after reversing the move. This was an explicit surrounding case in R2's earlier regression guidance, rather than a restart of another feature review.

Fix: structural history should describe the reversible column mapping and any rules actually removed with deleted columns. Apply that mapping to the current rule set during Undo/Redo instead of replacing the entire set with a stale snapshot. Alternatively define and implement a coherent explicit rule-configuration history. Preserve ordinary history's now-correct metadata neutrality.

Regression: move/insert/delete → add/edit/remove/import rule → Undo/Redo; restoring deleted columns and their associated rules; no duplicate or resurrected unrelated rules; ordinary edit Undo/Redo remains unchanged. The exact move/add/Undo assertion is retained in the independent fixture.

### R1a — P2: header-applicability comparison unnecessarily revalidates other rules

Location on `479a85d`: `src/App.tsx:1442–1454`, particularly `1446`; analogous whole-row invalidation at `1619–1626` for sorting.

The new aligned row comparison correctly preserves untouched violations until any rule has `skipHeader`. Inserting at row 0 then deletes the **whole** original-header comparison row. This revalidates every rule column, including all-rows rules whose applicability never changed. The sorting branch uses the same broad invalidation. Header applicability is a property of each rule, not of the entire row.

Reproduction: load `bad,value` / `11,keep`. Add rejecting pattern `[0-9]*` to column A with header skipping OFF; A1 is an existing violation. Add rejecting Required to B with header skipping ON. Insert a row above source row 1. The new blank header satisfies A's pattern and is excluded from B's rule; the old B header `value` is valid when it becomes data. A's existing `bad` value is unchanged and already subject to the same all-rows rule. **Observed: insertion is rejected and the original two rows remain**, instead of inserting a valid blank header and preserving the unrelated existing A violation.

Fix: check changed header applicability for only the affected rules/destinations, alongside genuinely new cells and changed final values. Do not erase all old values for that row. Rules with different `skipHeader` settings can also share a column, so merely limiting whole-cell invalidation to affected columns is not a complete per-rule solution.

Regression: this mixed-rule insertion case, mixed-rule sorting when source row 1 moves, same-column rules with different header policies, and a formerly exempt header value that actually violates a newly applicable rule. The latter must still reject atomically.

### Executed checks and retained evidence

Two fresh permanent-suite commands on frozen `479a85d` completed successfully:

```sh
node node_modules/vitest/vitest.mjs run \
  src/tests/App.reviewCorrections.test.tsx src/tests/App.adoptedUx.test.tsx \
  src/tests/App.integration.test.tsx src/tests/useFile.test.ts \
  src/tests/validation.test.ts src/tests/cleanup.test.ts \
  src/tests/recovery.test.ts src/tests/c5Panels.test.tsx

node node_modules/vitest/vitest.mjs run \
  src/tests/importPreview.test.ts src/tests/conversionPreview.test.ts \
  src/tests/ImportPreview.test.tsx src/tests/formats.test.ts src/tests/csv.test.ts
```

Results: **8 files / 96 tests passed** and **5 files / 83 tests passed**, both exit 0, totaling **13 files / 179 tests**. The integrator separately reported 49 files / 625 tests, typecheck and ESLint passing; this reviewer did not rerun those aggregate commands.

The independent archived fixture completed with **7 passing assertions and 2 expected-safe assertion failures**, exit 1. Passing checks include the prior three R1–R3 reproductions, enum single-Undo, ordinary column-remapping Undo, remote-validation presentation, and single-document normalized close. Failures are exactly R2a and R1a above.

Retained artifacts for the integrator: `/tmp/plainsheet-c8-final479a85/review.test.tsx`, `vitest.config.mts`, `result.log`, `permanent.log`, `c2.log`; exact source archive `/tmp/plainsheet-c8-fixed479a85`. No source or permanent tests were edited. Only this report was changed. Review pauses here pending the next fixed SHA; the two remaining cases must not be marked cleared by the passing permanent suite alone.

## Narrow recheck: local `8d695acca750ba9fbbb226f9940be7a77d362427`

Date: 2026-10-12. The integrator maps this commit to remote `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`. This pass read the complete seven-file delta from `479a85d`, including the new `validationHistory.ts`, its tests, the per-rule validator change and all added App assertions. Production source matched the fixed SHA when checked with `git diff --quiet 8d695ac -- src src-tauri` (exit 0). Additional assertions ran against an exact archive.

**R1a and R2a are corrected. One new P2 capacity regression in the structural-history correction remains.** This is a bounded C5 rule-history/import neighbor of R2a. No C6/C7 algorithm or security review was reopened, and native GUI/IME/filesystem acceptance remains pending.

### Corrections and bounded neighbors verified

- **R1a corrected:** `App.tsx:1458–1474,1640–1650` identifies only the skip-header rule IDs that become applicable when the old header moves. `validation.ts:174–183,221–225` checks those IDs independently and deduplicates issues per row/column/rule, without rechecking an unrelated all-rows rule on the same cell. Both original mixed-column reproduction and additional App-level same-column insertion/sorting checks pass. Genuinely newly invalid Required values still reject atomically without an extra Undo entry.
- **R2a corrected within capacity:** `validationHistory.ts:14–89` maps the current rule set, inverts the actual column operations and retains only rules detached by a structural removal. App's ordinary history stays metadata-neutral; Undo/Redo computes its counterpart from the current rules and restores through this mapping (`App.tsx:891–899,1004–1008,1698–1726`). The original move → add rule → Undo now preserves and reverse-maps the new rule.
- Independent App tests cover **move, insert and delete**, each followed by rule edits, complete rule removal, and replacement through the actual sidecar import input, then Undo and Redo. The latest edited contents survive; explicitly removed surviving rules do not reappear; newly imported rules follow their columns; a rule on an inserted column is detached on Undo and returns on Redo. All three compound tests pass.
- Permanent tests additionally cover restored deleted-column rules alongside later surviving-column rules, noncontiguous deletion inversion, immutable cloning, a newly applicable rule on the same column, and no duplicate issue counting. Original F1–F9 and R1–R3 regressions still pass in the focused run.

### R2b — P2: restoring deleted-column rules can exceed the 100-rule limit and block ordinary editing

Locations on `8d695ac`: `src/lib/validationHistory.ts:80–85`; history/row mutation at `src/App.tsx:994–1008,1698–1708,1718–1728`; rejection of oversized rule sets at `src/lib/validation.ts:159–163,228`; export failure at `validation.ts:244–246` and `src/components/ValidationPanel.tsx:217–222`.

The recorded C5 contract and both add/import paths cap a document at 100 rules. Undo now correctly preserves current rules and appends rules from restored columns, but it does not preflight the combined count. Two individually valid states can therefore produce an invalid 101-rule state. This is not merely a panel presentation limit: `validateMutation` returns a rule error for **every** subsequent mutation when the count is greater than 100.

Reproduction: load `id,value` / `11,keep`; give A one Required rule; delete A; import a valid sidecar containing 100 uniquely identified Required rules on the surviving current A; Undo deletion. The restored A rule joins all 100 current rules, giving 101. Attempt the valid edit A2 `11` → `12`. **Observed: A2 stays `11` because the oversized rule set blocks the edit**, although every checked Required value is nonempty. The final independent intended-safe assertion fails at this exact value comparison. By source inspection, Export also throws `Invalid validation rules.` without a panel error handler for this state; an actual export click was not needed to reproduce the editing failure and is not claimed as executed.

Fix: preflight the complete restored rule state against the documented contract before changing rows or either history stack. On overflow, preserve rows, current rules and both stacks and present an actionable capacity message, or obtain an explicit rule-resolution choice. Do not silently truncate/drop current or restored rules, and do not leave a partially applied Undo. Apply the same guard to Redo, which can reintroduce rules from an inserted column after additional sidecar imports.

Regression: exactly 100 restored rules succeeds; 101 triggers the chosen atomic capacity handling; deletion Undo and insertion Redo with later valid imports/additions; current rule IDs colliding with detached IDs; no history consumption or data changes on blocked restoration; remove a rule and retry succeeds; export remains usable. The existing valid edit/import/history cases must continue passing.

### Execution receipt

```sh
node node_modules/vitest/vitest.mjs run \
  src/tests/App.reviewCorrections.test.tsx src/tests/App.adoptedUx.test.tsx \
  src/tests/App.integration.test.tsx src/tests/useFile.test.ts \
  src/tests/validation.test.ts src/tests/validationHistory.test.ts \
  src/tests/cleanup.test.ts src/tests/recovery.test.ts src/tests/c5Panels.test.tsx
```

Result: **9 files / 112 tests passed, exit 0**. This includes 29 App review-correction cases and nine new pure history/applicability cases. The integrator separately reported the aggregate 50-file/641-test run plus typecheck/ESLint passing; this review did not rerun that aggregate.

Independent archived App fixture: **14 tests passed / 1 failed, exit 1**. The failure is R2b; all original R1a/R2a assertions and the bounded edit/removal/import/same-column applicability neighbors pass. Reproduction source/config/logs are retained at `/tmp/plainsheet-c8-final8d695/review.test.tsx`, `vitest.config.mts`, `result.log`, `permanent.log`; exact archive `/tmp/plainsheet-c8-fixed8d695`.

Only this report was edited. No source/permanent test edits, builds, normal launches, dependency changes, external traffic or native writes were performed. Review pauses for an R2b correction and fixed-SHA receipt; the prior two findings can be marked corrected, but this C5 review is not yet closed.

## Final narrow receipt: local `f4d0f2b1479441a0c9542454da3f9b55345f5f58`

Date: 2026-10-12. The integrator maps this exact local commit to remote `6dba8bd1fb42b22b065fc9e8003d8d137e054610`. This pass reviewed only R2b and its four-file guard/test delta from `8d695ac`, plus the requested capacity, Undo/Redo, column-bound, actionable-message and retry boundaries. The source remained byte-identical to the fixed local commit (`git diff --quiet f4d0f2b -- src src-tauri`, exit 0). Independent reproductions used an exact archive.

**R2b is corrected. No remaining finding was identified in this narrow delta.** Together with the preceding fixed-SHA receipts, all concrete C2/C5 findings recorded in this report are corrected at this candidate. This is a scoped source/synthetic-test review result, not whole-product or native acceptance. It does not restart, substitute for, or approve the unperformed post-fix C6/C7 algorithm/security review.

### Source and behavior verification

- `src/lib/validationHistory.ts:93–104` computes the complete prospective restored rule set, checks the documented 100-rule capacity and each mapped rule's validity, and returns without mutating either argument. Ordinary nonstructural history remains unaffected.
- `src/App.tsx:1699–1715,1725–1741` runs this preflight **before** `history.undo`/`history.redo` and before row/rule restoration. On error it only shows the actionable message and returns. No rule truncation or partial restoration was added.
- The original delete-column → import 100 rules → Undo reproduction now blocks the overflowing Undo while retaining the valid current state. A subsequent ordinary valid edit succeeds; no 101-rule state is created.
- Fresh App tests verify exact equality of **both** real history stacks, current rows and exported rule contents after capacity rejection. They check the visible capacity explanation and instruction to remove unused rules. Removing one rule and retrying succeeds at exactly 100 rules with the expected stack transition. The symmetric inserted-column **Redo** case passes with the same atomic preservation and retry behavior.
- The column-bound case rejects a restoration that would move a rule beyond XFD before any state mutation, retains exportable current rules, and succeeds after the affected rule is removed. Independent pure assertions verify the exact 16383/16382 zero-based boundary, actionable correction text and unchanged inputs.
- Additional independent pure checks verify that exactly 100 restored rules are accepted and an imported rule reusing a detached rule's ID retains its current definition without a false capacity rejection or duplicate restoration. The original R1/R2/R3, R1a/R2a and bounded later-rule edit/removal/import assertions remain passing in the retained archived fixture.

### Fresh execution evidence

```sh
node node_modules/vitest/vitest.mjs run \
  src/tests/App.reviewCorrections.test.tsx \
  src/tests/validationHistory.test.ts src/tests/validation.test.ts
```

Result: **3 files / 48 tests passed, exit 0**: 32 App correction cases, 11 history/applicability cases and five validator cases. The transparent history wrapper in the reviewed tests executes the real history hook and observes its stacks; it does not replace the Undo/Redo implementation.

Independent fixture against archived `f4d0f2b`: **18 tests passed, exit 0**, including the previously failing capacity assertion and three additional pure boundary checks. Retained evidence: `/tmp/plainsheet-c8-finalf4d0f2/review.test.tsx`, `vitest.config.mts`, `result.log`, `permanent.log`; exact archive `/tmp/plainsheet-c8-fixedf4d0f2`. Earlier failing fixtures/logs remain retained separately for traceability.

The integrator separately reported **50 files / 646 tests**, typecheck and ESLint passing; this reviewer did not rerun those aggregate commands. Only this report was edited. No build, normal product launch, production/permanent-test edit, dependency change, external traffic or native write occurred. Native GUI, OS dialogs/filesystem, IME, clipboard, accessibility, storage durability and performance acceptance remain pending as previously documented. Any later production change requires its own appropriately scoped review; this receipt applies to the exact SHA above.
