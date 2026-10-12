import { parse as parseYaml } from "yaml";
import type { CellValue, Delimiter, FileFormat, Newline } from "../types/sheet";
import { parseTableText, serializeTableText } from "./formats";

export type ConversionKind =
  | "number" | "boolean" | "null" | "array" | "object" | "missing"
  | "empty-string" | "empty-omitted" | "header"
  | "markdown-body" | "markdown-tables" | "markdown-alignment";

export type ConversionExample = {
  kind: ConversionKind;
  location: string;
  before: string;
  after: string;
};

export type ConversionIssue = {
  kind: ConversionKind;
  count: number;
  message: string;
  messageJa: string;
};

export type ConversionPreview = {
  hasLoss: boolean;
  issues: ConversionIssue[];
  /** At most two examples per kind; absence of examples never means no loss. */
  examples: ConversionExample[];
  outputContent: string;
};

export type ConversionPreviewOptions = {
  /** Original accepted decoded source, not a reconstruction from sheet cells. */
  content: string;
  format: FileFormat;
  rows?: readonly (readonly CellValue[])[];
  delimiter?: Delimiter;
  newline?: Newline;
  omitEmptyCells?: boolean;
  sanitizeFormulas?: boolean;
  outputFormat?: FileFormat;
};

const descriptions: Record<ConversionKind, [string, string]> = {
  number: ["Numbers are written as text.", "数値を文字列として書き出します。"],
  boolean: ["Booleans are written as text.", "真偽値を文字列として書き出します。"],
  null: ["Null values become empty text or omitted fields.", "nullを空文字列または省略した項目へ変換します。"],
  array: ["Arrays are written as JSON text inside a string cell.", "配列をJSON形式の文字列として書き出します。"],
  object: ["Nested objects are written as JSON text inside a string cell.", "入れ子のオブジェクトをJSON形式の文字列として書き出します。"],
  missing: ["Missing fields are added as text fields.", "存在しなかった項目を文字列の項目として追加します。"],
  "empty-string": ["Empty text remains empty text.", "空文字列は空文字列のままです。"],
  "empty-omitted": ["Empty text fields are omitted.", "空文字列の項目を省略します。"],
  header: ["Blank, padded or duplicate column names are normalized for object keys.", "空白・前後空白・重複のある列名をオブジェクトのキーへ正規化します。"],
  "markdown-body": ["Text outside the imported table is not included in the output.", "取り込んだ表の外にある本文は書き出しに含まれません。"],
  "markdown-tables": ["Additional Markdown tables are not preserved as separate tables.", "2つ目以降のMarkdown表は独立した表として保持されません。"],
  "markdown-alignment": ["Markdown column alignment markers are removed.", "Markdownの列の整列指定を削除します。"],
};

/** Uses the production serializer so examples describe actual output, including omit rules. */
export function createConversionPreview(options: ConversionPreviewOptions): ConversionPreview {
  const { content, format, delimiter = ",", newline = "LF", omitEmptyCells = false,
    sanitizeFormulas = false, outputFormat = format } = options;
  const rows = options.rows ?? parseTableText(content.replace(/^\uFEFF/, ""), format, delimiter);
  const outputContent = serializeTableText(rows, outputFormat, delimiter, newline, {
    omitEmptyCells, sanitizeFormulas,
  });
  const issues: ConversionIssue[] = [];
  const examples: ConversionExample[] = [];
  const add = (kind: ConversionKind, location: string, before: string, after: string, loss = true) => {
    if (loss) {
      const issue = issues.find((entry) => entry.kind === kind);
      if (issue) issue.count += 1;
      else issues.push({ kind, count: 1, message: descriptions[kind][0], messageJa: descriptions[kind][1] });
    }
    if (examples.filter((example) => example.kind === kind).length < 2) {
      examples.push({ kind, location, before, after });
    }
  };

  if (format === "json" || format === "yaml") {
    const source: unknown = format === "json" ? JSON.parse(content.replace(/^\uFEFF/, "")) : parseYaml(content);
    const records = Array.isArray(source) ? source as Record<string, unknown>[] : [];
    const headers = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
    const structuredOutput = outputFormat === "json" || outputFormat === "yaml";
    const output: Record<string, unknown>[] = structuredOutput
      ? (outputFormat === "json" ? JSON.parse(outputContent) : parseYaml(outputContent)) ?? []
      : [];
    const outputHeaders = structuredOutput ? outputKeysByColumn(rows, outputFormat) : [...(rows[0] ?? [])];
    for (let row = 0; row < records.length; row += 1) {
      const record = records[row];
      for (const header of headers) {
        const present = Object.hasOwn(record, header);
        const value = record[header];
        const column = (rows[0] ?? []).indexOf(header);
        const outputKey = outputHeaders[column];
        const outputPresent = column >= 0 && (structuredOutput
          ? output[row] != null && outputKey !== undefined && Object.hasOwn(output[row], outputKey)
          : rows[row + 1] != null && column < rows[row + 1].length);
        const afterValue = structuredOutput ? output[row]?.[outputKey] : rows[row + 1]?.[column];
        const after = outputPresent ? displayValue(afterValue) : "(missing)";
        const location = `[${row}].${header}`;
        if (!present) {
          if (outputPresent) add("missing", location, "(missing)", after);
        } else if (value === null || value === undefined) {
          add("null", location, "null", after);
        } else if (typeof value === "number") {
          add("number", location, displayValue(value), after);
        } else if (typeof value === "boolean") {
          add("boolean", location, displayValue(value), after);
        } else if (Array.isArray(value)) {
          add("array", location, displayValue(value), after);
        } else if (typeof value === "object") {
          add("object", location, displayValue(value), after);
        } else if (value === "") {
          add(outputPresent ? "empty-string" : "empty-omitted", location, '""', after, !outputPresent);
        }
      }
    }
    if (structuredOutput) {
      (rows[0] ?? []).forEach((header, column) => {
        if (outputHeaders[column] !== undefined && outputHeaders[column] !== header) {
          add("header", `column ${column + 1}`, displayValue(header), displayValue(outputHeaders[column]));
        }
      });
    }
  }

  if (format === "markdown") {
    const lines = content.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
    const starts: number[] = [];
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (isMarkdownRow(lines[index]) && isSeparator(lines[index + 1])) starts.push(index);
    }
    const ranges = starts.map((start) => {
      let end = start + 2;
      while (end < lines.length && isMarkdownRow(lines[end])) end += 1;
      return { start, end };
    });
    const first = ranges[0];
    lines.forEach((line, index) => {
      if (line.trim() && !ranges.some(({ start, end }) => index >= start && index < end)) {
        add("markdown-body", `line ${index + 1}`, line, "(not included)");
      }
    });
    ranges.slice(1).forEach(({ start, end }) => {
      add("markdown-tables", `line ${start + 1}`, lines.slice(start, end).join("\n"),
        first && start < first.end ? "(flattened into ordinary rows of the first table)" : "(not included)");
    });
    if (first && lines[first.start + 1].includes(":")) {
      add("markdown-alignment", `line ${first.start + 2}`, lines[first.start + 1],
        outputFormat === "markdown" ? outputContent.split(/\r\n|\n|\r/)[1] ?? "(not included)" : "(not included)");
    }
  }
  return { hasLoss: issues.length > 0, issues, examples, outputContent };
}

function displayValue(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

function isMarkdownRow(line: string): boolean {
  return line.trim().startsWith("|") && line.includes("|");
}

function isSeparator(line: string): boolean {
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

/** Integer-like object keys enumerate in numeric order. Probe the real serializer
 * to map columns to their keys without guessing from Object.keys output order. */
function outputKeysByColumn(rows: readonly (readonly CellValue[])[], format: "json" | "yaml"): string[] {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (width === 0) return [];
  const markers = Array.from({ length: width }, (_, column) => `column-marker:${column}`);
  const serialized = serializeTableText([rows[0] ?? [], markers], format, ",", "LF");
  const parsed: Record<string, string>[] = format === "json" ? JSON.parse(serialized) : parseYaml(serialized);
  const keyForMarker = new Map(Object.entries(parsed[0]).map(([key, marker]) => [marker, key]));
  return markers.map((marker) => keyForMarker.get(marker)!);
}
