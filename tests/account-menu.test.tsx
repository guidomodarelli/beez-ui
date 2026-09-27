/** Verifies the account menu session actions, avatar fallbacks and trigger variants. */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountMenu, BeezUIProvider, DropdownMenuItem } from "beez-ui";

const ACCOUNT = { name: "Ana López", email: "ana@example.com" };

describe("AccountMenu", () => {
  it("offers sign-out to an authenticated account and shows its identity", async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();
    render(<AccountMenu {...ACCOUNT} status="authenticated" onSignOut={onSignOut} />);

    await user.click(screen.getByRole("button", { name: "Menú de cuenta" }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveTextContent("Ana López");
    expect(menu).toHaveTextContent("ana@example.com");
    await user.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("offers sign-in as a callback when signed out", async () => {
    const onSignIn = vi.fn();
    const user = userEvent.setup();
    render(<AccountMenu name="Invitado" email="Sin cuenta" status="unauthenticated" onSignIn={onSignIn} onSignOut={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Menú de cuenta" }));
    await user.click(await screen.findByRole("menuitem", { name: "Iniciar sesión" }));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("offers sign-in as a link through the router adapter", async () => {
    const user = userEvent.setup();
    /** Represents an application router link. */
    function RouterLink(props: React.ComponentProps<"a">) {
      return <a data-router="app" {...props} />;
    }
    render(
      <BeezUIProvider components={{ Link: RouterLink }}>
        <AccountMenu name="Invitado" email="Sin correo" status="unauthenticated" signInHref="/ingresar" onSignOut={vi.fn()} />
      </BeezUIProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Menú de cuenta" }));
    const signInLink = await screen.findByRole("menuitem", { name: "Iniciar sesión" });

    expect(signInLink).toHaveAttribute("href", "/ingresar");
    expect(signInLink).toHaveAttribute("data-router", "app");
  });

  it("keeps sign-out unavailable while disabled", async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();
    render(<AccountMenu {...ACCOUNT} status="authenticated" onSignOut={onSignOut} signOutDisabled />);

    await user.click(screen.getByRole("button", { name: "Menú de cuenta" }));
    const signOutItem = await screen.findByRole("menuitem", { name: "Cerrar sesión" });
    expect(signOutItem).toHaveAttribute("aria-disabled", "true");
    await user.click(signOutItem);

    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("uses the name initials as fallback and names only the trigger avatar", async () => {
    const user = userEvent.setup();
    render(<AccountMenu {...ACCOUNT} status="authenticated" onSignOut={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Menú de cuenta" })).toHaveTextContent("AL");
    await user.click(screen.getByRole("button", { name: "Menú de cuenta" }));
    await screen.findByRole("menu");

    // The header repeats the avatar next to the visible name, so it stays decorative.
    expect(screen.getAllByText("AL")).toHaveLength(2);
    expect(screen.getAllByText("AL", { ignore: "[aria-hidden=true]" })).toHaveLength(1);
  });

  it("applies the class names of every trigger and menu part", async () => {
    const user = userEvent.setup();
    render(
      <AccountMenu
        {...ACCOUNT}
        status="authenticated"
        triggerVariant="sidebar"
        classNames={{ triggerText: "text-part", triggerName: "name-part", triggerEmail: "email-part", header: "header-part", item: "item-part" }}
        onSignOut={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Menú de cuenta" });
    expect(trigger.querySelector(".text-part")).toHaveTextContent("Ana López");
    expect(trigger.querySelector(".name-part")).toHaveTextContent("Ana López");
    expect(trigger.querySelector(".email-part")).toHaveTextContent("ana@example.com");
    await user.click(trigger);
    expect(await screen.findByRole("menuitem", { name: "Cerrar sesión" })).toHaveClass("item-part");
    expect(screen.getByRole("menu").querySelector(".header-part")).toHaveTextContent("ana@example.com");
  });

  it("renders the sidebar trigger with identity, custom labels and extra items", async () => {
    const onOpenSettings = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountMenu
        {...ACCOUNT}
        status="authenticated"
        triggerVariant="sidebar"
        showStatusBadge
        labels={{ trigger: "Cuenta de Google conectada", signOut: "Desconectar" }}
        onSignOut={vi.fn()}
      >
        <DropdownMenuItem onSelect={onOpenSettings}>Ajustes</DropdownMenuItem>
      </AccountMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Cuenta de Google conectada" });
    expect(trigger).toHaveTextContent("ana@example.com");
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "Ajustes" }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
