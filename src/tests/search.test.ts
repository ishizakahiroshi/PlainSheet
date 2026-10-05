import { describe, expect, it } from "vitest";
import { collectSearchMatches, SEARCH_NAVIGATION_CAP } from "../lib/search";

describe("search count and bounded navigation", () => {
  it("counts every matching cell after the navigation limit without retaining unbounded coordinates", () => {
    const rows = Array.from({ length: 5003 }, () => ["match match", "other"]);
    const result = collectSearchMatches(rows, /match/g);
    expect(result.total).toBe(5003);
    expect(result.hits).toHaveLength(SEARCH_NAVIGATION_CAP);
    expect(result.hits.at(-1)).toEqual({ row: 4999, col: 0 });
  });
  it("keeps the total in the same visible-row scope, including after the cap", () => {
    const rows = Array.from({ length: 10006 }, () => ["match"]);
    const visible = new Set(Array.from({ length: 5003 }, (_, i) => i * 2));
    const result = collectSearchMatches(rows, /match/g, visible);
    expect(result.total).toBe(5003);
    expect(result.hits.at(-1)).toEqual({ row: 9998, col: 0 });
    expect(collectSearchMatches(rows, /match/g, new Set())).toEqual({ hits: [], total: 0 });
  });
  it("returns no results for an invalid matcher and counts matching cells rather than occurrences", () => {
    expect(collectSearchMatches([["match"]], null)).toEqual({ hits: [], total: 0 });
    expect(collectSearchMatches([["match match", "match"]], /match/g).total).toBe(2);
  });
});
