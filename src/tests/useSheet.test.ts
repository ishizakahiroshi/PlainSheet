import { describe, expect, it } from "vitest";
import { trimTrailingEmptyRows } from "../hooks/useSheet";

describe("trimTrailingEmptyRows", () => {
  it("removes trailing empty rows", () => {
    expect(trimTrailingEmptyRows([["a"], [""], [""]])).toEqual([["a"]]);
  });

  it("keeps at least one row instead of collapsing to an empty sheet", () => {
    expect(trimTrailingEmptyRows([[""]])).toEqual([[""]]);
    expect(trimTrailingEmptyRows([[""], [""]])).toEqual([[""]]);
  });
});
