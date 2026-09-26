"use client";

/**
 * Month grid of dated items, such as events or deadlines. Wide screens show one pill per item;
 * phones show one dot per item and list the selected day under the grid.
 */
import { useMemo, type CSSProperties, type ReactNode } from "react";

import { cn } from "../lib/utils.js";
import {
  createMonthGridDays,
  groupItemsByDateKey,
  splitCalendarWeeks,
  type CalendarWeekStart,
} from "../lib/month-grid.js";
import { PresenceSwap } from "./presence-swap.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";

/** Presentation of one dated item, already resolved by the application. */
export interface MonthGridItem {
  id: string;
  /** `YYYY-MM-DD` day the item belongs to, in the zone the application displays. */
  dateKey: string;
  title: string;
  /** Short start time, such as "18:00". */
  timeLabel?: string;
  /** Past items are muted. */
  isPast?: boolean;
  /** Cancelled items are struck through, muted and labelled. */
  isCancelled?: boolean;
  /** CSS color of the dot and the pill accent. Defaults to the primary color. */
  accentColor?: string;
  /** CSS color of the pill surface. Defaults to the background. */
  surfaceColor?: string;
  /** Leading content of the pill, such as a type badge or icon. */
  leading?: ReactNode;
}

export interface MonthGridLabels {
  table: string;
  today: string;
  cancelled: string;
  /** Accessible name of the phone summary of the selected day. */
  dayItems: string;
  /** Accessible name of a phone day button. */
  dayButton: (dayLabel: string, itemCount: number) => string;
  /** Seven weekday headers, Monday first; rotated when the week starts on Sunday. */
  weekDays: readonly string[];
}

const MONTH_GRID_DEFAULT_LABELS: MonthGridLabels = {
  table: "Calendario mensual",
  today: "Hoy",
  cancelled: "Cancelado",
  dayItems: "Eventos del día",
  dayButton: (dayLabel, itemCount) => `${dayLabel}: ${itemCount} ${itemCount === 1 ? "evento" : "eventos"}`,
  weekDays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

/** Dots shown per day on phones before the "+N" overflow indicator. */
const DAY_DOTS_MAX = 3;
const DEFAULT_LOCALE = "es-AR";
const NO_ITEMS: readonly MonthGridItem[] = [];
/** Day keys are formatted at noon UTC so no time zone shifts them to a neighbour day. */
const DAY_KEY_NOON_SUFFIX = "T12:00:00Z";

/** Exposes the item colors to the utility classes of its dot and pill. */
type ItemColorStyle = CSSProperties & { "--beez-item-accent"?: string; "--beez-item-surface"?: string };

/**
 * Builds the CSS variables carrying an item's colors.
 * @param item - Item with optional colors.
 * @returns Inline style with the defined variables.
 */
function buildItemColorStyle(item: MonthGridItem): ItemColorStyle {
  return {
    ...(item.accentColor ? { "--beez-item-accent": item.accentColor } : {}),
    ...(item.surfaceColor ? { "--beez-item-surface": item.surfaceColor } : {}),
  };
}

/**
 * Formats a day key as a long, readable date.
 * @param dateKey - `YYYY-MM-DD` key.
 * @param locale - BCP 47 locale.
 * @returns For example "miércoles, 6 de mayo".
 */
function formatLongDayLabel(dateKey: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(dateKey + DAY_KEY_NOON_SUFFIX),
  );
}

export interface MonthGridProps<TItem extends MonthGridItem> {
  /** Visible `YYYY-MM` month. */
  month: string;
  items: readonly TItem[];
  onSelectItem: (item: TItem) => void;
  /** `YYYY-MM-DD` key of today, or null before hydration. */
  todayKey?: string | null;
  weekStartsOn?: CalendarWeekStart;
  /** Day whose items are listed under the grid on phones. */
  activeDayKey?: string | null;
  onSelectDay?: (dayKey: string) => void;
  /** Renders the phone summary of the selected day. Defaults to a list of item buttons. */
  renderDaySummary?: (dayKey: string, dayItems: readonly TItem[]) => ReactNode;
  locale?: string;
  labels?: Partial<MonthGridLabels>;
  className?: string;
}

/**
 * Renders the month as an accessible table with today marked (`aria-current="date"`).
 * @param props - Month, items, selection callbacks and optional labels.
 * @returns The month grid and its phone day summary.
 */
export function MonthGrid<TItem extends MonthGridItem>({
  month,
  items,
  onSelectItem,
  todayKey = null,
  weekStartsOn = 1,
  activeDayKey = null,
  onSelectDay,
  renderDaySummary,
  locale = DEFAULT_LOCALE,
  labels,
  className,
}: MonthGridProps<TItem>) {
  const resolvedLabels = { ...MONTH_GRID_DEFAULT_LABELS, ...labels };
  const weekDayLabels =
    weekStartsOn === 0 ? [...resolvedLabels.weekDays.slice(-1), ...resolvedLabels.weekDays.slice(0, -1)] : resolvedLabels.weekDays;
  const weeks = useMemo(() => splitCalendarWeeks(createMonthGridDays(month, weekStartsOn)), [month, weekStartsOn]);
  const itemsByDay = useMemo(() => groupItemsByDateKey(items, (item) => item.dateKey), [items]);
  const activeDayItems = activeDayKey ? (itemsByDay[activeDayKey] ?? []) : [];

  const renderItemButton = (item: TItem, className: string) => (
    <button
      data-slot="month-grid-item"
      data-past={item.isPast || undefined}
      data-cancelled={item.isCancelled || undefined}
      className={cn(
        "w-full cursor-pointer rounded-[0.45rem] border border-[color-mix(in_oklab,var(--beez-item-accent,var(--primary))_35%,var(--border))] border-l-[3px] border-l-[var(--beez-item-accent,var(--primary))] bg-[var(--beez-item-surface,var(--background))] p-[0.35rem] text-left text-[0.8rem] font-bold text-foreground [overflow-wrap:anywhere] [-webkit-tap-highlight-color:transparent] transition-[border-color,background-color,scale] hover:border-[color-mix(in_oklab,var(--beez-item-accent,var(--primary))_60%,var(--border))] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        "data-cancelled:border-border data-cancelled:bg-muted/60 data-cancelled:font-semibold data-cancelled:text-muted-foreground data-past:border-border data-past:bg-muted/60 data-past:font-semibold data-past:text-muted-foreground",
        className,
      )}
      key={item.id}
      style={buildItemColorStyle(item)}
      type="button"
      onClick={() => onSelectItem(item)}
    >
      {item.leading}
      {item.timeLabel ? <span className="font-semibold text-muted-foreground tabular-nums"> {item.timeLabel}</span> : null}
      <span className={cn(item.isCancelled && "line-through")}> {item.title}</span>
      {item.isCancelled ? <span className="block text-[0.72rem] font-bold">{resolvedLabels.cancelled}</span> : null}
    </button>
  );

  return (
    <div data-slot="month-grid" className={cn("grid min-w-0 gap-5", className)}>
      <Table aria-label={resolvedLabels.table} className="w-full table-fixed border border-border md:min-w-[42rem]">
        <TableHeader>
          <TableRow>
            {weekDayLabels.map((dayLabel) => (
              <TableHead
                className="border-l border-border text-center text-[0.8rem] font-semibold text-muted-foreground max-md:px-[0.15rem] max-md:text-[0.7rem]"
                key={dayLabel}
              >
                {dayLabel}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeks.map((week) => (
            <TableRow key={week[0].dateKey}>
              {week.map((day) => {
                const isToday = day.dateKey === todayKey;
                const dayItems = itemsByDay[day.dateKey] ?? NO_ITEMS;

                return (
                  <TableCell
                    aria-current={isToday ? "date" : undefined}
                    className={cn(
                      "h-32 w-[calc(100%/7)] border-l border-border align-top whitespace-normal max-md:h-auto max-md:min-h-14 max-md:p-[0.2rem]",
                      isToday && "bg-[color-mix(in_oklab,var(--primary)_6%,var(--background))]",
                    )}
                    key={day.dateKey}
                  >
                    <span
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full font-bold tabular-nums max-md:size-6 max-md:text-[0.8rem]",
                        !day.isCurrentMonth && "font-medium text-muted-foreground",
                        isToday && "bg-primary text-primary-foreground",
                      )}
                    >
                      {day.dayNumber}
                      {isToday ? <span className="sr-only"> {resolvedLabels.today}</span> : null}
                    </span>
                    {dayItems.length > 0 && onSelectDay ? (
                      <button
                        aria-label={resolvedLabels.dayButton(formatLongDayLabel(day.dateKey, locale), dayItems.length)}
                        aria-pressed={activeDayKey === day.dateKey}
                        className="mt-[0.2rem] hidden min-h-6 w-full cursor-pointer flex-wrap items-center justify-center gap-[0.2rem] rounded-[0.4rem] border-0 bg-transparent py-[0.2rem] text-muted-foreground [-webkit-tap-highlight-color:transparent] transition-[background-color,scale] active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-pressed:bg-[color-mix(in_oklab,var(--primary)_14%,var(--background))] max-md:flex"
                        type="button"
                        onClick={() => onSelectDay(day.dateKey)}
                      >
                        {dayItems.slice(0, DAY_DOTS_MAX).map((item) => (
                          <span
                            aria-hidden
                            className={cn(
                              "size-[0.4rem] rounded-full bg-[var(--beez-item-accent,var(--primary))]",
                              item.isPast && "bg-muted-foreground",
                              item.isCancelled && "border border-muted-foreground bg-transparent",
                            )}
                            key={item.id}
                            style={buildItemColorStyle(item)}
                          />
                        ))}
                        {dayItems.length > DAY_DOTS_MAX ? (
                          <span aria-hidden className="text-[0.65rem] leading-none font-semibold tabular-nums">
                            +{dayItems.length - DAY_DOTS_MAX}
                          </span>
                        ) : null}
                      </button>
                    ) : null}
                    <div className={cn("mt-[0.35rem] grid gap-[0.35rem]", onSelectDay && "max-md:hidden")}>
                      {dayItems.map((item) => renderItemButton(item as TItem, ""))}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Phones only: tapping another day cross-fades the summary instead of swapping it in one frame. */}
      {onSelectDay ? (
        <div className="hidden min-w-0 empty:hidden max-md:grid">
          {activeDayKey && activeDayItems.length > 0 ? (
            <PresenceSwap presenceKey={activeDayKey}>
              {renderDaySummary ? (
                renderDaySummary(activeDayKey, activeDayItems)
              ) : (
                <section aria-label={resolvedLabels.dayItems} className="grid gap-2">
                  <h3 className="m-0 text-sm font-semibold first-letter:uppercase">{formatLongDayLabel(activeDayKey, locale)}</h3>
                  {activeDayItems.map((item) => renderItemButton(item, "text-sm"))}
                </section>
              )}
            </PresenceSwap>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
