import type { SearchOptions } from "../components/SearchPanel";
import type { CellValue } from "../types/sheet";

export type SearchHit = {
  row: number;
  col: number;
};

export const SEARCH_HIT_CAP = 5000;
const MAX_QUERY_LENGTH = 2000;

export function findSearchHits(
  rows: readonly (readonly CellValue[])[],
  query: string,
  options: SearchOptions,
  allowedRows?: ReadonlySet<number> | null,
): SearchHit[] {
  const matcher = buildMatcher(query, options);
  if (!matcher) {
    return [];
  }

  const hits: SearchHit[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    if (allowedRows && !allowedRows.has(rowIndex)) {
      continue;
    }
    const row = rows[rowIndex]!;
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      matcher.lastIndex = 0;
      if (matcher.test(row[colIndex]!)) {
        hits.push({ row: rowIndex, col: colIndex });
        if (hits.length >= SEARCH_HIT_CAP) {
          return hits;
        }
      }
    }
  }
  return hits;
}

export function buildMatcher(query: string, options: SearchOptions): RegExp | null {
  if (query === "" || query.length > MAX_QUERY_LENGTH) {
    return null;
  }

  const flags = `${options.caseSensitive ? "" : "i"}g`;
  try {
    return options.regex ? new RegExp(query, flags) : new RegExp(escapeRegExp(query), flags);
  } catch {
    return null;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
