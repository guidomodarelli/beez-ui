/** Protects LaTribu defaults while adding compatible Agenda capabilities. */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, SidebarProvider, SidebarTrigger, useSidebar, SIDEBAR_COOKIE_NAME } from "beez-ui";

/** Displays the actual provider state used by consumers. */
function SidebarState() {
  return <output aria-label="Estado">{useSidebar().state}</output>;
}

afterEach(() => localStorage.clear());

describe("Agenda compatibility", () => {
  it("should expose button variant and size without replacing its accessible primitive", () => {
    render(<Button variant="outline" size="lg">Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("data-variant", "outline");
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("data-size", "lg");
  });

  it("should restore optional local preferences and keep the LaTribu cookie contract", async () => {
    localStorage.setItem("test.sidebar", "false");
    render(<SidebarProvider storageKey="test.sidebar"><SidebarState /><SidebarTrigger /></SidebarProvider>);
    await waitFor(() => expect(screen.getByLabelText("Estado")).toHaveTextContent("collapsed"));
    await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(localStorage.getItem("test.sidebar")).toBe("true");
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=true`);
  });

  it("should preserve server-provided defaults without opting into local preferences", () => {
    localStorage.setItem("test.sidebar", "false");
    render(<SidebarProvider defaultOpen><SidebarState /></SidebarProvider>);
    expect(screen.getByLabelText("Estado")).toHaveTextContent("expanded");
  });
});
