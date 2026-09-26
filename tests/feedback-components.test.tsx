/** Verifies loaders, progress, empty and error states, popovers and toggles through their public contracts. */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BeezUIProvider,
  BouncingDotsLoader,
  ConfirmDeleteButton,
  DropdownMenuItem,
  EmptyState,
  ErrorState,
  InfoPopover,
  ProgressRing,
  ReactionButton,
} from "beez-ui";

describe("BouncingDotsLoader", () => {
  it("announces the loading state with a default Spanish label", () => {
    render(<BouncingDotsLoader />);

    expect(screen.getByRole("status", { name: "Cargando..." })).toHaveAttribute("data-size", "md");
  });

  it("accepts a custom label, size and native attributes", () => {
    render(<BouncingDotsLoader label="Buscando mensajes" size="sm" id="loader" />);

    const loader = screen.getByRole("status", { name: "Buscando mensajes" });
    expect(loader).toHaveAttribute("data-size", "sm");
    expect(loader).toHaveAttribute("id", "loader");
  });
});

describe("ProgressRing", () => {
  it("stays decorative without a label", () => {
    const { container } = render(<ProgressRing fraction={0.5} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("exposes the clamped value when labelled and hides the arc when empty", () => {
    const { rerender, container } = render(<ProgressRing fraction={1.4} label="Cuotas pagadas" />);

    expect(screen.getByRole("progressbar", { name: "Cuotas pagadas" })).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressRing fraction={0} label="Cuotas pagadas" />);

    expect(screen.getByRole("progressbar", { name: "Cuotas pagadas" })).toHaveAttribute("aria-valuenow", "0");
    expect(container.querySelector('[data-slot="progress-ring-indicator"]')).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders a labelled section with the requested heading level and actions", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState eyebrow="Próximamente" title="Cursos" titleAs="h1" description="Esta sección está en construcción." size="page">
        <button type="button" onClick={onCreate}>
          Crear curso
        </button>
      </EmptyState>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Cursos" })).toBeInTheDocument();
    expect(screen.getByText("Próximamente")).toBeInTheDocument();
    expect(screen.getByText("Esta sección está en construcción.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear curso" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("uses a paragraph for minor regions", () => {
    render(<EmptyState title="No hay eventos este mes." titleAs="p" align="center" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("No hay eventos este mes.").tagName).toBe("P");
  });
});

describe("ErrorState", () => {
  it("retries and links home through the configured router adapter", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    /** Represents an application router link that receives the destination. */
    function RouterLink(props: React.ComponentProps<"a">) {
      return <a data-router="app" {...props} />;
    }

    render(
      <BeezUIProvider components={{ Link: RouterLink }}>
        <ErrorState
          eyebrow="Error 500"
          title="Algo salió mal"
          description="No pudimos cargar esta página."
          retryLabel="Reintentar"
          onRetry={onRetry}
          homeHref="/inicio"
          homeLabel="Volver al inicio"
        />
      </BeezUIProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/inicio");
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("data-router", "app");
  });

  it("omits the home action without a destination", () => {
    render(<ErrorState title="Error" description="Detalle" retryLabel="Reintentar" onRetry={() => {}} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("InfoPopover", () => {
  it("toggles the explanation on click and closes it with its close button", async () => {
    const user = userEvent.setup();
    render(<InfoPopover message="Una deuda es plata que te prestaron." labels={{ trigger: "Qué es una deuda", close: "Cerrar ayuda de deuda" }} />);

    const trigger = screen.getByRole("button", { name: "Qué es una deuda" });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByText("Una deuda es plata que te prestaron.")).toBeVisible());
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Cerrar ayuda de deuda" }));
    await waitFor(() => expect(screen.queryByText("Una deuda es plata que te prestaron.")).not.toBeInTheDocument());
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<InfoPopover message="Ayuda" />);

    await user.click(screen.getByRole("button", { name: "Más información" }));
    await waitFor(() => expect(screen.getByText("Ayuda")).toBeVisible());
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByText("Ayuda")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Más información" })).toHaveFocus();
  });
});

describe("ConfirmDeleteButton", () => {
  it("runs the deletion only after confirming", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDeleteButton message="¿Eliminar el gasto Luz?" onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Abrir acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Eliminar" }));
    const confirmation = await screen.findByRole("dialog", { name: "¿Eliminar el gasto Luz?" });
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(within(confirmation).getByRole("button", { name: "Confirmar" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancels without side effects and keeps extra menu items first", async () => {
    const onConfirm = vi.fn();
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDeleteButton
        message="¿Eliminar?"
        onConfirm={onConfirm}
        extraMenuItems={<DropdownMenuItem onSelect={onEdit}>Editar</DropdownMenuItem>}
        labels={{ menu: "Acciones del gasto", delete: "Borrar", cancel: "Volver" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Acciones del gasto" }));
    const menuItems = await screen.findAllByRole("menuitem");
    expect(menuItems.map((menuItem) => menuItem.textContent)).toEqual(["Editar", "Borrar"]);
    await user.click(menuItems[1]);
    await user.click(within(await screen.findByRole("dialog", { name: "¿Eliminar?" })).getByRole("button", { name: "Volver" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("ReactionButton", () => {
  /** Owns the optimistic reaction state like a consumer would. */
  function ReactionHarness() {
    const [isActive, setIsActive] = useState(false);
    const [count, setCount] = useState(2);

    return (
      <ReactionButton
        ariaLabel={`Me gusta ${count}`}
        isActive={isActive}
        count={count}
        onClick={() => {
          setIsActive(!isActive);
          setCount(isActive ? count - 1 : count + 1);
        }}
      />
    );
  }

  it("exposes the state as a pressed toggle and settles on the new count", async () => {
    const user = userEvent.setup();
    render(<ReactionHarness />);

    const button = screen.getByRole("button", { name: "Me gusta 2" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);

    const likedButton = screen.getByRole("button", { name: "Me gusta 3" });
    expect(likedButton).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(likedButton).toHaveTextContent(/^3$/));
  });

  it("does not react while disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ReactionButton ariaLabel="Me gusta 1" isActive={false} count={1} isDisabled onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Me gusta 1" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
