import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider, SidebarTrigger, SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_OPEN_VALUE, SidebarMenuSkeleton } from "beez-ui";



describe("SidebarMenuSkeleton", () => {
  it("should hydrate without recoverable errors when browser randomness differs from the server", async () => {
    const recoverableErrors: unknown[] = [];
    const container = document.createElement("div");
    const originalMathRandom = Math.random;
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let consoleErrorCalls: unknown[][] = [];

    try {
      Math.random = vi.fn(() => 0.1);
      container.innerHTML = renderToString(<SidebarMenuSkeleton showIcon />);

      Math.random = vi.fn(() => 0.9);

      const root = hydrateRoot(container, <SidebarMenuSkeleton showIcon />, {
        onRecoverableError: (error) => {
          recoverableErrors.push(error);
        },
      });

      await act(async () => {
        await Promise.resolve();
      });

      root.unmount();
      consoleErrorCalls = consoleErrorSpy.mock.calls;
    } finally {
      Math.random = originalMathRandom;
      consoleErrorSpy.mockRestore();
    }

    expect(recoverableErrors).toEqual([]);
    expect(consoleErrorCalls).toEqual([]);
  });
});

describe("SidebarProvider persistence", () => {
  it("should serialize expanded navigation using the server consumer cookie contract", async () => {
    render(<SidebarProvider defaultOpen={false}><SidebarTrigger aria-label="Abrir navegación" /></SidebarProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Abrir navegación" }));
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=${SIDEBAR_COOKIE_OPEN_VALUE}`);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=; max-age=0; path=/`;
  });
});
