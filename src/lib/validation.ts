import type { Selection } from "../types/sheet";

export type ValidationRule = {
  id: string;
  column: number;
  kind: "required" | "pattern" | "enum";
  mode: "warning" | "reject";
  skipHeader: boolean;
  pattern?: string;
  values?: string[];
};
export type ValidationIssue = Selection & {
  ruleId: string;
  mode: "warning" | "reject";
  message: string;
  value: string;
};
export type ValidationReport = {
  allowed: boolean;
  issues: ValidationIssue[];
  totalIssues: number;
  rejectedIssues: number;
  truncated: boolean;
  ruleErrors: string[];
};
export const VALIDATION_REPORT_LIMIT = 200;
export const VALIDATION_RULE_LIMIT = 100;
export const VALIDATION_PATTERN_LIMIT = 128;
export const VALIDATION_VALUE_LIMIT = 4096;

type PatternToken = { test: (character: string) => boolean; min: number; max: number };
export type SafePattern = { error?: string; test: (value: string) => boolean };

/** Full-cell regex subset evaluated by bounded dynamic programming, never native backtracking.
 * Supports literals, ., character classes, \\d/\\w/\\s, ?, *, +, {n,m}, optional ^/$.
 * Groups, alternatives, lookarounds and backreferences are deliberately unsupported.
 */
export function compileSafePattern(pattern: string): SafePattern {
  const fail = (error: string): SafePattern => ({ error, test: () => false });
  if (typeof pattern !== "string" || !pattern || pattern.length > VALIDATION_PATTERN_LIMIT)
    return fail("Pattern must contain 1–128 characters.");
  let source = pattern;
  if (source.startsWith("^")) source = source.slice(1);
  if (source.endsWith("$") && !source.endsWith("\\$")) source = source.slice(0, -1);
  const tokens: PatternToken[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    let atom = source[cursor++];
    if (atom === "[") {
      const start = cursor - 1;
      let closed = false;
      while (cursor < source.length) {
        const char = source[cursor++];
        if (char === "\\") {
          cursor++;
          continue;
        }
        if (char === "]") {
          closed = true;
          break;
        }
      }
      if (!closed) return fail("Unclosed character class.");
      atom = source.slice(start, cursor);
    } else if (atom === "\\") {
      const escaped = source[cursor++];
      if (!escaped || !"dDwWsS\\.-+*?^$[]{}()|/".includes(escaped))
        return fail("Unsupported escape or backreference.");
      atom += escaped;
    } else if (/[()|^$?*+{}\]]/.test(atom))
      return fail("Groups, alternatives, assertions and nested quantifiers are unsupported.");
    let matcher: RegExp;
    try {
      matcher = new RegExp(`^(?:${atom})$`, "u");
    } catch {
      return fail("Invalid pattern character or class.");
    }
    let min = 1;
    let max = 1;
    const quantifier = source[cursor];
    if (quantifier === "?" || quantifier === "*" || quantifier === "+") {
      cursor++;
      min = quantifier === "+" ? 1 : 0;
      max = quantifier === "?" ? 1 : VALIDATION_VALUE_LIMIT;
    } else if (quantifier === "{") {
      const match = source.slice(cursor).match(/^\{(\d{1,4})(?:,(\d{0,4}))?\}/);
      if (!match) return fail("Invalid repetition. Use {n} or {n,m}.");
      min = Number(match[1]);
      max =
        match[2] === undefined ? min : match[2] === "" ? VALIDATION_VALUE_LIMIT : Number(match[2]);
      if (min > max || max > VALIDATION_VALUE_LIMIT)
        return fail("Repetition must be between 0 and 4096.");
      cursor += match[0].length;
    }
    tokens.push({ test: (character) => matcher.test(character), min, max });
  }
  return {
    test: (value) => {
      if (value.length > VALIDATION_VALUE_LIMIT) return false;
      const characters = Array.from(value);
      let reachable = new Uint8Array(characters.length + 1);
      reachable[0] = 1;
      for (const token of tokens) {
        const next = new Uint8Array(characters.length + 1);
        const prefix = new Uint32Array(characters.length + 2);
        for (let i = 0; i < reachable.length; i++) prefix[i + 1] = prefix[i] + reachable[i];
        let run = 0;
        for (let end = 0; end <= characters.length; end++) {
          if (end > 0) run = token.test(characters[end - 1]) ? run + 1 : 0;
          const low = Math.max(0, end - Math.min(token.max, run));
          const high = end - token.min;
          if (high >= low && prefix[high + 1] > prefix[low]) next[end] = 1;
        }
        reachable = next;
      }
      return reachable[characters.length] === 1;
    },
  };
}

export function validateRule(rule: ValidationRule): string | null {
  if (
    !rule ||
    typeof rule.id !== "string" ||
    !rule.id ||
    rule.id.length > 100 ||
    !Number.isInteger(rule.column) ||
    rule.column < 0 ||
    rule.column > 16383
  )
    return "Invalid rule identity or column.";
  if (
    !["required", "pattern", "enum"].includes(rule.kind) ||
    !["warning", "reject"].includes(rule.mode) ||
    typeof rule.skipHeader !== "boolean"
  )
    return "Invalid rule type or policy.";
  if (rule.kind === "pattern") return compileSafePattern(rule.pattern ?? "").error ?? null;
  if (
    rule.kind === "enum" &&
    (!Array.isArray(rule.values) ||
      !rule.values.length ||
      rule.values.length > 100 ||
      rule.values.some((v) => typeof v !== "string" || v.length > VALIDATION_VALUE_LIMIT))
  )
    return "Choose 1–100 text values, each at most 4096 characters.";
  return null;
}

/** All issues are counted. Display is bounded; one rejecting issue rejects the entire proposed edit. */
export function validateMutation(
  beforeRows: readonly (readonly string[])[],
  nextRows: readonly (readonly string[])[],
  rules: readonly ValidationRule[],
  changedCells?: readonly Selection[],
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const ruleErrors =
    rules.length > VALIDATION_RULE_LIMIT
      ? ["A document supports at most 100 validation rules."]
      : [];
  const compiled = rules.slice(0, VALIDATION_RULE_LIMIT).flatMap((rule) => {
    const error = validateRule(rule);
    if (error) {
      ruleErrors.push(`${rule.id}: ${error}`);
      return [];
    }
    return [{ rule, pattern: rule.kind === "pattern" ? compileSafePattern(rule.pattern!) : null }];
  });
  let totalIssues = 0;
  let rejectedIssues = 0;
  const seen = new Set<string>();
  const check = ({ row, col }: Selection) => {
    if (row < 0 || col < 0 || !Number.isInteger(row) || !Number.isInteger(col) || !nextRows[row])
      return;
    const key = `${row}:${col}`;
    if (seen.has(key)) return;
    seen.add(key);
    const value = nextRows[row][col] ?? "";
    for (const { rule, pattern } of compiled) {
      if (rule.column !== col || (rule.skipHeader && row === 0)) continue;
      const valid =
        rule.kind === "required"
          ? value !== ""
          : rule.kind === "enum"
            ? rule.values!.includes(value)
            : pattern!.test(value);
      if (valid) continue;
      totalIssues++;
      if (rule.mode === "reject") rejectedIssues++;
      if (issues.length < VALIDATION_REPORT_LIMIT)
        issues.push({
          row,
          col,
          ruleId: rule.id,
          mode: rule.mode,
          value: value.slice(0, VALIDATION_VALUE_LIMIT),
          message:
            rule.kind === "required"
              ? "A value is required."
              : rule.kind === "enum"
                ? "Value is outside the allowed list."
                : value.length > VALIDATION_VALUE_LIMIT
                  ? "Value exceeds the 4096-character pattern-check limit."
                  : "Value does not match the full-cell pattern.",
        });
    }
  };
  if (changedCells) changedCells.forEach(check);
  else {
    const columns = [...new Set(compiled.map(({ rule }) => rule.column))];
    nextRows.forEach((row, rowIndex) =>
      columns.forEach((col) => {
        if (!beforeRows[rowIndex] || (beforeRows[rowIndex][col] ?? "") !== (row[col] ?? ""))
          check({ row: rowIndex, col });
      }),
    );
  }
  return {
    allowed: rejectedIssues === 0 && ruleErrors.length === 0,
    issues,
    totalIssues,
    rejectedIssues,
    truncated: totalIssues > issues.length,
    ruleErrors,
  };
}

export function validateDocument(
  rows: readonly (readonly string[])[],
  rules: readonly ValidationRule[],
): ValidationReport {
  return validateMutation([], rows, rules);
}

export function serializeValidationRules(rules: readonly ValidationRule[]): string {
  if (rules.length > VALIDATION_RULE_LIMIT || rules.some((rule) => validateRule(rule)))
    throw new Error("Invalid validation rules.");
  return JSON.stringify({ version: 1, kind: "plainsheet-validation", rules }, null, 2);
}

export function parseValidationRules(text: string): { rules: ValidationRule[]; error?: string } {
  try {
    if (text.length > 1024 * 1024) throw new Error();
    const data = JSON.parse(text);
    if (
      data?.version !== 1 ||
      data.kind !== "plainsheet-validation" ||
      !Array.isArray(data.rules) ||
      data.rules.length > VALIDATION_RULE_LIMIT ||
      data.rules.some((rule: ValidationRule) => validateRule(rule))
    )
      throw new Error();
    if (new Set(data.rules.map((rule: ValidationRule) => rule.id)).size !== data.rules.length)
      throw new Error();
    return {
      rules: data.rules.map((rule: ValidationRule) => ({
        id: rule.id,
        column: rule.column,
        kind: rule.kind,
        mode: rule.mode,
        skipHeader: rule.skipHeader,
        ...(rule.kind === "pattern" ? { pattern: rule.pattern } : {}),
        ...(rule.kind === "enum" ? { values: [...rule.values!] } : {}),
      })),
    };
  } catch {
    return {
      rules: [],
      error: "Invalid or unsupported validation sidecar. Existing rules were not changed.",
    };
  }
}
