/** Exercises the presentational notification bell and panel through their public props and real Motion. */
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NOTIFICATION_BELL_SURFACE,
  NOTIFICATION_PANEL_STATUS,
  NotificationBell,
  formatUnreadBadge,
  type NotificationPanelItem,
} from "beez-ui";

type BellProps = ComponentProps<typeof NotificationBell>;

/**
 * Builds one resolved inbox item.
 * @param id - Item id.
 * @param title - Visible title.
 * @param isUnread - Whether it is still unread.
 * @returns The item.
 */
function buildItem(id: string, title: string, isUnread = true): NotificationPanelItem {
  return { id, title, detail: "Mañana a las 18:00", sentAtLabel: "6 may · 09:00", href: `#notificacion-${id}`, isUnread };
}

/**
 * Builds bell props with inert callbacks.
 * @param overrides - Props to replace.
 * @returns Complete props.
 */
function buildProps(overrides: Partial<BellProps> = {}): BellProps {
  return {
    isMarkingAll: false,
    isOpen: false,
    listStatus: NOTIFICATION_PANEL_STATUS.loaded,
    notifications: [],
    onMarkAllRead: vi.fn(),
    onOpenChange: vi.fn(),
    onRetry: vi.fn(),
    onSelectNotification: vi.fn(),
    surface: NOTIFICATION_BELL_SURFACE.popover,
    unreadCount: 0,
    ...overrides,
  };
}

/**
 * Renders the bell and returns a rerender helper.
 * @param overrides - Initial props.
 * @returns The render result and helper.
 */
function renderBell(overrides: Partial<BellProps> = {}) {
  const view = render(<NotificationBell {...buildProps(overrides)} />);
  return { ...view, rerenderBell: (nextOverrides: Partial<BellProps>) => view.rerender(<NotificationBell {...buildProps(nextOverrides)} />) };
}

describe("NotificationBell", () => {
  it("caps the visible badge at 9+ while the accessible name keeps the same cap", () => {
    renderBell({ unreadCount: 12 });

    expect(formatUnreadBadge(12)).toBe("9+");
    expect(screen.getByRole("button", { name: "Notificaciones, 9+ sin leer" })).toHaveTextContent("9+");
  });

  it("updates the badge and announces the count when a new notification arrives", async () => {
    const { rerenderBell } = renderBell({ unreadCount: 1 });

    rerenderBell({ unreadCount: 2 });

    expect(await screen.findByRole("button", { name: "Notificaciones, 2 sin leer" })).toHaveTextContent("2");
    expect(screen.getByRole("status")).toHaveTextContent("Notificaciones, 2 sin leer");
  });

  it("removes the badge once everything is read", async () => {
    const { rerenderBell } = renderBell({ unreadCount: 3 });
    const bell = screen.getByRole("button", { name: "Notificaciones, 3 sin leer" });

    rerenderBell({ unreadCount: 0 });

    expect(screen.getByRole("button", { name: "Notificaciones" })).toBe(bell);
    await waitFor(() => expect(bell).toHaveTextContent(""));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("adds a notification that arrives while the panel is open and keeps the existing ones", async () => {
    const first = buildItem("first", "Taller de álgebra");
    const second = buildItem("second", "Club de geometría");
    const { rerenderBell } = renderBell({ isOpen: true, notifications: [first], unreadCount: 1 });
    const panel = screen.getByRole("dialog", { name: "Notificaciones" });

    rerenderBell({ isOpen: true, notifications: [second, first], unreadCount: 2 });

    const links = await within(panel).findAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName(/Club de geometría/);
    expect(links[1]).toHaveAccessibleName(/Taller de álgebra/);
    expect(links[0]).toHaveAttribute("href", "#notificacion-second");
  });

  it("drops the unread marker and the mark-all action when the last item is read", async () => {
    const { rerenderBell } = renderBell({ isOpen: true, notifications: [buildItem("first", "Taller de álgebra")], unreadCount: 1 });
    const panel = screen.getByRole("dialog", { name: "Notificaciones" });

    expect(within(panel).getByRole("link", { name: /Taller de álgebra/ })).toHaveAccessibleName(/^No leída:/);
    expect(within(panel).getByRole("button", { name: "Marcar todas como leídas" })).toBeInTheDocument();

    rerenderBell({ isOpen: true, notifications: [buildItem("first", "Taller de álgebra", false)], unreadCount: 0 });

    expect(within(panel).getByRole("link", { name: /Taller de álgebra/ })).not.toHaveAccessibleName(/No leída/);
    await waitFor(() => expect(within(panel).queryByRole("button", { name: "Marcar todas como leídas" })).not.toBeInTheDocument());
  });

  it("replaces the loading state with the list and shows the empty state when nothing arrives", () => {
    const { rerenderBell } = renderBell({ isOpen: true, listStatus: NOTIFICATION_PANEL_STATUS.loading });
    const panel = screen.getByRole("dialog", { name: "Notificaciones" });
    expect(within(panel).getByRole("status")).toHaveTextContent("Cargando notificaciones…");

    rerenderBell({ isOpen: true, listStatus: NOTIFICATION_PANEL_STATUS.loaded });

    expect(within(panel).getByText("No tenés notificaciones.")).toBeInTheDocument();
    expect(within(panel).queryByText("Cargando notificaciones…")).not.toBeInTheDocument();
  });

  it("selects one item, marks all, and retries after an error", async () => {
    const user = userEvent.setup();
    const onSelectNotification = vi.fn();
    const onMarkAllRead = vi.fn();
    const onRetry = vi.fn();
    const { rerenderBell } = renderBell({
      isOpen: true,
      notifications: [buildItem("first", "Taller de álgebra")],
      onSelectNotification,
      onMarkAllRead,
      unreadCount: 1,
    });

    await user.click(screen.getByRole("link", { name: /Taller de álgebra/ }));
    await user.click(screen.getByRole("button", { name: "Marcar todas como leídas" }));
    expect(onSelectNotification).toHaveBeenCalledWith("first");
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);

    rerenderBell({ isOpen: true, listStatus: NOTIFICATION_PANEL_STATUS.error, onRetry });
    await user.click(within(screen.getByRole("alert")).getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("opens the inbox as a bottom sheet with custom labels", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerenderBell } = renderBell({
      surface: NOTIFICATION_BELL_SURFACE.sheet,
      onOpenChange,
      labels: { title: "Avisos", describeUnread: (unreadCount) => `Avisos: ${unreadCount}` },
      unreadCount: 1,
    });

    await user.click(screen.getByRole("button", { name: "Avisos: 1" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerenderBell({ surface: NOTIFICATION_BELL_SURFACE.sheet, isOpen: true, labels: { title: "Avisos" }, unreadCount: 1 });

    expect(await screen.findByRole("dialog", { name: "Avisos" })).toBeInTheDocument();
  });
});
