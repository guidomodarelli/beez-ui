/** Verifies that stored rich text renders safe links through the public component. */
import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RichTextContent } from "@guidomodarelli/beez-ui";

describe("RichTextContent", () => {
  it("renders plain text without links", () => {
    render(<RichTextContent content="hola mundo" />);

    expect(screen.getByText("hola mundo")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("auto-detects a bare URL as a safe external link", () => {
    render(<RichTextContent content="entrá a https://example.com ahora" />);

    const link = screen.getByRole("link", { name: "https://example.com" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("renders a markdown link with custom text", () => {
    render(<RichTextContent content="[el curso](https://example.com)" />);

    const link = screen.getByRole("link", { name: "el curso" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("shows bracket text that is not a valid link unchanged", () => {
    render(<RichTextContent content="Material [PDF](pendiente) acá" />);

    expect(
      screen.getByText("[PDF](pendiente)", { exact: false })
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("invokes onLinkClick when a link is clicked", async () => {
    const user = userEvent.setup();
    const handleLinkClick = vi.fn((event) => event.preventDefault());

    render(
      <RichTextContent
        content="https://example.com"
        onLinkClick={handleLinkClick}
      />
    );

    await user.click(screen.getByRole("link"));

    expect(handleLinkClick).toHaveBeenCalledTimes(1);
  });
});
