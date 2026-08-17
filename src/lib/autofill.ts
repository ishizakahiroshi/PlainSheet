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
