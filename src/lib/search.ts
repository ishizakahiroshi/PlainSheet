import type { CellValue } from "../types/sheet";

export const SEARCH_NAVIGATION_CAP = 5000;
export type SearchHit = { row: number; col: number };

/** Bound the highlighted/navigation list without understating the search scope. */
export function collectSearchMatches(
  rows: CellValue[][],
  matcher: RegExp | null,
  visible: Set<number> | null = null,
  includesCell?: (row: number, col: number) => boolean,
): { hits: SearchHit[]; total: number } {
  const hits: SearchHit[] = [];
  let total = 0;
  if (!matcher) return { hits, total };
  for (let row = 0; row < rows.length; row += 1) {
    if (visible && !visible.has(row)) continue;
    for (let col = 0; col < rows[row].length; col += 1) {
      if (includesCell && !includesCell(row, col)) continue;
      matcher.lastIndex = 0;
      if (!matcher.test(rows[row][col])) continue;
      total += 1;
      if (hits.length < SEARCH_NAVIGATION_CAP) hits.push({ row, col });
    }
  }
  return { hits, total };
}

export type MatcherOptions = {
  regex: boolean;
  caseSensitive: boolean;
  wholeCell?: boolean;
  groups?: boolean;
};
export function compileSearch(
  query: string,
  options: MatcherOptions,
): { matcher: RegExp | null; error: string | null } {
  if (query === "") return { matcher: null, error: null };
  if (query.length > 2000)
    return {
      matcher: null,
      error: "検索は2000 UTF-16 code unitsまでです / Maximum 2000 UTF-16 code units",
    };
  const pattern = options.regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    return {
      matcher: new RegExp(
        options.wholeCell ? `^(?:${pattern})(?![\\s\\S])` : pattern,
        `${options.caseSensitive ? "" : "i"}g`,
      ),
      error: null,
    };
  } catch {
    return {
      matcher: null,
      error: "正規表現が不正です。括弧やエスケープを確認してください / Invalid regular expression",
    };
  }
}
export function replaceSearchValue(
  value: string,
  matcher: RegExp,
  replacement: string,
  groups = false,
  once = false,
): string {
  const regex = new RegExp(matcher.source, once ? matcher.flags.replace("g", "") : matcher.flags);
  return groups ? value.replace(regex, replacement) : value.replace(regex, () => replacement);
}
