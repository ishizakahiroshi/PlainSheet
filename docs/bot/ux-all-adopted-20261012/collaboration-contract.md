# UX-020: explicit HTTP collaboration contract

## Scope and implementation

The optional sharing mode sends a raw string table to an operator-selected self-host relay. It is separate from ordinary local editing and saving. `CollaborationClient` starts **OFF**, with an empty endpoint, and its constructor performs no request or persistence. There is no hosted default, account provider, public signaling, STUN, analytics, BroadcastChannel transport, or added dependency. Formula expressions remain raw strings. View preferences, original file paths, save destinations, local checkpoints, CSV metadata, and credentials are never inserted into CSV.

The implementation consists of:

- `src/lib/collaboration/model.ts`: validated operations, stable identities, bounded history model, matrix projection and structural helpers.
- `src/lib/collaboration/client.ts`: explicit `fetch`/poll provider, bearer membership, optimistic in-memory queue, connection status and management API.
- `src/components/SharingPanel.tsx`: explicit blank-start create/join consent, permissions, invitation management, pending operation review, history restore, and confirmed stop/leave/delete controls using the shared focus-managed dialog.
- `server/relay.ts`: optional Node built-in HTTP relay factory, with no socket opened by import.
- `server/run.mjs`, `server/serve.ts`: explicit Node 24 or Bun self-host entry point. Node's built-in synchronous module hook resolves only this implementation's relative TypeScript imports. No external loader is fetched.
- `src/tests/collaboration.{model,transport,runner}.test.ts`: synthetic model and actual loopback HTTP tests, including a real standalone relay child process which the test stops.

## Consistency and recovery

This is a bounded, centralized authoritative protocol, not a peer-to-peer CRDT. Each room is held by one process. After reading the request body, the server rechecks room existence, membership, revocation, role and stopped state, then applies the entire operation synchronously without an intervening await. Successful operations receive a strictly increasing room revision. Server arrival order wins for concurrent writes to the same cell; both changes and the displaced value remain visible in retained history. Independent operations may arrive in either order and converge to the same authoritative snapshot. Missing structural dependencies or future base revisions are rejected without partial application; they may be explicitly retried after the dependency arrives.

Rows and columns have stable opaque IDs, including tombstones. Cells target an ID pair, never a display index. Inserts name an existing anchor or the beginning; delete and restore preserve IDs and retained cell values. Reordering names the complete active ID list and rejects stale membership. Concurrent updates to a deleted row/column are retained and flagged `deleted-target`; restoring the structure reveals those values. The implementation never tries to deduce row identity by comparing cell contents.

Operation IDs are idempotent for the room's entire lifetime. The relay retains a bounded receipt for every accepted operation, including when its detailed history entry expires. Reusing an ID with changed content or another actor is rejected. A duplicate returns the current snapshot without applying the operation again. A room stops accepting new operations at its hard operation cap instead of evicting receipts and risking duplicate writes.

Undo is a **new compensating operation**, restricted to the actor's own retained entry. Its preconditions reject erasure of a later cell or structural change. Deliberate history restoration is available separately: `restore(id)` replays the chosen entry's after-state actions, while `restore(id, true)` restores its before-state actions. These are new edits and can intentionally replace newer values; the UI must make that consequence clear. Restoring before a deletion revives the same row/column and its retained cells. History is operation-level, not a complete historical workbook snapshot. A reorder restore rejects when the set of active IDs changed. A batch is atomic, including formula-reference edits composed with structural actions.

## UI integration API

Import from `src/lib/collaboration/index.ts`.

1. Construct `new CollaborationClient({ endpoint })` only for an explicitly configured session. `createRoom(rawRows, displayName)` uploads the selected table; `joinRoom(roomId, inviteToken, displayName)` downloads the shared table. Surface the endpoint, content being shared, and volatile retention before starting. Do not transmit the file path or inferred account identity.
2. `subscribe(listener)` reports `status`, `endpoint`, `snapshot`, `memberId`, `pendingCount` and `error`. Status is `off`, `connecting`, `online`, `offline`, `blocked` or `stopped`. The snapshot includes roles/members, revision, history/conflicts, retention limits and exact expiry.
3. `getState().snapshot` is authoritative. `getDocument()` projects this tab's queued edits over it; render `sharedDocumentRows(client.getDocument())` for immediate optimistic updates. `enqueue(actions)` updates this projected view synchronously. `submit(actions)` queues then flushes when connected. Errors do not discard queued edits.
4. Use `activeIds(document, "row" | "column")` to map source positions once. `actionsForCellMatrix(document, nextRows)` accepts same-shape cell edits only. `insertAxisActions(document, axis, index, count)` and `deleteAxisActions(document, axis, indexes)` produce stable structural actions. Reorder explicitly with `{ type: "reorder", axis, ids }`. Formula reference changes may be calculated after a pure `applyCollaborationOperation` projection and composed as `set-cell` actions in the same submitted batch.
5. `startPolling(intervalMs = 2000)` starts requests only after create/join; no polling starts automatically. `disconnect()` stops future automatic traffic but keeps credentials and the bounded queue in this tab. Already-sent requests can still reach the relay. Late responses cannot reopen a disconnected session. `connect()` explicitly synchronizes and retries the preserved queue with its original operation IDs and payloads. `sync()` reads without discarding pending edits.
6. Transient transport failure retains the queue. A rejected operation blocks automatic write retries; polling may continue read-only. `getPendingOperations()` exposes a reviewable copy. `discardPending(id)` is an explicit removal, forbidden during an in-flight send. `connect()` is the explicit retry action after resolving a rejection. Authentication denial stops polling and preserves the pending work for local recovery. Rate-limit responses defer automatic retry according to `Retry-After`.
7. `undo(id)`, `restore(id, before?)`, `invite("editor" | "viewer")`, `revoke(memberId)`, `revokeInvite(inviteId)`, `leave()`, `stop()` and `deleteRoom()` have corresponding relay enforcement. Show errors and queued edits. Warn before abandoning them. `forget()` drops this tab's credentials and queue but does not erase the relay; it is not a substitute for leave/stop/delete. `dispose()` stops polling and subscriptions.

Sharing success is not durable local-save success. Applying a remote snapshot should update the bound document's raw rows and dirty state without changing its original save destination or marking newer edits durably saved. A sharing session must remain bound to its original document; changing tabs or opening another file must not silently upload it to the room. UI bulk/structural/Undo paths must use the shared operation contract rather than simultaneously replaying local snapshot history.

## Roles, invitation and copy boundaries

- Owner: read/write/history restore, create or revoke invitations, revoke participants, stop sharing, and delete the room. The owner cannot invite another owner or transfer ownership in this version.
- Editor: read/write/history restore and leave; cannot manage membership, stop or delete the room.
- Viewer: read and leave only. Direct forged write/history/management HTTP calls are refused server-side.
- Invitations are unguessable bearer capabilities, limited to one use and at most ten minutes. They carry only editor/viewer permission. The invitation result exposes the token once for explicit user sharing. Membership tokens are separate. Tokens are sent in authorization headers (membership) or JSON POST bodies (invitation redemption), never query strings, logs or sample documentation. The relay stores only hashes.
- Revoke and leave immediately deny that member's future reads and writes, including previously queued/replayed operations. Authorization is checked before an idempotent ACK is returned.
- Stop clears invitations and revokes all non-owner members. Owner can still read the retained snapshot and delete it; writing/joining is stopped. Delete removes the relay's in-memory room immediately. Automatic expiry removes it no later than the next bounded purge pass, with every request checking expiry first.
- **No action can recall a copy already received, exported, screenshotted or saved by another participant.** Revocation/deletion is access removal at the relay, not remote erasure of others' devices. Display this boundary in sharing management.

## Retention and availability

The relay is deliberately **volatile memory only**, with no database, disk journal or restart recovery. Restart, crash or operator shutdown loses all shared rooms and history. The client queue and membership credentials are also memory-only: reload, close, `forget()` or a lost tab loses them. Export/save a local copy through the ordinary explicit save path before stopping or leaving when needed. Reconnection support covers a surviving client session and surviving relay; it does not promise durability across either process restarting.

Default/hard bounds:

- Room lifetime: at most 24 hours from creation, never silently extended.
- Invitation lifetime: at most ten minutes and no later than room expiry; at most 32 outstanding invitations.
- 16 rooms by default (hard configurable ceiling 32), at most 64 member records including revoked/left members per room.
- 5,000 retained rows, 500 retained columns, 50,000 row/column combinations, counting tombstones; 32,768 characters per cell.
- 4 MiB serialized document; 16 MiB document plus detailed history; 100 detailed history entries; 10,000 total accepted operations/receipts.
- 5,000 actions per atomic operation. Request body defaults to 1 MiB (operator can lower it or raise to a hard ceiling of 4 MiB). Tables above that initial upload limit must use a smaller sharing copy.
- Browser queue: at most 100 operations and 4 MiB combined JSON; each queued operation fits the default 1 MiB request envelope. Oversized edits are rejected rather than silently split and lose atomicity.
- 600 requests per minute per network address by default, bounded tracking for 1,024 addresses; 15-second request timeout, ten-second header timeout, 30 headers. A reverse proxy makes participants share its network-address rate bucket. This is a small self-host relay; capacity planning, high availability and multi-process federation are not provided.

## Operator configuration and security

No service has been deployed. The optional commands below are operator instructions, not an automatic startup. Use only synthetic data for the loopback check until the actual deployment and sharing destination are approved.

With Node 24 (already present in the test environment):

```sh
PLAINSHEET_ALLOWED_ORIGINS='http://localhost:1420' node server/run.mjs
```

Alternatively, with the repository's Bun runtime already installed:

```sh
PLAINSHEET_ALLOWED_ORIGINS='http://localhost:1420' bun server/serve.ts
```

Both entry points bind **127.0.0.1 only**, port 8787 by default. `PLAINSHEET_RELAY_PORT` accepts 1024–65535. Missing/empty allowed origins causes startup failure. This code never creates a public listener or a default cloud destination. The Node entry was tested; the Bun entry has not been run in this environment because Bun is absent.

For actual cross-device use, an operator must separately provide a TLS reverse proxy and an explicitly chosen HTTPS URL, configure request size/rate limits and **disable request/response-body and authorization-header logging**. Do not log invitation POST bodies. Do not place tokens in URLs. A chosen relay can read all content; TLS protects transport, not against the operator. There is no end-to-end encryption. An operator origin allowlist is defense-in-depth and not a substitute for bearer authorization.

`PLAINSHEET_ALLOWED_ORIGINS` is a comma-separated exact list of the origins that actually host the app. Wildcards, `null` opaque origins and URL paths are refused. Web development and deployed web origins differ. Tauri origins also differ by platform (for example `tauri://localhost` versus `http://tauri.localhost` or `https://tauri.localhost`); inspect the actual app origin and add only those required. Do not guess by enabling every origin. Browser CORS preflight permits GET/POST/DELETE/OPTIONS and only Authorization/Content-Type headers, does not enable cookie credentials, and never returns wildcard CORS.

The client permits HTTPS for remote relays and HTTP only for the exact loopback hostnames `localhost`, `127.0.0.1`, `[::1]`. Embedded URL credentials, queries, fragments and redirects are rejected. Cookies are omitted, the referrer is suppressed and responses are non-cacheable. Non-browser test clients supply the explicit allowlisted Origin; ordinary browsers provide their own.

The original desktop CSP only permitted local IPC. UI integration must deliberately add the configured transport's required `connect-src` capability (HTTPS plus narrowly scoped loopback HTTP for local testing) without changing scripts, unsafe-eval, navigation or other security directives. A CSP allowance alone performs no network request; the endpoint still starts empty/OFF. CSP and relay CORS both need to permit the actual origin/destination pairing. Real native desktop and remote TLS-proxy interoperability remain separate unobserved acceptance checks.

## Test evidence and remaining acceptance

Helper verification commands use existing installed dependencies and do not build or start the PlainSheet product:

```sh
node node_modules/vitest/vitest.mjs run src/tests/collaboration*.test.ts src/tests/collaboration.panel.test.tsx
node node_modules/eslint/bin/eslint.js src/lib/collaboration server src/components/SharingPanel.tsx src/tests/collaboration*
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

Latest focused run: **4 files / 29 tests passed**, exit 0; scoped lint exit 0; whole-source `tsc --noEmit --pretty false` exit 0 at the helper checkpoint. The integrator must rerun whole-repository checks after final integration. The standalone runner test started a loopback-only Node child, submitted one synthetic table, and stopped the child with SIGTERM (exit 0). Transport tests start/stop their own loopback HTTP sockets; they do not use BroadcastChannel or substitute a mocked transport. Component tests mock individual client methods to isolate UI consent/role/confirmation/error behavior; they are not transport evidence. No account, public service, real content, product build, normal product launch or deployment was used.

Coverage includes two participants' concurrent cell and row/column operations; raw strings/identities; reorder/Undo; stale/deleted-target conflicts and explicit history restoration; offline resend and a lost ACK; duplicate/reverse/dependency/future operations; atomic failure; history pruning with retained receipt replay; role forgery; revocation while a request body is in flight; single-use/revoked/expired invites; leave/stop/delete; expiry/rate/body/CORS limits; rejected-operation retry blocking; late response after disconnect; standalone Node startup/shutdown.

Still required outside helper acceptance: integrated sharing UI/permissions/dirty-state tests, formula+structure+sharing interaction, full regression/review on the final SHA, actual separate-device traffic through an operator's TLS proxy, real native CSP/origins and desktop UI, and performance/accessibility/IME/OS clipboard observations. Loopback TCP proves a real transport implementation, not that an unconfigured public deployment or unobserved devices passed acceptance.

## Dependency and rollback ledger

No package or lock change. Runtime uses Node 24 built-ins (`node:http`, `node:crypto`, `node:module`) and browser fetch/crypto; source is repository code under the project's existing license. Remove the sharing UI/connection hooks and these scoped files to roll back this extension; ordinary CSV content has no provider metadata to migrate. Relay shutdown intentionally drops server memory, so preserve needed local copies before rollback.

## Coordinate-derived batch and history guards (FC-03 correction, 2026-10-12)

`CollaborationOperation.expectedRevision?: number` is an optional nonnegative safe-integer whole-operation precondition. When present, the relay must see exactly that document revision before it applies any action, writes any history, or retains a receipt. A mismatch returns HTTP 409 `revision-conflict`; no part of the batch is applied. `baseRevision` still describes the client's observed authoritative snapshot and does not by itself impose this precondition. Unguarded stable-ID operations retain their existing merge behavior.

The integration API is `client.enqueue(actions, { expectedRevision: sourceDocument.revision })`, or `client.submit(actions, { expectedRevision: sourceDocument.revision })`. `sourceDocument` must be the exact `client.getDocument()` result used to calculate the operation, including pending projections. Do not substitute the latest revision after computing actions, or the temporary structural projection's incremented revision. Guard every batch containing client-computed structural/formula transformations or other coordinate-derived changes, even when its computed formula diff happens to be empty. Offline batches can use sequential projected revisions and succeed if their exact dependencies commit without intervening edits.

A rejected operation remains in the bounded pending queue with its original ID, base revision, expected revision and actions. Its queue is blocked against automatic retries. `sync()` may update the authoritative snapshot; `getDocument()` omits an invalid guarded projection and all dependent later projections rather than displaying invalid formula coordinates. Pending work remains available through `getPendingOperations()`. Explicit `connect()` resends the same immutable operation, so a stale guard still fails. Recovery requires reviewing/exporting the pending operation, explicitly discarding it, and recomputing a new operation from the latest source snapshot with a fresh ID. The client never updates a pending payload or silently rebases positional formulas.

Membership/role checks still precede receipt handling. Matching retained receipts are replayed before revision or history preconditions, including when a lost-ACK retry's expected revision is now old. Syncing a snapshot that already contains a pending operation does not apply that operation a second time in the optimistic view. A changed payload with the same ID remains an `id-reused` error.

History replay is deliberately conservative because history stores raw positional formula strings rather than an authoritative transform:

- Every structural Undo requires the current document revision to equal the original history entry's commit revision. A newly created peer formula can depend on that structure without touching the inserted axis entry, so per-cell/axis conditions or a newly supplied current-revision guard cannot establish safety.
- Undo or restore of a formula-bearing entry, or an entry originally submitted with `expectedRevision`, also requires its original commit revision. Structural restore additionally requires that revision whenever any current retained cell contains a formula string. These checks run on the relay and in optimistic projection; stale Undo reports `undo-conflict`, stale restore reports `history-conflict` and retains blocked pending work.
- An unguarded formula-free structural history restore may still revive retained stable-ID content when the current document contains no formulas. Ordinary unguarded non-formula cell history keeps its existing conditional Undo and deliberate overwrite behavior.
- Immediate safe structural Undo remains available. This correction intentionally rejects older positional history rather than promising formula-aware multi-step rebasing or history reconstruction. To repeat a rejected structural intention, review and issue a newly computed edit.

Regression evidence lives in `src/tests/collaboration.revisionGuard.test.ts`: real loopback concurrent same/cross-axis inserts/deletes with relative, absolute and range formulas; atomic stale rejection; blocked immutable queue and explicit recomputation to `=A3*2`; offline dependency guards; lost-ACK replay; unguarded stable-ID merging; direct-wire validation; structural Undo after peer-created formulas; unsafe structural/formula history restore; and immediate valid Undo. These tests close all synthetic clients and relay sockets. They establish protocol behavior, not native or separate-device acceptance.
