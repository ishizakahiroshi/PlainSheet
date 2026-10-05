import type { CellValue, SheetMeta } from "../types/sheet";
import { sameRows } from "./gridOperations";

export type SaveSnapshot = { documentId: string; rows: CellValue[][]; meta: SheetMeta };
export type SaveCompletion = {
  snapshot: SaveSnapshot;
  patch: Partial<SheetMeta>;
  method: "direct" | "download";
};

export function completedSaveMeta(
  rows: CellValue[][],
  meta: SheetMeta,
  completion: SaveCompletion,
): SheetMeta {
  const source = completion.snapshot.meta;
  const unchanged =
    sameRows(rows, completion.snapshot.rows) &&
    meta.encoding === source.encoding &&
    meta.newline === source.newline &&
    meta.delimiter === source.delimiter &&
    meta.format === source.format &&
    meta.csvFormulaGuard === source.csvFormulaGuard &&
    meta.omitEmptyCells === source.omitEmptyCells;
  // A browser can only confirm download initiation, not a destination write or completion.
  const patch = { ...completion.patch };
  // Preserve metadata the user changed during the write; the completed output used the captured settings.
  for (const key of [
    "encoding",
    "newline",
    "delimiter",
    "format",
    "csvFormulaGuard",
    "omitEmptyCells",
  ] as const) {
    if (meta[key] !== source[key]) delete patch[key];
  }
  return {
    ...meta,
    ...patch,
    dirty: completion.method === "direct" && unchanged ? false : meta.dirty,
  };
}
