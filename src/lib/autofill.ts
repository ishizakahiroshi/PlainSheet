/**
 * Builds a fill series from source values for the given target length.
 * - Pure numbers → arithmetic sequence (step from last two values, or +1),
 *   keeping the decimals and the zero padding of the source ("001" → "002")
 * - Dates (2026-11-01, 2026/11/01) → next days (step from the last two)
 * - Trailing number ("item1", "item-1") → increments the trailing number
 * - Otherwise → cycle-copy the source values
 */
export function fillSeries(sourceValues: string[], targetCount: number): string[] {
  if (targetCount <= 0) {
    return [];
  }
  if (sourceValues.length === 0) {
    return Array.from({ length: targetCount }, () => "");
  }

  const numbers = sourceValues.map(parsePlainNumber);
  if (numbers.every((value) => value !== null)) {
    const numeric = numbers as PlainNumber[];
    const last = numeric[numeric.length - 1]!;
    const decimals = Math.max(...numeric.map((entry) => entry.decimals));
    const step = numeric.length >= 2 ? last.value - numeric[numeric.length - 2]!.value : 1;
    return Array.from({ length: targetCount }, (_, index) =>
      formatNumber(last.value + step * (index + 1), decimals, last.width),
    );
  }

  const dates = sourceValues.map(parseDate);
  if (dates.every((value) => value !== null)) {
    const entries = dates as ParsedDate[];
    const last = entries[entries.length - 1]!;
    const step = entries.length >= 2 ? last.day - entries[entries.length - 2]!.day : 1;
    return Array.from({ length: targetCount }, (_, index) =>
      formatDate(last.day + step * (index + 1), last),
    );
  }

  const trailing = sourceValues.map(parseTrailingNumber);
  if (trailing.every((value) => value !== null)) {
    const entries = trailing as { prefix: string; number: number; width: number }[];
    const last = entries[entries.length - 1]!;
    const prev = entries.length >= 2 ? entries[entries.length - 2]! : null;
    const step = prev ? last.number - prev.number : 1;
    return Array.from({ length: targetCount }, (_, index) => {
      const next = last.number + step * (index + 1);
      const body = String(Math.abs(next)).padStart(last.width, "0");
      return `${last.prefix}${next < 0 ? `-${body}` : body}`;
    });
  }

  return Array.from({ length: targetCount }, (_, index) => sourceValues[index % sourceValues.length]!);
}

/**
 * Fills one axis (rows or columns) of a fill-handle drag.
 *
 * glide-data-grid reports the destination as the source range plus the
 * dragged extension, so cells inside the source are skipped: they keep their
 * values instead of being overwritten by the continuation of the series.
 * Cells after the source continue the series; cells before it continue the
 * series backwards (the cell next to the source comes first).
 */
export function fillAlongAxis(
  sourceValues: string[],
  sourceStart: number,
  destStart: number,
  destLength: number,
): { index: number; value: string }[] {
  const sourceEnd = sourceStart + sourceValues.length;
  const destEnd = destStart + destLength;
  const after = fillSeries(sourceValues, Math.max(0, destEnd - sourceEnd));
  const before = fillSeries([...sourceValues].reverse(), Math.max(0, sourceStart - destStart));
  const cells: { index: number; value: string }[] = [];
  for (let index = destStart; index < destEnd; index += 1) {
    if (index >= sourceStart && index < sourceEnd) {
      continue;
    }
    const value =
      index >= sourceEnd ? after[index - sourceEnd] : before[sourceStart - 1 - index];
    cells.push({ index, value: value ?? "" });
  }
  return cells;
}

export function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

type PlainNumber = {
  value: number;
  // Digits after the decimal point.
  decimals: number;
  // Width to zero-pad the integer part to, or 0 when the source is not padded.
  width: number;
};

function parsePlainNumber(value: string): PlainNumber | null {
  const trimmed = value.trim().replace(/,/g, "");
  const match = /^-?(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const integer = match[1]!;
  return {
    value: parsed,
    decimals: match[2]?.length ?? 0,
    width: integer.length > 1 && integer.startsWith("0") ? integer.length : 0,
  };
}

function formatNumber(value: number, decimals: number, width: number): string {
  // toFixed rounds away float noise (0.1 + 0.2 → 0.3).
  const text = Math.abs(value).toFixed(decimals);
  const [integer, fraction] = text.split(".");
  const padded = integer!.padStart(width, "0");
  const body = fraction === undefined ? padded : `${padded}.${fraction}`;
  return value < 0 && Number(text) !== 0 ? `-${body}` : body;
}

type ParsedDate = {
  // Days since 1970-01-01.
  day: number;
  separator: string;
  padded: boolean;
};

const DAY_MS = 86_400_000;

function parseDate(value: string): ParsedDate | null {
  const match = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[3]);
  const date = Number(match[4]);
  const time = Date.UTC(year, month - 1, date);
  const check = new Date(time);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) {
    return null; // 2026-02-30 is not a date
  }
  return {
    day: time / DAY_MS,
    separator: match[2]!,
    padded: match[3]!.length === 2 && match[4]!.length === 2,
  };
}

function formatDate(day: number, style: ParsedDate): string {
  const date = new Date(day * DAY_MS);
  const pad = (part: number) => (style.padded ? String(part).padStart(2, "0") : String(part));
  return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join(
    style.separator,
  );
}

// A trailing run of digits. A "-" before it is part of the text ("item-1"),
// not a minus sign: values that are only a number are handled above.
function parseTrailingNumber(
  value: string,
): { prefix: string; number: number; width: number } | null {
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) {
    return null;
  }
  const number = Number(match[2]);
  if (!Number.isFinite(number)) {
    return null;
  }
  return { prefix: match[1]!, number, width: match[2]!.length };
}
