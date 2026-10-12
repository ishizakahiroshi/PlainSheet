import { useMemo, useState } from "react";
import type { Selection } from "../types/sheet";
import { previewCleanup, previewDedupe } from "../lib/cleanup";
import { FeatureDialog } from "./FeatureDialog";

export type CleanupPanelProps = {
  rows: string[][];
  cells: readonly Selection[];
  hasHeader: boolean;
  onApply: (nextRows: string[][], metadata?: { deletedRows?: number[] }) => void;
  onClose: () => void;
};

export function CleanupPanel({ rows, cells, hasHeader, onApply, onClose }: CleanupPanelProps) {
  const [kind, setKind] = useState<"trim" | "dedupe">("trim");
  const [asciiWhitespace, setAsciiWhitespace] = useState(true);
  const [fullwidthSpace, setFullwidthSpace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [keepHeader, setKeepHeader] = useState(hasHeader);
  const [removeWholeRows, setRemoveWholeRows] = useState(false);
  const columns = useMemo(
    () => [...new Set(cells.map((cell) => cell.col))].sort((a, b) => a - b),
    [cells],
  );
  const [keys, setKeys] = useState<number[]>(() =>
    [...new Set(cells.map((cell) => cell.col))].sort((a, b) => a - b),
  );
  const sourceRows = useMemo(() => [...new Set(cells.map((cell) => cell.row))], [cells]);
  const selected = new Set(cells.map(({ row, col }) => `${row}:${col}`));
  const completeKeySelection = sourceRows.every((row) =>
    keys.every((col) => selected.has(`${row}:${col}`)),
  );
  const preview = useMemo(
    () =>
      kind === "trim"
        ? previewCleanup(rows, cells, { asciiWhitespace, fullwidthSpace })
        : previewDedupe(rows, sourceRows, {
            keyColumns: keys,
            caseSensitive,
            hasHeader: keepHeader,
          }),
    [
      kind,
      rows,
      cells,
      asciiWhitespace,
      fullwidthSpace,
      sourceRows,
      keys,
      caseSensitive,
      keepHeader,
    ],
  );
  const error = "error" in preview && typeof preview.error === "string" ? preview.error : undefined;
  const changed = kind === "trim" ? preview.changedCells : preview.removedSourceRows.length;
  return (
    <FeatureDialog title="Clean up selected data" onClose={onClose}>
      <p>
        Only the exact selected source cells and visible selected rows are considered. Hidden rows
        are excluded. Values stay as text, including padded IDs and long numbers.
      </p>
      <label>
        Operation{" "}
        <select value={kind} onChange={(event) => setKind(event.target.value as "trim" | "dedupe")}>
          <option value="trim">Trim surrounding whitespace</option>
          <option value="dedupe">Remove duplicate rows</option>
        </select>
      </label>
      {kind === "trim" ? (
        <>
          <label>
            <input
              type="checkbox"
              checked={asciiWhitespace}
              onChange={(event) => setAsciiWhitespace(event.target.checked)}
            />
            Trim ASCII spaces, tabs and line breaks at the edges
          </label>
          <label>
            <input
              type="checkbox"
              checked={fullwidthSpace}
              onChange={(event) => setFullwidthSpace(event.target.checked)}
            />
            Trim fullwidth spaces (U+3000) at the edges
          </label>
          <p>Internal spaces and nonbreaking spaces are preserved. Case is unchanged.</p>
        </>
      ) : (
        <>
          <fieldset>
            <legend>Compare selected key columns</legend>
            {columns.map((col) => (
              <label key={col}>
                <input
                  type="checkbox"
                  checked={keys.includes(col)}
                  onChange={(event) =>
                    setKeys((old) =>
                      event.target.checked ? [...old, col] : old.filter((entry) => entry !== col),
                    )
                  }
                />
                Column {col + 1}
              </label>
            ))}
          </fieldset>
          <label>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(event) => setCaseSensitive(event.target.checked)}
            />
            Case-sensitive comparison
          </label>
          <label>
            <input
              type="checkbox"
              checked={keepHeader}
              onChange={(event) => setKeepHeader(event.target.checked)}
            />
            Keep source row 1 as a header
          </label>
          <label>
            <input
              type="checkbox"
              checked={removeWholeRows}
              onChange={(event) => setRemoveWholeRows(event.target.checked)}
            />
            Remove each duplicate's complete row, including its other columns
          </label>
          <p>
            The first selected occurrence is kept. Whitespace is compared exactly. Unselected and
            hidden rows retain their values and relative order.
          </p>
          {!completeKeySelection && (
            <p role="alert">Select every key cell in each target row before removing duplicates.</p>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <p role="status">
        Preview:{" "}
        {kind === "trim"
          ? `${preview.changedCells} changed cells of ${preview.targetedCells} selected cells`
          : `${preview.removedSourceRows.length} complete rows removed`}
        . Apply is one Undo; cancel changes nothing.
      </p>
      {kind === "trim" ? (
        <ol aria-label="Cleanup changes">
          {preview.changes.map((change) => (
            <li key={`${change.row}:${change.col}`}>
              Row {change.row + 1}, column {change.col + 1}: {JSON.stringify(change.before)} →{" "}
              {JSON.stringify(change.after)}
            </li>
          ))}
        </ol>
      ) : (
        <p>
          Source rows to remove:{" "}
          {preview.removedSourceRows
            .slice(0, 100)
            .map((row) => row + 1)
            .join(", ") || "None"}
          {preview.removedSourceRows.length > 100 ? " (first 100 shown)" : ""}
        </p>
      )}
      {preview.truncated && <p>The first 100 changes are shown; the count includes all changes.</p>}
      <div className="modalActions">
        <button onClick={onClose}>Cancel</button>
        <button
          disabled={
            !changed ||
            !!error ||
            (kind === "dedupe" && (!removeWholeRows || !completeKeySelection))
          }
          onClick={() => {
            onApply(
              preview.nextRows,
              kind === "dedupe" ? { deletedRows: preview.removedSourceRows } : undefined,
            );
          }}
        >
          Apply cleanup
        </button>
      </div>
    </FeatureDialog>
  );
}
