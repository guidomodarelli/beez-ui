/** Exercises shared theme behavior with the real provider and notification library. */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AnimatedThemeToggler, BeezUIProvider, ThemedToaster, toast } from "beez-ui";

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark", "light");
  act(() => { toast.dismiss(); });
});

describe("provider theme", () => {
  it("should let the native orchestrator drive the toggle and persist the selected theme", async () => {
    render(<BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><AnimatedThemeToggler /></BeezUIProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Alternar tema" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Oscuro" }));
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("should synchronize the toaster with the provider's resolved theme", async () => {
    const { container } = render(<BeezUIProvider themeOptions={{ defaultTheme: "dark", enableSystem: false }}><ThemedToaster /></BeezUIProvider>);
    act(() => { toast.success("Guardado"); });
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(container.querySelector("[data-sonner-toaster]")).toHaveAttribute("data-sonner-theme", "dark");
  });
});
