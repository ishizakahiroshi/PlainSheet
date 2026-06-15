import type { CellValue, Delimiter, Newline } from "../types/sheet";

export function parseCsv(text: string, delimiter: Delimiter = ","): CellValue[][] {
  if (text.length === 0) {
    return [];
  }

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

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
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
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

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
    const score = max * 10 + consistency;
    if (max > 1 && score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}
