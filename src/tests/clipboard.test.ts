import { describe, expect, it } from "vitest";
import { classifyClipboardText, normalizeRange, parseClipboardText, rangeTsv } from "../lib/clipboard";

describe("rangeTsv", () => {
  it("serializes a selected range as TSV", () => {
    expect(
      rangeTsv(
        [
          ["a", "b", "c"],
          ["d", "e", "f"],
        ],
        { startRow: 0, startCol: 1, endRow: 1, endCol: 2 },
      ),
    ).toBe("b\tc\ne\tf");
  });

  it("fills missing cells with empty strings", () => {
    expect(rangeTsv([["a"], ["b", "c"]], { startRow: 0, startCol: 0, endRow: 1, endCol: 1 })).toBe(
      "a\t\nb\tc",
    );
  });

  it("returns an empty string for null range", () => {
    expect(rangeTsv([["a"]], null)).toBe("");
  });
});

describe("parseClipboardText", () => {
  it("parses Excel TSV", () => {
    expect(parseClipboardText("a\tb\nc\td\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parses quoted tabs and newlines", () => {
    expect(parseClipboardText("\"a\tb\"\t\"c\n d\"")).toEqual([["a\tb", "c\n d"]]);
  });

  it("keeps a single value as a 1x1 grid", () => {
    expect(parseClipboardText("plain")).toEqual([["plain"]]);
  });
});

describe("classifyClipboardText", () => {
  it("classifies one cell", () => {
    expect(classifyClipboardText("plain").source).toBe("single-cell");
  });

  it("classifies ranges", () => {
    expect(classifyClipboardText("a\tb").source).toBe("range");
  });
});

describe("normalizeRange", () => {
  it("normalizes reversed corners", () => {
    expect(normalizeRange({ startRow: 4, startCol: 3, endRow: 1, endCol: 0 })).toEqual({
      startRow: 1,
      startCol: 0,
      endRow: 4,
      endCol: 3,
    });
  });
});
