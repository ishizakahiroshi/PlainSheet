/**
 * Builds a fill series from source values for the given target length.
 * - Pure numbers → arithmetic sequence (step from last two values, or +1)
 * - Trailing number ("item1") → increments the trailing number
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
    const numeric = numbers as number[];
    const step =
      numeric.length >= 2 ? numeric[numeric.length - 1]! - numeric[numeric.length - 2]! : 1;
    const start = numeric[numeric.length - 1]!;
    return Array.from({ length: targetCount }, (_, index) => String(start + step * (index + 1)));
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

function parsePlainNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (trimmed === "" || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTrailingNumber(
  value: string,
): { prefix: string; number: number; width: number } | null {
  const match = value.match(/^(.*?)(-?\d+)$/);
  if (!match) {
    return null;
  }
  const digits = match[2]!.replace("-", "");
  const number = Number(match[2]);
  if (!Number.isFinite(number)) {
    return null;
  }
  return { prefix: match[1]!, number, width: digits.length };
}
