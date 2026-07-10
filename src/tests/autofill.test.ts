import { describe, expect, it } from "vitest";
import { fillSeries } from "../lib/autofill";

describe("fillSeries", () => {
  it("extends numeric sequences by step", () => {
    expect(fillSeries(["1", "2"], 3)).toEqual(["3", "4", "5"]);
    expect(fillSeries(["10"], 2)).toEqual(["11", "12"]);
  });

  it("extends trailing numbers", () => {
    expect(fillSeries(["item1"], 3)).toEqual(["item2", "item3", "item4"]);
    expect(fillSeries(["A01", "A02"], 2)).toEqual(["A03", "A04"]);
  });

  it("cycle-copies non-numeric text", () => {
    expect(fillSeries(["a", "b"], 4)).toEqual(["a", "b", "a", "b"]);
  });

  it("handles empty source and zero count", () => {
    expect(fillSeries([], 2)).toEqual(["", ""]);
    expect(fillSeries(["1"], 0)).toEqual([]);
  });
});
