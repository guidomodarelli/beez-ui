/** Exercises shared theme behavior with the real provider and notification library. */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedThemeToggler, BeezUIProvider, ThemedToaster, toast } from "beez-ui";

const SCRIPT_TAG_WARNING = "Encountered a script tag";

/** Collects console errors, so React's rendering warnings can be asserted on. */
function captureConsoleErrors() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

afterEach(() => {
  vi.restoreAllMocks();
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

  it("should not render an inert theme script on client-only renders", () => {
    const consoleError = captureConsoleErrors();
    const { container } = render(<BeezUIProvider themeOptions={{ defaultTheme: "light" }}><p>Contenido</p></BeezUIProvider>);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(container.querySelector("script")).toHaveAttribute("type", "application/json");
    const messages = consoleError.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((message) => message.includes(SCRIPT_TAG_WARNING))).toEqual([]);
  });

  it("should keep the executable theme script in server HTML and hydrate it without warnings", async () => {
    const consoleError = captureConsoleErrors();
    const app = <BeezUIProvider themeOptions={{ defaultTheme: "light" }}><p>Contenido</p></BeezUIProvider>;
    const container = document.createElement("div");
    container.innerHTML = renderToString(app);
    const serverScript = container.querySelector("script");
    // The script must stay executable in server HTML, where it prevents a theme flash.
    expect(serverScript).not.toBeNull();
    expect(serverScript).not.toHaveAttribute("type");
    document.body.appendChild(container);
    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, app, { onRecoverableError: (error) => recoverableErrors.push(error) });
      });
      expect(recoverableErrors).toEqual([]);
      expect(screen.getByText("Contenido")).toBeInTheDocument();
      const messages = consoleError.mock.calls.map((call) => String(call[0]));
      expect(messages.filter((message) => message.includes(SCRIPT_TAG_WARNING))).toEqual([]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("should synchronize the toaster with the provider's resolved theme", async () => {
    const { container } = render(<BeezUIProvider themeOptions={{ defaultTheme: "dark", enableSystem: false }}><ThemedToaster /></BeezUIProvider>);
    act(() => { toast.success("Guardado"); });
    expect(await screen.findByText("Guardado")).toBeInTheDocument();
    expect(container.querySelector("[data-sonner-toaster]")).toHaveAttribute("data-sonner-theme", "dark");
  });
});
