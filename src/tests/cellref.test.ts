import { describe, expect, it } from "vitest";
import { columnIndexFromName, parseCellRef } from "../lib/cellref";

describe("columnIndexFromName", () => {
  it("maps A/Z/AA/ZZ", () => {
    expect(columnIndexFromName("A")).toBe(0);
    expect(columnIndexFromName("Z")).toBe(25);
    expect(columnIndexFromName("AA")).toBe(26);
    expect(columnIndexFromName("ZZ")).toBe(701);
  });

  it("rejects invalid names", () => {
    expect(columnIndexFromName("")).toBeNull();
    expect(columnIndexFromName("1A")).toBeNull();
    expect(columnIndexFromName("A1")).toBeNull();
  });
});

describe("parseCellRef", () => {
  it("parses a single cell", () => {
    expect(parseCellRef("A1")).toEqual({ kind: "cell", row: 0, col: 0 });
    expect(parseCellRef("z100")).toEqual({ kind: "cell", row: 99, col: 25 });
  });

  it("parses a range", () => {
    expect(parseCellRef("A1:C5")).toEqual({
      kind: "range",
      startRow: 0,
      startCol: 0,
      endRow: 4,
      endCol: 2,
    });
  });

  it("rejects invalid input", () => {
    expect(parseCellRef("")).toBeNull();
    expect(parseCellRef("1A")).toBeNull();
    expect(parseCellRef("A1:B2:C3")).toBeNull();
    expect(parseCellRef("hello")).toBeNull();
  });
});
