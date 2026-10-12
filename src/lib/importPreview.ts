import type { CellValue, Delimiter, Encoding, FileFormat, Newline } from "../types/sheet";
import { detectDelimiter, detectNewline } from "./csv";
import { parseTableText } from "./formats";
import { createConversionPreview, type ConversionPreview } from "./conversionPreview";

export type ImportPreviewRequest = {
  /** Original bytes: changing a selection must never decode previously decoded text. */
  bytes: Uint8Array;
  fileName: string;
  initialEncoding?: Encoding;
};

export type ImportPreviewOptions = {
  encoding: Encoding;
  format: FileFormat;
  delimiter: Delimiter;
  newline: Newline;
};

export type ImportPreviewResult = ImportPreviewOptions & {
  content: string;
  rows: CellValue[][];
  hadBom: boolean;
  conversion: ConversionPreview;
};

/** null cancels the whole import. The caller commits rows/meta only after this resolves. */
export type RequestImportPreview = (request: ImportPreviewRequest) => Promise<ImportPreviewResult | null>;

export type ImportPreviewError = { kind: "encoding" | "unsupported" | "parse"; message: string };
export type EncodingDetection = {
  encoding: Encoding;
  candidates: Encoding[];
  confidence: "bom" | "utf8-compatible" | "ambiguous";
};
export type ImportPreviewState = ImportPreviewOptions & {
  content: string;
  rows: CellValue[][];
  hadBom: boolean;
  detection: EncodingDetection;
  encodingWarning: string | null;
  error: ImportPreviewError | null;
  result: ImportPreviewResult | null;
};

const DECODER_LABELS: Record<Encoding, string> = {
  "utf-8": "utf-8", "utf-8-bom": "utf-8", cp932: "shift_jis", "euc-jp": "euc-jp",
  // Keep parity with the existing encoding_rs desktop read/write contract.
  "latin-1": "windows-1252",
};
export const IMPORT_ENCODINGS: readonly Encoding[] = ["utf-8", "utf-8-bom", "cp932", "euc-jp", "latin-1"];

export function hasUtf8Bom(bytes: Uint8Array): boolean {
  return bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

export function detectImportEncoding(bytes: Uint8Array): EncodingDetection {
  if (hasUtf8Bom(bytes)) return { encoding: "utf-8-bom", candidates: ["utf-8-bom"], confidence: "bom" };
  const candidates = IMPORT_ENCODINGS.filter((encoding) => encoding !== "utf-8-bom" && decodes(bytes, encoding));
  if (candidates.includes("utf-8")) {
    return { encoding: "utf-8", candidates, confidence: "utf8-compatible" };
  }
  return { encoding: candidates[0] ?? "utf-8", candidates, confidence: "ambiguous" };
}

export function importFormatFromName(fileName: string): FileFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".tsv")) return "tsv";
  if (/\.(md|markdown)$/.test(lower)) return "markdown";
  if (lower.endsWith(".json")) return "json";
  if (/\.ya?ml$/.test(lower)) return "yaml";
  return "csv";
}

/** Pure original-byte decoding and parsing; no document changes or file writes. */
export function previewImport(request: ImportPreviewRequest, options: Partial<ImportPreviewOptions> = {}): ImportPreviewState {
  const { bytes } = request;
  const hadBom = hasUtf8Bom(bytes);
  const detection = detectImportEncoding(bytes);
  const encoding = options.encoding ?? request.initialEncoding ?? detection.encoding;
  const format = options.format ?? importFormatFromName(request.fileName);
  let content = "";
  let encodingWarning: string | null = null;
  let error: ImportPreviewError | null = null;
  const source = hadBom && (encoding === "utf-8" || encoding === "utf-8-bom") ? bytes.subarray(3) : bytes;
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff) || bytes.includes(0)) {
    error = { kind: "unsupported", message: "UTF-16, UTF-32 or binary/NUL-containing files are not supported. Convert a copy to UTF-8 first." };
  } else {
    try {
      content = decode(source, encoding, true);
    } catch {
      try {
        content = decode(source, encoding, false);
        encodingWarning = "The selected encoding cannot decode every byte. Select another encoding or convert a copy to UTF-8.";
        error = { kind: "encoding", message: encodingWarning };
      } catch {
        error = { kind: "unsupported", message: "This runtime does not support the selected decoder. Convert a copy to UTF-8 or open it in the desktop app." };
      }
    }
  }
  if (!error && hadBom && encoding !== "utf-8" && encoding !== "utf-8-bom") {
    encodingWarning = "The source has a UTF-8 BOM, but another encoding is selected. Check the preview carefully.";
  }
  const delimiter = options.delimiter ?? (format === "tsv" ? "\t" : detectDelimiter(content));
  const newline = options.newline ?? detectNewline(content);
  let rows: CellValue[][] = [];
  let result: ImportPreviewResult | null = null;
  if (!error) {
    try {
      rows = parseTableText(content, format, delimiter);
      if (format === "markdown" && content.trim() !== "" && rows.length === 0) {
        throw new Error("No supported pipe-style Markdown table was found.");
      }
      const conversion = createConversionPreview({ content, format, rows, delimiter, newline });
      result = { content, rows, encoding, format, delimiter, newline, hadBom, conversion };
    } catch (cause) {
      error = { kind: "parse", message: cause instanceof Error ? cause.message : "The selected table format could not be parsed." };
    }
  }
  return { content, rows, encoding, format, delimiter, newline, hadBom, detection, encodingWarning, error, result };
}

function decodes(bytes: Uint8Array, encoding: Encoding): boolean {
  try { decode(bytes, encoding, true); return true; } catch { return false; }
}

function decode(bytes: Uint8Array, encoding: Encoding, fatal: boolean): string {
  return new TextDecoder(DECODER_LABELS[encoding], { fatal, ignoreBOM: true }).decode(bytes);
}
