import { describe, expect, it } from "vitest";
import { sortRows } from "../lib/sort";

describe("sortRows", () => {
  it("sorts numbers ascending and descending", () => {
    const rows = [["3"], ["1"], ["2"]];
    expect(sortRows(rows, 0, "asc")).toEqual([["1"], ["2"], ["3"]]);
    expect(sortRows(rows, 0, "desc")).toEqual([["3"], ["2"], ["1"]]);
  });

  it("sorts strings with localeCompare", () => {
    const rows = [["c"], ["a"], ["b"]];
    expect(sortRows(rows, 0, "asc")).toEqual([["a"], ["b"], ["c"]]);
  });

  it("keeps empty cells at the end", () => {
    const rows = [["2"], [""], ["1"], [""]];
    expect(sortRows(rows, 0, "asc")).toEqual([["1"], ["2"], [""], [""]]);
  });

  it("keeps the header row fixed when requested", () => {
    const rows = [
      ["name", "score"],
      ["b", "2"],
      ["a", "10"],
    ];
    expect(sortRows(rows, 1, "asc", { headerRow: true })).toEqual([
      ["name", "score"],
      ["b", "2"],
      ["a", "10"],
    ]);
    expect(sortRows(rows, 0, "asc", { headerRow: true })).toEqual([
      ["name", "score"],
      ["a", "10"],
      ["b", "2"],
    ]);
  });
});
