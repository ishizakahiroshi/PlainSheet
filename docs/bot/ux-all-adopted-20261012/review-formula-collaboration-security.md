# C8 independent review: formula, collaboration and security integration

Date: 2026-10-12. Reviewer did not implement the reviewed code.

## Verdict and fixed scope

**Changes required. Three P1 findings and one P2 finding are reproduced below.** The existing focused tests pass, but miss these integrated lifecycle/concurrency cases. This is not native or separate-device acceptance.

- Independently inspected and executed local candidate: `4e264500c34216398f39067b86cbf55c89c8b887`.
- Local baseline: `d5b1a4f1b34fe173943d2e034ade599d0438d0e7`, identified by the coordinator as byte-equivalent to instruction baseline `8204b5442f602164148b725c3ad07190630e33c4`.
- Published candidate supplied by the coordinator: `a632ef64a2631e2dd00e63a84f6e12d8effb5469`, Draft PR #4. The coordinator verified that its 71 source/test blobs equal the local candidate. This reviewer did not independently fetch the remote commit. The published review diff begins at `bf7e54689742c35a2158c16f79823a66cb59ad85`; intervening pre-baseline changes are instruction/link changes, not additional implementation in this review.
- Full new implementations read: `src/lib/formula.ts`, every file under `src/lib/collaboration/`, `server/relay.ts`, `server/run.mjs`, `server/serve.ts`, `src/components/SharingPanel.tsx`, `src/hooks/useCollaboration.ts`.
- Integration inspected: `src/App.tsx` formula/raw rendering and editing, clipboard/fill, structural mutations, sorting, Undo/Redo, sharing create/join/detach, document switching/loading, save/export/checkpoints, close guards and cleanup; `useDocuments`, `useFile`, relevant `GlideSheet`, `FormulaBar`, `CellTextEditor`, and native CSP/main changes.
- Tests read: complete formula and collaboration model/transport/runner/panel suites, `useCollaboration.test.tsx`, and relevant production-App extension tests. Repository guidance, task README, adopted proposal, C6/C7/C8 plans, design/formula/collaboration contracts and historical research-review caveats were considered. Historical recommendations to defer UX-019/020 do not narrow the adopted task.
- Production/test files were not modified. Additional reproductions were written only in a temporary directory outside the checkout. This report is the only repository file authored by this reviewer.

## Findings

### FC-01 — P1: a shared blank starter is reused for another file, allowing an unconsented upload

**Location:** `src/App.tsx:381–407` (`isBlankStarter` / `loadIntoWorkspace`), with the upload path at `src/App.tsx:327–330` and `src/hooks/useCollaboration.ts:110–141`.

`isBlankStarter` checks the empty matrix and file/dirty state but does not check whether its document ID owns a collaboration session. Creating a room for the untouched blank starter leaves those predicates true. Opening another file then replaces the content under the same document ID. The old session remains attached. The next ordinary cell edit compares the entire newly opened matrix against the old shared document and sends its contents into the old room. A polling refresh before that edit can instead overwrite the newly opened local table with the room's blank content.

**Reproduction observed with production App/hooks and real loopback HTTP:**

1. Render an untouched App, explicitly share its blank table and join an editor peer.
2. Close the sharing panel and open a synthetic CSV containing `private,not-shared` and `secret,do-not-upload` through the ordinary load path.
3. The application still has one tab; the old sharing session is attached to it.
4. Edit the second row's first cell to `secret-changed`, then synchronize the peer.
5. Peer receives `[["private","not-shared"],["secret-changed","do-not-upload"]]`, although only the original blank table was approved for sharing.

The reproduction uses the sample-load callback with synthetic CSV bytes; native/browser file import reaches the same `loadIntoWorkspace` branch. No real private data or external relay was used.

**Required fix:** Treat any document with an attached or pending sharing session as ineligible for blank-starter reuse. Opening a different file must create a fresh unshared document ID. Apply the same invariant to New/Open/sample/drop/recovery and asynchronous sharing establishment; do not silently detach or upload the new document as a substitute.

**Regression:** Share blank → Open file → edit → poll; assert two document IDs, new tab OFF, old room unchanged. Also test Open while create/join is awaiting a response and New on a shared blank starter.

### FC-02 — P1: a remote structural update makes an active editor overwrite a different cell

**Location:** `src/App.tsx:305–308` (apply remote rows) and `src/App.tsx:861–870` (index-addressed commit). Related editor target capture: `src/components/FormulaBar.tsx:121–131`; grid commit mapping: `src/components/GlideSheet.tsx:288–297`.

The transport has stable row/column IDs, but the live editor retains only its numerical coordinates. Applying a remote snapshot can insert, delete or reorder rows/columns while the draft remains active. On commit, those old coordinates are mapped against the new matrix and the write targets another stable cell. The integration never binds the edit session to the original stable IDs or rejects the changed structure. Because enqueue uses the latest snapshot revision, the resulting unintended overwrite need not appear as a stale-write conflict.

**Reproduction observed with production FormulaBar/App and real loopback HTTP:**

1. Share `[["first","A"],["second","B"]]` and join an editor peer.
2. Select the second row's first cell, focus the formula bar and type `edited-second` without committing.
3. Peer inserts a row at the beginning; let the application's real polling refresh arrive.
4. Press Enter in the still-focused formula bar.
5. Both participants receive `[["",""],["edited-second","A"],["second","B"]]`. The original first row was overwritten; the intended second row was untouched.

**Required fix:** Capture stable row ID, column ID and appropriate revision information at edit start. Commit only to that identity; if it was deleted, preserve the draft and request resolution rather than writing to its former index. Alternatively, safely block/resolve a structural refresh while a draft is active. Audit both formula bar and canvas editor, including IME and row/column reordering. Replacing a whole current matrix is not an adequate stable-identity commit contract.

**Regression:** Pending draft × remote insert/delete/reorder on both axes, including a filtered view and an offscreen target. Assert the original stable target receives the edit, or the draft is retained with a clear conflict; no neighboring value changes.

### FC-03 — P1: concurrent structural formula rewrites silently retain stale references

**Location:** `src/hooks/useCollaboration.ts:93–102`, `src/App.tsx:1219–1229` (and analogous column/delete paths), `src/lib/collaboration/model.ts:250–252,280–291,315–331`.

The client calculates positional formula rewrites using its local structural snapshot and packages the results as ordinary unconditional `set-cell` actions. The relay allows an old `baseRevision` and applies these precomputed strings after other structural changes. Stable cell identity alone does not make a formula's embedded A1 positions valid. Two identical rewritten strings also bypass the overwritten-cell conflict test, leaving no reported conflict despite a changed result.

**Real loopback reproduction:**

1. Initial shared data is `[["2","=A1*2"]]`.
2. Two clients at revision 0 each independently build an insertion at row 0 using `insertAxisActions`, project it with `applyCollaborationOperation`, and append `actionsForCellMatrix(projected, rewriteFormulasForStructure(...))`. This is the production hook's composition.
3. Submit both prepared operations and synchronize.
4. Actual converged rows: `[["",""],["",""],["2","=A2*2"]]`; calculated result is `0`.
5. Required surviving-target reference is `=A3*2`, yielding `4`. Both history conflict arrays are empty.

**Companion structural-Undo reproduction:** Start with `[["2",""]]`. A inserts row 0. B synchronizes and writes `=A2*3` beside the original `2`. A synchronizes and undoes its insertion. Actual final rows are `[["2","=A2*3"]]`, result `0`, with all three conflict arrays empty. A safe implementation must reject this Undo or transform the new formula to `=A1*3` (result `6`). Merely putting a precondition equal to the current revision on the Undo request does not detect the problem; the inverse was derived from an earlier structure. This companion fixture also executed against the unchanged frozen model/client/relay/formula files and stopped its relay.

**Required fix:** Make formula-aware structural transformation authoritative against the committed structure, or reject stale structural/formula batches atomically with a reviewed rebase/retry flow. A per-formula-cell `ifRevision` alone is insufficient when no existing formula changed but another relevant structural edit occurred. Define the same rule for offline queues, deletion, new formulas created after an insertion, and compensating Undo/history restoration. Keep the original operation ID/payload immutable on a lost-ACK retry; a deliberately rebased new operation needs its own identity.

**Regression:** Simultaneous same-axis and crossed-axis inserts/deletes with relative/absolute/range formulas; one offline client; formula added by a peer before structural Undo. Either the correct reference/result must converge, or the whole unsafe batch must be visibly rejected with pending work retained. Assert semantic results and conflict state, not only equality of clients' final matrices.

### FC-04 — P2: saving locally bypasses the warning for unsent sharing operations on window close

**Location:** `src/App.tsx:272–276`, `src/App.tsx:484–504`, and the close/save-close completion paths. Session loss occurs through the memory-only queue in `src/lib/collaboration/client.ts`.

Browser/native close guards consider dirty files, an active editor and in-progress saves, but do not inspect collaboration queues. After disconnected edits are successfully saved locally, dirty becomes false even though those operations have not reached the relay. Closing then loses the queue and membership credentials without a pending-sharing confirmation. A generic explanation shown earlier in SharingPanel does not satisfy the contract to warn before abandoning a specific pending queue.

**Observed production-App integration with real relay and mocked native I/O/window APIs:**

1. Share a table, explicitly disconnect, edit a cell; UI reports `pending=1`.
2. Save the local document successfully; tab becomes clean.
3. Dispatch a cancellable `beforeunload`: it is not prevented.
4. Invoke the registered native `onCloseRequested` handler: it immediately calls `destroy()` without a sharing warning.
5. Peer synchronization still returns the old value. Closing the real tab/window would discard the only resend queue. The local file copy survives, so this is a synchronization/queue-loss finding, not a claim that its saved cell contents vanished.

**Required fix:** Expose pending/in-flight sharing state across all document sessions to browser/native close guards and every save-then-close path. A local save must not imply successful synchronization. Require an explicit choice to wait/reconnect or abandon the pending operations, preserving the ability to save a local copy.

**Regression:** Online delayed ACK and offline/revoked/blocked queues × active/inactive document × successful local save × native/titlebar/browser close. Verify no silent queue/credential loss and no automatic unauthorized retry of rejected writes.

## Verification and security observations

Independent focused command against the frozen local candidate:

```sh
node node_modules/vitest/vitest.mjs run src/tests/formula.test.ts src/tests/collaboration.model.test.ts src/tests/collaboration.transport.test.ts src/tests/collaboration.panel.test.tsx src/tests/collaboration.runner.test.ts src/tests/useCollaboration.test.tsx src/tests/App.extendedUx.test.tsx
```

Result: **7 files / 163 tests passed, exit 0**. This includes the real loopback transport, explicit standalone Node relay startup/shutdown and the existing production-App integration tests. Passing these tests does not invalidate FC-01–04.

Additional temporary reproductions:

- Actual `CollaborationClient`/relay plus formula helpers: concurrent formula insert and new-formula-before-structural-Undo scenarios, each exit 0; outputs exactly as FC-03. Both clients disposed and relay closed in `finally`.
- A temporary copy of the existing App integration harness, with three added tests that assert the observed faulty outcomes for FC-01, FC-02 and FC-04: **3 passed / 18 existing tests intentionally deselected**, exit 0. Production App, FormulaBar, hooks, parsers and SharingPanel execute; only the canvas renderer/native I/O are mocked as in the existing suite. All loopback servers and clients are stopped in cleanup. These are reproductions of failures, not regression-success claims.
- Coordinator separately reported whole-candidate TypeScript/ESLint exit 0 and 43 files / 515 tests passed; this reviewer did not re-run those whole-repository commands.

The full parser/evaluator review found no additional blocking issue in its stated bounded subset: raw input remains separate, default mode is OFF, no input-to-JavaScript execution path exists, external/network functions are not implemented, and expression/dependency/range/operation budgets are bounded. Arithmetic/coercion and positional-sort differences from Excel are explicit contracts, not newly reported compatibility bugs.

The relay/client implementation also has substantive protections: empty default endpoint and no construction-time traffic; explicit create/join consent; no default public signaling/STUN/relay; remote HTTPS and loopback-only HTTP policy; cookies/referrers/redirects disabled on requests; membership bearer tokens in headers and invitation tokens in POST bodies; hashed server capabilities; server-side viewer/owner enforcement; authorization rechecked after reading bodies; retained idempotency receipts; bounded documents/history/queues/body/rate/retention; single-use expiring invitations; stop/revoke/leave/delete enforcement; volatile-storage and irrevocable-copy explanations. Existing real-HTTP tests cover these boundaries. FC-01 is an application-level consent/session-identity breach despite those provider protections.

The CSP change adds HTTPS and explicit localhost/127.0.0.1 transport allowances without adding `unsafe-eval` or changing script policy. Source inspection is not proof that a packaged platform's webview origin/CORS/CSP pair works. Client acceptance of IPv6 loopback is also broader than the explicit native CSP loopback entries and should be checked if IPv6 is advertised.

## Remaining acceptance and handoff

Do not mark C6/C7/C8 accepted until FC-01–04 are fixed and independently re-reviewed at a new fixed code SHA with meaningful negative/concurrent regression tests. No product build, normal product launch, deployment, external connection, real account, real content or new dependency was used in this review.

Actual separate-device traffic through an operator-approved TLS proxy, packaged native CSP/origins, real OS save/close behavior, real canvas/IME/clipboard, accessibility and performance remain unobserved. The loopback evidence establishes executable HTTP behavior, not separate-device or native acceptance.
