/** Verifies hydration-safe hooks and the swipe gesture hook through real renders. */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  HORIZONTAL_SWIPE_DIRECTION,
  useHorizontalSwipe,
  useIsHydrated,
  useViewerTimeZone,
  type HorizontalSwipeDirection,
} from "beez-ui/hooks";

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
