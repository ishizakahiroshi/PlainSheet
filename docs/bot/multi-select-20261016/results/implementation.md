# First assembled implementation candidate

P-20261016-003. 2026-10-16. Implementation owner: dots multi-select coordinator. Independent reviewer: dots `review_multiselect_context_actions`; independent and owner review are pending for this first candidate.

## Baselines and scope

- Fixed instructions read: `5ee020fcd9aece26c7b74196959ba18958485746`.
- Behavior oracle / unchanged develop: `037c29ea4649efc81acc8f28824dca3df08e7450`.
- Full review diff baseline: `e676daae5224842ae238d4e0a8047cb0f2307f89`.
- Publication target: `dots/multi-select-P-20261016-003`; Draft PR base `develop`.
- Product SHA will be recorded in the submission receipt after publication. This document does not manufacture its own enclosing commit SHA.
- No changes to other branches, workflows, manifests, lockfiles, native code, persistence schemas, or dependencies. No product launch/build, release, merge, deployment, real data, or secrets.

## Implemented paths

| Stage | Implementation | Executed acceptance |
|---|---|---|
| C1 | `selectionTarget.ts`, App, GlideSheet, ContextMenu, i18n, CSS | Actual App/hook/GlideSheet public callbacks and DOM: row-marker `onCellContextMenu([-1,row])`, header and cell contexts; preserve five rows or discontiguous columns; outside replaces target; simulate Glide's subsequent selection callback; keyboard invocation/arrows/Escape/focus and IME guard; clipped menu position |
| C2 | App, useSheet, clipboard, history, confirmation text | Discontiguous delete/copy/clear leave gaps untouched; insert/duplicate anchor after maximum; failure/cancel no-op; trailing positions and last/all-target editability; one Undo/Redo; filters block mutations and column copy includes visible source rows |
| C3 | useSheet, history/documents/filter types and App/GlideSheet | Selected-only width change and Undo without CSV dirty; contiguous block movement; widths remap; hidden-gap controls and Show all; source-aware edits; saving uses all source rows; A→B→A view isolation |
| C4 | `multiSelectApp.test.tsx`, `multiSelectHooks.test.tsx` | Full suite and static checks below; independent and owner review still required |

The App tests execute the real App, GlideSheet adapter, selection/sheet/history/document/filter hooks, menus and dialogs. Only the external canvas DataEditor and file IO boundaries are test doubles. This proves application wiring, not canvas hit testing or OS integration. Hook tests invoke actual hooks; they do not copy algorithms as their oracle.

## Commands and results

Environment: Linux x86_64, Node 24.19.0; existing installed frontend cache, no download/install. Glide 6.0.3, Vitest 2.1.9, TypeScript 5.9.3, ESLint 9.39.5, jsdom 27.4.0, Testing Library 16.3.3. Bun/Rust/Cargo unavailable locally. Cached versions are not represented as a frozen-lock installation.

- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node node_modules/vitest/vitest.mjs run`: exit 0; 15 files / 135 tests passed (25 new real App/hook/document/history tests).
- `git diff --check`: exit 0.
- Scoped scan for secret-like tokens, private absolute paths and private conversation locators: no matches in changed source or task documents.
- Prescribed `bun run test`, `bunx tsc --noEmit`, `bun run lint`: not run locally because Bun is absent. The equivalent installed frontend tools above were run; existing unchanged PR CI must verify its exact head and frozen lockfile on Windows/macOS/Ubuntu.

## Pending gates and correction loop

1. Publish first code SHA and Draft PR; verify remote source blobs match checked local bytes.
2. Separate reviewer examines the entire canonical bounded diff, records findings and exact reviewed SHA. Implement scoped fixes and re-review changed paths.
3. Owner performs comprehensive assembled-candidate review and sends consolidated findings through the same task thread/Issue. Implement and recheck corrections.
4. Observe unchanged PR CI at the final exact SHA, including executed and skipped jobs/steps.
5. Real canvas, narrow-window layout, IME composition, OS clipboard, and native save/reopen remain unobserved because product launch is not authorized. CI compilation and DOM mocks cannot close these gates.

The first progress-comment call to Issue 5 was cancelled by the execution tool and has not been retried or delegated. Distinct first candidate Git publication was subsequently authorized; no cancellation override is inferred. Coordination continues in the established task thread while that Issue publication stop remains in place.

## Rollback

Do not merge the Draft PR to decline this candidate; develop and other candidates remain unchanged. If a later authorized integration needs reversal, revert this case's product commits on an appropriately authorized branch. No runtime/persistence migration or dependency rollback is needed. No reset/force push is proposed.
