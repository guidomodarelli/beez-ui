/** Demonstrates NotificationBell with a stateful inbox. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NOTIFICATION_BELL_SURFACE, NOTIFICATION_PANEL_STATUS, NotificationBell, type NotificationPanelItem } from "beez-ui";

const INITIAL_NOTIFICATIONS: NotificationPanelItem[] = [
  { id: "1", title: "Taller de álgebra empieza mañana", detail: "Jueves 7 de mayo a las 18:00", sentAtLabel: "6 may · 09:00", href: "#taller", isUnread: true },
  { id: "2", title: "Tu propuesta fue aprobada", detail: "Club de geometría", sentAtLabel: "5 may · 14:20", href: "#propuesta", isUnread: false },
];

/** Owns the inbox state: reading items lowers the badge. */
function NotificationBellExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((notification) => notification.isUnread).length;
  const markRead = (notificationId?: string) =>
    setNotifications(
      notifications.map((notification) =>
        notificationId === undefined || notification.id === notificationId ? { ...notification, isUnread: false } : notification,
      ),
    );

  return (
    <div className="flex justify-end">
      <NotificationBell
        surface={NOTIFICATION_BELL_SURFACE.responsive}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        unreadCount={unreadCount}
        notifications={notifications}
        listStatus={NOTIFICATION_PANEL_STATUS.loaded}
        isMarkingAll={false}
        onMarkAllRead={() => markRead()}
        onRetry={() => {}}
        onSelectNotification={markRead}
      />
    </div>
  );
}

const meta = {
  title: "Components/NotificationBell",
  render: () => <NotificationBellExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
