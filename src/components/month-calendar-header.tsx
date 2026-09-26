"use client";

/**
 * Month calendar toolbar: previous/next month navigation with an animated title, a "today"
 * shortcut with an optional clock label, an optional view toggle and slots for actions and filters.
 */
import { useId, type ComponentType, type ReactNode, type SVGProps } from "react";
import { motion } from "motion/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import type { MonthTransitionDirection } from "../hooks/use-month-transition-direction.js";
import { cn } from "../lib/utils.js";
import { SPRING_LAYOUT } from "../motion/tokens.js";
import { Button } from "./button.js";
import { Link } from "./link.js";

const DEFAULT_LOCALE = "es-AR";
const MONTH_KEY_FIRST_DAY_SUFFIX = "-01T12:00:00Z";
/** Moves the view marker without animation (for example while the view follows the viewport). */
const INSTANT_TRANSITION = { duration: 0 } as const;

export interface MonthCalendarHeaderLabels {
  previousMonth: string;
  nextMonth: string;
  today: string;
  viewMode: string;
}

const MONTH_CALENDAR_HEADER_DEFAULT_LABELS: MonthCalendarHeaderLabels = {
  previousMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  today: "Hoy",
  viewMode: "Vista",
};

/** One option of the view toggle, such as list or calendar. */
export interface MonthCalendarViewOption<TView extends string> {
  value: TView;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Navigation target: a URL rendered as a link, or a callback rendered as a button. */
export type MonthCalendarNavigation = { href: string; onSelect?: never } | { href?: never; onSelect: () => void };

export interface MonthCalendarHeaderProps<TView extends string> {
  /** Visible `YYYY-MM` month. */
  month: string;
  previousMonth: MonthCalendarNavigation;
  nextMonth: MonthCalendarNavigation;
  today?: MonthCalendarNavigation;
  /** Title of the month. Defaults to the localized month and year, such as "Mayo de 2026". */
  title?: ReactNode;
  titleAs?: "h1" | "h2";
  /** Side the title slides in from after a month change (see `useMonthTransitionDirection`). */
  monthTransitionDirection?: MonthTransitionDirection;
  /** Clock label next to the "today" shortcut, or null before hydration. */
  timeLabel?: string | null;
  viewOptions?: readonly MonthCalendarViewOption<TView>[];
  view?: TView;
  onViewChange?: (view: TView) => void;
  /** Glide the active view marker; turn off while the view still follows the viewport. */
  shouldAnimateView?: boolean;
  actions?: ReactNode;
  /** Rendered as the last row, such as filter chips. */
  filters?: ReactNode;
  locale?: string;
  labels?: Partial<MonthCalendarHeaderLabels>;
  className?: string;
}

/**
 * Formats a month key as a capitalized month and year.
 * @param month - `YYYY-MM` month key.
 * @param locale - BCP 47 locale.
 * @returns For example "Mayo de 2026".
 */
export function formatMonthTitle(month: string, locale: string = DEFAULT_LOCALE): string {
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(month + MONTH_KEY_FIRST_DAY_SUFFIX),
  );
  return monthTitle.charAt(0).toLocaleUpperCase(locale) + monthTitle.slice(1);
}

const PILL_LINK_CLASS_NAME =
  "inline-flex items-center justify-center rounded-full border border-border bg-background font-semibold text-foreground no-underline [-webkit-tap-highlight-color:transparent] transition-[border-color,background-color,scale] hover:border-[color-mix(in_oklab,var(--foreground)_24%,var(--border))] hover:bg-accent active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface NavigationControlProps {
  navigation: MonthCalendarNavigation;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
}

/**
 * Renders a navigation target as a router link or a button.
 * @param props - Target, class name, accessible name and content.
 * @returns The control.
 */
function NavigationControl({ navigation, className, ariaLabel, children }: NavigationControlProps) {
  if (navigation.href !== undefined) {
    return (
      <Link aria-label={ariaLabel} className={className} href={navigation.href}>
        {children}
      </Link>
    );
  }
  return (
    <button aria-label={ariaLabel} className={cn("cursor-pointer", className)} type="button" onClick={navigation.onSelect}>
      {children}
    </button>
  );
}

/**
 * Renders the header of a month calendar. The title is keyed by month so it replays its entrance,
 * and the view marker glides between the toggle buttons.
 * @param props - Month, navigation targets, optional view toggle, actions and labels.
 * @returns The calendar header.
 */
export function MonthCalendarHeader<TView extends string>({
  month,
  previousMonth,
  nextMonth,
  today,
  title,
  titleAs: TitleElement = "h1",
  monthTransitionDirection,
  timeLabel,
  viewOptions,
  view,
  onViewChange,
  shouldAnimateView = true,
  actions,
  filters,
  locale = DEFAULT_LOCALE,
  labels,
  className,
}: MonthCalendarHeaderProps<TView>) {
  const resolvedLabels = { ...MONTH_CALENDAR_HEADER_DEFAULT_LABELS, ...labels };
  const shouldReduceMotion = usePrefersReducedMotion();
  /** Shared layout id scoped to this header, so two calendars never exchange their markers. */
  const viewIndicatorLayoutId = useId();
  const hasToolbar = Boolean(today || timeLabel || (viewOptions && viewOptions.length > 0) || actions);
  const viewIndicatorTransition = shouldAnimateView && !shouldReduceMotion ? SPRING_LAYOUT : INSTANT_TRANSITION;

  return (
    <header
      data-slot="month-calendar-header"
      className={cn(
        "grid grid-cols-[minmax(0,1fr)] items-center gap-x-6 gap-y-3 border-b border-border/75 pb-4 lg:grid-cols-[auto_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:grid-cols-[auto_auto_auto]">
        <NavigationControl
          ariaLabel={resolvedLabels.previousMonth}
          className={cn(PILL_LINK_CLASS_NAME, "group/previous size-9 flex-none")}
          navigation={previousMonth}
        >
          <ChevronLeftIcon aria-hidden className="size-[1.1rem] transition-transform [@media(hover:hover)_and_(pointer:fine)]:group-hover/previous:-translate-x-0.5" />
        </NavigationControl>
        <TitleElement
          className={cn(
            "m-0 min-w-0 text-center font-display text-[clamp(1.6rem,4vw,2.25rem)] leading-[1.1] font-semibold text-foreground [overflow-wrap:anywhere] lg:px-1 lg:text-left",
            "data-[month-transition=next]:[--beez-month-enter-offset:10px] data-[month-transition=previous]:[--beez-month-enter-offset:-10px]",
            "data-[month-transition=next]:animate-[beez-month-title-enter_280ms_cubic-bezier(0.16,1,0.3,1)_both] data-[month-transition=previous]:animate-[beez-month-title-enter_280ms_cubic-bezier(0.16,1,0.3,1)_both]",
          )}
          data-month-transition={monthTransitionDirection}
          key={month}
        >
          {title ?? formatMonthTitle(month, locale)}
        </TitleElement>
        <NavigationControl
          ariaLabel={resolvedLabels.nextMonth}
          className={cn(PILL_LINK_CLASS_NAME, "group/next size-9 flex-none")}
          navigation={nextMonth}
        >
          <ChevronRightIcon aria-hidden className="size-[1.1rem] transition-transform [@media(hover:hover)_and_(pointer:fine)]:group-hover/next:translate-x-0.5" />
        </NavigationControl>
      </div>
      {hasToolbar ? (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 lg:justify-end">
          {today || timeLabel ? (
            <div className="flex min-w-0 flex-wrap items-center gap-[0.6rem]">
              {today ? (
                <NavigationControl className={cn(PILL_LINK_CLASS_NAME, "min-h-9 px-[0.9rem] text-[0.9rem]")} navigation={today}>
                  {resolvedLabels.today}
                </NavigationControl>
              ) : null}
              {timeLabel ? <p className="m-0 text-[0.85rem] text-muted-foreground tabular-nums">{timeLabel}</p> : null}
            </div>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-[0.6rem]">
            {viewOptions && viewOptions.length > 0 ? (
              // Stacking root for the gliding marker: above the toggle background, below both buttons.
              <div aria-label={resolvedLabels.viewMode} className="isolate inline-flex gap-1 rounded-xl border border-border p-[0.2rem]" role="group">
                {viewOptions.map((option) => {
                  const isActive = view === option.value;
                  const ViewIcon = option.icon;

                  // The marker is the button's sibling: the press transform would otherwise lift it.
                  return (
                    <span className="relative inline-flex" key={option.value}>
                      {isActive ? (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 -z-10 rounded-(--radius) bg-secondary"
                          layoutId={viewIndicatorLayoutId}
                          transition={viewIndicatorTransition}
                        />
                      ) : null}
                      <Button
                        aria-pressed={isActive}
                        className={cn(isActive && "bg-transparent text-secondary-foreground hover:bg-transparent")}
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => onViewChange?.(option.value)}
                      >
                        <ViewIcon aria-hidden />
                        <span className="sr-only">{option.label}</span>
                      </Button>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {actions}
          </div>
        </div>
      ) : null}
      {filters ? <div className="col-span-full min-w-0">{filters}</div> : null}
    </header>
  );
}
