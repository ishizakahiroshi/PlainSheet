/** A base-10 number. Cell contents never pass through IEEE-754 Number. */
export type ExactDecimal = { coefficient: bigint; scale: number };

const MAX_DECIMAL_DIGITS = 10000;

/**
 * Accept decimal notation and correctly grouped thousands, with an optional
 * bounded exponent. Dates, hexadecimal, Infinity and malformed grouping are text.
 */
export function parseExactDecimal(raw: string): ExactDecimal | null {
  const value = raw.trim();
  if (value.length === 0 || value.length > MAX_DECIMAL_DIGITS) return null;
  const match = value.match(/^([+-]?)(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) return null;
  const exponent = Number(match[4] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_DECIMAL_DIGITS) return null;
  const fraction = match[3] ?? "";
  const digits = match[2]!.replaceAll(",", "") + fraction;
  let coefficient = BigInt(`${match[1] === "-" ? "-" : ""}${digits}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return { coefficient, scale };
}

export function compareExactDecimals(a: ExactDecimal, b: ExactDecimal): number {
  const scale = Math.max(a.scale, b.scale);
  const left = a.coefficient * 10n ** BigInt(scale - a.scale);
  const right = b.coefficient * 10n ** BigInt(scale - b.scale);
  return left < right ? -1 : left > right ? 1 : 0;
}

export function subtractExactDecimals(a: ExactDecimal, b: ExactDecimal): ExactDecimal {
  const scale = Math.max(a.scale, b.scale);
  return {
    coefficient:
      a.coefficient * 10n ** BigInt(scale - a.scale) -
      b.coefficient * 10n ** BigInt(scale - b.scale),
    scale,
  };
}

export function offsetExactDecimal(
  start: ExactDecimal,
  step: ExactDecimal,
  offset: number,
): ExactDecimal {
  const scale = Math.max(start.scale, step.scale);
  return {
    coefficient:
      start.coefficient * 10n ** BigInt(scale - start.scale) +
      step.coefficient * BigInt(offset) * 10n ** BigInt(scale - step.scale),
    scale,
  };
}

/** Render an exact result, retaining meaningful zero-padding/grouping of its seed. */
export function formatExactDecimal(value: ExactDecimal, template = ""): string {
  const trimmed = template.trim();
  const templateMatch = trimmed.match(/^([+-]?)(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/);
  const templateInteger = templateMatch?.[2]?.replaceAll(",", "") ?? "";
  const minimumIntegerWidth = /^0\d/.test(templateInteger) ? templateInteger.length : 1;
  const minimumFractionWidth = templateMatch?.[3]?.length ?? 0;
  const negative = value.coefficient < 0n;
  const absolute = negative ? -value.coefficient : value.coefficient;
  const digits = absolute.toString().padStart(value.scale + 1, "0");
  let integer = (value.scale ? digits.slice(0, -value.scale) : digits).padStart(
    minimumIntegerWidth,
    "0",
  );
  let fraction = value.scale ? digits.slice(-value.scale) : "";
  while (fraction.length > minimumFractionWidth && fraction.endsWith("0"))
    fraction = fraction.slice(0, -1);
  fraction = fraction.padEnd(minimumFractionWidth, "0");
  if (templateMatch?.[2]?.includes(",")) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = negative ? "-" : templateMatch?.[1] === "+" ? "+" : "";
  const leading = template.match(/^\s*/)?.[0] ?? "";
  const trailing = template.match(/\s*$/)?.[0] ?? "";
  return `${leading}${sign}${integer}${fraction ? `.${fraction}` : ""}${trailing}`;
}
