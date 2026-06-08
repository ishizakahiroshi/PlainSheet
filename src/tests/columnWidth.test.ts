import { describe, expect, it } from "vitest";
import { calculateColumnWidths, clamp, isWideCharacter, measureCell } from "../lib/columnWidth";

describe("calculateColumnWidths", () => {
  it("returns one width per existing column", () => {
    expect(calculateColumnWidths([["a", "bb"], ["ccc"]])).toEqual({
      0: 72,
      1: 72,
    });
  });

  it("measures Japanese text wider than ASCII text", () => {
    const widths = calculateColumnWidths([["Name"], ["東京都中央区日本橋"]]);
    expect(widths[0]).toBeGreaterThan(120);
  });

  it("clamps very long cells to 420px", () => {
    const widths = calculateColumnWidths([[`${"a".repeat(200)}`]]);
    expect(widths[0]).toBe(420);
  });

  it("scans at most the first 1000 rows", () => {
    const rows = Array.from({ length: 1001 }, (_, index) => [index === 1000 ? "あ".repeat(100) : "a"]);
    const widths = calculateColumnWidths(rows);
    expect(widths[0]).toBe(72);
  });
});

describe("measureCell", () => {
  it("uses 7.5px for ASCII", () => {
    expect(measureCell("abcd")).toBe(30);
  });

  it("uses 15px for wide characters", () => {
    expect(measureCell("日本")).toBe(30);
  });
});

describe("isWideCharacter", () => {
  it("recognizes ASCII as narrow", () => {
    expect(isWideCharacter("A")).toBe(false);
  });

  it("recognizes kana as wide", () => {
    expect(isWideCharacter("ア")).toBe(true);
  });
});

describe("clamp", () => {
  it("clamps below the minimum", () => {
    expect(clamp(10, 72, 420)).toBe(72);
  });

  it("clamps above the maximum", () => {
    expect(clamp(900, 72, 420)).toBe(420);
  });
});
