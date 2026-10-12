import {
  formatExactDecimal,
  offsetExactDecimal,
  parseExactDecimal,
  subtractExactDecimals,
  type ExactDecimal,
} from "./decimal";

export type FillMode = "copy" | "series";
export type FillRectangle = { x: number; y: number; width: number; height: number };
export type FillUpdate = { row: number; col: number; value: string };

const modulo = (value: number, size: number) => ((value % size) + size) % size;

/**
 * Builds the continuation after the seeds (the historical helper contract).
 * Explicit copy repeats raw values. Series uses exact decimal arithmetic or a
 * same-prefix digit suffix; date-looking values and other text repeat verbatim.
 */
export function fillSeries(
  sourceValues: readonly string[],
  targetCount: number,
  mode: FillMode = "series",
): string[] {
  if (!Number.isSafeInteger(targetCount) || targetCount <= 0) return [];
  const at = seriesValueAt(sourceValues, mode);
  return Array.from({ length: targetCount }, (_, index) => at(sourceValues.length + index));
}

/**
 * Glide's destination includes the seed rectangle. Return only extension cells,
 * never writes to seeds. Coordinates stay in the caller's visible row space;
 * the caller must map each result to its source row exactly once before commit.
 * Both upward/leftward and downward/rightward fill follow the same axis. A
 * two-axis destination tiles raw values rather than inventing a 2-D series.
 */
export function buildFillUpdates(
  rows: readonly (readonly string[])[],
  source: FillRectangle,
  destination: FillRectangle,
  options: { mode?: FillMode } = {},
): FillUpdate[] {
  if (!validRectangle(source) || !validRectangle(destination)) return [];
  const mode = options.mode ?? "series";
  const vertical = destination.x === source.x && destination.width === source.width;
  const horizontal = destination.y === source.y && destination.height === source.height;
  const readers = new Map<number, (index: number) => string>();
  if (vertical) {
    for (let col = source.x; col < source.x + source.width; col += 1) {
      readers.set(
        col,
        seriesValueAt(
          Array.from(
            { length: source.height },
            (_, offset) => rows[source.y + offset]?.[col] ?? "",
          ),
          mode,
        ),
      );
    }
  } else if (horizontal) {
    for (let row = source.y; row < source.y + source.height; row += 1) {
      readers.set(
        row,
        seriesValueAt(
          Array.from({ length: source.width }, (_, offset) => rows[row]?.[source.x + offset] ?? ""),
          mode,
        ),
      );
    }
  }
  const updates: FillUpdate[] = [];
  for (let row = destination.y; row < destination.y + destination.height; row += 1) {
    for (let col = destination.x; col < destination.x + destination.width; col += 1) {
      if (
        row >= source.y &&
        row < source.y + source.height &&
        col >= source.x &&
        col < source.x + source.width
      )
        continue;
      const value = vertical
        ? readers.get(col)!(row - source.y)
        : horizontal
          ? readers.get(row)!(col - source.x)
          : (rows[source.y + modulo(row - source.y, source.height)]?.[
              source.x + modulo(col - source.x, source.width)
            ] ?? "");
      updates.push({ row, col, value });
    }
  }
  return updates;
}

function validRectangle(rectangle: FillRectangle): boolean {
  return (
    [rectangle.x, rectangle.y, rectangle.width, rectangle.height].every(Number.isSafeInteger) &&
    rectangle.x >= 0 &&
    rectangle.y >= 0 &&
    rectangle.width > 0 &&
    rectangle.height > 0
  );
}

function seriesValueAt(values: readonly string[], mode: FillMode): (index: number) => string {
  if (values.length === 0) return () => "";
  const cycle = (index: number) => values[modulo(index, values.length)]!;
  if (mode === "copy") return cycle;
  const numbers = values.map(parseExactDecimal);
  if (numbers.every((value): value is ExactDecimal => value !== null)) {
    return exactSequence(values, numbers);
  }
  // Dates are intentionally text: the user can copy them without a guessed
  // calendar or accidentally treating the date's '-' as a negative suffix.
  if (values.some((value) => /^\s*\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:\D|$)/.test(value))) return cycle;
  const suffixes = values.map((value) => value.match(/^(.*?\D)(\d+)$/));
  if (
    suffixes.every((value) => value !== null) &&
    suffixes.every((value) => value![1] === suffixes[0]![1]) &&
    /\p{L}/u.test(suffixes[0]![1]!)
  ) {
    const prefix = suffixes[0]![1]!;
    const digits = suffixes.map((value) => value![2]!);
    const suffixNumbers = digits.map(parseExactDecimal);
    if (!suffixNumbers.every((value): value is ExactDecimal => value !== null)) return cycle;
    const at = exactSequence(digits, suffixNumbers);
    return (index) =>
      index >= 0 && index < values.length ? values[index]! : `${prefix}${at(index)}`;
  }
  return cycle;
}

function exactSequence(
  values: readonly string[],
  numbers: ExactDecimal[],
): (index: number) => string {
  const lastIndex = numbers.length - 1;
  const unit = { coefficient: 1n, scale: 0 };
  const forwardStep =
    numbers.length > 1 ? subtractExactDecimals(numbers[lastIndex]!, numbers[lastIndex - 1]!) : unit;
  const backwardStep = numbers.length > 1 ? subtractExactDecimals(numbers[1]!, numbers[0]!) : unit;
  return (index) => {
    if (index >= 0 && index <= lastIndex) return values[index]!;
    const anchor = index < 0 ? 0 : lastIndex;
    const result = offsetExactDecimal(
      numbers[anchor]!,
      index < 0 ? backwardStep : forwardStep,
      index - anchor,
    );
    return formatExactDecimal(result, values[anchor]);
  };
}
