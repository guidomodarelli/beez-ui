/** Verifies the restored link contract through native and configured rendering. */
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeezUIProvider, Link } from "beez-ui";

/** Represents an application adapter that receives the navigation hints. */
function ConsumerLink({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  return <a data-prefetch={String(prefetch)} {...props} />;
}

describe("Link", () => {
  it("should render a native anchor without framework attributes", () => {
    render(<Link href="/courses" prefetch>Cursos</Link>);
    expect(screen.getByRole("link", { name: "Cursos" })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link")).not.toHaveAttribute("prefetch");
  });

  it("should preserve explicit prefetch overrides through the adapter", () => {
    render(<BeezUIProvider components={{ Link: ConsumerLink }}><Link href="/courses" prefetch={false}>Cursos</Link></BeezUIProvider>);
    expect(screen.getByRole("link")).toHaveAttribute("data-prefetch", "false");
  });
});
