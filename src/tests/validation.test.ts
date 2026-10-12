import { describe, expect, it } from "vitest";
import {
  compileSafePattern,
  parseValidationRules,
  serializeValidationRules,
  validateDocument,
  validateMutation,
  type ValidationRule,
} from "../lib/validation";

const rule: ValidationRule = {
  id: "id",
  column: 0,
  kind: "pattern",
  pattern: "[0-9]{5}",
  mode: "warning",
  skipHeader: true,
};
describe("bounded optional input rules", () => {
  it("warns without changing raw input and preserves padded IDs", () => {
    const rows = [["ID"], ["00123"], ["900719925474099312345"]];
    const report = validateDocument(rows, [rule]);
    expect(report.allowed).toBe(true);
    expect(report.totalIssues).toBe(1);
    expect(report.issues[0].row).toBe(2);
    expect(rows[1][0]).toBe("00123");
  });
  it("rejects a whole paste, counts every error, and keeps reports bounded", () => {
    const before = [["header"], ["valid"]];
    const after = [["header"], ...Array.from({ length: 250 }, () => [""])];
    const report = validateMutation(before, after, [{ ...rule, kind: "required", mode: "reject" }]);
    expect(report.allowed).toBe(false);
    expect(report.totalIssues).toBe(250);
    expect(report.rejectedIssues).toBe(250);
    expect(report.issues).toHaveLength(200);
    expect(report.truncated).toBe(true);
    expect(before).toEqual([["header"], ["valid"]]);
  });
  it("checks only changed destinations and handles exact enum text", () => {
    const before = [["head"], ["bad old value"], ["no"]];
    const after = [["head"], ["bad old value"], ["yes"]];
    const enumRule: ValidationRule = {
      ...rule,
      kind: "enum",
      mode: "reject",
      values: ["yes", "00123"],
    };
    expect(validateMutation(before, after, [enumRule]).allowed).toBe(true);
    expect(
      validateMutation(before, [["head"], ["bad old value"], ["YES"]], [enumRule]).allowed,
    ).toBe(false);
    expect(
      validateMutation(
        before,
        after,
        [enumRule],
        [
          { row: 2, col: 0 },
          { row: 2, col: 0 },
        ],
      ).totalIssues,
    ).toBe(0);
  });
  it("supports useful full-match patterns without unsafe regex constructs", () => {
    for (const [pattern, valid, invalid] of [
      ["^[A-Z]{2}-\\d{3,5}$", "AB-00123", "AB-001234"],
      ["a*b?c+", "aaabccc", "aaabcccx"],
      ["[あ-ん]+", "あいう", "abc"],
      ["^$", "", "a"],
    ]) {
      const compiled = compileSafePattern(pattern);
      expect(compiled.error).toBeUndefined();
      expect(compiled.test(valid)).toBe(true);
      expect(compiled.test(invalid)).toBe(false);
    }
    for (const pattern of ["(a+)+$", "a|b", "(a)\\1", "a{4097}", "[", "a++", "a".repeat(129)])
      expect(compileSafePattern(pattern).error).toBeTruthy();
    expect(compileSafePattern("a*a*a*a*b").test("a".repeat(4096))).toBe(false);
    expect(compileSafePattern("a+").test("a".repeat(4097))).toBe(false);
  });
  it("roundtrips a versioned standalone sidecar and rejects malformed metadata", () => {
    const text = serializeValidationRules([rule]);
    expect(parseValidationRules(text).rules).toEqual([rule]);
    for (const bad of [
      "{",
      JSON.stringify({ version: 2, kind: "plainsheet-validation", rules: [rule] }),
      JSON.stringify({ version: 1, kind: "plainsheet-validation", rules: [rule, rule] }),
      JSON.stringify({
        version: 1,
        kind: "plainsheet-validation",
        rules: [{ ...rule, column: -1 }],
      }),
    ])
      expect(parseValidationRules(bad).error).toBeTruthy();
  });
});
