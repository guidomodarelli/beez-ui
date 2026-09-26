/** Verifies the framework-neutral helpers exported by the package root. */
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  EXTERNAL_BROWSER_PLATFORM,
  HORIZONTAL_SWIPE_DIRECTION,
  buildExternalBrowserUrl,
  classifyFiles,
  compareFuzzyMatchRank,
  createMonthGridDays,
  detectInAppBrowser,
  formatFileSize,
  getExactMatchIndices,
  getFuzzyMatchIndices,
  getFuzzyMatchRank,
  getNameInitials,
  groupItemsByDateKey,
  isFileTypeAccepted,
  renderHighlightedText,
  replaceCurrentUrlSearchParams,
  replaceCurrentUrlSearchParamValues,
  resolveHorizontalSwipe,
  shiftMonthKey,
  splitCalendarWeeks,
} from "beez-ui";

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = 1024 * 1024;
const IPHONE_INSTAGRAM_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0";
const IPHONE_SAFARI_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_MERCADO_PAGO_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 MercadoPago";

describe("formatFileSize", () => {
  it("formats plain byte counts without decimals", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1023)).toBe("1.023 B");
  });

  it("scales to larger units with at most one es-AR decimal", () => {
    expect(formatFileSize(BYTES_PER_KILOBYTE)).toBe("1 KB");
    expect(formatFileSize(12.3 * BYTES_PER_MEGABYTE)).toBe("12,3 MB");
    expect(formatFileSize(25 * BYTES_PER_MEGABYTE)).toBe("25 MB");
  });

  it("uses the requested locale for the decimal separator", () => {
    expect(formatFileSize(1.5 * BYTES_PER_KILOBYTE, { locale: "en-US" })).toBe("1.5 KB");
  });

  it("treats non-finite or negative input as an empty size", () => {
    expect(formatFileSize(Number.NaN)).toBe("0 B");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("0 B");
    expect(formatFileSize(-200)).toBe("0 B");
  });
});

describe("resolveHorizontalSwipe", () => {
  it("reads fast horizontal drags as page turns", () => {
    expect(resolveHorizontalSwipe({ deltaX: -90, deltaY: 10, durationMs: 250 })).toBe(HORIZONTAL_SWIPE_DIRECTION.next);
    expect(resolveHorizontalSwipe({ deltaX: 90, deltaY: -12, durationMs: 250 })).toBe(HORIZONTAL_SWIPE_DIRECTION.previous);
  });

  it("ignores short, mostly vertical and slow drags", () => {
    expect(resolveHorizontalSwipe({ deltaX: -30, deltaY: 0, durationMs: 200 })).toBeNull();
    expect(resolveHorizontalSwipe({ deltaX: -90, deltaY: 80, durationMs: 200 })).toBeNull();
    expect(resolveHorizontalSwipe({ deltaX: -90, deltaY: 0, durationMs: 2_000 })).toBeNull();
  });
});

describe("browser navigation helpers", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("sets and removes query parameters in one history entry, keeping path and hash", () => {
    window.history.replaceState(null, "", "/grupo/eventos?event=abc%402026#detalle");
    const historyLength = window.history.length;

    replaceCurrentUrlSearchParams({ event: null, month: "2026-05" });

    expect(window.location.pathname).toBe("/grupo/eventos");
    expect(window.location.search).toBe("?month=2026-05");
    expect(window.location.hash).toBe("#detalle");
    expect(window.history.length).toBe(historyLength);
  });

  it("replaces every value of a repeatable parameter", () => {
    window.history.replaceState(null, "", "/grupo?type=live&month=2026-05");

    replaceCurrentUrlSearchParamValues("type", ["course", "meetup"]);

    expect(new URL(window.location.href).searchParams.getAll("type")).toEqual(["course", "meetup"]);
    expect(new URL(window.location.href).searchParams.get("month")).toBe("2026-05");
  });
});

describe("in-app browser helpers", () => {
  it("detects embedded browsers and their platform from the user agent", () => {
    expect(detectInAppBrowser(IPHONE_INSTAGRAM_USER_AGENT)).toEqual({ isInAppBrowser: true, isIos: true, isAndroid: false, isMercadoPago: false });
    expect(detectInAppBrowser(ANDROID_MERCADO_PAGO_USER_AGENT)).toMatchObject({ isInAppBrowser: true, isAndroid: true, isMercadoPago: true });
    expect(detectInAppBrowser(IPHONE_SAFARI_USER_AGENT).isInAppBrowser).toBe(false);
    expect(detectInAppBrowser(null).isInAppBrowser).toBe(false);
  });

  it("builds deep links that reopen https URLs in the default browser", () => {
    const targetHttpsUrl = "https://example.com/ingresar?next=%2Fgrupo";

    expect(buildExternalBrowserUrl({ platform: EXTERNAL_BROWSER_PLATFORM.ios, targetHttpsUrl })).toBe("x-safari-https://example.com/ingresar?next=%2Fgrupo");
    expect(buildExternalBrowserUrl({ platform: EXTERNAL_BROWSER_PLATFORM.android, targetHttpsUrl })).toBe(
      `googlechrome://navigate?url=${encodeURIComponent(targetHttpsUrl)}`,
    );
    expect(buildExternalBrowserUrl({ platform: EXTERNAL_BROWSER_PLATFORM.ios, targetHttpsUrl: "http://example.com" })).toBeNull();
  });
});

describe("getNameInitials", () => {
  it("builds up to two uppercase initials ignoring repeated spaces", () => {
    expect(getNameInitials("  ana   maría lópez ")).toBe("AM");
    expect(getNameInitials("guido")).toBe("G");
    expect(getNameInitials("   ")).toBe("");
  });
});

describe("file acceptance", () => {
  const pdf = { name: "Recibo.PDF", type: "application/pdf", size: 2_000 };
  const photoWithoutMimeType = { name: "foto.heic", type: "", size: 3_000 };
  const bigImage = { name: "grande.png", type: "image/png", size: 9_000 };
  const text = { name: "notas.txt", type: "text/plain", size: 10 };

  it("accepts extensions, exact MIME types and wildcards, falling back to the extension", () => {
    expect(isFileTypeAccepted(pdf, ".pdf")).toBe(true);
    expect(isFileTypeAccepted(pdf, "application/pdf")).toBe(true);
    expect(isFileTypeAccepted(photoWithoutMimeType, "image/*")).toBe(true);
    expect(isFileTypeAccepted(text, "image/*,.pdf")).toBe(false);
    expect(isFileTypeAccepted(text)).toBe(true);
  });

  it("splits files into accepted, wrong-type and oversized groups", () => {
    expect(classifyFiles([pdf, photoWithoutMimeType, bigImage, text], { accept: "image/*,.pdf", maxSize: 5_000 })).toEqual({
      accepted: [pdf, photoWithoutMimeType],
      unaccepted: [text],
      oversized: [bigImage],
    });
    expect(classifyFiles([pdf, text], { allowsMultiple: false }).accepted).toEqual([pdf]);
  });
});

describe("month grid helpers", () => {
  it("builds Monday-first weeks padded with neighbour months", () => {
    // May 2026 starts on a Friday and has 31 days: 4 leading + 31 = 35 cells.
    const days = createMonthGridDays("2026-05");
    const weeks = splitCalendarWeeks(days);

    expect(days).toHaveLength(35);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(days[0]).toEqual({ dateKey: "2026-04-27", dayNumber: 27, isCurrentMonth: false });
    expect(days[4]).toEqual({ dateKey: "2026-05-01", dayNumber: 1, isCurrentMonth: true });
    expect(days.at(-1)).toEqual({ dateKey: "2026-05-31", dayNumber: 31, isCurrentMonth: true });
  });

  it("starts weeks on Sunday when requested", () => {
    expect(createMonthGridDays("2026-05", 0)[0]).toEqual({ dateKey: "2026-04-26", dayNumber: 26, isCurrentMonth: false });
  });

  it("rejects malformed month keys with the received value", () => {
    expect(() => createMonthGridDays("2026-13")).toThrow(/2026-13/);
  });

  it("groups items by day keeping their order and shifts months across years", () => {
    const items = [
      { id: "b", dateKey: "2026-05-06" },
      { id: "a", dateKey: "2026-05-06" },
      { id: "c", dateKey: "2026-05-13" },
    ];

    expect(groupItemsByDateKey(items, (item) => item.dateKey)).toEqual({ "2026-05-06": [items[0], items[1]], "2026-05-13": [items[2]] });
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
  });
});

describe("fuzzy search", () => {
  it("matches exact contiguous text ignoring case and accents", () => {
    expect(getExactMatchIndices("Préstamo tarjeta", "PREST")).toEqual([0, 1, 2, 3, 4]);
    expect(getExactMatchIndices("Préstamo tarjeta", "  tarjeta  ")).toEqual([9, 10, 11, 12, 13, 14, 15]);
    expect(getExactMatchIndices("AxxBxxC gasto", "abc")).toBeNull();
    expect(getExactMatchIndices("Agua", "   ")).toEqual([]);
  });

  it("ranks contiguous fuzzy matches before scattered ones", () => {
    const contiguousRank = getFuzzyMatchRank("tarjeta", "tarj");
    const scatteredRank = getFuzzyMatchRank("t-a-r-j", "tarj");

    expect(getFuzzyMatchIndices("AxxBxxC gasto", "abc")).toEqual([0, 3, 6]);
    expect(contiguousRank).not.toBeNull();
    expect(scatteredRank).not.toBeNull();
    expect(compareFuzzyMatchRank(contiguousRank!, scatteredRank!)).toBeLessThan(0);
  });

  it("highlights the matched segment with the given class", () => {
    const matchIndices = getExactMatchIndices("Préstamo tarjeta", "prest") ?? [];

    render(<div>{renderHighlightedText("Préstamo tarjeta", matchIndices, "exact-highlight", "exact-match")}</div>);

    expect(screen.getByText("Prést", { selector: "mark" })).toHaveClass("exact-highlight");
    expect(screen.getByText("amo tarjeta", { selector: "span" })).toBeInTheDocument();
  });
});
