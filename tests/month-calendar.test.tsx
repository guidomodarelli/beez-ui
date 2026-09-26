/** Verifies the month grid and calendar header through their accessible table and controls. */
import { useState } from "react";
import { CalendarDaysIcon, ListIcon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthCalendarHeader, MonthGrid, formatMonthTitle, type MonthGridItem } from "beez-ui";

const ITEMS: MonthGridItem[] = [
  { id: "class", dateKey: "2026-05-06", title: "Clase abierta", timeLabel: "18:00", accentColor: "rgb(10, 120, 200)" },
  { id: "meetup", dateKey: "2026-05-06", title: "Encuentro", timeLabel: "20:00", isCancelled: true },
  { id: "past", dateKey: "2026-05-04", title: "Repaso", timeLabel: "10:00", isPast: true },
];

describe("MonthGrid", () => {
  it("renders a Monday-first table, marks today and lists items per day", () => {
    render(<MonthGrid month="2026-05" items={ITEMS} todayKey="2026-05-06" onSelectItem={vi.fn()} />);

    const table = screen.getByRole("table", { name: "Calendario mensual" });
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]);
    const today = table.querySelector('[aria-current="date"]');
    expect(today).toHaveTextContent("6 Hoy");
    expect(within(today as HTMLElement).getAllByRole("button").map((button) => button.textContent)).toEqual([" 18:00 Clase abierta", " 20:00 EncuentroCancelado"]);
  });

  it("selects an item and exposes cancelled and past states", async () => {
    const onSelectItem = vi.fn();
    const user = userEvent.setup();
    render(<MonthGrid month="2026-05" items={ITEMS} onSelectItem={onSelectItem} />);

    await user.click(screen.getByRole("button", { name: /Clase abierta/ }));

    expect(onSelectItem).toHaveBeenCalledWith(ITEMS[0]);
    expect(screen.getByRole("button", { name: /Encuentro/ })).toHaveAttribute("data-cancelled", "true");
    expect(screen.getByRole("button", { name: /Repaso/ })).toHaveAttribute("data-past", "true");
    expect(screen.getByRole("button", { name: /Clase abierta/ }).style.getPropertyValue("--beez-item-accent")).toBe("rgb(10, 120, 200)");
  });

  it("offers day buttons and a summary of the selected day for phones", async () => {
    const user = userEvent.setup();
    /** Owns the selected day like a consumer would. */
    function SelectableGrid() {
      const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
      return <MonthGrid month="2026-05" items={ITEMS} activeDayKey={activeDayKey} onSelectDay={setActiveDayKey} onSelectItem={vi.fn()} />;
    }
    render(<SelectableGrid />);

    const dayButton = screen.getByRole("button", { name: "miércoles, 6 de mayo: 2 eventos" });
    expect(dayButton).toHaveAttribute("aria-pressed", "false");
    await user.click(dayButton);

    expect(dayButton).toHaveAttribute("aria-pressed", "true");
    const summary = await screen.findByRole("region", { name: "Eventos del día" });
    expect(within(summary).getByRole("heading", { name: "miércoles, 6 de mayo" })).toBeInTheDocument();
    expect(within(summary).getAllByRole("button")).toHaveLength(2);
  });

  it("starts weeks on Sunday with rotated headers", () => {
    render(<MonthGrid month="2026-05" items={[]} weekStartsOn={0} onSelectItem={vi.fn()} />);

    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Dom");
    expect(screen.getAllByRole("row")[1].querySelector("td")).toHaveTextContent("26");
  });
});

describe("MonthCalendarHeader", () => {
  it("formats the month title and links to the neighbour months", () => {
    render(
      <MonthCalendarHeader
        month="2026-05"
        previousMonth={{ href: "?month=2026-04" }}
        nextMonth={{ href: "?month=2026-06" }}
        today={{ href: "?month=2026-09" }}
        timeLabel="18:30 Buenos Aires"
        monthTransitionDirection="next"
      />,
    );

    expect(formatMonthTitle("2026-05")).toBe("Mayo de 2026");
    expect(screen.getByRole("heading", { level: 1, name: "Mayo de 2026" })).toHaveAttribute("data-month-transition", "next");
    expect(screen.getByRole("link", { name: "Mes anterior" })).toHaveAttribute("href", "?month=2026-04");
    expect(screen.getByRole("link", { name: "Mes siguiente" })).toHaveAttribute("href", "?month=2026-06");
    expect(screen.getByRole("link", { name: "Hoy" })).toHaveAttribute("href", "?month=2026-09");
    expect(screen.getByText("18:30 Buenos Aires")).toBeInTheDocument();
  });

  it("navigates with callbacks and switches the view", async () => {
    const onPreviousMonth = vi.fn();
    const user = userEvent.setup();
    /** Owns the view like a consumer would. */
    function HeaderHarness() {
      const [view, setView] = useState<"list" | "calendar">("calendar");
      return (
        <MonthCalendarHeader
          month="2026-05"
          previousMonth={{ onSelect: onPreviousMonth }}
          nextMonth={{ onSelect: vi.fn() }}
          viewOptions={[
            { value: "list", label: "Ver lista", icon: ListIcon },
            { value: "calendar", label: "Ver calendario", icon: CalendarDaysIcon },
          ]}
          view={view}
          onViewChange={setView}
          actions={<button type="button">Crear evento</button>}
          labels={{ viewMode: "Vista de eventos" }}
        />
      );
    }
    render(<HeaderHarness />);

    await user.click(screen.getByRole("button", { name: "Mes anterior" }));
    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    const viewToggle = screen.getByRole("group", { name: "Vista de eventos" });
    expect(within(viewToggle).getByRole("button", { name: "Ver calendario" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(viewToggle).getByRole("button", { name: "Ver lista" }));
    expect(within(viewToggle).getByRole("button", { name: "Ver lista" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Crear evento" })).toBeInTheDocument();
  });
});
