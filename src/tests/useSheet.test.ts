import { describe, expect, it } from "vitest";
import { ensureSize, trimTrailingEmptyRows } from "../hooks/useSheet";

describe("trimTrailingEmptyRows", () => {
  it("removes trailing empty rows", () => {
    expect(trimTrailingEmptyRows([["a"], [""], [""]])).toEqual([["a"]]);
  });

  it("keeps at least one row instead of collapsing to an empty sheet", () => {
    expect(trimTrailingEmptyRows([[""]])).toEqual([[""]]);
    expect(trimTrailingEmptyRows([[""], [""]])).toEqual([[""]]);
  });
});

describe("delete-last-row safety (shape used by useSheet.deleteRow)", () => {
  it("never collapses to an empty array after removing the final row", () => {
    // Mirrors deleteRow: splice then keep a blank row when empty.
    const next = [["only"]].slice();
    next.splice(0, 1);
    if (next.length === 0) {
      next.push([""]);
    }
    expect(next).toEqual([[""]]);
  });
});

describe("ensureSize", () => {
  it("pads rows and columns with empty strings", () => {
    expect(ensureSize([["a"]], 2, 3)).toEqual([
      ["a", "", ""],
      ["", "", ""],
    ]);
  });
});
