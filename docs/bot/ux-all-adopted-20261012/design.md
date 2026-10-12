# P-20261012-001 implementation contracts

Fixed instructions: 8204b5442f602164148b725c3ad07190630e33c4. Behavior oracle: 8a11f1b94e16d575fa3f3df3f43924b34c0a4cf6. Diff origin: bf7e54689742c35a2158c16f79823a66cb59ad85.

## Five shared boundaries

1. Values and targets: raw cells remain strings. Source coordinates own edits/history; filtered display coordinates are mapped exactly once. Navigation does not allocate rows or dirty data. Rectangular bulk mutations are atomic and one Undo. Clipboard self-copy preserves matrix dimensions; ambiguous external formats require an explicit preview choice. Drag series preserves seeds; keyboard fill copies.
2. Saving and conversion: every asynchronous operation captures document ID, raw rows, and all serialization settings. A completion cannot clean newer edits. Only successful native writes create durable checkpoints. Downloads remain dirty. Decode previews retain original bytes. Lossy structured-text/table-only saves show impact before overwrite.
3. Operation access: toolbar, shortcuts, and command search dispatch the same actions and disabled reasons. IME confirmation keys do not trigger commands. Search scope is a frozen source-cell set, invalidated on document/structural change; search, preview, and replacement use the same matcher.
4. Document view: filters, header interpretation, freezes and named-view selection are isolated by document ID. They never alter CSV values or dirty state. Named presets require explicit persistence/apply, have a versioned schema, and never auto-match a filename. Header meaning, highlight, row freeze and column freeze are independent.
5. Optional extensions: formula calculation, recovery content persistence and shared content are OFF initially. Metadata never silently enters CSV. Recovery copies have no original path. Formula raw expressions stay in raw history; calculated export is explicit. Collaboration has stable row/column identities and an explicit provider endpoint, server-enforced authorization, replay handling and conflict history; no built-in public signaling/STUN/relay.

## Ownership and order

One integrator owns App, GlideSheet, useSheet, useFile and shared document state. Independent helpers/tests may be prepared in parallel; integration is C1 through C7 followed by complete independent C8 review and correction/re-review. Each test record names actual commands, exit, candidate version and unobserved native boundaries. No product build or normal product launch is performed.

## Environment and dependencies

Cloud Linux x86_64, Node 24.19.0, npm 11.9.0, Python 3.12.14, Git 2.52.0. Bun, Cargo and Rust are absent. Existing declared dependencies installed with npm --ignore-scripts --package-lock=false and a task-local cache (314 packages, exit 0); no package or lock modification. This verifies runtime availability, not Bun frozen-lock reproducibility. Baseline against verified source: 24 files / 190 tests, exit 0, new run for this task. No feature acceptance inferred from baseline. Chromium binary exists; native OS/IME/clipboard and product GUI remain unobserved. New dependency ledger will state exact version, license, necessity, lock impact and rollback; no dependency added at contract checkpoint.

## Rollback and publication

Only dots/ux-all-P-20261012-001 is writable remotely; Draft PR targets bot/20261005-004-excel-like-ux. Revert this task's commits to restore fixed instruction source. No workflow modification, deployment, release or merge. A rejected/cancelled write is checkpointed and not automatically retried.

## Observed integration limits

The complete candidate is implemented and synthetic checks are recorded, but the independent C6/C7 post-fix review is NOT PERFORMED following the saved initial report's tool-side stop. It was not restarted or replaced. C8 and all-28 acceptance therefore remain open. The other review receipts name their exact candidate and limited final recheck scopes. Automated existing CI has observed frozen-Bun/native compilation on Windows/macOS/Ubuntu; local Bun/Rust availability and actual native GUI acceptance remain separate.
