import type { CellValue, Delimiter, Newline } from "../types/sheet";

export function parseCsv(text: string, delimiter: Delimiter = ","): CellValue[][] {
  if (text.length === 0) {
    return [];
  }

  // Strip a leading UTF-8 BOM so browser File.text() loads match the Rust
  // decoder (which already drops EF BB BF before decoding).
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows: CellValue[][] = [];
  let row: CellValue[] = [];
  let cell = "";
  let inQuotes = false;
  let quotedCell = false;
  let justClosedQuote = false;
  let endedWithRowBreak = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
    quotedCell = false;
    justClosedQuote = false;
  };

  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
    endedWithRowBreak = true;
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    endedWithRowBreak = false;

    if (inQuotes) {
      if (char === "\"") {
        if (next === "\"") {
          cell += "\"";
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === "\"" && cell.length === 0 && !quotedCell) {
      inQuotes = true;
      quotedCell = true;
      continue;
    }

    if (char === delimiter) {
      pushCell();
      continue;
    }

    if (char === "\r" || char === "\n") {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      pushRow();
      continue;
    }

    if (justClosedQuote && (char === " " || char === "\t")) {
      continue;
    }

    cell += char;
    justClosedQuote = false;
  }

  if (!endedWithRowBreak || row.length > 0 || cell.length > 0 || quotedCell) {
    pushCell();
    rows.push(row);
  }

  return rows;
}

export function serializeCsv(
  rows: readonly (readonly CellValue[])[],
  delimiter: Delimiter = ",",
  newline: Newline = "LF",
  sanitizeFormulas = false,
): string {
  const lineBreak = newline === "CRLF" ? "\r\n" : "\n";
  return rows
    .map((row) => row.map((cell) => serializeCell(cell, delimiter, sanitizeFormulas)).join(delimiter))
    .join(lineBreak);
}

// Cells starting with these are treated as formulas by spreadsheet apps; the
// opt-in guard prefixes them with ' so an exported file cannot execute on open.
// Leading C0 controls or BOM are stripped by Excel/Sheets before parsing, so
// they would otherwise bypass the guard (e.g. a BOM followed by '=' or '\n='
// at cell start). The pattern is built from a string literal because writing
// the C0/BOM chars verbatim would trip no-irregular-whitespace.
// eslint-disable-next-line no-control-regex
const FORMULA_PREFIX = new RegExp("^[\\u0000-\\u001f\\uFEFF]*[=+\\-@\\t\\r\\n]");

function serializeCell(cell: CellValue, delimiter: Delimiter, sanitizeFormulas = false): string {
  const value = sanitizeFormulas && FORMULA_PREFIX.test(cell) ? `'${cell}` : cell;
  const mustQuote =
    value.includes(delimiter) ||
    value.includes("\"") ||
    value.includes("\r") ||
    value.includes("\n") ||
    value.startsWith(" ") ||
    value.endsWith(" ");

  if (!mustQuote) {
    return value;
  }

  return `"${value.replaceAll("\"", "\"\"")}"`;
}

export function detectNewline(text: string): Newline {
  return text.includes("\r\n") ? "CRLF" : "LF";
}

export function detectDelimiter(text: string): Delimiter {
  const sample = text.split(/\r\n|\n|\r/, 5).join("\n");
  const candidates: Delimiter[] = [",", "\t", ";", "|"];

  let best: Delimiter = ",";
  let bestScore = -1;
  for (const delimiter of candidates) {
    const rows = parseCsv(sample, delimiter);
    const counts = rows.map((row) => row.length);
    const max = Math.max(0, ...counts);
    const consistency = counts.filter((count) => count === max).length;
    // Weight by how many rows actually agree on the column count first, so a
    // single outlier row with many fields can't outrank the dominant
    // delimiter. (Previously `max * 10 + consistency` let `c|d|e` beat
    // a mostly-comma file.)
    const score = consistency * 10 + max;
    if (max > 1 && score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}

/** Threshold (bytes) above which browser open prefers streaming parse. */
export const STREAM_PARSE_THRESHOLD = 5 * 1024 * 1024;

type StreamParseState = {
  rows: CellValue[][];
  row: CellValue[];
  cell: string;
  inQuotes: boolean;
  quotedCell: boolean;
  justClosedQuote: boolean;
  endedWithRowBreak: boolean;
};

function createStreamState(): StreamParseState {
  return {
    rows: [],
    row: [],
    cell: "",
    inQuotes: false,
    quotedCell: false,
    justClosedQuote: false,
    endedWithRowBreak: false,
  };
}

function pushStreamCell(state: StreamParseState): void {
  state.row.push(state.cell);
  state.cell = "";
  state.quotedCell = false;
  state.justClosedQuote = false;
}

function pushStreamRow(state: StreamParseState): void {
  pushStreamCell(state);
  state.rows.push(state.row);
  state.row = [];
  state.endedWithRowBreak = true;
}

/** Feeds a text chunk into an incremental CSV parser (handles quotes across chunks). */
export function feedCsvChunk(
  state: StreamParseState,
  chunk: string,
  delimiter: Delimiter,
  isFirstChunk: boolean,
): void {
  let source = chunk;
  if (isFirstChunk && source.length > 0 && source.charCodeAt(0) === 0xfeff) {
    source = source.slice(1);
  }

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    const next = source[index + 1];
    state.endedWithRowBreak = false;

    if (state.inQuotes) {
      if (char === "\"") {
        if (next === "\"") {
          state.cell += "\"";
          index += 1;
        } else {
          state.inQuotes = false;
          state.justClosedQuote = true;
        }
      } else {
        state.cell += char;
      }
      continue;
    }

    if (char === "\"" && state.cell.length === 0 && !state.quotedCell) {
      state.inQuotes = true;
      state.quotedCell = true;
      continue;
    }

    if (char === delimiter) {
      pushStreamCell(state);
      continue;
    }

    if (char === "\r" || char === "\n") {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      pushStreamRow(state);
      continue;
    }

    if (state.justClosedQuote && (char === " " || char === "\t")) {
      continue;
    }

    state.cell += char;
    state.justClosedQuote = false;
  }
}

export function finishCsvStream(state: StreamParseState): CellValue[][] {
  if (!state.endedWithRowBreak || state.row.length > 0 || state.cell.length > 0 || state.quotedCell) {
    pushStreamCell(state);
    state.rows.push(state.row);
  }
  return state.rows;
}

/**
 * Parses CSV from an async iterable of text chunks (e.g. File stream).
 * Call onProgress with 0–1 as chunks arrive when totalBytes is known.
 */
export async function parseCsvStream(
  chunks: AsyncIterable<string>,
  delimiter: Delimiter = ",",
  options?: { totalBytes?: number; onProgress?: (ratio: number) => void },
): Promise<CellValue[][]> {
  const state = createStreamState();
  let first = true;
  let seen = 0;
  for await (const chunk of chunks) {
    feedCsvChunk(state, chunk, delimiter, first);
    first = false;
    seen += chunk.length;
    if (options?.totalBytes && options.onProgress) {
      options.onProgress(Math.min(1, seen / options.totalBytes));
    }
  }
  return finishCsvStream(state);
}

/** Yields decoded text chunks from a Blob/File stream. */
export async function* streamFileText(file: Blob): AsyncGenerator<string> {
  if (typeof file.stream !== "function") {
    yield await file.text();
    return;
  }
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        yield value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
