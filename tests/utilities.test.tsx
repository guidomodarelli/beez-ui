/** Verifies the framework-neutral helpers exported by the package root. */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  classifyFiles,
  compareFuzzyMatchRank,
  formatFileSize,
  getExactMatchIndices,
  getFuzzyMatchIndices,
  getFuzzyMatchRank,
  isFileTypeAccepted,
  renderHighlightedText,
} from "beez-ui";
import { HORIZONTAL_SWIPE_DIRECTION, resolveHorizontalSwipe } from "beez-ui/hooks";

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = 1024 * 1024;

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
