# C6 / UX-019 formula helper contract

Status: independent helper and synthetic tests prepared for sequential integration by the shared-file owner. This document is not evidence that the UI, native saving, IME, accessibility, or real-screen acceptance has passed.

## Source and ownership

- `src/lib/formula.ts`: dependency-free, local pure parser/evaluator and reference rewrites.
- `src/tests/formula.test.ts`: synthetic evaluation, security, limits, rewrite, snapshot, sort, and CSV round-trip tests.
- No shared App/GlideSheet/useSheet/useFile files changed by this helper work.
- No added dependencies, network calls, code generation, `eval`, `Function`, dynamic imports, product build, product launch, or remote changes.
- Implements the adopted C6 plan, which supersedes the historical UX-019 recommendation to defer formulas.

## The raw/display boundary

Calculation is OFF unless `enabled: true` is supplied explicitly. Only a raw cell starting with `=` at index zero is a formula; leading whitespace and a leading apostrophe remain literal text. Ordinary mode always returns the original cell strings, including formula-looking content.

The source of truth remains raw `string[][]`. Editing, formula-bar input, search/replace, clipboard raw copy, history, collaboration, and document dirty comparisons should use those strings. Derived display strings must not be passed to `setRows`, history, or the edit callback. Each evaluation owns a copy of its input snapshot; a later mutation cannot change an earlier save snapshot. A recalculation does not create a history entry or independently mark a document dirty.

```ts
const calculated = useMemo(
  () => evaluateFormulaSheet(document.rows, { enabled: document.formulaMode }),
  [document.rows, document.formulaMode],
);

// Grid's displayData uses derived values; data/editor and formula bar use raw.
const raw = document.rows[sourceRow]?.[col] ?? "";
const display = calculated.displayRows[sourceRow]?.[col] ?? "";
```

The `useMemo` and document setting are integration examples, not implemented UI claims. Keep the mode per document or in its explicit view state. Initial OFF is mandatory. No formula/view metadata belongs in CSV/TSV.

## Public API

### `evaluateFormulaSheet(rawRows, options?)`

Options: `{ enabled?: boolean, limits?: Partial<FormulaLimits> }`.

Returns:

- `displayRows: string[][]`: original ragged shape, original literal display strings, calculated formula results/errors.
- `errors: { row, col, error }[]`: zero-based source coordinates for formula errors.
- `dependencies: ReadonlyMap<string, readonly string[]>`: formula A1 address to directly read source A1 addresses. Addresses are deduplicated. Only the chosen IF branch contributes dependencies; errors may stop traversal before later references are read.
- `getCellResult(row, col)`: `{ kind: 'value', raw, value, display, formula }` or `{ kind: 'error', raw, error, display, formula: true }`. `value` is a number, boolean, or string. Referenced numeric-looking raw strings have a numeric calculation value without changing their literal display.

The dependency evaluator caches each cell inside one snapshot, recognizes active recursion for cycles, and recalculates a fresh graph for every raw snapshot. This is full snapshot recalculation, not cross-snapshot incremental invalidation. It avoids stale results after undo, sorting, filtering changes, tabs, and async saves. The helper never uses a visible-row index.

### `exportFormulaRows(rawRows, 'formulas' | 'values', options?)`

Returns an independent string-grid snapshot. `'formulas'` clones raw strings. `'values'` calculates only if `enabled: true`; calculation OFF always preserves the original strings.

Call it against the same originating document/rows/mode snapshot captured by the existing save workflow. Pass its result into the existing format serializer/encoding path. Do not replace in-memory raw rows with export output and do not mark a different document saved. On value export, formula errors are explicit error strings, never blank cells.

The existing CSV/TSV injection guard remains a separate serializer option. Enabling it prefixes formula-looking output with `'`, so formula exports then deliberately reopen as protected literal strings. The save UI must disclose this combination rather than promise executable-formula round-trip. CSV has no typed-cell metadata: a computed string that itself starts with `=` is still formula-looking text if calculation is later explicitly enabled on reopening. Keep ordinary reopen OFF and disclose this limit; optional injection guarding protects consumers that auto-evaluate CSV.

### `translateFormula(raw, { rowDelta, colDelta })`

Use for fill/copy only while formula mode is ON. Deltas are physical/source coordinates, including hidden gaps. Relative axes shift; `$` axes stay fixed. For example:

- `=A1+$B$2+C$3+$D4`, delta row +2 / col +1 becomes `=B3+$B$2+D$3+$D6`.
- Source row 2 copied to source row 8 has row delta +6, even if only two rows are visible.

Call with each destination cell's own source and target coordinates. Do not increment formulas using the numeric/trailing-number fill-series helper. Regular external TSV has no trustworthy source coordinate metadata; keep those pasted formula strings literal as supplied unless a same-document copy origin is explicitly available. Copying to a negative/out-of-grid target inserts an explicit `#REF!`; an invalid range becomes a whole `#REF!` expression.

### `adjustFormulaReferences(raw, change)`

`change: { type: 'insert' | 'delete', axis: 'row' | 'col', index, count }`, with zero-based source coordinates. The supplied index/count describe the old grid, not a visible projection.

- Structural insert/delete updates relative AND absolute target coordinates. `$` controls copying, not structural identity.
- Inserting at/before a range's first cell shifts that boundary; insertion inside the range extends its far boundary.
- Deleting a referenced cell makes a single reference `#REF!`.
- Partial range deletion shrinks the range to surviving cells. Complete range deletion makes it `#REF!`.
- Reversed ranges and each endpoint's `$` flags are retained.
- Quoted reference-like strings are untouched; unchanged reference spelling/spacing is retained.
- Invalid/unsupported formula syntax is left intact rather than guessed or destroyed. The normal calculation result shows its error.
- Invalid programmer-supplied index/count/deltas throw `RangeError`; formula text itself yields visible errors rather than executing code.

### `rewriteFormulasForStructure(alreadyEditedRows, change)`

Returns a new raw grid after applying the reference adjustment to every surviving formula. The caller first inserts/deletes actual rows/columns, calls this helper on that new grid while still using the old structural coordinates, then commits all changes in one existing Undo operation. Call only in calculation mode. For disjoint deletions, process contiguous blocks in descending source order, rewriting after each block and committing the combined result once. Do not create one Undo entry per rewritten formula.

### Row sorting and column moves

`FORMULA_ROW_SORT_POLICY` is `move-raw-rows-keep-positional-references`.

`reorderFormulaRows(rows, sourceRowOrder)` validates a full permutation, then returns cloned raw rows without translating formulas. Existing sorting callers that already move complete raw rows obey the same policy without using this helper.

A1 refers to a position, not an implicit stable row identity. Sorting moves the formula's raw text with its row; its address strings stay unchanged and the sheet recalculates against the new arrangement. Example:

```text
Before: [2, =A1*10], [1, =A2*10]
After swapping: [1, =A2*10], [2, =A1*10]
Displayed after: [1, 20], [2, 10]
```

Do not reuse fill translation on sort. Explain the positional behavior in formula help/sort UI before users rely on row-linked formulas. Header rows and sort-key comparisons remain the caller's explicit contract; sorting cannot infer persistent row identity. Column reordering follows the same positional/raw-text policy. Insert/delete uses the dedicated reference adjustment above. The existing single Undo restores the previous entire raw snapshot and therefore its previous calculation.

## Formula language and deliberate limits

Supported:

- Finite decimal/scientific numbers; double-quoted strings with doubled-quote escaping; TRUE/FALSE.
- A1 and mixed/absolute references (`$A1`, `A$1`, `$A$1`), rectangular ranges, case-insensitive column/function names.
- `+ - * / ^`, unary signs, postfix `%`, parentheses, and `= <> < <= > >=` comparisons.
- `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, and lazy `IF(condition, trueValue[, falseValue])`.
- Functions accept comma-separated arguments. No locale-dependent decimal/comma grammar.
- Unknown function names, including digit-bearing names such as LOG10, yield `#NAME?`.

This is a bounded PlainSheet subset, not Excel/Sheets compatibility:

- Same-table source coordinates only. No cross-sheet/workbook references, array formulas, full-row/full-column ranges, named ranges, dates, external data, filesystem functions, network functions, volatile functions, or JS expressions.
- Out-of-materialized-data references within the existing grid hard ceilings are empty cells. They do not allocate backing rows. Out-of-grid/deleted references are `#REF!`.
- Empty referenced cells display empty when referenced directly, and coerce to zero for arithmetic/conditions.
- Numeric strings are strict decimal/scientific notation, optionally signed. Commas/currency/date/percent strings are not implicitly numeric. Raw leading zeros and long identifiers remain intact, but any numeric calculation uses JavaScript finite IEEE-754 numbers, with the associated precision limits.
- Aggregates accept numbers/numeric strings and ignore other strings, blanks, and booleans. This rule is uniform for direct arguments and references. COUNT counts numbers/numeric strings. Empty SUM/COUNT/MIN/MAX return zero; empty AVERAGE is `#DIV/0!`.
- Comparisons normalize numeric strings and compare nonnumeric text case-insensitively. This is an explicit lightweight rule, not locale/Excel type ordering.
- IF evaluates only the selected branch; its unselected branch may contain a cycle, error, unknown function, or oversized range without triggering evaluation. Syntax still must parse. Two-argument IF returns FALSE when false.
- Exponentiation is right associative and binds more tightly than unary minus (`-2^2` is `-4`). Use parentheses for other desired sign semantics.
- A range is not a scalar; top-level/scalar range use produces an error. There is no implicit intersection or array spill.
- Literal error-looking raw text stays text. Formula error nodes or evaluation errors propagate as typed errors.

Error display codes: `#ERROR!` (syntax/unsupported syntax), `#REF!`, `#NAME?`, `#DIV/0!`, `#VALUE!`, `#NUM!`, `#CYCLE!`, and `#LIMIT!`. Errors retain the input formula for correction/Undo/export. A dependent of a cyclic cell also displays `#CYCLE!`.

## Resource bounds

Default hard ceilings, with caller overrides allowed only to lower them:

| Resource | Ceiling |
| --- | ---: |
| Raw formula length | 8,192 characters |
| Tokens per formula | 2,048 |
| Parse/evaluation expression depth | 64 |
| Dependency depth | 128 |
| Combined active expression/dependency frames | 192 |
| Cells in one range | 100,000 |
| Evaluation operations per snapshot | 500,000 |
| Evaluated formula cells per snapshot | 10,000 |

Exceeded bounds produce `#LIMIT!` without rewriting raw input. A global operation/formula-cell budget means evaluation order can determine which cells exceed the limit; this is a safety ceiling, not a promise of partially complete computation. Surface errors before a values export. Existing raw rows must still be visited/copied; these limits do not replace the application's large-file/import controls. Performance is not benchmarked on production-sized files or real devices.

## Integration acceptance still owned by C6/C8

- Visible calculation toggle starts OFF; show raw formula and result separately and explain supported subset/errors.
- Use source-row mapping for displayed results, edits, fill, filtered copy, and references.
- Preserve raw strings and a single atomic history change through edit/fill/structural actions; recompute on undo/redo.
- Never apply reference-rewrite helpers to formula-looking literal data in OFF mode.
- Explicit formula/value export choice, snapshot-safe Save/Save as, and both browser/native outcome semantics.
- Explain sorting and CSV injection-guard behavior. Preserve originating-document isolation during delayed saves/tab switching.
- Existing filter/search/collaboration integration, real canvas/editor focus, IME, OS clipboard, native close/save, assistive technology, and device performance are not proven by helper tests.

## Verification record

Focused checks run with the installed dependency tree, using Node because Bun availability belongs to the parent environment record:

```sh
node node_modules/vitest/vitest.mjs run src/tests/formula.test.ts
node node_modules/typescript/bin/tsc --noEmit --pretty false --strict --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --types vitest/globals,node src/lib/formula.ts src/tests/formula.test.ts
node node_modules/eslint/bin/eslint.js src/lib/formula.ts src/tests/formula.test.ts
```

Helper validation: formula tests **110 passed**, and formula + CSV + cell-reference regression tests **145 passed across 3 files**; both focused commands exited 0. The isolated strict typecheck, focused ESLint, and source/test Prettier check each exited 0. The tests include 2,000 deterministic malformed expressions and exhaustive small-range deletion invariants. The owner should record the final source/review SHA in the task's shared coverage/progress records after integration. An earlier aggregate typecheck was blocked by simultaneous clipboard-test edits. After those settled, `node node_modules/typescript/bin/tsc --noEmit --pretty false` exited 0 against the then-current shared workspace; the parent must repeat aggregate checks on its final integrated revision. Product builds/startups were not run. No external services or real user data were used.

Rollback: remove the formula-mode connections and these isolated helper/tests/docs, preserving ordinary raw-string paths. No dependency or persisted schema rollback is needed for the helper itself.
