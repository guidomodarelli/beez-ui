/** Verifies the in-app browser call to action and the external browser handoff countdown. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ExternalBrowserHandoff, OpenInBrowserCta } from "beez-ui";

const SIGN_IN_URL = "https://example.com/ingresar?next=%2Fgrupo";
const EXTERNAL_BROWSER_URL = "x-safari-https://example.com/grupo?pago=1";
const FALLBACK_URL = "/ingresar?next=%2Fgrupo";

describe("OpenInBrowserCta", () => {
  it("offers a Safari deep link on iOS and keeps the URL copyable", () => {
    render(<OpenInBrowserCta url={SIGN_IN_URL} isIos />);

    expect(screen.getByRole("heading", { name: "Abrí este sitio en tu navegador" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir en Safari" })).toHaveAttribute("href", "x-safari-https://example.com/ingresar?next=%2Fgrupo");
    expect(screen.getByText(SIGN_IN_URL)).toBeInTheDocument();
  });

  it("explains the manual steps elsewhere and accepts custom copy", () => {
    render(<OpenInBrowserCta url={SIGN_IN_URL} isIos={false} copy={{ title: "Abrí la app en tu navegador", manualHint: "Copiá el link." }} />);

    expect(screen.getByRole("heading", { name: "Abrí la app en tu navegador" })).toBeInTheDocument();
    expect(screen.getByText("Copiá el link.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("ExternalBrowserHandoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    Reflect.deleteProperty(document, "visibilityState");
  });

  it("renders the primary deep link, the countdown and the fallback link", () => {
    render(<ExternalBrowserHandoff externalBrowserUrl={EXTERNAL_BROWSER_URL} fallbackUrl={FALLBACK_URL} onFallback={vi.fn()} copy={{ eyebrow: "Suscripción pendiente" }} />);

    expect(screen.getByRole("heading", { level: 1, name: "Abrí este sitio en tu navegador" })).toBeInTheDocument();
    expect(screen.getByText("Suscripción pendiente")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("5");
    expect(screen.getByRole("link", { name: "Continuar en tu navegador" })).toHaveAttribute("href", EXTERNAL_BROWSER_URL);
    expect(screen.getByRole("link", { name: "O continuá acá" })).toHaveAttribute("href", FALLBACK_URL);
  });

  it("follows the fallback when the countdown reaches zero", () => {
    const onFallback = vi.fn();
    render(<ExternalBrowserHandoff externalBrowserUrl={EXTERNAL_BROWSER_URL} fallbackUrl={FALLBACK_URL} onFallback={onFallback} />);

    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByRole("timer")).toHaveTextContent("4");
    expect(onFallback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(4_000));
    expect(screen.getByRole("timer")).toHaveTextContent("0");
    expect(onFallback).toHaveBeenCalledWith(FALLBACK_URL);
  });

  it("waits for the deep link after a tap and follows the fallback only once when it does not take", () => {
    const onFallback = vi.fn();
    render(<ExternalBrowserHandoff externalBrowserUrl={EXTERNAL_BROWSER_URL} fallbackUrl={FALLBACK_URL} onFallback={onFallback} />);
    const primaryAction = screen.getByRole("link", { name: "Continuar en tu navegador" });
    // jsdom cannot open custom schemes; keep the tap inside the page like a failed deep link.
    primaryAction.addEventListener("click", (event) => event.preventDefault());

    act(() => {
      primaryAction.click();
      primaryAction.click();
    });
    act(() => vi.advanceTimersByTime(5_000));

    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it("does not follow the fallback once the page is hidden by the external browser", () => {
    const onFallback = vi.fn();
    render(<ExternalBrowserHandoff externalBrowserUrl={EXTERNAL_BROWSER_URL} fallbackUrl={FALLBACK_URL} onFallback={onFallback} />);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });

    act(() => vi.advanceTimersByTime(5_000));

    expect(onFallback).not.toHaveBeenCalled();
  });
});
