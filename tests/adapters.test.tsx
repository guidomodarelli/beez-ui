/** Exercises framework-neutral adapters through the public orchestration boundary. */
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar, AvatarImage, BeezUIProvider, PaginationNext } from "beez-ui";

/** Models a consumer-owned router without mocking a library implementation. */
function ConsumerLink(props: ComponentProps<"a">) {
  return <a data-router="consumer" {...props} />;
}

/** Models a consumer-owned image renderer and forwards native browser events. */
function ConsumerImage(props: ComponentProps<"img">) {
  return <img data-image-adapter="consumer" {...props} />;
}

describe("BeezUIProvider", () => {
  it("should render a native link without an orchestrator", () => {
    render(<PaginationNext href="/page/2" text="Siguiente" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/page/2");
    expect(screen.getByRole("link")).not.toHaveAttribute("data-router");
  });

  it("should apply the consumer adapters while preserving the image lifecycle", () => {
    render(<BeezUIProvider components={{ Link: ConsumerLink, Image: ConsumerImage }}><PaginationNext href="/page/2" text="Siguiente" /><Avatar><AvatarImage src="/profile.png" alt="Perfil" /></Avatar></BeezUIProvider>);
    expect(screen.getByRole("link")).toHaveAttribute("data-router", "consumer");
    const image = screen.getByAltText("Perfil");
    expect(image).toHaveAttribute("data-image-adapter", "consumer");
    fireEvent.load(image);
    expect(screen.getByRole("img", { name: "Perfil" })).toBeInTheDocument();
    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Perfil" })).not.toBeInTheDocument();
  });
});
