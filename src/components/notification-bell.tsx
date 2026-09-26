"use client";

/**
 * Header bell with an unread badge that opens the notification inbox: a popover on desktop and a
 * bottom sheet on mobile. Presentational: all state and callbacks come from the caller.
 */
import { useId, useState } from "react";
import { BellIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useIsHydrated } from "../hooks/use-is-hydrated.js";
import { useIsMobile } from "../hooks/use-mobile.js";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { MOTION_EASE, MOTION_TIMING, SPRING_POP } from "../motion/tokens.js";
import { AnimatedCount } from "./animated-count.js";
import { Button } from "./button.js";
import { NotificationPanel, type NotificationPanelProps } from "./notification-panel.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./sheet.js";

/**
 * Surfaces the bell can render. `responsive` ships both until hydration, so a media query (the
 * 768px breakpoint of `useIsMobile`) shows the right one without a layout shift; once hydrated it
 * keeps only the surface matching the viewport, since both share the open state.
 */
export const NOTIFICATION_BELL_SURFACE = {
  popover: "popover",
  responsive: "responsive",
  sheet: "sheet",
} as const;

export type NotificationBellSurface = (typeof NOTIFICATION_BELL_SURFACE)[keyof typeof NOTIFICATION_BELL_SURFACE];

/** The badge shows up to this number; above it, "9+". */
export const NOTIFICATION_BADGE_MAX = 9;

/**
 * Visible badge text.
 * @param unreadCount - Unread notifications.
 * @returns "3" or "9+".
 */
export function formatUnreadBadge(unreadCount: number): string {
  return unreadCount > NOTIFICATION_BADGE_MAX ? `${NOTIFICATION_BADGE_MAX}+` : String(unreadCount);
}

/**
 * Default accessible name of the bell, announcing the unread count.
 * @param unreadCount - Unread notifications.
 * @returns "Notificaciones" or "Notificaciones, 3 sin leer".
 */
export function describeUnreadNotifications(unreadCount: number): string {
  if (unreadCount === 0) return "Notificaciones";
  return `Notificaciones, ${formatUnreadBadge(unreadCount)} sin leer`;
}

export interface NotificationBellLabels {
  title: string;
  /** Visually hidden description of the mobile sheet. */
  sheetDescription: string;
  /** Accessible name of the bell for a given unread count. */
  describeUnread: (unreadCount: number) => string;
}

const NOTIFICATION_BELL_DEFAULT_LABELS: NotificationBellLabels = {
  title: "Notificaciones",
  sheetDescription: "Avisos recientes de tu cuenta.",
  describeUnread: describeUnreadNotifications,
};

/** Scale the unread badge grows from and shrinks to when it appears or clears. */
const BADGE_HIDDEN_SCALE = 0.4;

const BADGE_MOTION = {
  animate: { opacity: 1, scale: 1, transition: SPRING_POP },
  exit: { opacity: 0, scale: BADGE_HIDDEN_SCALE, transition: { duration: MOTION_TIMING.exit, ease: MOTION_EASE } },
  initial: { opacity: 0, scale: BADGE_HIDDEN_SCALE },
} as const;

/** One short swing of the bell (out, back past rest, settling), played when the count grows. */
const BELL_NUDGE_ROTATION_DEGREES = [0, -14, 10, -4, 0];
const BELL_NUDGE_TRANSITION = { duration: MOTION_TIMING.pop, ease: MOTION_EASE } as const;

/**
 * Highest value the rolling badge animates to. Every count above the visible maximum renders
 * "9+", so they share one value and never roll between identical labels.
 */
const BADGE_ROLL_CEILING = NOTIFICATION_BADGE_MAX + 1;

/**
 * Counts how many times the unread count grew while mounted, adjusting state during render so
 * the swing starts in the same commit that shows the new badge.
 * @param unreadCount - Current unread notifications.
 * @returns Zero until the count grows, then the number of increases seen.
 */
function useUnreadIncreaseCount(unreadCount: number): number {
  const [previousUnreadCount, setPreviousUnreadCount] = useState(unreadCount);
  const [increaseCount, setIncreaseCount] = useState(0);

  if (previousUnreadCount !== unreadCount) {
    if (unreadCount > previousUnreadCount) setIncreaseCount((currentIncreaseCount) => currentIncreaseCount + 1);
    setPreviousUnreadCount(unreadCount);
  }

  return increaseCount;
}

export type NotificationBellProps = Omit<NotificationPanelProps, "titleSlot" | "reservesCloseButtonSpace" | "labels"> & {
  /** Desktop popover, mobile bottom sheet, or both before hydration. */
  surface: NotificationBellSurface;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  labels?: Partial<NotificationBellLabels>;
  panelLabels?: NotificationPanelProps["labels"];
};

/**
 * Renders the bell. Its accessible name carries the count and a polite live region announces
 * changes. Both surfaces trap focus while open and return it to the bell on close. Each surface
 * keeps a fixed slot in the tree, so dropping the inactive one after hydration never remounts the
 * active one. The root uses `display: contents`, so the triggers stay direct header items.
 * @param props - Surface, open state, unread count, panel data and optional labels.
 * @returns The bell and its inbox surfaces.
 */
export function NotificationBell({
  isOpen,
  onOpenChange,
  surface,
  unreadCount,
  labels,
  panelLabels,
  className,
  ...panelProps
}: NotificationBellProps) {
  const resolvedLabels = { ...NOTIFICATION_BELL_DEFAULT_LABELS, ...labels };
  const shouldReduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const isHydrated = useIsHydrated();
  const isMobile = useIsMobile();
  const resolvedSurface =
    surface === NOTIFICATION_BELL_SURFACE.responsive && isHydrated
      ? isMobile
        ? NOTIFICATION_BELL_SURFACE.sheet
        : NOTIFICATION_BELL_SURFACE.popover
      : surface;
  const isResponsive = resolvedSurface === NOTIFICATION_BELL_SURFACE.responsive;
  const showsSheet = isResponsive || resolvedSurface === NOTIFICATION_BELL_SURFACE.sheet;
  const showsPopover = isResponsive || resolvedSurface === NOTIFICATION_BELL_SURFACE.popover;
  const accessibleLabel = resolvedLabels.describeUnread(unreadCount);
  const unreadIncreaseCount = useUnreadIncreaseCount(unreadCount);
  const titleClassName = "m-0 text-base font-semibold";

  const trigger = (
    <Button
      data-slot="notification-bell-trigger"
      aria-label={accessibleLabel}
      className="relative pointer-coarse:min-h-10 pointer-coarse:min-w-10"
      size="icon"
      type="button"
      variant="ghost"
    >
      {/* Remounting on each increase replays the swing exactly once; it hangs from its top edge. */}
      <motion.span
        animate={unreadIncreaseCount > 0 && !shouldReduceMotion ? { rotate: BELL_NUDGE_ROTATION_DEGREES } : undefined}
        aria-hidden="true"
        className="inline-flex origin-[50%_10%]"
        key={unreadIncreaseCount}
        transition={BELL_NUDGE_TRANSITION}
      >
        <BellIcon aria-hidden="true" />
      </motion.span>
      <AnimatePresence initial={false}>
        {unreadCount > 0 ? (
          <motion.span
            {...BADGE_MOTION}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 inline-flex h-5 min-w-5 translate-x-[35%] -translate-y-[30%] items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-xs leading-none font-semibold text-primary-foreground tabular-nums"
            key="unread-badge"
          >
            <AnimatedCount format={formatUnreadBadge} value={Math.min(unreadCount, BADGE_ROLL_CEILING)} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Button>
  );

  return (
    <span data-slot="notification-bell" className={cn("contents", className)}>
      <span aria-live="polite" className="sr-only" role="status">
        {unreadCount > 0 ? accessibleLabel : ""}
      </span>
      {showsPopover ? (
        <span className={cn("contents", isResponsive && "max-md:hidden")}>
          <Popover onOpenChange={onOpenChange} open={isOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent
              align="end"
              aria-labelledby={titleId}
              className="flex max-h-[min(32rem,calc(100svh-5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden p-0"
            >
              <NotificationPanel
                {...panelProps}
                labels={panelLabels}
                titleSlot={
                  <h2 className={titleClassName} id={titleId}>
                    {resolvedLabels.title}
                  </h2>
                }
                unreadCount={unreadCount}
              />
            </PopoverContent>
          </Popover>
        </span>
      ) : null}
      {showsSheet ? (
        <span className={cn("contents", isResponsive && "md:hidden")}>
          <Sheet onOpenChange={onOpenChange} open={isOpen}>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 pb-[env(safe-area-inset-bottom)]" side="bottom">
              <SheetDescription className="sr-only">{resolvedLabels.sheetDescription}</SheetDescription>
              <NotificationPanel
                {...panelProps}
                labels={panelLabels}
                reservesCloseButtonSpace
                titleSlot={<SheetTitle className={titleClassName}>{resolvedLabels.title}</SheetTitle>}
                unreadCount={unreadCount}
              />
            </SheetContent>
          </Sheet>
        </span>
      ) : null}
    </span>
  );
}
