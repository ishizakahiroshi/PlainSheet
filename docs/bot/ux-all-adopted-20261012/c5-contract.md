# C5 cleanup, validation and recovery contracts

Prepared as independent helpers and callback panels for UX-017, UX-018 and UX-027. No dependencies, network requests, native file writes or CSV metadata additions. Shared-file integration belongs to the sequential integration owner. This record describes helper/component tests, not native or product-screen acceptance.

## Owned files

- `src/lib/cleanup.ts`, `validation.ts`, `recovery.ts`
- `src/components/CleanupPanel.tsx`, `ValidationPanel.tsx`, `RecoveryPanel.tsx`
- `src/tests/cleanup.test.ts`, `validation.test.ts`, `recovery.test.ts`, `c5Panels.test.tsx`
- This contract

## Cleanup

`previewCleanup(rows, cells, {asciiWhitespace, fullwidthSpace})` accepts the exact selected source-coordinate cell set, already filtered by the shared selection mapper. It clones rows and trims only chosen boundary character classes. ASCII means space, tab, CR/LF, form-feed and vertical-tab. U+3000 is a separately unchecked option. Internal whitespace and NBSP are preserved. Every value stays a string; padded/long IDs are never coerced. Duplicate/out-of-bounds targets do not expand scope.

Result: `nextRows`, `changes` (first 100 cell diffs), complete `changedCells` count, `targetedCells`, `removedSourceRows`, `truncated`. Preview/cancel does not alter input.

`previewDedupe(rows, selectedSourceRows, {keyColumns,caseSensitive,hasHeader})` keeps the first source-order selected occurrence and removes complete subsequent selected rows. Header means source row 0. Hidden/nonselected rows never participate in comparison, are not removed and retain values/relative order. Their source indexes naturally shift when earlier rows are removed. Keys are exact strings or explicit Unicode lowercase comparison; no trimming or numeric conversion. Composite keys use a JSON tuple to avoid delimiter collisions. No key columns produces an error.

`CleanupPanel({rows,cells,hasHeader,onApply,onClose})` previews every option change. Dedupe requires selecting all key cells in each target row and checking explicit complete-row removal consent. `onApply(nextRows, metadata?)` fires once; dedupe passes `{deletedRows: originalSourceIndices}` for formula/reference/collaboration structural integration. Trim passes no metadata. The owner must validate and commit the resulting rows as one history operation, and remount/cancel the panel when document/selection identity changes. It must not perform an additional bulk transformation behind the visible preview.

## Validation

Rules live in a per-document session map outside rows/CSV:

`ValidationRule = {id,column,kind:'required'|'pattern'|'enum',mode:'warning'|'reject',skipHeader,pattern?,values?}`

`validateMutation(beforeRows,nextRows,rules,changedCells?)` returns `{allowed,issues,totalIssues,rejectedIssues,truncated,ruleErrors}`. Without explicit targets it checks changed values in rule columns; with targets it checks that exact source-coordinate set. All violations are counted, including rejecting errors beyond the first 200 display entries. One rejecting violation blocks the complete transaction before history or row mutation. Warnings leave raw strings intact. Existing unrelated invalid values do not prevent repair elsewhere. `validateDocument(rows,rules)` reports existing violations without modifying data. Rejecting rules are chosen explicitly; the panel defaults to warning.

Limits: 100 rules; pattern source 128 characters; values checked by patterns at most 4096 UTF-16 code units; enum 1–100 exact strings of at most 4096 characters. Required means nonempty raw text, not trim/nonblank. Pattern matching is full-cell and supports literals, dot, classes, `\\d/\\w/\\s`, optional edge anchors, `?`, `*`, `+`, `{n}`, `{n,m}` and `{n,}`. Groups, alternatives, lookarounds, backreferences and nested quantifiers are rejected. A bounded dynamic-programming matcher handles sequences of repeated tokens in O(pattern tokens × value length), avoiding native whole-pattern backtracking. Native regex only tests one character against one atom.

`serializeValidationRules` / `parseValidationRules` use the independent version-1 `plainsheet-validation` JSON schema. Import is explicit into the current intended document and never matches filenames. Corrupt/unsupported imports return an error and do not replace existing rules. Rules removed from a session are not implicitly removed from exported sidecars; deleting a sidecar does not clear an already imported session. Closing a document loses its session rules. CSV-only sharing loses all rules by design.

`ValidationPanel({rows,rules,onRulesChange,onClose,onExportRules?})` adds/edits/removes rules and lists bounded violations. JSON file import is capped at 1 MiB and ignores reads completed after unmount or after a newer read. Export always exposes the complete separate JSON for review/copy; the optional callback should deliver a `.validation.json` file through the owner's platform-aware download/save route. Remount the panel by document ID and capture that ID in callbacks. UI enum-candidate editing in the grid and enforcement of all mutation routes belong to shared integration.

## Recovery

`createRecoveryStore(storage, 'browser'|'desktop', options?)` injects a localStorage-compatible adapter. It returns `inspect`, `enable({acceptLocalContentStorage:true})`, `writeSnapshot({documentId,rows,meta})`, `deleteOne(id)`, `deleteAll()`, `disable()`, `restoreCopy(id)` and `location`. Every operation returns `{ok:true,value}` or `{ok:false,error}`; callers must not claim success on failure or block ordinary editing. The optional clock/ID generator is for deterministic synthetic tests.

Initial missing storage is OFF; `inspect` while OFF does not write content. Explicit UI consent explains committed cell content, names, serialization options, exact edition-local location, TTL, capacity and best-effort limits. The browser uses this site's browser-profile localStorage. Native uses the app's own local webview storage, not an original file or a separately guaranteed backup. Consent is retained in the same versioned store so previously enabled recovery can continue after restart.

All content and consent live in one `plainsheet.recovery.v1` key. One synchronous localStorage replacement commits one coherent store snapshot; a failed write preserves the previous completed snapshot according to the Web Storage contract. There is no cross-window transaction locking; concurrent windows can race and recovery remains best effort. Capacity is a conservative 2 MiB of UTF-16 serialized key value (including metadata), with at most 50 documents; no silent eviction. Each draft has a cryptographically random recovery ID and a separately supplied random session-document ID. Filename is display only. Snapshot updates preserve recovery ID. Schema validation includes version, edition, timestamp, TTL, unique identities, cell strings, metadata enums and bounds.

A draft expires exactly seven days after its most recent successful snapshot. Reads/writes clean expired entries; expired entries are never restored. Failed cleanup returns an error. App-closed deletion is not promised. Storage denial, quota errors, oversized documents, corrupt data and identity failures are surfaced without touching editor rows. A failed OFF deletion immediately blocks further snapshot writes for the current store instance and explicitly says content may remain after restart; it never claims deletion succeeded.

Snapshots only include committed rows, display filename and a whitelist of serialization options. Neither filePath, original sourceText, history, incomplete editor/IME drafts, view state, rules nor collaboration state is stored. `restoreCopy` clones data, prefixes the filename with `Recovered-`, marks it dirty and never includes an original file path/sourceText. The owner creates a fresh document identity with optional calculation/sharing initially OFF. External modification of the original cannot redirect restore into that file. Opening a copy does not delete its snapshot. Browser download-start does not delete drafts. Deletion is explicit or TTL-driven.

`RecoveryPanel({store,onRestore,onStateChange?,onClose})` displays names, random-identity suffixes, snapshot/expiry times, consent, individual deletion, all deletion, OFF-and-delete and Later. `onRestore` receives `{rows,meta,recoveredFrom}` for a new document. The owner should create the controller once with safe storage access, inspect startup candidates, snapshot committed edits only while enabled and surface write failures. Enabling can snapshot the active document explicitly. Deleting drafts must not immediately recreate unchanged content through an effect triggered only by the deletion state notification. Debounced writes must capture originating document ID, rows and metadata and be cancelled/flushed deliberately on switches.

## Validation evidence and remaining boundaries

- Focused Vitest command: `./node_modules/.bin/vitest run src/tests/cleanup.test.ts src/tests/validation.test.ts src/tests/recovery.test.ts src/tests/c5Panels.test.tsx`: 4 files / 23 tests, exit 0 on 2026-10-12 local executor time.
- Scoped ESLint covers all ten source/test files: exit 0. No suppressions or test removal.
- Full `tsc --noEmit`: exit 0 against the concurrently integrated tree at this handoff. Earlier unrelated live-worker diagnostics were reported separately and corrected by their owner. `git diff --check` for the owned paths: exit 0.
- Synthetic tests cover exact/hidden selection, padded and long IDs, explicit whitespace/header/case, preview bounds, callback atomicity/cancel, warning/reject counts and unsafe-pattern rejection, standalone sidecars, initial OFF zero writes, consent, same-name identities, dirty pathless restore, quota/corruption/read/deletion/expiry failures, capacity and last-completed snapshots.
- Parent integration tests must prove single Undo, per-document rule isolation, every mutation route, rejected-paste no-history behavior, actual recovery scheduling and startup presentation. Real browser/native storage durability, eviction/private mode, crash/power loss, OS file-picker/save, OS clipboard, IME, screen reader and rendered product-width acceptance remain unobserved.

## Integrated rule history and applicability (latest candidate)

At code `76ab986ceeff7fb0d2dcba17cf6096489c45ff33`, structural validation compares identity-aligned surviving values and checks newly applicable header-skipping rules individually. `validateMutation` accepts an optional fifth argument of `{row,ruleId}` entries; this does not recheck other unchanged rules, even when they share a column. Inserted or changed invalid values remain atomic rejections.

`validationHistory.ts` records reversible column insert/delete/move mappings and only the rules removed with deleted columns. Undo/Redo remaps the current rule set rather than restoring stale whole arrays. Later edits/additions survive on the same surviving column; newly inserted-column rules are removed with that column during Undo and restored with it during Redo. Ordinary cell history never captures rule configuration. App rules remain per-document and outside CSV/recovery content.

Integration now has permanent App assertions for cleanup atomicity, rule remapping, later-rule edits, enum commit with one Undo, recovery scheduling/deletion, startup corruption and close/save behavior. The final source has 50 files /641 tests overall; see verification.md for exact scope and independent receipts. Actual storage durability and native/UI acceptance remain pending.

At latest code `6dba8bd1fb42b22b065fc9e8003d8d137e054610`, structural Undo/Redo preflights the 100-rule count and mapped-rule validity before mutating rows, rules or history stacks. If restoration would exceed a limit, an actionable notice asks for unnecessary/affected rules to be removed or corrected. The action is wholly rejected without clipping rules or consuming history; the user can retry the same action after adjusting rules. The permanent App guard tests and full 646-test receipt document this boundary.
