import { describe, expect, it } from "vitest";
import {
  invertValidationChanges,
  remapValidationRules,
  restoreValidationHistory,
  validationHistoryBefore,
  validationHistoryError,
  type ValidationColumnChange,
} from "../lib/validationHistory";
import { validateMutation, type ValidationRule } from "../lib/validation";

const rule = (id: string, column: number): ValidationRule => ({
  id,
  column,
  kind: "required",
  mode: "reject",
  skipHeader: true,
});

describe("column-aware validation history", () => {
  it("preserves later rule additions and edits across move undo and redo", () => {
    const initial = [rule("original", 0)];
    const undo = validationHistoryBefore(initial, [{ type: "move", from: 0, to: 2 }]);
    const current = [{ ...rule("original", 2), mode: "warning" as const }, rule("later", 0)];
    const redo = validationHistoryBefore(current, undo.validationChanges);
    const undone = restoreValidationHistory(current, undo);
    expect(undone).toEqual([{ ...rule("original", 0), mode: "warning" }, rule("later", 1)]);
    expect(restoreValidationHistory(undone, redo)).toEqual(current);
  });

  it("restores only deleted-column rules while preserving later rules on survivors", () => {
    const initial = [rule("deleted", 1), rule("surviving", 3)];
    const changes: ValidationColumnChange[] = [{ type: "delete", indexes: [2, 1] }];
    const undo = validationHistoryBefore(initial, changes);
    const current = [...remapValidationRules(initial, changes), rule("later", 0)];
    const redo = validationHistoryBefore(current, undo.validationChanges);
    const undone = restoreValidationHistory(current, undo);
    expect(undone).toEqual([rule("surviving", 3), rule("later", 0), rule("deleted", 1)]);
    expect(restoreValidationHistory(undone, redo)).toEqual(current);
  });

  it("keeps newly inserted column rules detached during undo and restores them on redo", () => {
    const undo = validationHistoryBefore(
      [rule("old", 2)],
      [{ type: "insert", index: 1, count: 2 }],
    );
    const current = [rule("old", 4), rule("new", 2)];
    const redo = validationHistoryBefore(current, undo.validationChanges);
    const undone = restoreValidationHistory(current, undo);
    expect(undone).toEqual([rule("old", 2)]);
    expect(restoreValidationHistory(undone, redo)).toEqual(current);
  });

  it("inverts a noncontiguous deletion at original indexes", () => {
    const changes: ValidationColumnChange[] = [{ type: "delete", indexes: [4, 1, 4] }];
    const surviving = [rule("A", 0), rule("C", 2), rule("D", 3), rule("F", 5)];
    expect(
      remapValidationRules(
        remapValidationRules(surviving, changes),
        invertValidationChanges(changes),
      ),
    ).toEqual(surviving);
  });

  it("keeps ordinary cell history metadata-neutral", () => {
    expect(validationHistoryBefore([rule("later", 0)])).toEqual({});
  });

  it("preflights capacity without clipping rules or changing restoration metadata", () => {
    const current = Array.from({ length: 100 }, (_, index) => rule(`current-${index}`, 0));
    const undo = validationHistoryBefore([rule("removed", 0)], [{ type: "delete", indexes: [0] }]);
    const saved = structuredClone({ current, undo });
    expect(validationHistoryError(current, undo)).toMatch(/100 rules/);
    expect({ current, undo }).toEqual(saved);
    expect(validationHistoryError(current.slice(1), undo)).toBeNull();
    expect(restoreValidationHistory(current.slice(1), undo)).toHaveLength(100);
  });

  it("preflights mapped rules outside the supported column range", () => {
    const target = { validationChanges: [{ type: "insert" as const, index: 0, count: 1 }] };
    expect(validationHistoryError([rule("last", 16383)], target)).toMatch(/invalidate a rule/);
    expect(validationHistoryError([rule("last", 16382)], target)).toBeNull();
  });

  it("copies mutable rule values and change indexes", () => {
    const initial = [{ ...rule("enum", 1), kind: "enum" as const, values: ["yes"] }];
    const undo = validationHistoryBefore(initial, [{ type: "delete", indexes: [1] }]);
    initial[0].values.push("no");
    const restored = restoreValidationHistory([], undo);
    restored[0].values!.push("maybe");
    expect(undo.validationRemovedRules![0].values).toEqual(["yes"]);
  });
});

describe("rule-specific header applicability", () => {
  const rules: ValidationRule[] = [
    { ...rule("all-rows", 0), kind: "pattern", pattern: "[0-9]*", skipHeader: false },
    rule("header-skipping", 1),
  ];
  it("does not revalidate unchanged all-row violations when another rule becomes applicable", () => {
    const rows = [
      ["", ""],
      ["bad", "value"],
      ["11", "keep"],
    ];
    const before = [undefined, ["bad", "value"], ["11", "keep"]] as unknown as string[][];
    expect(
      validateMutation(before, rows, rules, undefined, [{ row: 1, ruleId: "header-skipping" }])
        .allowed,
    ).toBe(true);
  });
  it("checks newly applicable rules independently even on the same column", () => {
    const sameColumn = [rules[0], { ...rules[1], column: 0 }];
    expect(
      validateMutation([["0"], ["bad"]], [["0"], ["bad"]], sameColumn, undefined, [
        { row: 1, ruleId: "header-skipping" },
      ]).allowed,
    ).toBe(true);
    expect(
      validateMutation([["0"], [""]], [["0"], [""]], sameColumn, undefined, [
        { row: 1, ruleId: "header-skipping" },
      ]).rejectedIssues,
    ).toBe(1);
  });
  it("still rejects new invalid values and does not double-count applicability checks", () => {
    const result = validateMutation(
      [],
      [
        ["bad", ""],
        ["bad", ""],
      ],
      rules,
      undefined,
      [{ row: 1, ruleId: "header-skipping" }],
    );
    expect(result.rejectedIssues).toBe(3);
  });
});
