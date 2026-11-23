// JSON and YAML files hold typed values (numbers, booleans, null, nested
// objects), but the sheet edits text. This module remembers what each cell was
// in the file, so a save writes cells the user did not touch exactly as they
// were, and writes an edited cell with the type its column used.
import {
  isMap,
  isScalar,
  isSeq,
  parseDocument,
  Scalar,
  type Document,
  type Node as YamlNode,
  type Pair,
  YAMLMap,
} from "yaml";
import type { CellValue, StructuredSource, StructuredValue, ValueKind } from "../types/sheet";

// --- JSON numbers ---------------------------------------------------------

// Number literals of a JSON text in document order, skipping strings.
function scanJsonNumbers(text: string): string[] {
  const numbers: string[] = [];
  const pattern = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match[0][0] !== '"') {
      numbers.push(match[0]);
    }
  }
  return numbers;
}

// Visits values in the order JSON.parse saw them. Object keys that look like
// array indexes are reordered by the engine; the caller checks every match.
function walkJson(value: unknown, visit: (value: number) => void): void {
  if (typeof value === "number") {
    visit(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      walkJson(item, visit);
    }
  } else if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) {
      walkJson(item, visit);
    }
  }
}

/** Parses JSON and returns the source text of each number, keyed by its parsed value's position. */
function parseJsonKeepingNumbers(text: string): { value: unknown; raw: Map<object, string[]> } {
  const value: unknown = JSON.parse(text);
  const raw = new Map<object, string[]>();
  const tokens = scanJsonNumbers(text);
  // Only needed when a number does not survive JSON.parse as written
  // (large integers, 1.50, 1e3, -0).
  if (!tokens.some((token) => String(Number(token)) !== token)) {
    return { value, raw };
  }
  const values: number[] = [];
  walkJson(value, (number) => values.push(number));
  if (
    values.length !== tokens.length ||
    values.some((number, index) => number !== Number(tokens[index]))
  ) {
    return { value, raw };
  }
  // Hand each record its numbers in key order.
  let cursor = 0;
  const assign = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(assign);
      return;
    }
    if (node !== null && typeof node === "object") {
      const own: string[] = [];
      for (const item of Object.values(node)) {
        if (typeof item === "number") {
          own.push(tokens[cursor]!);
          cursor += 1;
        } else {
          // Nested numbers keep their parsed value.
          walkJson(item, () => {
            cursor += 1;
          });
          own.push("");
        }
      }
      raw.set(node, own);
      return;
    }
    if (typeof node === "number") {
      cursor += 1;
    }
  };
  if (Array.isArray(value)) {
    value.forEach(assign);
  }
  return { value, raw };
}

// --- reading ----------------------------------------------------------------

function kindOf(value: unknown): ValueKind {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "bigint") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object") return "object";
  return "string";
}

function cellOf(value: unknown): CellValue {
  if (value == null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export type ParsedStructured = {
  rows: CellValue[][];
  source: StructuredSource | undefined;
};

function buildRows(
  records: Record<string, StructuredValue>[],
  format: StructuredSource["format"],
  text: string,
): ParsedStructured {
  const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  if (headers.length === 0) {
    return { rows: [], source: undefined };
  }
  // Keys come from the file: "toString" or "__proto__" must not reach Object.prototype.
  const kinds: Record<string, ValueKind[]> = Object.create(null) as Record<string, ValueKind[]>;
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      const list = (kinds[key] ??= []);
      if (!list.includes(value.kind)) {
        list.push(value.kind);
      }
    }
  }
  return {
    rows: [
      headers,
      ...records.map((record) =>
        headers.map((header) => (Object.hasOwn(record, header) ? record[header]!.cell : "")),
      ),
    ],
    source: { format, records, kinds, text: format === "yaml" ? text : undefined },
  };
}

function requireObjectList(value: unknown): Record<string, unknown>[] | null {
  // An empty YAML document (or comment-only file) parses to null: an empty sheet.
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new Error("Expected an array of objects");
  }
  // A list that holds anything but plain objects (arrays, scalars, a mix) is
  // not a table this importer understands; dropping those items would lose rows.
  if (!value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))) {
    throw new Error("Expected an array of objects");
  }
  return value as Record<string, unknown>[];
}

export function parseJsonTable(text: string): ParsedStructured {
  const { value, raw } = parseJsonKeepingNumbers(text);
  const list = requireObjectList(value);
  if (!list) {
    return { rows: [], source: undefined };
  }
  const records = list.map((record) => {
    const numbers = raw.get(record);
    const entries = Object.entries(record).map(([key, item], index): [string, StructuredValue] => {
      const kind = kindOf(item);
      const source = kind === "number" ? numbers?.[index] || String(item) : undefined;
      return [
        key,
        {
          kind,
          cell: source ?? cellOf(item),
          json: source ?? JSON.stringify(item),
        },
      ];
    });
    return Object.fromEntries(entries);
  });
  return buildRows(records, "json", text);
}

export function parseYamlTable(text: string): ParsedStructured {
  const doc = parseDocument(text, { intAsBigInt: true });
  if (doc.errors.length > 0) {
    throw doc.errors[0];
  }
  const list = requireObjectList(doc.toJS());
  if (!list) {
    return { rows: [], source: undefined };
  }
  const seq = doc.contents;
  const records = list.map((record, rowIndex) => {
    const node = isSeq(seq) ? seq.items[rowIndex] : undefined;
    const entries = Object.entries(record).map(([key, item]): [string, StructuredValue] => {
      const kind = kindOf(item);
      // Nested values may hold BigInt (intAsBigInt), which JSON.stringify rejects.
      let cell =
        kind === "object"
          ? JSON.stringify(item, (_key, inner: unknown) =>
              typeof inner === "bigint" ? Number(inner) : inner,
            )
          : cellOf(item);
      if ((kind === "number" || kind === "boolean") && isMap(node)) {
        // Keep the number as written (1.50 stays 1.50).
        const valueNode = node.get(key, true);
        if (isScalar(valueNode) && typeof valueNode.source === "string") {
          cell = valueNode.source;
        }
      }
      return [key, { kind, cell }];
    });
    return Object.fromEntries(entries);
  });
  return buildRows(records, "yaml", text);
}

// --- writing ----------------------------------------------------------------

function kindsOf(source: StructuredSource | undefined, key: string): ValueKind[] | undefined {
  return source && Object.hasOwn(source.kinds, key) ? source.kinds[key] : undefined;
}

const JSON_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;

type Typed =
  | { type: "string"; value: string }
  | { type: "number"; raw: string }
  | { type: "boolean"; value: boolean }
  | { type: "null" }
  | { type: "object"; value: unknown };

// The type to write an edited cell with: the column's type in the file when
// the text fits it, otherwise text.
function inferTyped(cell: CellValue, kinds: readonly ValueKind[] | undefined): Typed {
  if (!kinds) {
    return { type: "string", value: cell };
  }
  if (cell === "" && kinds.includes("null") && !kinds.includes("string")) {
    return { type: "null" };
  }
  if (kinds.includes("number") && JSON_NUMBER.test(cell)) {
    return { type: "number", raw: cell };
  }
  if (kinds.includes("boolean") && (cell === "true" || cell === "false")) {
    return { type: "boolean", value: cell === "true" };
  }
  if (kinds.includes("object") && /^[[{]/.test(cell)) {
    try {
      return { type: "object", value: JSON.parse(cell) };
    } catch {
      // Not JSON: keep it as text.
    }
  }
  return { type: "string", value: cell };
}

function typedJson(typed: Typed): string {
  switch (typed.type) {
    case "number":
      return typed.raw;
    case "boolean":
      return String(typed.value);
    case "null":
      return "null";
    case "object":
      return JSON.stringify(typed.value);
    default:
      return JSON.stringify(typed.value);
  }
}

/**
 * Writes rows as a JSON array of objects. Cells unchanged since the file was
 * read keep their original JSON text; keys the record did not have stay absent
 * while their cell is empty.
 */
export function serializeJsonTable(
  rows: readonly (readonly CellValue[])[],
  headers: readonly string[],
  source: StructuredSource | undefined,
  omitEmpty: boolean,
): string {
  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    // Header-only sheets keep their column names as one empty object.
    return JSON.stringify([Object.fromEntries(headers.map((header) => [header, ""]))], null, 2);
  }
  const indentNested = (json: string) => json.replace(/\n/g, "\n    ");
  const objects = dataRows.map((row, dataIndex) => {
    const original = source?.records[dataIndex];
    const lines: string[] = [];
    headers.forEach((header, index) => {
      const cell = row[index] ?? "";
      const before = original && Object.hasOwn(original, header) ? original[header] : undefined;
      if (original && !before && cell === "" && kindsOf(source, header)) {
        return; // the record never had this key
      }
      if (omitEmpty && cell === "" && dataIndex > 0) {
        return;
      }
      let json: string;
      if (before && before.cell === cell && before.json !== undefined) {
        json = before.json;
      } else {
        const typed = inferTyped(cell, kindsOf(source, header));
        json =
          typed.type === "object"
            ? indentNested(JSON.stringify(typed.value, null, 2))
            : typedJson(typed);
      }
      lines.push(`    ${JSON.stringify(header)}: ${json}`);
    });
    return lines.length === 0 ? "  {}" : `  {\n${lines.join(",\n")}\n  }`;
  });
  return `[\n${objects.join(",\n")}\n]`;
}

function yamlNode(doc: Document, typed: Typed): YamlNode {
  switch (typed.type) {
    case "number": {
      const number = Number(typed.raw);
      const integer = /^-?\d+$/.test(typed.raw);
      if (integer && !Number.isSafeInteger(number)) {
        return new Scalar(BigInt(typed.raw));
      }
      const scalar = new Scalar(number);
      const fraction = /\.(\d+)$/.exec(typed.raw);
      if (fraction) {
        scalar.minFractionDigits = fraction[1]!.length;
      }
      return scalar;
    }
    case "boolean":
      return new Scalar(typed.value);
    case "null":
      return new Scalar(null);
    case "object":
      return doc.createNode(typed.value) as YamlNode;
    default:
      return doc.createNode(typed.value) as YamlNode;
  }
}

/**
 * Writes rows as a YAML list of maps. When the file was YAML, the original
 * document is edited in place: comments, quoting and number formats of cells
 * the user did not touch are kept.
 */
export function serializeYamlTable(
  rows: readonly (readonly CellValue[])[],
  headers: readonly string[],
  source: StructuredSource | undefined,
  omitEmpty: boolean,
): string | null {
  if (!source?.text) {
    return null;
  }
  const doc = parseDocument(source.text, { intAsBigInt: true });
  const seq = doc.contents;
  if (doc.errors.length > 0 || !isSeq(seq)) {
    return null;
  }
  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    return null;
  }
  // Rows the sheet added are new maps, so the list holds parsed and new nodes.
  const items = seq.items as unknown[];
  dataRows.forEach((row, dataIndex) => {
    const original = source.records[dataIndex];
    const existing = items[dataIndex];
    const yamlMap: YAMLMap = isMap(existing) ? existing : new YAMLMap();
    items[dataIndex] = yamlMap;
    headers.forEach((header, index) => {
      const cell = row[index] ?? "";
      const before = original && Object.hasOwn(original, header) ? original[header] : undefined;
      const pairIndex = yamlMap.items.findIndex(
        (pair) => isScalar(pair.key) && String(pair.key.value) === header,
      );
      const pair =
        pairIndex === -1 ? undefined : (yamlMap.items[pairIndex] as Pair<unknown, unknown>);
      if (
        (!before && cell === "" && kindsOf(source, header)) ||
        (omitEmpty && cell === "" && dataIndex > 0)
      ) {
        if (pair) {
          yamlMap.items.splice(pairIndex, 1);
        }
        return;
      }
      if (before && pair && before.cell === cell) {
        return; // untouched: keep the node as written
      }
      const node = yamlNode(doc, inferTyped(cell, kindsOf(source, header)));
      if (pair) {
        const old = pair.value as YamlNode | null;
        if (old && "comment" in old && old.comment) {
          node.comment = old.comment;
        }
        pair.value = node;
      } else {
        yamlMap.items.push(doc.createPair(header, node) as Pair<unknown, unknown>);
      }
    });
    // Columns that were deleted or renamed.
    yamlMap.items = yamlMap.items.filter(
      (pair) => !isScalar(pair.key) || headers.includes(String(pair.key.value)),
    );
  });
  items.length = dataRows.length;
  return doc.toString();
}
