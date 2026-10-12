# C2 import and conversion preview contract

Status: helpers/components implemented and locally tested; App/useFile/native wiring belongs to the integration owner. No product build or normal product launch was run.

## Owned files

- `src/lib/importPreview.ts`
- `src/lib/conversionPreview.ts`
- `src/components/ImportPreview.tsx`
- `src/tests/importPreview.test.ts`
- `src/tests/conversionPreview.test.ts`
- `src/tests/ImportPreview.test.tsx`
- This contract document

No dependencies were added. Existing `yaml`, table parser/serializer and `FeatureDialog` are reused.

## Import boundary

`ImportPreviewRequest` contains original `bytes: Uint8Array`, `fileName: string` and optional `initialEncoding: Encoding`.

`RequestImportPreview` is `(request) => Promise<ImportPreviewResult | null>`. The caller waits for this result before changing document data, metadata, original-source tracking, recent files or the document's saved checkpoint. `null` cancels without committing anything. The integration owner must also check that an older request has not been superseded while its preview was open.

`ImportPreview` receives `request`, `onConfirm`, `onCancel`, and optional `locale`. `onConfirm` returns `content`, `rows`, `encoding`, `format`, `delimiter`, `newline`, `hadBom`, and `conversion`. The component never writes files or mutates a document.

`previewImport` reparses original bytes for each choice. It does not run an encoding conversion on a previously decoded string. It distinguishes `encoding`, `parse`, and `unsupported` errors and disables confirmation while an error remains. A valid UTF-8 replacement character is not treated as a decoder failure. Invalid byte sequences may be shown in the raw-text preview but cannot be accepted until the decoder is changed. UTF-16/32 BOMs and binary/NUL-containing input are unsupported; convert a copy to UTF-8 first.

Encoding detection is advisory: BOM is identified, otherwise valid UTF-8 is described as compatible, and legacy candidates as ambiguous. Available selections are UTF-8, UTF-8 BOM, Shift_JIS/CP932, EUC-JP and Latin-1. The existing native `latin-1` contract is actually Windows-1252, so the UI names both and uses that exact decoder mapping.

A physical UTF-8 BOM is removed from decoded content and retained in `hadBom`; default metadata is `utf-8-bom`. Explicitly choosing UTF-8 removes BOM on later text export. Existing JSON/YAML serialization remains UTF-8, as the preview explains. Encoding, delimiter, format and output-newline selections are independent; changing the format resets delimiter detection.

## Conversion boundary

`createConversionPreview({ content, format, rows?, delimiter?, newline?, omitEmptyCells?, sanitizeFormulas?, outputFormat? })` takes the accepted original source and the current save snapshot. `format` describes the source; `outputFormat` defaults to it. It returns `hasLoss`, counted `issues`, up to two concrete `examples` per kind, and exact `outputContent` from the production serializer.

JSON/YAML examples cover numbers, booleans, null, arrays, nested objects, missing properties and empty strings. Empty strings remaining strings are shown alongside a real loss but do not independently trigger a warning. Omit-empty behavior respects the production serializer's first-record header retention. Blank/duplicate/padded headers are normalized by the production serializer. Numeric-looking reordered keys are mapped back to columns using a serializer probe so JavaScript object enumeration does not mislabel examples.

Markdown analysis follows the current supported leading-pipe table grammar. It describes excluded body text, later tables, and alignment removal. A contiguous later table that the parser imports as ordinary rows is described as flattened, rather than falsely omitted. A pure table without alignment markers does not trigger a loss warning. A nonempty Markdown input with no supported table produces a parse error instead of silently opening an empty sheet.

`ConversionImpact` renders counted issues and concrete before/after examples. `ConversionPreviewDialog` receives `fileName`, `preview`, `onChoose` and optional `locale`. It defaults keyboard focus to Save As and returns `"save-as"`, `"overwrite"`, or `null`. It has no write side effects.

The save integration must retain the accepted source per document until a direct save succeeds, compute a fresh report using the immutable save snapshot, and require explicit overwrite when the selected native destination is the original path and loss is present. Choosing Save As alone is not permission to overwrite if the file picker subsequently returns the original path. Cancel and failed writes retain the source and dirty state. After success, source tracking must reflect what was actually written, without replacing newer edits or another document's source. Browser downloads do not establish a durable checkpoint.

## Verification

2026-10-12 local environment: Node 24.19.0, existing installed dependencies. Commands run from the repository root:

- `node node_modules/vitest/vitest.mjs run src/tests/importPreview.test.ts src/tests/conversionPreview.test.ts src/tests/ImportPreview.test.tsx src/tests/formats.test.ts src/tests/csv.test.ts`: exit 0, 5 files / 83 tests. This includes 31 new C2 tests and 52 existing parser/serializer regressions.
- `node node_modules/eslint/bin/eslint.js src/lib/importPreview.ts src/lib/conversionPreview.ts src/components/ImportPreview.tsx src/tests/importPreview.test.ts src/tests/conversionPreview.test.ts src/tests/ImportPreview.test.tsx`: exit 0 after correcting unnecessary quote escapes in one test.
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0. An earlier concurrent formula-test import failure was observed and reported; the later full typecheck passed after its owner corrected it.

The tests execute the actual helpers and React components with synthetic UTF-8/BOM/CP932/EUC-JP/Windows-1252 fixtures. They cover redecoding from original bytes, parse/encoding error separation, supported format recovery, cancellation, safer save choice focus, IME Escape, structured conversion, omit rules, Markdown losses and bounded examples.

Not observed here: full integration acceptance, product screenshots/layout at narrow widths, assistive technologies, native file-picker or overwrite behavior, OS IME, large-file latency/memory or real file encodings beyond the synthetic fixtures. The complete bytes and parsed sheet are currently held for the preview; no streaming or large-file performance claim is made.
