export interface WideDateParts {
  year: number;
  month: number;
  day: number;
}

export const MIN_WIDE_YEAR = -10000;
export const MAX_WIDE_YEAR = 10000;

export function daysInWideMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseWideDate(value: string): WideDateParts | null {
  const match = value.trim().match(/^(-?\d{1,5})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || year < MIN_WIDE_YEAR || year > MAX_WIDE_YEAR) return null;
  if (month < 1 || month > 12 || day < 1 || day > daysInWideMonth(year, month)) return null;
  return { year, month, day };
}

export function isWideDate(value: string): boolean {
  return parseWideDate(value) !== null;
}

export function compareWideDates(a: string, b: string): number {
  const left = parseWideDate(a);
  const right = parseWideDate(b);
  if (!left || !right) return Number.NaN;
  return left.year - right.year || left.month - right.month || left.day - right.day;
}

export function formatWideDate({ year, month, day }: WideDateParts): string {
  const yearText = String(year);
  return `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Convert a wide date to the signed ISO form understood by JavaScript Date. */
export function wideDateToUtcDate(value: string): Date | null {
  const parts = parseWideDate(value);
  if (!parts) return null;
  const year = `${parts.year < 0 ? "-" : "+"}${String(Math.abs(parts.year)).padStart(6, "0")}`;
  const iso = `${year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T12:00:00.000Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}
