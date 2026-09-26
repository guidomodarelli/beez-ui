/** Verifies hydration-safe hooks and gesture and month-transition hooks through real renders. */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  HORIZONTAL_SWIPE_DIRECTION,
  MONTH_TRANSITION_DIRECTION,
  resolveMonthTransitionDirection,
  useHorizontalSwipe,
  useIsHydrated,
  useMonthTransitionDirection,
  useViewerTimeZone,
  type HorizontalSwipeDirection,
} from "beez-ui";

/** Renders what the hooks report, so tests read it like a user would. */
function HydrationProbe() {
  return (
    <>
      <output aria-label="Hidratado">{useIsHydrated() ? "cliente" : "servidor"}</output>
      <output aria-label="Zona horaria">{useViewerTimeZone() ?? "servidor"}</output>
    </>
  );
}

/** Exposes a swipe surface and reports each recognised swipe. */
function SwipeProbe({ onSwipe }: { onSwipe: (direction: HorizontalSwipeDirection) => void }) {
  return (
    <div data-testid="swipe-surface" {...useHorizontalSwipe(onSwipe)}>
      Mayo
    </div>
  );
}

/** Shows the direction computed for the visible month. */
function MonthDirectionProbe({ month, scopeKey = "calendario" }: { month: string; scopeKey?: string }) {
  return <output aria-label="Dirección">{useMonthTransitionDirection(scopeKey, month)}</output>;
}

/**
 * Dispatches a one-finger touch sequence on the surface.
 * @param surface - Element with the swipe handlers.
 * @param start - Start point and time stamp are taken from the event.
 * @param end - End point.
 */
function swipe(surface: HTMLElement, start: { x: number; y: number }, end: { x: number; y: number }) {
  fireEvent.touchStart(surface, { touches: [{ identifier: 1, clientX: start.x, clientY: start.y }] });
  fireEvent.touchEnd(surface, { changedTouches: [{ identifier: 1, clientX: end.x, clientY: end.y }], touches: [] });
}

describe("hydration-safe hooks", () => {
  it("render the server snapshot on the server", () => {
    const serverMarkup = renderToString(<HydrationProbe />);

    expect(serverMarkup).toContain("servidor");
    expect(serverMarkup).not.toContain("cliente");
  });

  it("report the browser values once rendered on the client", () => {
    render(<HydrationProbe />);

    expect(screen.getByRole("status", { name: "Hidratado" })).toHaveTextContent("cliente");
    expect(screen.getByRole("status", { name: "Zona horaria" })).toHaveTextContent(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});

describe("useHorizontalSwipe", () => {
  it("reports a leftward swipe as the next page and ignores vertical drags", () => {
    const onSwipe = vi.fn();
    render(<SwipeProbe onSwipe={onSwipe} />);
    const surface = screen.getByTestId("swipe-surface");

    swipe(surface, { x: 200, y: 100 }, { x: 100, y: 110 });
    swipe(surface, { x: 200, y: 100 }, { x: 190, y: 300 });

    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenCalledWith(HORIZONTAL_SWIPE_DIRECTION.next);
  });

  it("cancels the gesture when a second finger touches the surface", () => {
    const onSwipe = vi.fn();
    render(<SwipeProbe onSwipe={onSwipe} />);
    const surface = screen.getByTestId("swipe-surface");

    fireEvent.touchStart(surface, {
      touches: [
        { identifier: 1, clientX: 200, clientY: 100 },
        { identifier: 2, clientX: 220, clientY: 120 },
      ],
    });
    fireEvent.touchEnd(surface, { changedTouches: [{ identifier: 1, clientX: 50, clientY: 100 }], touches: [] });

    expect(onSwipe).not.toHaveBeenCalled();
  });
});

describe("month transition direction", () => {
  it("compares month keys chronologically", () => {
    expect(resolveMonthTransitionDirection(null, "2026-05")).toBe(MONTH_TRANSITION_DIRECTION.none);
    expect(resolveMonthTransitionDirection("2026-05", "2026-06")).toBe(MONTH_TRANSITION_DIRECTION.next);
    expect(resolveMonthTransitionDirection("2026-01", "2025-12")).toBe(MONTH_TRANSITION_DIRECTION.previous);
  });

  it("follows month changes of the same calendar and a remount right after one", () => {
    const { rerender, unmount } = render(<MonthDirectionProbe month="2026-05" scopeKey="remonta" />);
    expect(screen.getByRole("status", { name: "Dirección" })).toHaveTextContent("none");

    rerender(<MonthDirectionProbe month="2026-04" scopeKey="remonta" />);
    expect(screen.getByRole("status", { name: "Dirección" })).toHaveTextContent("previous");

    unmount();
    render(<MonthDirectionProbe month="2026-05" scopeKey="remonta" />);
    expect(screen.getByRole("status", { name: "Dirección" })).toHaveTextContent("next");
  });

  it("does not orient a different calendar", () => {
    const { unmount } = render(<MonthDirectionProbe month="2026-05" scopeKey="primero" />);
    unmount();

    render(<MonthDirectionProbe month="2026-06" scopeKey="segundo" />);

    expect(screen.getByRole("status", { name: "Dirección" })).toHaveTextContent("none");
  });
});
