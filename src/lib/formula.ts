import { columnName } from "./columns";
import { MAX_GRID_COLS, MAX_GRID_ROWS } from "../types/sheet";

/** Formula evaluation is opt-in. Raw cells and history always remain strings. */
export type FormulaErrorCode =
  "#ERROR!" | "#REF!" | "#NAME?" | "#DIV/0!" | "#VALUE!" | "#NUM!" | "#CYCLE!" | "#LIMIT!";

export type FormulaScalar = string | number | boolean;
export type FormulaCellResult =
  | { kind: "value"; raw: string; value: FormulaScalar; display: string; formula: boolean }
  | { kind: "error"; raw: string; error: FormulaErrorCode; display: string; formula: true };
export type FormulaDiagnostic = { row: number; col: number; error: FormulaErrorCode };
export type FormulaLimits = {
  maxFormulaLength: number;
  maxTokens: number;
  maxDepth: number;
  maxDependencyDepth: number;
  maxRangeCells: number;
  maxOperations: number;
  maxFormulaCells: number;
};
export const DEFAULT_FORMULA_LIMITS: Readonly<FormulaLimits> = Object.freeze({
  maxFormulaLength: 8192,
  maxTokens: 2048,
  maxDepth: 64,
  maxDependencyDepth: 128,
  maxRangeCells: 100_000,
  maxOperations: 500_000,
  maxFormulaCells: 10_000,
});
export type FormulaOptions = { enabled?: boolean; limits?: Partial<FormulaLimits> };
export type FormulaEvaluation = {
  /** Same shape as rawRows. Never feed these derived strings back into editing/history. */
  displayRows: string[][];
  errors: FormulaDiagnostic[];
  /** Source A1 addresses, including only the selected IF branch, in evaluation order. */
  dependencies: ReadonlyMap<string, readonly string[]>;
  getCellResult: (row: number, col: number) => FormulaCellResult;
};

type Ref = { row: number; col: number; absoluteRow: boolean; absoluteCol: boolean };
type Token = {
  kind: "number" | "string" | "word" | "ref" | "error" | "symbol" | "end";
  text: string;
  start: number;
  end: number;
};
type Node =
  | { kind: "literal"; value: FormulaScalar }
  | { kind: "error"; error: FormulaErrorCode }
  | { kind: "ref"; ref: Ref; start: number; end: number }
  | { kind: "range"; from: Ref; to: Ref; start: number; end: number }
  | { kind: "unary"; op: string; operand: Node }
  | { kind: "binary"; op: string; left: Node; right: Node }
  | { kind: "call"; name: string; args: Node[] };
type RangeValue = { kind: "range"; values: FormulaScalar[] };
type Value = FormulaScalar | RangeValue;
const ERROR_CODES: FormulaErrorCode[] = [
  "#ERROR!",
  "#REF!",
  "#NAME?",
  "#DIV/0!",
  "#VALUE!",
  "#NUM!",
  "#CYCLE!",
  "#LIMIT!",
];
const NUMBER_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const BINARY_PRECEDENCE: Readonly<Record<string, number>> = {
  "=": 1,
  "<>": 1,
  "<": 1,
  "<=": 1,
  ">": 1,
  ">=": 1,
  "+": 2,
  "-": 2,
  "*": 3,
  "/": 3,
  "^": 5,
};

class FormulaFault extends Error {
  constructor(readonly code: FormulaErrorCode) {
    super(code);
  }
}
function fail(code: FormulaErrorCode): never {
  throw new FormulaFault(code);
}
function limitsFor(options?: Partial<FormulaLimits>): FormulaLimits {
  const limits = { ...DEFAULT_FORMULA_LIMITS };
  for (const key of Object.keys(limits) as (keyof FormulaLimits)[]) {
    const requested = options?.[key];
    // Callers may lower limits for constrained devices/tests, never bypass hard ceilings.
    if (requested !== undefined && Number.isSafeInteger(requested) && requested > 0) {
      limits[key] = Math.min(requested, limits[key]);
    }
  }
  return limits;
}
export function isFormula(raw: string): boolean {
  return raw.startsWith("=");
}
function address(row: number, col: number): string {
  return `${columnName(col)}${row + 1}`;
}
function validCoordinate(row: number, col: number): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    col >= 0 &&
    row < MAX_GRID_ROWS &&
    col < MAX_GRID_COLS
  );
}
function parseRef(text: string): Ref {
  const match = /^(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(text);
  if (!match) return fail("#REF!");
  let col = 0;
  for (const letter of match[2].toUpperCase()) {
    col = col * 26 + letter.charCodeAt(0) - 64;
    if (col > MAX_GRID_COLS) return fail("#REF!");
  }
  const row = Number(match[4]) - 1;
  if (!validCoordinate(row, col - 1)) return fail("#REF!");
  return { row, col: col - 1, absoluteCol: match[1] === "$", absoluteRow: match[3] === "$" };
}
function printRef(ref: Ref): string {
  if (!validCoordinate(ref.row, ref.col)) return "#REF!";
  return `${ref.absoluteCol ? "$" : ""}${columnName(ref.col)}${ref.absoluteRow ? "$" : ""}${ref.row + 1}`;
}
function tokenize(raw: string, limits: FormulaLimits): Token[] {
  if (raw.length > limits.maxFormulaLength) return fail("#LIMIT!");
  const tokens: Token[] = [];
  let index = 1;
  while (index < raw.length) {
    if (/\s/.test(raw[index])) {
      index += 1;
      continue;
    }
    if (tokens.length >= limits.maxTokens) return fail("#LIMIT!");
    const start = index;
    const tail = raw.slice(index);
    if (raw[index] === '"') {
      index += 1;
      let text = "";
      let closed = false;
      while (index < raw.length) {
        if (raw[index] === '"') {
          if (raw[index + 1] === '"') {
            text += '"';
            index += 2;
            continue;
          }
          index += 1;
          closed = true;
          break;
        }
        text += raw[index++];
      }
      if (!closed) return fail("#ERROR!");
      tokens.push({ kind: "string", text, start, end: index });
      continue;
    }
    const error = ERROR_CODES.find((code) => tail.toUpperCase().startsWith(code));
    if (error) {
      index += error.length;
      tokens.push({ kind: "error", text: error, start, end: index });
      continue;
    }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(tail)?.[0];
    const referenceCandidate = /^\$?[A-Za-z]+\$?[0-9]+(?![A-Za-z0-9_.$])/.exec(tail)?.[0];
    const reference =
      referenceCandidate && !/^\s*\(/.test(tail.slice(referenceCandidate.length))
        ? referenceCandidate
        : undefined;
    const word = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(tail)?.[0];
    const symbol = /^(?:<=|>=|<>|[+\-*/^%=<>(),:])/.exec(tail)?.[0];
    const text = number ?? reference ?? word ?? symbol;
    if (!text) return fail("#ERROR!");
    index += text.length;
    tokens.push({
      kind: number ? "number" : reference ? "ref" : word ? "word" : "symbol",
      text,
      start,
      end: index,
    });
  }
  tokens.push({ kind: "end", text: "", start: raw.length, end: raw.length });
  return tokens;
}

function parse(raw: string, limits: FormulaLimits): Node {
  const tokens = tokenize(raw, limits);
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  const requireSymbol = (text: string) => {
    if (peek().text !== text) fail("#ERROR!");
    take();
  };
  function expression(minimum = 0, depth = 0): Node {
    if (depth >= limits.maxDepth) return fail("#LIMIT!");
    const token = take();
    let left: Node;
    if (token.kind === "number") {
      const value = Number(token.text);
      if (!Number.isFinite(value)) return fail("#NUM!");
      left = { kind: "literal", value };
    } else if (token.kind === "string") {
      left = { kind: "literal", value: token.text };
    } else if (token.kind === "error") {
      left = { kind: "error", error: token.text as FormulaErrorCode };
    } else if (token.kind === "ref") {
      const end = peek().text === ":" ? (take(), take()) : undefined;
      if (end && end.kind !== "ref") return fail("#REF!");
      try {
        const ref = parseRef(token.text);
        left = end
          ? { kind: "range", from: ref, to: parseRef(end.text), start: token.start, end: end.end }
          : { kind: "ref", ref, start: token.start, end: token.end };
      } catch (error) {
        if (!(error instanceof FormulaFault)) throw error;
        left = { kind: "error", error: error.code };
      }
    } else if (token.kind === "word") {
      const name = token.text.toUpperCase();
      if (peek().text === "(") {
        take();
        const args: Node[] = [];
        if (peek().text !== ")") {
          for (;;) {
            args.push(expression(0, depth + 1));
            if (peek().text !== ",") break;
            take();
          }
        }
        requireSymbol(")");
        left = { kind: "call", name, args };
      } else if (name === "TRUE" || name === "FALSE") {
        left = { kind: "literal", value: name === "TRUE" };
      } else left = { kind: "error", error: "#NAME?" };
    } else if (token.text === "(") {
      left = expression(0, depth + 1);
      requireSymbol(")");
    } else if (token.text === "+" || token.text === "-") {
      left = { kind: "unary", op: token.text, operand: expression(4, depth + 1) };
    } else return fail("#ERROR!");
    while (true) {
      if (peek().text === "%") {
        take();
        left = { kind: "unary", op: "%", operand: left };
        continue;
      }
      const op = peek().text;
      const precedence = peek().kind === "symbol" ? BINARY_PRECEDENCE[op] : undefined;
      if (precedence === undefined || precedence < minimum) break;
      take();
      const right = expression(op === "^" ? precedence : precedence + 1, depth + 1);
      left = { kind: "binary", op, left, right };
    }
    return left;
  }
  const result = expression();
  if (peek().kind !== "end") return fail("#ERROR!");
  return result;
}
function numberFromText(value: string): number | null {
  const trimmed = value.trim();
  const unsigned = trimmed.replace(/^[+-]/, "");
  if (!NUMBER_PATTERN.test(unsigned)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}
function scalar(value: Value): FormulaScalar {
  if (typeof value === "object") return fail("#VALUE!");
  return value;
}
function numeric(value: Value): number {
  const valueScalar = scalar(value);
  if (typeof valueScalar === "number") return valueScalar;
  if (typeof valueScalar === "boolean") return Number(valueScalar);
  if (valueScalar.trim() === "") return 0;
  return numberFromText(valueScalar) ?? fail("#VALUE!");
}
function finite(value: number): number {
  return Number.isFinite(value) ? value : fail("#NUM!");
}
function truthy(value: Value): boolean {
  const valueScalar = scalar(value);
  if (typeof valueScalar === "boolean") return valueScalar;
  if (typeof valueScalar === "string") {
    if (valueScalar.toUpperCase() === "TRUE") return true;
    if (valueScalar.toUpperCase() === "FALSE") return false;
  }
  return numeric(valueScalar) !== 0;
}
function compare(left: FormulaScalar, right: FormulaScalar): number {
  const comparable = (value: FormulaScalar): number | string => {
    if (typeof value === "boolean") return Number(value);
    if (typeof value === "number") return value;
    return value.trim() === "" ? 0 : (numberFromText(value) ?? value.toUpperCase());
  };
  const a = comparable(left);
  const b = comparable(right);
  if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
  const aText = String(a);
  const bText = String(b);
  return aText === bText ? 0 : aText < bText ? -1 : 1;
}
function formatValue(value: FormulaScalar): string {
  return typeof value === "boolean"
    ? value
      ? "TRUE"
      : "FALSE"
    : String(Object.is(value, -0) ? 0 : value);
}

/** Pure snapshot recalculation: all dependencies read the same raw source coordinates. */
export function evaluateFormulaSheet(
  rawRows: readonly (readonly string[])[],
  options: FormulaOptions = {},
): FormulaEvaluation {
  const enabled = options.enabled === true;
  const limits = limitsFor(options.limits);
  // Own the snapshot: an async save or later caller mutation cannot change this result.
  const rows = rawRows.map((row) => [...row]);
  const cache = new Map<string, FormulaCellResult>();
  const dependencies = new Map<string, string[]>();
  const active = new Set<string>();
  let operations = 0;
  let formulaCells = 0;
  let evaluationDepth = 0;
  const tick = () => {
    if (++operations > limits.maxOperations) fail("#LIMIT!");
  };

  function getCellResult(row: number, col: number): FormulaCellResult {
    if (!validCoordinate(row, col))
      return { kind: "error", raw: "", error: "#REF!", display: "#REF!", formula: true };
    const key = address(row, col);
    const cached = cache.get(key);
    if (cached) return cached;
    const raw = rows[row]?.[col] ?? "";
    if (!enabled || !isFormula(raw)) {
      const result: FormulaCellResult = {
        kind: "value",
        raw,
        value: enabled ? (numberFromText(raw) ?? raw) : raw,
        display: raw,
        formula: false,
      };
      // Missing cells are blank, but never allocate/cache a huge virtual grid.
      if (rows[row]?.[col] !== undefined) cache.set(key, result);
      return result;
    }
    if (active.has(key))
      return { kind: "error", raw, error: "#CYCLE!", display: "#CYCLE!", formula: true };
    if (active.size >= limits.maxDependencyDepth)
      return { kind: "error", raw, error: "#LIMIT!", display: "#LIMIT!", formula: true };
    active.add(key);
    const refs = new Set<string>();
    let result: FormulaCellResult;
    try {
      tick();
      if (++formulaCells > limits.maxFormulaCells) fail("#LIMIT!");
      const node = parse(raw, limits);
      const read = (ref: Ref): FormulaScalar => {
        tick();
        refs.add(address(ref.row, ref.col));
        const referenced = getCellResult(ref.row, ref.col);
        if (referenced.kind === "error") return fail(referenced.error);
        return referenced.value;
      };
      function evaluate(node: Node, depth = 0): Value {
        tick();
        if (depth >= limits.maxDepth) return fail("#LIMIT!");
        if (evaluationDepth >= limits.maxDepth + limits.maxDependencyDepth) return fail("#LIMIT!");
        evaluationDepth += 1;
        try {
          const next = (child: Node) => evaluate(child, depth + 1);
          switch (node.kind) {
            case "literal":
              return node.value;
            case "error":
              return fail(node.error);
            case "ref":
              return read(node.ref);
            case "range": {
              const top = Math.min(node.from.row, node.to.row);
              const bottom = Math.max(node.from.row, node.to.row);
              const left = Math.min(node.from.col, node.to.col);
              const right = Math.max(node.from.col, node.to.col);
              if ((bottom - top + 1) * (right - left + 1) > limits.maxRangeCells)
                return fail("#LIMIT!");
              const values: FormulaScalar[] = [];
              for (let r = top; r <= bottom; r += 1) {
                for (let c = left; c <= right; c += 1)
                  values.push(read({ row: r, col: c, absoluteCol: false, absoluteRow: false }));
              }
              return { kind: "range", values };
            }
            case "unary": {
              const value = numeric(next(node.operand));
              return finite(node.op === "-" ? -value : node.op === "%" ? value / 100 : value);
            }
            case "binary": {
              const left = next(node.left);
              const right = next(node.right);
              if (BINARY_PRECEDENCE[node.op] === 1) {
                const comparison = compare(scalar(left), scalar(right));
                switch (node.op) {
                  case "=":
                    return comparison === 0;
                  case "<>":
                    return comparison !== 0;
                  case "<":
                    return comparison < 0;
                  case "<=":
                    return comparison <= 0;
                  case ">":
                    return comparison > 0;
                  case ">=":
                    return comparison >= 0;
                }
              }
              const a = numeric(left);
              const b = numeric(right);
              switch (node.op) {
                case "+":
                  return finite(a + b);
                case "-":
                  return finite(a - b);
                case "*":
                  return finite(a * b);
                case "/":
                  return b === 0 ? fail("#DIV/0!") : finite(a / b);
                case "^":
                  return finite(a ** b);
                default:
                  return fail("#ERROR!");
              }
            }
            case "call": {
              if (node.name === "IF") {
                if (node.args.length !== 2 && node.args.length !== 3) return fail("#VALUE!");
                return truthy(next(node.args[0]))
                  ? next(node.args[1])
                  : node.args[2]
                    ? next(node.args[2])
                    : false;
              }
              if (!["SUM", "AVERAGE", "MIN", "MAX", "COUNT"].includes(node.name))
                return fail("#NAME?");
              const numbers: number[] = [];
              for (const arg of node.args) {
                const value = next(arg);
                for (const entry of typeof value === "object" ? value.values : [value]) {
                  tick();
                  const number =
                    typeof entry === "number"
                      ? entry
                      : typeof entry === "string"
                        ? numberFromText(entry)
                        : null;
                  if (number !== null) numbers.push(number);
                }
              }
              switch (node.name) {
                case "COUNT":
                  return numbers.length;
                case "SUM":
                  return finite(numbers.reduce((sum, value) => sum + value, 0));
                case "AVERAGE":
                  return numbers.length
                    ? finite(numbers.reduce((sum, value) => sum + value, 0) / numbers.length)
                    : fail("#DIV/0!");
                case "MIN":
                  return numbers.length ? numbers.reduce((min, value) => Math.min(min, value)) : 0;
                case "MAX":
                  return numbers.length ? numbers.reduce((max, value) => Math.max(max, value)) : 0;
                default:
                  return fail("#NAME?");
              }
            }
          }
        } finally {
          evaluationDepth -= 1;
        }
      }
      const value = scalar(evaluate(node));
      result = { kind: "value", raw, value, display: formatValue(value), formula: true };
    } catch (error) {
      if (!(error instanceof FormulaFault)) throw error;
      result = { kind: "error", raw, error: error.code, display: error.code, formula: true };
    } finally {
      active.delete(key);
    }
    dependencies.set(key, [...refs]);
    cache.set(key, result);
    return result;
  }
  const errors: FormulaDiagnostic[] = [];
  const displayRows = rows.map((row, r) =>
    row.map((_raw, c) => {
      const result = getCellResult(r, c);
      if (result.kind === "error") errors.push({ row: r, col: c, error: result.error });
      return result.display;
    }),
  );
  return { displayRows, errors, dependencies, getCellResult };
}

/** Mode is explicit; even 'values' exports stay literal while calculation is OFF. */
export function exportFormulaRows(
  rawRows: readonly (readonly string[])[],
  mode: "formulas" | "values",
  options: FormulaOptions = {},
): string[][] {
  return mode === "values" && options.enabled === true
    ? evaluateFormulaSheet(rawRows, options).displayRows
    : rawRows.map((row) => [...row]);
}

type ReferenceNode = Extract<Node, { kind: "ref" | "range" }>;
function rewrite(raw: string, transform: (node: ReferenceNode) => string): string {
  if (!isFormula(raw)) return raw;
  try {
    const node = parse(raw, { ...DEFAULT_FORMULA_LIMITS });
    const replacements: { start: number; end: number; value: string }[] = [];
    function visit(node: Node, depth = 0): void {
      if (depth >= DEFAULT_FORMULA_LIMITS.maxDepth) fail("#LIMIT!");
      if (node.kind === "ref" || node.kind === "range")
        replacements.push({ start: node.start, end: node.end, value: transform(node) });
      else if (node.kind === "unary") visit(node.operand, depth + 1);
      else if (node.kind === "binary") {
        visit(node.left, depth + 1);
        visit(node.right, depth + 1);
      } else if (node.kind === "call") for (const arg of node.args) visit(arg, depth + 1);
    }
    visit(node);
    let result = raw;
    for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
      result =
        result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end);
    }
    return result;
  } catch (error) {
    if (!(error instanceof FormulaFault)) throw error;
    // An unsupported/malformed input must never be silently destroyed by an edit.
    return raw;
  }
}

/** Relative references follow physical SOURCE-coordinate deltas; $ axes stay fixed. */
export function translateFormula(
  raw: string,
  delta: { rowDelta: number; colDelta: number },
): string {
  if (!Number.isSafeInteger(delta.rowDelta) || !Number.isSafeInteger(delta.colDelta))
    throw new RangeError("Formula deltas must be integers");
  const move = (ref: Ref) => ({
    ...ref,
    row: ref.row + (ref.absoluteRow ? 0 : delta.rowDelta),
    col: ref.col + (ref.absoluteCol ? 0 : delta.colDelta),
  });
  return rewrite(raw, (node) => {
    if (node.kind === "ref") {
      const moved = move(node.ref);
      return moved.row === node.ref.row && moved.col === node.ref.col
        ? raw.slice(node.start, node.end)
        : printRef(moved);
    }
    const from = move(node.from);
    const to = move(node.to);
    if (!validCoordinate(from.row, from.col) || !validCoordinate(to.row, to.col)) return "#REF!";
    return from.row === node.from.row &&
      from.col === node.from.col &&
      to.row === node.to.row &&
      to.col === node.to.col
      ? raw.slice(node.start, node.end)
      : `${printRef(from)}:${printRef(to)}`;
  });
}
export type FormulaStructuralChange = {
  type: "insert" | "delete";
  axis: "row" | "col";
  index: number;
  count: number;
};
function validateChange(change: FormulaStructuralChange): void {
  const maximum = change.axis === "row" ? MAX_GRID_ROWS : MAX_GRID_COLS;
  if (
    !Number.isSafeInteger(change.index) ||
    !Number.isSafeInteger(change.count) ||
    change.index < 0 ||
    change.count <= 0 ||
    change.index >= maximum ||
    change.count > maximum - change.index
  ) {
    throw new RangeError("Invalid formula structural edit");
  }
}
/** Insert/delete shifts absolute AND relative targets. Partial range deletion shrinks it. */
export function adjustFormulaReferences(raw: string, change: FormulaStructuralChange): string {
  validateChange(change);
  const moveIndex = (value: number): number | null => {
    if (value < change.index) return value;
    if (change.type === "insert") return value + change.count;
    return value < change.index + change.count ? null : value - change.count;
  };
  return rewrite(raw, (node) => {
    if (node.kind === "ref") {
      const index = moveIndex(node.ref[change.axis]);
      if (index === null) return "#REF!";
      return index === node.ref[change.axis]
        ? raw.slice(node.start, node.end)
        : printRef({ ...node.ref, [change.axis]: index });
    }
    const first = node.from[change.axis];
    const last = node.to[change.axis];
    let low = Math.min(first, last);
    let high = Math.max(first, last);
    if (change.type === "delete") {
      const end = change.index + change.count;
      if (low >= change.index && high < end) return "#REF!";
      if (low >= change.index && low < end) low = end;
      if (high >= change.index && high < end) high = change.index - 1;
    }
    const mappedLow = moveIndex(low);
    const mappedHigh = moveIndex(high);
    if (mappedLow === null || mappedHigh === null) return "#REF!";
    const from = { ...node.from, [change.axis]: first <= last ? mappedLow : mappedHigh };
    const to = { ...node.to, [change.axis]: first <= last ? mappedHigh : mappedLow };
    if (!validCoordinate(from.row, from.col) || !validCoordinate(to.row, to.col)) return "#REF!";
    return from[change.axis] === first && to[change.axis] === last
      ? raw.slice(node.start, node.end)
      : `${printRef(from)}:${printRef(to)}`;
  });
}
/** Call on the structurally edited raw grid, before committing the single Undo entry. */
export function rewriteFormulasForStructure(
  rows: readonly (readonly string[])[],
  change: FormulaStructuralChange,
): string[][] {
  validateChange(change);
  return rows.map((row) => row.map((raw) => adjustFormulaReferences(raw, change)));
}

/** Sorting moves whole raw rows; A1 remains a positional address, never a row identity. */
export const FORMULA_ROW_SORT_POLICY = "move-raw-rows-keep-positional-references" as const;
export function reorderFormulaRows(
  rows: readonly (readonly string[])[],
  sourceRowOrder: readonly number[],
): string[][] {
  if (
    sourceRowOrder.length !== rows.length ||
    new Set(sourceRowOrder).size !== rows.length ||
    sourceRowOrder.some((row) => !Number.isInteger(row) || row < 0 || row >= rows.length)
  ) {
    throw new RangeError("Row order must be a complete source-row permutation");
  }
  return sourceRowOrder.map((row) => [...rows[row]]);
}
