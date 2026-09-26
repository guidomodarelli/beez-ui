/** Demonstrates MonthCalendarHeader and MonthGrid working together. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDaysIcon, ListIcon } from "lucide-react";
import { Button, MonthCalendarHeader, MonthGrid, shiftMonthKey, useMonthTransitionDirection, type MonthGridItem } from "beez-ui";

const INITIAL_MONTH = "2026-05";

/**
 * Builds sample items for a month.
 * @param month - Visible `YYYY-MM` month.
 * @returns Items on a few days of that month.
 */
function buildItems(month: string): MonthGridItem[] {
  return [
    { id: `${month}-class`, dateKey: `${month}-06`, title: "Clase abierta", timeLabel: "18:00", accentColor: "var(--chart-3)" },
    { id: `${month}-meetup`, dateKey: `${month}-06`, title: "Encuentro", timeLabel: "20:00", isCancelled: true },
    { id: `${month}-review`, dateKey: `${month}-14`, title: "Repaso general", timeLabel: "10:00" },
    { id: `${month}-talk`, dateKey: `${month}-21`, title: "Charla invitada", timeLabel: "19:30", accentColor: "var(--free)" },
  ];
}

/** Owns the visible month, view and selected day like a consumer would. */
function MonthCalendarExample() {
  const [month, setMonth] = useState(INITIAL_MONTH);
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const monthTransitionDirection = useMonthTransitionDirection("storybook", month);

  return (
    <div className="grid gap-4">
      <MonthCalendarHeader
        month={month}
        monthTransitionDirection={monthTransitionDirection}
        previousMonth={{ onSelect: () => setMonth(shiftMonthKey(month, -1)) }}
        nextMonth={{ onSelect: () => setMonth(shiftMonthKey(month, 1)) }}
        today={{ onSelect: () => setMonth(INITIAL_MONTH) }}
        timeLabel="18:30 Buenos Aires"
        viewOptions={[
          { value: "list", label: "Ver lista", icon: ListIcon },
          { value: "calendar", label: "Ver calendario", icon: CalendarDaysIcon },
        ]}
        view={view}
        onViewChange={setView}
        actions={<Button>Crear evento</Button>}
      />
      <MonthGrid
        month={month}
        items={buildItems(month)}
        todayKey={`${INITIAL_MONTH}-06`}
        activeDayKey={activeDayKey}
        onSelectDay={setActiveDayKey}
        onSelectItem={() => {}}
      />
    </div>
  );
}

const meta = {
  title: "Components/MonthCalendar",
  render: () => <MonthCalendarExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
