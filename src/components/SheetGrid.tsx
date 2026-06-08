import { useEffect, useRef } from "react";
import { isCellInRange } from "../hooks/useSelection";
import { t } from "../lib/i18n";
import type { CellValue, ColumnWidthMap, Range, Selection } from "../types/sheet";
import { BUFFER_ROWS } from "../types/sheet";
import type { ContextMenuKind } from "./ContextMenu";
import type { EditingCell } from "../hooks/useEdit";

type SheetGridProps = {
  rows: CellValue[][];
  columnCount: number;
  colWidths: ColumnWidthMap;
  selection: Selection;
  range: Range;
  editing: EditingCell | null;
  searchHits: Set<string>;
  activeSearchHit: string | null;
  zebra: boolean;
  headerHighlight: boolean;
  onSelectCell: (row: number, col: number, extend: boolean) => void;
  onSelectRow: (row: number) => void;
  onSelectColumn: (col: number) => void;
  onStartEdit: (row: number, col: number, overwrite?: string) => void;
  onUpdateEdit: (value: string) => void;
  onCommitEdit: (row: number, col: number, value: string, direction: "none" | "down" | "up" | "right" | "left") => void;
  onCancelEdit: () => void;
  onOpenContextMenu: (kind: ContextMenuKind, row: number, col: number, x: number, y: number) => void;
  onResizeColumn: (col: number, width: number) => void;
};

export function SheetGrid({
  rows,
  columnCount,
  colWidths,
  selection,
  range,
  editing,
  searchHits,
  activeSearchHit,
  zebra,
  headerHighlight,
  onSelectCell,
  onSelectRow,
  onSelectColumn,
  onStartEdit,
  onUpdateEdit,
  onCommitEdit,
  onCancelEdit,
  onOpenContextMenu,
  onResizeColumn,
}: SheetGridProps) {
  const displayRowCount = rows.length + BUFFER_ROWS;
  const displayColumnCount = Math.max(columnCount, 6);
  const columns = Array.from({ length: displayColumnCount }, (_, index) => index);
  const displayRows = Array.from({ length: displayRowCount }, (_, index) => index);

  return (
    <div className="gridViewport" role="grid" aria-rowcount={displayRowCount} aria-colcount={displayColumnCount}>
      <table className="sheetGrid">
        <colgroup>
          <col className="rowNumberCol" />
          {columns.map((col) => (
            <col key={col} style={{ width: colWidths[col] ?? 120 }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="cornerCell" scope="col" />
            {columns.map((col) => {
              const selected = range
                ? isCellInRange(selection.row, col, {
                    startRow: 0,
                    startCol: col,
                    endRow: Math.max(0, rows.length - 1),
                    endCol: col,
                  })
                : selection.col === col;
              return (
                <th className={selected ? "columnHeader columnHeader--selected" : "columnHeader"} key={col} scope="col">
                  <button
                    type="button"
                    aria-label={t("columnLabel", { column: columnName(col) })}
                    onClick={() => onSelectColumn(col)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      onOpenContextMenu("column", 0, col, event.clientX, event.clientY);
                    }}
                  >
                    <span>{columnName(col)}</span>
                    <span className="columnHeader__chevron">▾</span>
                  </button>
                  <ColumnResizeHandle col={col} onResizeColumn={onResizeColumn} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((rowIndex) => {
            const isBuffer = rowIndex >= rows.length;
            return (
              <tr
                className={[
                  isBuffer ? "sheetGrid__bufferRow" : "",
                  zebra && rowIndex % 2 === 1 ? "sheetGrid__zebraRow" : "",
                  headerHighlight && rowIndex === 0 && !isBuffer ? "sheetGrid__headerRow" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={rowIndex}
              >
                <th
                  className={range && isCellInRange(rowIndex, selection.col, range) ? "rowHeader rowHeader--selected" : "rowHeader"}
                  scope="row"
                >
                  <button
                    type="button"
                    aria-label={t("rowLabel", { row: rowIndex + 1 })}
                    onClick={() => onSelectRow(rowIndex)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      onOpenContextMenu("row", rowIndex, 0, event.clientX, event.clientY);
                    }}
                  >
                    {rowIndex + 1}
                  </button>
                </th>
                {columns.map((colIndex) => {
                  const value = rows[rowIndex]?.[colIndex] ?? "";
                  const active = selection.row === rowIndex && selection.col === colIndex;
                  const inRange = isCellInRange(rowIndex, colIndex, range);
                  const hitKey = `${rowIndex}:${colIndex}`;
                  const isEditing = editing?.row === rowIndex && editing.col === colIndex;
                  return (
                    <td
                      className={[
                        "sheetGrid__cell",
                        active ? "sheetGrid__cell--active" : "",
                        inRange ? "sheetGrid__cell--range" : "",
                        searchHits.has(hitKey) ? "sheetGrid__cell--searchHit" : "",
                        activeSearchHit === hitKey ? "sheetGrid__cell--activeHit" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={`${rowIndex}:${colIndex}`}
                    >
                      {isEditing ? (
                        <CellEditor
                          editing={editing}
                          onUpdate={onUpdateEdit}
                          onCommit={(direction) =>
                            onCommitEdit(editing.row, editing.col, editing.value, direction)
                          }
                          onCancel={onCancelEdit}
                        />
                      ) : (
                        <button
                          type="button"
                          className="sheetGrid__cellButton"
                          aria-label={t("cellLabel", { cell: `${columnName(colIndex)}${rowIndex + 1}` })}
                          onClick={(event) => onSelectCell(rowIndex, colIndex, event.shiftKey)}
                          onDoubleClick={() => onStartEdit(rowIndex, colIndex)}
                          onContextMenu={(event) => {
                            event.preventDefault();
                            onSelectCell(rowIndex, colIndex, false);
                            onOpenContextMenu("cell", rowIndex, colIndex, event.clientX, event.clientY);
                          }}
                        >
                          {value}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CellEditor({
  editing,
  onUpdate,
  onCommit,
  onCancel,
}: {
  editing: EditingCell;
  onUpdate: (value: string) => void;
  onCommit: (direction: "none" | "down" | "up" | "right" | "left") => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      className="sheetGrid__editor"
      aria-label={t("formulaInput")}
      value={editing.value}
      onChange={(event) => onUpdate(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit(event.shiftKey ? "up" : "down");
        } else if (event.key === "Tab") {
          event.preventDefault();
          onCommit(event.shiftKey ? "left" : "right");
        } else if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      onBlur={() => onCommit("none")}
    />
  );
}

function ColumnResizeHandle({
  col,
  onResizeColumn,
}: {
  col: number;
  onResizeColumn: (col: number, width: number) => void;
}) {
  const startX = useRef(0);
  const startWidth = useRef(0);

  return (
    <button
      type="button"
      className="columnHeader__resize"
      aria-label={t("resizeColumn")}
      onMouseDown={(event) => {
        event.preventDefault();
        startX.current = event.clientX;
        const header = event.currentTarget.closest("th");
        startWidth.current = header?.getBoundingClientRect().width ?? 120;

        const handleMove = (moveEvent: MouseEvent) => {
          onResizeColumn(col, startWidth.current + moveEvent.clientX - startX.current);
        };
        const handleUp = () => {
          window.removeEventListener("mousemove", handleMove);
          window.removeEventListener("mouseup", handleUp);
        };
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
      }}
    />
  );
}

export function columnName(index: number): string {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}
