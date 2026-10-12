import type { Selection } from "../types/sheet";

export type TrimOptions = { asciiWhitespace: boolean; fullwidthSpace: boolean };
export type CleanupChange = Selection & { before: string; after: string };
export type CleanupPreview = {
  nextRows: string[][];
  changes: CleanupChange[];
  changedCells: number;
  targetedCells: number;
  removedSourceRows: number[];
  truncated: boolean;
};
export const CLEANUP_PREVIEW_LIMIT = 100;

/** Exact source coordinates only. No display mapping or numeric coercion occurs here. */
export function previewCleanup(
  rows: readonly (readonly string[])[],
  cells: readonly Selection[],
  options: TrimOptions,
): CleanupPreview {
  const nextRows = rows.map((row) => [...row]);
  const changes: CleanupChange[] = [];
  const seen = new Set<string>();
  const characters = `${options.asciiWhitespace ? " \\t\\r\\n\\f\\v" : ""}${options.fullwidthSpace ? "\\u3000" : ""}`;
  const matcher = characters ? new RegExp(`^[${characters}]+|[${characters}]+$`, "g") : null;
  let changedCells = 0;
  for (const { row, col } of cells) {
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      col < 0 ||
      rows[row]?.[col] === undefined
    )
      continue;
    const key = `${row}:${col}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const before = rows[row][col];
    const after = matcher ? before.replace(matcher, "") : before;
    if (before === after) continue;
    nextRows[row][col] = after;
    changedCells++;
    if (changes.length < CLEANUP_PREVIEW_LIMIT) changes.push({ row, col, before, after });
  }
  return {
    nextRows,
    changes,
    changedCells,
    targetedCells: seen.size,
    removedSourceRows: [],
    truncated: changedCells > changes.length,
  };
}

export type DedupeOptions = {
  keyColumns: readonly number[];
  caseSensitive: boolean;
  hasHeader: boolean;
};
export type DedupePreview = CleanupPreview & { error?: string };

/** Removes complete selected rows; nonselected/hidden row values and relative order are preserved. */
export function previewDedupe(
  rows: readonly (readonly string[])[],
  sourceRows: readonly number[],
  options: DedupeOptions,
): DedupePreview {
  const baseline: CleanupPreview = {
    nextRows: rows.map((row) => [...row]),
    changes: [],
    changedCells: 0,
    targetedCells: 0,
    removedSourceRows: [],
    truncated: false,
  };
  const keys = [...new Set(options.keyColumns)];
  if (!keys.length || keys.some((col) => !Number.isInteger(col) || col < 0))
    return { ...baseline, error: "Choose at least one valid key column." };
  const targets = [...new Set(sourceRows)]
    .filter(
      (row) =>
        Number.isInteger(row) && row >= 0 && row < rows.length && !(options.hasHeader && row === 0),
    )
    .sort((a, b) => a - b);
  const seen = new Set<string>();
  const removedSourceRows: number[] = [];
  for (const row of targets) {
    const key = JSON.stringify(
      keys.map((col) => {
        const value = rows[row][col] ?? "";
        return options.caseSensitive ? value : value.toLowerCase();
      }),
    );
    if (seen.has(key)) removedSourceRows.push(row);
    else seen.add(key);
  }
  const removed = new Set(removedSourceRows);
  return {
    ...baseline,
    nextRows: rows.filter((_, row) => !removed.has(row)).map((row) => [...row]),
    removedSourceRows,
    targetedCells: targets.length * keys.length,
  };
}
