/** Verifies that motion slots keep the primitives' public contracts intact. */
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Checkbox,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "beez-ui";

describe("Motion slots", () => {
  it("should forward the consumer ref of a gliding tab list and keep keyboard selection", async () => {
    const user = userEvent.setup();
    const listRef = createRef<HTMLDivElement>();
    render(
      <Tabs defaultValue="resumen">
        <TabsList ref={listRef} aria-label="Secciones">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">Contenido del resumen</TabsContent>
        <TabsContent value="detalle">Contenido del detalle</TabsContent>
      </Tabs>,
    );
    expect(listRef.current).toBe(screen.getByRole("tablist", { name: "Secciones" }));
    await user.click(screen.getByRole("tab", { name: "Resumen" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Detalle" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Contenido del detalle")).toBeInTheDocument();
  });

  it("should keep the checkbox mark mounted so its exit can play before CSS hides it", async () => {
    const user = userEvent.setup();
    const { container } = render(<Checkbox aria-label="Recibir novedades" />);
    const checkbox = screen.getByRole("checkbox", { name: "Recibir novedades" });
    const indicator = () => container.querySelector("[data-slot=checkbox-indicator]");
    expect(indicator()).toHaveAttribute("data-state", "unchecked");
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(indicator()).toHaveAttribute("data-state", "checked");
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(indicator()).toHaveAttribute("data-state", "unchecked");
  });
});
