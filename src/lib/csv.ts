import type { CellValue, Delimiter, Newline } from "../types/sheet";

export type CsvParseInfo = {
  // Set when a quoted field never closed. The quote was then read as an
  // ordinary character so the rest of the file keeps its rows and columns.
  unterminatedQuote?: boolean;
};

export function parseCsv(
  text: string,
  delimiter: Delimiter = ",",
  info?: CsvParseInfo,
): CellValue[][] {
  if (text.length === 0) {
    return [];
  }
  // Strip a leading UTF-8 BOM so browser File.text() loads match the Rust
  // decoder (which already drops EF BB BF before decoding).
  const state = createStreamState(delimiter);
  feedCsvChunk(state, text, delimiter, true);
  return finishCsvStream(state, info);
}

export function serializeCsv(
  rows: readonly (readonly CellValue[])[],
  delimiter: Delimiter = ",",
  newline: Newline = "LF",
  sanitizeFormulas = false,
  trailingNewline = false,
): string {
  const lineBreak = newline === "CRLF" ? "\r\n" : "\n";
  const body = rows
    .map((row, index) => {
      const line = row
        .map((cell) => serializeCell(cell, delimiter, sanitizeFormulas))
        .join(delimiter);
      // Without a final line break, an unquoted final blank record is
      // indistinguishable from a trailing line ending (or an empty file). Keep
      // its real row position explicit.
      return !trailingNewline && index === rows.length - 1 && line === "" ? '""' : line;
    })
    .join(lineBreak);
  return trailingNewline && rows.length > 0 ? body + lineBreak : body;
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

/** The line break most lines use, so one stray CRLF does not convert a whole LF file. */
export function detectNewline(text: string): Newline {
  let crlf = 0;
  let lf = 0;
  for (let index = text.indexOf("\n"); index !== -1; index = text.indexOf("\n", index + 1)) {
    if (index > 0 && text.charCodeAt(index - 1) === 0x0d) {
      crlf += 1;
    } else {
      lf += 1;
    }
  }
  return crlf > lf ? "CRLF" : "LF";
}

/** Whether the text ends with a line break, so a save can keep it. */
export function hasTrailingNewline(text: string): boolean {
  return text.endsWith("\n") || text.endsWith("\r");
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
  delimiter: Delimiter;
  rows: CellValue[][];
  row: CellValue[];
  cell: string;
  inQuotes: boolean;
  // The current cell opened with a quote. Once the quote closes, only a
  // delimiter or a line break may follow (spaces before them are dropped).
  quotedCell: boolean;
  // Source text of the current quoted cell from its opening quote. If text
  // follows the closing quote (`"Hello" she said`), or the quote never
  // closes, the cell falls back to this text instead of losing characters.
  raw: string;
  // Read the next opening quote as an ordinary character (replaying an
  // unterminated quoted field).
  literalQuote: boolean;
  endedWithRowBreak: boolean;
  // A "\r" that landed on the last character of a chunk: the matching "\n"
  // may arrive as the first character of the next chunk, so the row break is
  // already emitted and the "\n" must be swallowed then instead of producing
  // a phantom empty row.
  pendingCR: boolean;
  // A '"' inside a quoted cell that landed on the last character of a chunk:
  // the next chunk's first character decides whether it is an escaped '""' or
  // the closing quote of the cell.
  pendingQuote: boolean;
};

function createStreamState(delimiter: Delimiter = ","): StreamParseState {
  return {
    delimiter,
    rows: [],
    row: [],
    cell: "",
    inQuotes: false,
    quotedCell: false,
    raw: "",
    literalQuote: false,
    endedWithRowBreak: false,
    pendingCR: false,
    pendingQuote: false,
  };
}

function pushStreamCell(state: StreamParseState): void {
  state.row.push(state.cell);
  state.cell = "";
  state.quotedCell = false;
  state.raw = "";
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
  state.delimiter = delimiter;
  let source = chunk;
  if (isFirstChunk && source.length > 0 && source.charCodeAt(0) === 0xfeff) {
    source = source.slice(1);
  }

  let startIndex = 0;
  if (state.pendingCR && source.length > 0) {
    state.pendingCR = false;
    if (source.charCodeAt(0) === 0x0a) {
      startIndex = 1;
    }
  }

  if (state.pendingQuote && startIndex < source.length) {
    state.pendingQuote = false;
    if (source[startIndex] === "\"") {
      state.cell += "\"";
      state.raw += "\"";
      startIndex += 1;
    } else {
      state.inQuotes = false;
    }
  }

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]!;
    const next = source[index + 1];
    state.endedWithRowBreak = false;

    if (state.inQuotes) {
      if (char === "\"") {
        if (next === "\"") {
          state.cell += "\"";
          state.raw += "\"\"";
          index += 1;
        } else if (next === undefined) {
          state.raw += "\"";
          state.pendingQuote = true;
        } else {
          state.raw += "\"";
          state.inQuotes = false;
        }
      } else {
        state.cell += char;
        state.raw += char;
      }
      continue;
    }

    if (char === "\"" && state.cell.length === 0 && !state.quotedCell) {
      if (state.literalQuote) {
        state.literalQuote = false;
        state.cell += char;
        continue;
      }
      state.inQuotes = true;
      state.quotedCell = true;
      state.raw = char;
      continue;
    }

    if (char === delimiter) {
      pushStreamCell(state);
      continue;
    }

    if (char === "\r" || char === "\n") {
      if (char === "\r") {
        if (next === "\n") {
          index += 1;
        } else if (next === undefined) {
          // The "\n" (if any) arrives with the next chunk; swallow it there.
          state.pendingCR = true;
        }
      }
      pushStreamRow(state);
      continue;
    }

    if (state.quotedCell) {
      // After the closing quote. Spaces before a delimiter are dropped; any
      // other text means this was not a quoted field after all, so keep the
      // field exactly as written, quotes included.
      state.raw += char;
      if (char !== " " && char !== "\t") {
        state.cell = state.raw;
        state.quotedCell = false;
        state.raw = "";
      }
      continue;
    }

    state.cell += char;
  }
}

export function finishCsvStream(state: StreamParseState, info?: CsvParseInfo): CellValue[][] {
  for (;;) {
    if (state.pendingQuote) {
      state.pendingQuote = false;
      state.inQuotes = false;
    }
    if (!state.inQuotes) {
      break;
    }
    // The quote never closed. Reading everything after it as one cell would
    // swallow the rest of the file, so read the quote as a character instead.
    if (info) {
      info.unterminatedQuote = true;
    }
    const replay = state.raw;
    state.cell = "";
    state.quotedCell = false;
    state.inQuotes = false;
    state.raw = "";
    state.literalQuote = true;
    state.pendingCR = false;
    state.endedWithRowBreak = false;
    feedCsvChunk(state, replay, state.delimiter, false);
  }
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
  options?: {
    totalBytes?: number;
    onProgress?: (ratio: number) => void;
    info?: CsvParseInfo;
  },
): Promise<CellValue[][]> {
  const state = createStreamState(delimiter);
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
  return finishCsvStream(state, options?.info);
}

/** Thrown when a file that must be UTF-8 holds bytes that are not valid UTF-8. */
export class TextEncodingError extends Error {
  constructor() {
    super("file is not valid UTF-8");
    this.name = "TextEncodingError";
  }
}

/**
 * Yields decoded text chunks from a Blob/File stream. Decoding is strict: a
 * file in another encoding would otherwise be read as U+FFFD replacement
 * characters and, once saved, overwrite the original with them.
 */
export async function* streamFileText(file: Blob): AsyncGenerator<string> {
  if (typeof file.stream !== "function") {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
        await file.arrayBuffer(),
      );
    } catch {
      throw new TextEncodingError();
    }
    yield text;
    return;
  }
  const reader = file
    .stream()
    .pipeThrough(new TextDecoderStream("utf-8", { fatal: true, ignoreBOM: true }))
    .getReader();
  try {
    while (true) {
      let chunk: ReadableStreamReadResult<string>;
      try {
        chunk = await reader.read();
      } catch (error) {
        if (error instanceof TypeError) {
          throw new TextEncodingError();
        }
        throw error;
      }
      const { done, value } = chunk;
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
