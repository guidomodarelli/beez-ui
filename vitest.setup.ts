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


// Release DOM trees and subscriptions between real component tests.
afterEach(cleanup);
