/**
 * Turns the free-text `period` strings used across projects and experience into
 * positions on a single shared time axis.
 *
 * Periods are authored for humans ("Jul – Nov 2025", "Feb 2023 – Nov 2025",
 * "Aug 2020 – Mar 2022") because that is what reads well on a case study page.
 * Rather than duplicate them as machine dates in every content file and let the
 * two drift, this parses the strings that already exist. Anything unparseable is
 * dropped from the timeline rather than guessed at, so a malformed period costs a
 * bar rather than producing a wrong one.
 */
import type { World } from './categories';

export interface TimelineEntry {
  id: string;
  label: string;
  detail: string;
  period: string;
  world: World | 'study';
  /** Fractional years since the epoch of the chart. */
  start: number;
  end: number;
  href?: string;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Decimal year, e.g. Jul 2025 -> 2025.5. */
function toDecimalYear(month: number, year: number): number {
  return year + month / 12;
}

/**
 * Handles the two shapes actually present in the content: "Mon YYYY – Mon YYYY"
 * and the abbreviated "Mon – Mon YYYY" where the start year is implied by the end.
 * Both en dashes and hyphens appear in the source, so both are accepted.
 */
export function parsePeriod(period: string): { start: number; end: number } | null {
  const [rawStart, rawEnd] = period.split(/\s*[–—-]\s*/);
  if (!rawStart || !rawEnd) return null;

  const readPart = (part: string) => {
    const month = part.match(/[a-z]{3}/i)?.[0]?.toLowerCase();
    const year = part.match(/\d{4}/)?.[0];
    return { month: month ? MONTHS[month] : undefined, year: year ? Number(year) : undefined };
  };

  const start = readPart(rawStart);
  const end = readPart(rawEnd);

  if (end.year === undefined) return null;
  // "Jul – Nov 2025": the start borrows the end's year.
  const startYear = start.year ?? end.year;

  return {
    start: toDecimalYear(start.month ?? 0, startYear),
    end: toDecimalYear((end.month ?? 11) + 1, end.year),
  };
}

export interface TimelineBounds {
  min: number;
  max: number;
  /** Whole years spanning the data, for axis ticks. */
  ticks: number[];
}

export function boundsOf(entries: TimelineEntry[]): TimelineBounds {
  const min = Math.floor(Math.min(...entries.map((e) => e.start)));
  const max = Math.ceil(Math.max(...entries.map((e) => e.end)));
  const ticks: number[] = [];
  for (let year = min; year <= max; year += 1) ticks.push(year);
  return { min, max, ticks };
}

/** Left offset and width as percentages of the axis. */
export function placement(entry: TimelineEntry, bounds: TimelineBounds) {
  const span = bounds.max - bounds.min || 1;
  const left = ((entry.start - bounds.min) / span) * 100;
  const width = ((entry.end - entry.start) / span) * 100;
  return { left, width: Math.max(width, 1.5) };
}
