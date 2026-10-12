import type { ValidationRule } from "./validation";
import { VALIDATION_RULE_LIMIT, validateRule } from "./validation";

export type ValidationColumnChange =
  | { type: "insert"; index: number; count: number }
  | { type: "delete"; indexes: number[] }
  | { type: "move"; from: number; to: number };

export type ValidationHistory = {
  validationChanges?: ValidationColumnChange[];
  validationRemovedRules?: ValidationRule[];
};

/** Map current rules with their columns; never rewind later rule edits. */
export function remapValidationRules(
  rules: readonly ValidationRule[],
  changes: readonly ValidationColumnChange[],
): ValidationRule[] {
  let next = structuredClone([...rules]);
  for (const change of changes) {
    next = next.flatMap((rule) => {
      let column = rule.column;
      if (change.type === "insert") {
        if (column >= change.index) column += change.count;
      } else if (change.type === "delete") {
        const indexes = [...new Set(change.indexes)];
        if (indexes.includes(column)) return [];
        column -= indexes.filter((index) => index < column).length;
      } else {
        const { from, to } = change;
        column =
          column === from
            ? to
            : from < to && column > from && column <= to
              ? column - 1
              : from > to && column >= to && column < from
                ? column + 1
                : column;
      }
      return [{ ...rule, column }];
    });
  }
  return next;
}

export function invertValidationChanges(
  changes: readonly ValidationColumnChange[],
): ValidationColumnChange[] {
  return [...changes].reverse().flatMap((change): ValidationColumnChange[] => {
    if (change.type === "insert")
      return [
        {
          type: "delete",
          indexes: Array.from({ length: change.count }, (_, offset) => change.index + offset),
        },
      ];
    if (change.type === "move") return [{ type: "move", from: change.to, to: change.from }];
    return [...new Set(change.indexes)]
      .sort((a, b) => a - b)
      .map((index) => ({ type: "insert", index, count: 1 }));
  });
}

/** Metadata for returning to the current state after the supplied operation. */
export function validationHistoryBefore(
  rules: readonly ValidationRule[],
  changes?: readonly ValidationColumnChange[],
): ValidationHistory {
  if (!changes) return {};
  const survivingIds = new Set(remapValidationRules(rules, changes).map((rule) => rule.id));
  return {
    validationChanges: invertValidationChanges(changes),
    validationRemovedRules: structuredClone(rules.filter((rule) => !survivingIds.has(rule.id))),
  };
}

export function restoreValidationHistory(
  rules: readonly ValidationRule[],
  entry: ValidationHistory,
): ValidationRule[] {
  const next = remapValidationRules(rules, entry.validationChanges ?? []);
  const ids = new Set(next.map((rule) => rule.id));
  for (const rule of entry.validationRemovedRules ?? []) {
    if (!ids.has(rule.id)) {
      next.push(structuredClone(rule));
      ids.add(rule.id);
    }
  }
  return next;
}

/** Preflight before moving either history stack or mutating rows/rules. */
export function validationHistoryError(
  rules: readonly ValidationRule[],
  entry?: ValidationHistory,
): string | null {
  if (!entry?.validationChanges) return null;
  const restored = restoreValidationHistory(rules, entry);
  if (restored.length > VALIDATION_RULE_LIMIT)
    return "復元後の入力ルールが100件を超えるため変更しませんでした。不要なルールを削除して再実行してください / History would exceed 100 rules; remove unused rules and retry.";
  if (restored.some((rule) => validateRule(rule)))
    return "復元後の入力ルールが有効な列範囲を外れるため変更しませんでした。該当ルールを修正または削除してください / History would invalidate a rule; correct or remove the affected rule.";
  return null;
}
