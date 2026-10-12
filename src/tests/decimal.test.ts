import { describe, expect, it } from "vitest";
import {
  compareExactDecimals,
  formatExactDecimal,
  offsetExactDecimal,
  parseExactDecimal,
  subtractExactDecimals,
} from "../lib/decimal";

describe("exact decimal primitives", () => {
  it("parses decimal and bounded exponent notation", () => {
    expect(parseExactDecimal("1.23e2")).toEqual({ coefficient: 123n, scale: 0 });
    expect(parseExactDecimal("-1.2e-3")).toEqual({ coefficient: -12n, scale: 4 });
    expect(parseExactDecimal("1,234.50")).toEqual({ coefficient: 123450n, scale: 2 });
  });

  it.each([
    "",
    " ",
    "NaN",
    "Infinity",
    "0x10",
    "1,2",
    "12,34",
    "2026-10-11",
    "1e999999999999999999999",
    "1e10001",
  ])("rejects nondecimal or unbounded input %s", (text) => {
    expect(parseExactDecimal(text)).toBeNull();
  });

  it("compares adjacent very precise values", () => {
    expect(
      compareExactDecimals(
        parseExactDecimal("9007199254740993")!,
        parseExactDecimal("9007199254740992")!,
      ),
    ).toBe(1);
    expect(
      compareExactDecimals(parseExactDecimal("1.0000000000000000001")!, parseExactDecimal("1")!),
    ).toBe(1);
    expect(compareExactDecimals(parseExactDecimal("-0")!, parseExactDecimal("0.0")!)).toBe(0);
  });

  it("performs decimal differences and offsets with no floating point noise", () => {
    const start = parseExactDecimal("0.2")!;
    const step = subtractExactDecimals(start, parseExactDecimal("0.1")!);
    expect(formatExactDecimal(offsetExactDecimal(start, step, 3))).toBe("0.5");
    expect(formatExactDecimal(offsetExactDecimal(start, step, -3))).toBe("-0.1");
  });
});
