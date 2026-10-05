import type { CellValue } from "../types/sheet";

export const SEARCH_NAVIGATION_CAP = 5000;
export type SearchHit = { row: number; col: number };

/** Bound the highlighted/navigation list without understating the search scope. */
export function collectSearchMatches(
  rows: CellValue[][],
  matcher: RegExp | null,
  visible: Set<number> | null = null,
): { hits: SearchHit[]; total: number } {
  const hits: SearchHit[] = [];
  let total = 0;
  if (!matcher) return { hits, total };
  for (let row = 0; row < rows.length; row += 1) {
    if (visible && !visible.has(row)) continue;
    for (let col = 0; col < rows[row].length; col += 1) {
      matcher.lastIndex = 0;
      if (!matcher.test(rows[row][col])) continue;
      total += 1;
      if (hits.length < SEARCH_NAVIGATION_CAP) hits.push({ row, col });
    }
  }
  return { hits, total };
}
