# UX-028 named filter views contract

## Scope and integration

`src/lib/namedViews.ts` owns the session collection and explicit optional device storage. `src/components/NamedViewsPanel.tsx` uses the existing `FeatureDialog`. The App integrator owns the toolbar/command entry, per-document active view ID, live filter restoration and column-width update. No row, sort, selection/history, dirty, header, freeze or CSV serializer mutation is performed by this component/helper.

Panel props:

- Required: `documentId`, `rows`, `filters` (`Map<number, Set<string>>`), `colWidths`, `onApply`, `onClose`.
- Optional: `fileName`, `activeViewId`, `visibleCount` (data rows, excluding interpreted header), `headerRow` (default true), `locale`, injected `store` for tests.
- `onApply` receives `{ id: string | null, name: string | null, filters: [number, string[]][], colWidths }`. Apply uses a cloned preset. Save-current and active rename emit the current unchanged filters/widths to update selection/name; these actions do not overwrite a previous preset. Deleting the active preset removes its label while retaining current live conditions. All-rows returns null ID/name, empty filters and unchanged widths.
- The host must apply widths as view state without making the document dirty. It can read `namedViewStore.document(documentId, fileName).views` and `viewMatchesCurrent` for persistent status outside the dialog. Store operations are synchronous and throw typed `NamedViewsError`; no storage retry is automatic.
- `forgetDocument(documentId)` is available to discard a closed tab's session collection, without touching explicitly persisted groups. New opens must use new random document IDs; the panel independently keys pending dialog state by document ID.

## Isolation and compatibility

Each session document is bound to a newly generated random group ID. File names are display labels, never keys. A session has multiple views with independently generated IDs. Presets contain only filter entries, explicit column widths, the view name and a schema guard. The guard records version, column count, header interpretation and ordered header names; interpretation is only checked, never restored. No-header tables store no first-row/content fingerprints.

Reordered/renamed/deleted/added columns, changed header interpretation, duplicate headers and blank headers reject application with a recreate instruction. No-header tables have no reliable semantic column identities; they require explicit positional confirmation on each currently observed row snapshot. Any new row-array snapshot invalidates that confirmation. Missing allowed filter values remain visible in the explanation and unchanged in the preset, including an allowed-value set of zero items (zero matching data rows).

Prior device groups are only loaded through an explicit action. The user selects a group (no auto-selection by filename), sees saved/current column previews, and confirms the intended document and column correspondence. All selected group's schemas must be safe. Import copies views to the current session with new view IDs and does not apply filters or enable persistence. The user then chooses Apply. Duplicate target view names are rejected without a partial import.

## Persistence and deletion

Default is session-only, with no localStorage read/write while creating/managing session views. The explicit checkbox persists the current document's presets using `plainsheet.namedViews.v1`, envelope `{ version: 1, groups }`. Persisted data never includes a local file path, complete rows, sort, raw formula mode, dirty state or other document settings. Filter values and header names can contain content-derived information; the dialog warns about this before opting in. Views do not travel inside CSV or sync.

The aggregate serialized UTF-8 value is bounded at 256 KiB, up to 100 groups and 100 views/group; each individual session group is also bounded. Names are trimmed, unique within a group, and limited to 80 characters. Reads reject unknown versions, invalid shape, duplicate IDs, invalid column indices and non-finite/out-of-range widths. Parsing preserves only allowlisted fields. Unavailable storage, quota errors and oversized data are visible errors; persistent CRUD is committed to memory only after the storage operation succeeds. Unknown/corrupt existing data is never silently overwritten.

Unchecking persistence deletes this group's device copy while retaining session views. Individual view deletion updates its opted-in group. Group deletion, all document-view deletion, and all device-storage deletion have UI routes. All-deletion actions have explicit confirmation/cancellation. All-device deletion also recovers corrupt/unknown-version storage and disables session persistence without removing session views. There is no automatic retry after any failure. Browser storage clearing, eviction and separate browser/device profiles can remove or isolate the optional data.

## Verification

Synthetic helper/component tests use the real store, real panel and existing dialog; the host App has separate integration acceptance. The focused suite covers CRUD with two presets, independent same-name documents, default-off storage, explicit rebind, duplicate/blank/reordered/deleted/header-mode schema rejection, no-header confirmation invalidation, empty/missing filter values, modified status, exact filter/width callbacks, opt-out, deletion cancellation, quota/malformed/version/size failures, clone isolation, and keyboard/IME dismissal/focus behavior.

No product build, normal product launch, network service, additional dependency or runtime deployment is part of this implementation. Real GUI, native storage lifecycle, browser restarts, accessibility technology and performance remain unobserved and must not be counted as synthetic-test passes.

Focused verification on the shared implementation candidate (2026-10-12):

- `node node_modules/vitest/vitest.mjs run src/tests/namedViews.test.ts src/tests/namedViewsPanel.test.tsx`: exit 0, 2 files / 24 tests passed. The first run exposed a jsdom grouped-selector ordering issue in the existing focus hook; the integration owner added explicit DOM-order sorting, then this entire focused suite passed.
- `node node_modules/eslint/bin/eslint.js src/lib/namedViews.ts src/components/NamedViewsPanel.tsx src/tests/namedViews*.test.*`: exit 0.
- `node node_modules/typescript/bin/tsc --noEmit --pretty false`: exit 0 against the shared state after integration fixes; the final submission must rerun aggregate checks against its exact code SHA.
