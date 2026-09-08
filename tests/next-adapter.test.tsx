/** Verifies the optional entrypoint using real Next.js and Base UI components. */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar, AvatarFallback, AvatarImage, PaginationNext } from "beez-ui";
import { NextBeezUIProvider } from "beez-ui/next";

describe("NextBeezUIProvider", () => {
  it("should activate Next Image while preserving the avatar lifecycle", async () => {
    render(<NextBeezUIProvider><Avatar><AvatarImage src="/profile.png" alt="Perfil" /><AvatarFallback>GH</AvatarFallback></Avatar></NextBeezUIProvider>);
    const image = screen.getByAltText("Perfil");
    expect(image).toHaveAttribute("data-nimg", "1");
    expect((image as HTMLImageElement).src).toBe(new URL("/profile.png", window.location.href).href);
    fireEvent.load(image);
    expect(await screen.findByRole("img", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.queryByText("GH")).not.toBeInTheDocument();
    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Perfil" })).not.toBeInTheDocument();
  });

  it("should opt into the Next image optimizer when requested", () => {
    render(<NextBeezUIProvider optimizeImages><Avatar><AvatarImage src="/profile.png" alt="Perfil" /></Avatar></NextBeezUIProvider>);
    expect(screen.getByAltText("Perfil").getAttribute("src")).toContain("/_next/image?");
  });

  it("should preserve navigation hrefs through the Next adapter", () => {
    render(<NextBeezUIProvider><PaginationNext href="/page/2" text="Siguiente" /></NextBeezUIProvider>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/page/2");
  });
});
