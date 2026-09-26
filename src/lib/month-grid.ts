/**
 * Pure, time-zone-free helpers for month calendars. Days are `YYYY-MM-DD` keys and months are
 * `YYYY-MM` keys; the application decides which zone turns an instant into a day key.
 */

export const CALENDAR_WEEK_LENGTH = 7;
const MILLISECONDS_PER_DAY = 86_400_000;
const DATE_KEY_LENGTH = 10;
const MONTH_KEY_LENGTH = 7;
const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** First day of the week: 0 is Sunday, 1 is Monday. */
export type CalendarWeekStart = 0 | 1;

/** One cell of the month grid. */
export interface MonthGridDay {
  /** `YYYY-MM-DD` key of the cell. */
  dateKey: string;
  dayNumber: number;
  /** False for padding days of the neighbour months. */
  isCurrentMonth: boolean;
}

/**
 * Parses a `YYYY-MM` key.
 * @param month - Month key.
 * @returns The year and zero-based month index.
 * @throws {RangeError} When the key is not a valid `YYYY-MM` month.
 */
function parseMonthKey(month: string): { year: number; monthIndex: number } {
  const match = MONTH_KEY_PATTERN.exec(month);
  if (!match) throw new RangeError(`month-grid:parseMonthKey expected a YYYY-MM month, received "${month.slice(0, 20)}"`);
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}

/**
 * Builds the cells of a month grid, padding the first and last week with neighbour-month days.
 * @param month - `YYYY-MM` month key.
 * @param weekStartsOn - First day of the week; Monday by default.
 * @returns Every cell of the grid, a multiple of seven.
 */
export function createMonthGridDays(month: string, weekStartsOn: CalendarWeekStart = 1): MonthGridDay[] {
  const { year, monthIndex } = parseMonthKey(month);
  const monthStartTime = Date.UTC(year, monthIndex, 1);
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingDays = (new Date(monthStartTime).getUTCDay() + CALENDAR_WEEK_LENGTH - weekStartsOn) % CALENDAR_WEEK_LENGTH;
  const totalCells = Math.ceil((leadingDays + daysInMonth) / CALENDAR_WEEK_LENGTH) * CALENDAR_WEEK_LENGTH;
  const firstCellTime = monthStartTime - leadingDays * MILLISECONDS_PER_DAY;

  return Array.from({ length: totalCells }, (_, dayIndex) => {
    const date = new Date(firstCellTime + dayIndex * MILLISECONDS_PER_DAY);
    return {
      dateKey: date.toISOString().slice(0, DATE_KEY_LENGTH),
      dayNumber: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === monthIndex,
    };
  });
}

/**
 * Splits grid cells into rows of seven days.
 * @param days - Cells returned by {@link createMonthGridDays}.
 * @returns One array per week.
 */
export function splitCalendarWeeks<TDay>(days: readonly TDay[]): TDay[][] {
  return Array.from({ length: Math.ceil(days.length / CALENDAR_WEEK_LENGTH) }, (_, weekIndex) =>
    days.slice(weekIndex * CALENDAR_WEEK_LENGTH, (weekIndex + 1) * CALENDAR_WEEK_LENGTH),
  );
}

/**
 * Indexes items by their day key, keeping input order within each day.
 * @param items - Items, usually sorted by start.
 * @param getDateKey - Reads the `YYYY-MM-DD` key of an item.
 * @returns Record from day key to the items of that day.
 */
export function groupItemsByDateKey<TItem>(items: readonly TItem[], getDateKey: (item: TItem) => string): Record<string, TItem[]> {
  const groupedItems: Record<string, TItem[]> = {};
  for (const item of items) (groupedItems[getDateKey(item)] ??= []).push(item);
  return groupedItems;
}

/**
 * Moves a month key by a number of months.
 * @param month - `YYYY-MM` month key.
 * @param monthOffset - Months to add; negative values go back.
 * @returns The resulting `YYYY-MM` key.
 */
export function shiftMonthKey(month: string, monthOffset: number): string {
  const { year, monthIndex } = parseMonthKey(month);
  return new Date(Date.UTC(year, monthIndex + monthOffset, 1)).toISOString().slice(0, MONTH_KEY_LENGTH);
}
