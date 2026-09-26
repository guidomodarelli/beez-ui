/**
 * Verifies the optional emoji picker entrypoint and the PWA update control where jsdom can run them.
 * Picking an emoji (IntersectionObserver) and applying updates (Service Worker) run in tests/browser.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { EmojiPicker } from "beez-ui/emoji-picker";
import { PwaUpdateControl } from "beez-ui";

describe("EmojiPicker", () => {
  it("renders on the server without loading the picker library", () => {
    const serverMarkup = renderToString(<EmojiPicker label="Ícono" value="" onChange={vi.fn()} />);

    expect(serverMarkup).toContain("Ícono");
    expect(serverMarkup).not.toContain("EmojiPickerReact");
  });

  it("keeps the label for assistive technology when visually hidden", () => {
    render(<EmojiPicker label="Ícono" value="🎉" onChange={vi.fn()} isLabelVisuallyHidden disabled />);

    expect(screen.getByText("Ícono")).toHaveClass("sr-only");
    expect(screen.getByRole("button", { name: "Elegir emoji" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Elegir emoji" })).toHaveTextContent("🎉");
  });
});

describe("PwaUpdateControl", () => {
  it("renders nothing on the server and in browsers without service workers", () => {
    expect(renderToString(<PwaUpdateControl />)).toBe("");

    const { container } = render(<PwaUpdateControl />);

    // jsdom has no Service Worker API; the real update flow is covered in tests/browser.
    expect("serviceWorker" in navigator).toBe(false);
    expect(container).toBeEmptyDOMElement();
  });
});
