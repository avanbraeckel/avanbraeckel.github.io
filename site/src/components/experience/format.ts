const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Parses 'YYYY-MM'. Returns null for anything else (including null). */
export function parseMonth(
  value: string | null,
): { year: number; month: number } | null {
  if (value === null) return null;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** 'YYYY-MM' → 'May 2021'. */
export function formatMonth(value: string): string {
  const parsed = parseMonth(value);
  if (!parsed) return value;
  return `${MONTHS[parsed.month - 1]} ${parsed.year}`;
}

/**
 * 'May 2021 – Dec 2021', collapsing the year when both ends share it
 * ('May – Aug 2022'). Ongoing ranges read 'Jan 2024 – Present', and a current
 * role with no published start reads 'Now'. Returns null when the start date
 * is unknown otherwise.
 */
export function formatRange(
  start: string | null,
  end: string | null,
  current = false,
): string | null {
  const from = parseMonth(start);
  if (!from || start === null) return current ? "Now" : null;
  if (end === null) return `${formatMonth(start)} – Present`;
  const to = parseMonth(end);
  if (!to) return formatMonth(start);
  if (from.year === to.year) {
    if (from.month === to.month) return formatMonth(start);
    return `${MONTHS[from.month - 1]} – ${formatMonth(end)}`;
  }
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** Inclusive length in months: May–Aug is 4. Null if either end is unknown. */
export function monthSpan(
  start: string | null,
  end: string | null,
): number | null {
  const from = parseMonth(start);
  const to = end === null ? null : parseMonth(end);
  if (!from || !to) return null;
  return (to.year - from.year) * 12 + (to.month - from.month) + 1;
}

/** '8 months', '1 year 2 months'. Null if the span is unknown. */
export function formatSpan(
  start: string | null,
  end: string | null,
): string | null {
  const months = monthSpan(start, end);
  if (months === null || months <= 0) return null;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(" ");
}

/** Machine-readable value for <time dateTime>. */
export function isoMonth(value: string | null): string | undefined {
  return parseMonth(value) && value !== null ? value : undefined;
}
