"use client";

/**
 * Content of a notification inbox: header with "mark all as read", the list, and the loading,
 * error and empty states. Presentational: items, statuses and callbacks come from the caller.
 */
import type { ReactNode } from "react";
import { BellOffIcon, CheckCheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../lib/utils.js";
import { MOTION_EASE, MOTION_TIMING } from "../motion/tokens.js";
import { AnimatedListItem } from "./animated-list-item.js";
import { Button } from "./button.js";
import { Link } from "./link.js";

export const NOTIFICATION_PANEL_STATUS = {
  error: "error",
  idle: "idle",
  loaded: "loaded",
  loading: "loading",
} as const;

export type NotificationPanelStatus = (typeof NOTIFICATION_PANEL_STATUS)[keyof typeof NOTIFICATION_PANEL_STATUS];

/** Presentation of one inbox item, already resolved by the application. */
export interface NotificationPanelItem {
  id: string;
  title: string;
  /** Secondary line, such as when or where. */
  detail?: string;
  /** Short creation stamp, such as "12 may · 18:00". */
  sentAtLabel?: string;
  /** In-app destination; navigates through the configured router adapter. */
  href: string;
  isUnread: boolean;
}

export interface NotificationPanelLabels {
  markAllRead: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  emptyHint: string;
  /** Visually hidden prefix of unread items. */
  unreadPrefix: string;
}

export const NOTIFICATION_PANEL_DEFAULT_LABELS: NotificationPanelLabels = {
  markAllRead: "Marcar todas como leídas",
  loading: "Cargando notificaciones…",
  error: "No pudimos cargar tus notificaciones.",
  retry: "Reintentar",
  empty: "No tenés notificaciones.",
  emptyHint: "Te avisamos acá cuando cambie algo que te importa.",
  unreadPrefix: "No leída: ",
};

/** Body regions fade in when they mount, so the new state is in the DOM at once. */
const REGION_FADE_CLASS_NAME = "animate-in fade-in duration-180";

const MARK_ALL_FADE = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
  transition: { duration: MOTION_TIMING.enter, ease: MOTION_EASE },
} as const;

type NotificationPanelView = "empty" | "error" | "idle" | "list" | "loading";

/**
 * Picks the body region: the list whenever there are items (a background refresh never hides
 * them), otherwise the state of the last load.
 * @param hasNotifications - Whether the inbox has at least one item.
 * @param listStatus - Status of the latest list load.
 * @returns The region to render.
 */
function resolvePanelView(hasNotifications: boolean, listStatus: NotificationPanelStatus): NotificationPanelView {
  if (hasNotifications) return "list";
  if (listStatus === NOTIFICATION_PANEL_STATUS.loading) return "loading";
  if (listStatus === NOTIFICATION_PANEL_STATUS.error) return "error";
  if (listStatus === NOTIFICATION_PANEL_STATUS.loaded) return "empty";
  return "idle";
}

export interface NotificationPanelProps {
  notifications: readonly NotificationPanelItem[];
  listStatus: NotificationPanelStatus;
  unreadCount: number;
  isMarkingAll: boolean;
  onMarkAllRead: () => void;
  onRetry: () => void;
  onSelectNotification: (notificationId: string) => void;
  /** Heading rendered by the surface (popover or sheet title). */
  titleSlot: ReactNode;
  /** Leaves room for a sheet close button at the end of the header. */
  reservesCloseButtonSpace?: boolean;
  labels?: Partial<NotificationPanelLabels>;
  className?: string;
}

/**
 * Renders the inbox. Unread items keep a dot that fades out when they are read.
 * @param props - Items, load status, callbacks, title slot and optional labels.
 * @returns The panel.
 */
export function NotificationPanel({
  notifications,
  listStatus,
  unreadCount,
  isMarkingAll,
  onMarkAllRead,
  onRetry,
  onSelectNotification,
  titleSlot,
  reservesCloseButtonSpace = false,
  labels,
  className,
}: NotificationPanelProps) {
  const resolvedLabels = { ...NOTIFICATION_PANEL_DEFAULT_LABELS, ...labels };
  const panelView = resolvePanelView(notifications.length > 0, listStatus);

  return (
    <div data-slot="notification-panel" className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3", reservesCloseButtonSpace && "pr-12")}>
        {titleSlot}
        <AnimatePresence initial={false}>
          {unreadCount > 0 ? (
            <motion.span key="mark-all" className="-mr-2 inline-flex" {...MARK_ALL_FADE}>
              <Button
                className="text-[0.8rem] text-muted-foreground"
                disabled={isMarkingAll}
                onClick={onMarkAllRead}
                size="sm"
                type="button"
                variant="ghost"
              >
                <CheckCheckIcon aria-hidden="true" />
                {resolvedLabels.markAllRead}
              </Button>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {panelView === "loading" ? (
        <p className={cn("m-0 grid justify-items-start gap-3 p-4 text-[0.9rem] text-muted-foreground", REGION_FADE_CLASS_NAME)} role="status">
          {resolvedLabels.loading}
        </p>
      ) : null}

      {panelView === "error" ? (
        <div className={cn("grid justify-items-start gap-3 p-4 text-[0.9rem] text-muted-foreground", REGION_FADE_CLASS_NAME)} role="alert">
          <p className="m-0">{resolvedLabels.error}</p>
          <Button onClick={onRetry} size="sm" type="button" variant="outline">
            {resolvedLabels.retry}
          </Button>
        </div>
      ) : null}

      {panelView === "empty" ? (
        <div className={cn("grid justify-items-center gap-[0.35rem] px-5 py-8 text-center text-[0.9rem] text-muted-foreground", REGION_FADE_CLASS_NAME)}>
          <BellOffIcon aria-hidden="true" className="mb-1 size-6 opacity-80" />
          <p className="m-0">{resolvedLabels.empty}</p>
          <p className="m-0 max-w-72 text-[0.8rem]">{resolvedLabels.emptyHint}</p>
        </div>
      ) : null}

      {panelView === "list" ? (
        <ul className={cn("m-0 min-h-0 list-none overflow-y-auto overscroll-contain py-1", REGION_FADE_CLASS_NAME)}>
          <AnimatePresence initial={false}>
            {notifications.map((notification) => (
              <AnimatedListItem className="[&+&]:border-t [&+&]:border-border/60" key={notification.id}>
                <Link
                  className={cn(
                    "grid grid-cols-[0.5rem_minmax(0,1fr)] items-start gap-3 px-4 py-3 text-foreground no-underline outline-none [-webkit-tap-highlight-color:transparent] transition-[background-color,box-shadow] focus-visible:bg-accent focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] active:bg-accent [@media(hover:hover)]:hover:bg-accent",
                    notification.isUnread && "bg-primary/6",
                  )}
                  href={notification.href}
                  onClick={() => onSelectNotification(notification.id)}
                >
                  <span
                    aria-hidden="true"
                    data-unread={notification.isUnread || undefined}
                    className="mt-[0.4rem] size-2 scale-50 rounded-full bg-primary opacity-0 transition-[opacity,scale] data-unread:scale-100 data-unread:opacity-100"
                  />
                  <span className="grid min-w-0 gap-[0.15rem]">
                    {notification.isUnread ? <span className="sr-only">{resolvedLabels.unreadPrefix}</span> : null}
                    <span className="text-[0.9rem] leading-[1.35] font-medium [overflow-wrap:anywhere]">{notification.title}</span>
                    {notification.detail ? (
                      <span className="text-[0.8rem] leading-[1.4] text-muted-foreground [overflow-wrap:anywhere]">{notification.detail}</span>
                    ) : null}
                    {notification.sentAtLabel ? <span className="text-xs text-muted-foreground">{notification.sentAtLabel}</span> : null}
                  </span>
                </Link>
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </ul>
      ) : null}
    </div>
  );
}
