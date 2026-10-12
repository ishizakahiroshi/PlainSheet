import type { CellValue } from "../types/sheet";
import { compareExactDecimals, parseExactDecimal } from "./decimal";

export type SortDirection = "asc" | "desc";
export type SortMode = "auto" | "text" | "numeric";
export type SortKey = { colIndex: number; direction: SortDirection; mode?: SortMode };
export type SortOptions = { headerRow?: boolean; mode?: SortMode };

/** Stable raw-string-preserving single-key sort. Empty cells always go last. */
export function sortRows(
  rows: readonly (readonly CellValue[])[],
  colIndex: number,
  direction: SortDirection,
  options: SortOptions = {},
): CellValue[][] {
  return sortRowsByKeys(rows, [{ colIndex, direction, mode: options.mode }], options);
}

/**
 * Multi-key sort of complete rows, never a column-only shuffle. Auto chooses
 * exact numeric comparison only when all nonempty values of that key parse.
 * Auto preserves natural Japanese text ordering for mixed/text columns; explicit
 * text mode disables natural numeric ordering. Numeric mode
 * places valid numbers before nonnumeric text, which is compared as text;
 * blanks remain last in either direction. Equal rows retain their input order.
 */
export function sortRowsByKeys(
  rows: readonly (readonly CellValue[])[],
  keys: readonly SortKey[],
  options: Pick<SortOptions, "headerRow"> = {},
): CellValue[][] {
  const headerCount = options.headerRow && rows.length ? 1 : 0;
  const body = rows.slice(headerCount);
  const collator = new Intl.Collator("ja", { numeric: false, sensitivity: "base" });
  const naturalCollator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });
  const comparators = keys
    .filter((key) => Number.isSafeInteger(key.colIndex) && key.colIndex >= 0)
    .map((key) => {
      const numeric =
        key.mode === "numeric" ||
        (key.mode !== "text" &&
          body.every((row) => {
            const value = (row[key.colIndex] ?? "").trim();
            return value === "" || parseExactDecimal(value) !== null;
          }));
      return { key, numeric };
    });
  const sorted = body
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      for (const { key, numeric } of comparators) {
        const left = (a.row[key.colIndex] ?? "").trim();
        const right = (b.row[key.colIndex] ?? "").trim();
        if (left === "" && right === "") continue;
        if (left === "") return 1;
        if (right === "") return -1;
        let compared: number;
        if (numeric) {
          const leftNumber = parseExactDecimal(left);
          const rightNumber = parseExactDecimal(right);
          if (leftNumber !== null && rightNumber === null) return -1;
          if (leftNumber === null && rightNumber !== null) return 1;
          compared =
            leftNumber !== null && rightNumber !== null
              ? compareExactDecimals(leftNumber, rightNumber)
              : collator.compare(left, right);
        } else {
          compared = (key.mode === "text" ? collator : naturalCollator).compare(left, right);
        }
        if (compared !== 0) return compared * (key.direction === "asc" ? 1 : -1);
      }
      return a.index - b.index;
    })
    .map(({ row }) => [...row]);
  return headerCount ? [[...rows[0]!], ...sorted] : sorted;
}
