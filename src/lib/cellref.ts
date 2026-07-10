import { columnName } from "./columns";

export type CellRef =
  | { kind: "cell"; row: number; col: number }
  | { kind: "range"; startRow: number; startCol: number; endRow: number; endCol: number };

/** Converts a spreadsheet column name (A, Z, AA) to a zero-based index. */
export function columnIndexFromName(name: string): number | null {
  const upper = name.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(upper)) {
    return null;
  }
  let value = 0;
  for (let i = 0; i < upper.length; i += 1) {
    value = value * 26 + (upper.charCodeAt(i) - 64);
  }
  return value - 1;
}

function parseSingleRef(text: string): { row: number; col: number } | null {
  const match = text.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return null;
  }
  const col = columnIndexFromName(match[1]);
  const row = Number(match[2]) - 1;
  if (col === null || !Number.isInteger(row) || row < 0) {
    return null;
  }
  return { row, col };
}

/** Parses `A1`, `B10`, or `A1:C5` into a cell/range ref. Returns null on invalid input. */
export function parseCellRef(text: string): CellRef | null {
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  if (trimmed.includes(":")) {
    const [left, right, extra] = trimmed.split(":");
    if (extra !== undefined || !left || !right) {
      return null;
    }
    const start = parseSingleRef(left);
    const end = parseSingleRef(right);
    if (!start || !end) {
      return null;
    }
    return {
      kind: "range",
      startRow: start.row,
      startCol: start.col,
      endRow: end.row,
      endCol: end.col,
    };
  }
  const cell = parseSingleRef(trimmed);
  if (!cell) {
    return null;
  }
  return { kind: "cell", row: cell.row, col: cell.col };
}

export function formatCellRef(row: number, col: number): string {
  return `${columnName(col)}${row + 1}`;
}
