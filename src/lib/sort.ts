import type { CellValue } from "../types/sheet";

export type SortDirection = "asc" | "desc";

export type SortOptions = {
  headerRow?: boolean;
};

/**
 * Sorts rows by a single column. Empty cells always sort to the end.
 * When every non-empty value is numeric, compares as numbers; otherwise localeCompare (ja).
 */
export function sortRows(
  rows: CellValue[][],
  colIndex: number,
  direction: SortDirection,
  options: SortOptions = {},
): CellValue[][] {
  if (rows.length === 0 || colIndex < 0) {
    return rows.map((row) => [...row]);
  }

  const headerRow = options.headerRow === true;
  const header = headerRow && rows.length > 0 ? [...rows[0]!] : null;
  const body = headerRow ? rows.slice(1) : rows.slice();
  if (body.length === 0) {
    return header ? [header] : [];
  }

  const numeric = body.every((row) => {
    const value = (row[colIndex] ?? "").trim();
    return value === "" || Number.isFinite(Number(value.replace(/,/g, "")));
  });

  const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });
  const dir = direction === "asc" ? 1 : -1;

  const sorted = body
    .map((row, index) => ({ row: [...row], index }))
    .sort((a, b) => {
      const aRaw = (a.row[colIndex] ?? "").trim();
      const bRaw = (b.row[colIndex] ?? "").trim();
      const aEmpty = aRaw === "";
      const bEmpty = bRaw === "";
      if (aEmpty && bEmpty) {
        return a.index - b.index;
      }
      if (aEmpty) {
        return 1;
      }
      if (bEmpty) {
        return -1;
      }
      let cmp: number;
      if (numeric) {
        cmp = Number(aRaw.replace(/,/g, "")) - Number(bRaw.replace(/,/g, ""));
      } else {
        cmp = collator.compare(aRaw, bRaw);
      }
      if (cmp === 0) {
        return a.index - b.index;
      }
      return cmp * dir;
    })
    .map((entry) => entry.row);

  return header ? [header, ...sorted] : sorted;
}
