import type { CellValue, ColumnWidthMap } from "../types/sheet";

const MIN_WIDTH = 72;
const MAX_WIDTH = 420;
const MAX_SCAN_ROWS = 1000;
const ASCII_WIDTH = 7.5;
const WIDE_WIDTH = 15;
const CELL_PADDING = 32;

export function calculateColumnWidths(rows: readonly (readonly CellValue[])[]): ColumnWidthMap {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const widths: ColumnWidthMap = {};
  const scanRows = rows.slice(0, MAX_SCAN_ROWS);

  for (let col = 0; col < columnCount; col += 1) {
    let measured = 0;
    for (const row of scanRows) {
      measured = Math.max(measured, measureCell(row[col] ?? ""));
    }
    widths[col] = clamp(Math.ceil(measured + CELL_PADDING), MIN_WIDTH, MAX_WIDTH);
  }

  return widths;
}

export function measureCell(value: CellValue): number {
  let width = 0;
  for (const char of value) {
    width += isWideCharacter(char) ? WIDE_WIDTH : ASCII_WIDTH;
  }
  return width;
}

export function isWideCharacter(char: string): boolean {
  const code = char.codePointAt(0);
  if (code === undefined) {
    return false;
  }

  return (
    code >= 0x1100 &&
    (code <= 0x115f ||
      code === 0x2329 ||
      code === 0x232a ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1f300 && code <= 0x1f64f) ||
      (code >= 0x1f900 && code <= 0x1f9ff))
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
