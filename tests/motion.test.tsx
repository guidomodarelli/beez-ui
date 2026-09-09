/** Verifies readable reduced-motion content through real React rendering and hydration. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { TypingAnimation } from "beez-ui";

afterEach(() => vi.restoreAllMocks());

/** Emulates the browser preference without replacing React or the shared component. */
function preferReducedMotion() {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));
}

describe("Reduced motion", () => {
  it("should show all rotating words without waiting or looping", () => {
    preferReducedMotion();
    render(
      <TypingAnimation
        words={["Primera idea", "Segunda idea"]}
        duration={10000}
        loop
      />,
    );
    expect(screen.getByText("Primera idea · Segunda idea")).toBeInTheDocument();
  });

  it("should hydrate the server markup before applying the browser preference", async () => {
    preferReducedMotion();
    const component = (
      <TypingAnimation duration={10000}>Contenido accesible</TypingAnimation>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(component);
    document.body.appendChild(container);
    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, component, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });
      expect(container).toHaveTextContent("Contenido accesible");
      expect(recoverableErrors).toEqual([]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
