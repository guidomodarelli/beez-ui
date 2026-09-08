/** Verifies responsive image generation through the native provider without mocking Unpic. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarImage, BeezUIProvider } from "beez-ui";

describe("Unpic adapter", () => {
  it("should use the detected CDN's responsive URLs and preserve image load events", () => {
    render(<BeezUIProvider><Avatar><AvatarImage src="https://images.unsplash.com/photo-example" alt="Perfil" /></Avatar></BeezUIProvider>);
    const image = screen.getByAltText("Perfil") as HTMLImageElement;
    expect(new URL(image.src).searchParams.get("w")).toBe("40");
    expect(image.srcset).not.toBe("");
    fireEvent.load(image);
    expect(screen.getByRole("img", { name: "Perfil" })).toBeInTheDocument();
  });

  it("should preserve a source that has no configured image service", () => {
    render(<BeezUIProvider><Avatar><AvatarImage src="/profile.png" alt="Perfil" /></Avatar></BeezUIProvider>);
    expect((screen.getByAltText("Perfil") as HTMLImageElement).src).toBe(new URL("/profile.png", window.location.href).href);
  });
});
