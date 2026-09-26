"use client";

/** Tracks which way the visible month moved, to orient month entrance animations. */
import { useEffect, useState } from "react";

export const MONTH_TRANSITION_DIRECTION = {
  next: "next",
  none: "none",
  previous: "previous",
} as const;

export type MonthTransitionDirection = (typeof MONTH_TRANSITION_DIRECTION)[keyof typeof MONTH_TRANSITION_DIRECTION];

/**
 * How long, in milliseconds, the last shown month still orients the next calendar mount. Month
 * links may remount the calendar behind a route loading state, so the memory must outlive that
 * gap but not a later, unrelated visit.
 */
const SHOWN_MONTH_MEMORY_MS = 5_000;

interface ShownMonthMemory {
  month: string;
  shownAt: number;
  scopeKey: string;
}

/**
 * Last month shown by a calendar in this tab. It is written only from effects, which never run on
 * the server, so server renders and the hydration render always read `null` and match.
 */
let lastShownMonth: ShownMonthMemory | null = null;

/**
 * Records the month a calendar is showing.
 * @param scopeKey - Calendar identity, such as a group or resource id.
 * @param month - Visible `YYYY-MM` month.
 */
function rememberShownMonth(scopeKey: string, month: string): void {
  lastShownMonth = { month, shownAt: Date.now(), scopeKey };
}

/**
 * Reads the month recently shown by the same calendar, if still within the memory window.
 * @param scopeKey - Calendar identity.
 * @returns The month, or null.
 */
function readRecentlyShownMonth(scopeKey: string): string | null {
  if (lastShownMonth === null || lastShownMonth.scopeKey !== scopeKey || Date.now() - lastShownMonth.shownAt > SHOWN_MONTH_MEMORY_MS) {
    return null;
  }
  return lastShownMonth.month;
}

/**
 * Compares two `YYYY-MM` keys, which sort chronologically as plain strings.
 * @param fromMonth - Month shown before, or null when there is none.
 * @param toMonth - Month shown now.
 * @returns `next` or `previous` when the month changed, `none` otherwise.
 */
export function resolveMonthTransitionDirection(fromMonth: string | null, toMonth: string): MonthTransitionDirection {
  if (fromMonth === null || fromMonth === toMonth) return MONTH_TRANSITION_DIRECTION.none;
  return toMonth > fromMonth ? MONTH_TRANSITION_DIRECTION.next : MONTH_TRANSITION_DIRECTION.previous;
}

interface MonthTransitionState {
  direction: MonthTransitionDirection;
  month: string;
}

/**
 * Direction of the latest month change of a calendar: a new `month` on the same instance, or a
 * fresh mount right after another month of the same calendar was on screen.
 * @param scopeKey - Calendar identity, so different calendars do not orient each other.
 * @param month - Visible `YYYY-MM` month.
 * @returns Direction to animate the month entrance with.
 */
export function useMonthTransitionDirection(scopeKey: string, month: string): MonthTransitionDirection {
  const [transition, setTransition] = useState<MonthTransitionState>(() => ({
    direction: resolveMonthTransitionDirection(readRecentlyShownMonth(scopeKey), month),
    month,
  }));

  if (transition.month !== month) {
    setTransition({ direction: resolveMonthTransitionDirection(transition.month, month), month });
  }

  // Refreshed on unmount too, so the memory window starts when the viewer leaves the month.
  useEffect(() => {
    rememberShownMonth(scopeKey, month);
    return () => rememberShownMonth(scopeKey, month);
  }, [month, scopeKey]);

  return transition.month === month ? transition.direction : resolveMonthTransitionDirection(transition.month, month);
}
