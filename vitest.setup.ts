import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

/** Registers the application custom element omitted from the test consumer. */
const RELATIVE_TIME_ELEMENT_TAG = "relative-time";

if (
  globalThis.customElements &&
  !globalThis.customElements.get(RELATIVE_TIME_ELEMENT_TAG)
) {
  globalThis.customElements.define(
    RELATIVE_TIME_ELEMENT_TAG,
    class RelativeTimeElementTestStub extends HTMLElement {}
  );
}


/**
 * jsdom does not implement `matchMedia`, which theme and layout providers call while mounting.
 * This environment shim only lets components mount: it reports that no media query matches (a
 * desktop without user preferences) and never changes. Behavior that depends on real media
 * queries (reduced motion, hover capability, viewport breakpoints) is verified with Playwright.
 * It stays writable so a test can emulate a preference with `vi.spyOn(window, "matchMedia")`.
 */
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      Object.assign(new EventTarget(), {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
      }),
  });
}

/**
 * jsdom does not implement pointer capture or `scrollIntoView`, which Radix popovers, selects
 * and menus call while handling input. These no-op shims only let those interactions run;
 * capture and scrolling behavior is verified with Playwright.
 */
// Node-environment suites (release tooling) share this setup and have no DOM to shim.
if (typeof HTMLElement !== "undefined") {
  const elementPlatformShims: Array<[object, string, () => unknown]> = [
    [HTMLElement.prototype, "hasPointerCapture", () => false],
    [HTMLElement.prototype, "setPointerCapture", () => undefined],
    [HTMLElement.prototype, "releasePointerCapture", () => undefined],
    [Element.prototype, "scrollIntoView", () => undefined],
  ];
  for (const [prototype, method, implementation] of elementPlatformShims) {
    if (!(method in prototype)) {
      Object.defineProperty(prototype, method, { configurable: true, value: implementation });
    }
  }
}

// Release DOM trees and subscriptions between real component tests.
afterEach(cleanup);
