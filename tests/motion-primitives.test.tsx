/** Verifies the public motion primitives through real Motion rendering and user interaction. */
import { describe, expect, it, vi, afterEach } from "vitest";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatedCollapse, AnimatedCount, AnimatedListItem, PresenceSwap } from "beez-ui";

function CollapseHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
        Detalles
      </button>
      <AnimatedCollapse isOpen={isOpen} id="details-region">
        <p>Contenido expandido</p>
      </AnimatedCollapse>
    </>
  );
}

function CounterHarness() {
  const [count, setCount] = useState(3);

  return (
    <>
      <button type="button" onClick={() => setCount((current) => current + 1)}>
        Sumar
      </button>
      <button type="button" onClick={() => setCount((current) => current - 1)}>
        Restar
      </button>
      <output aria-label="Total">
        <AnimatedCount value={count} format={(value) => `${value} me gusta`} />
      </output>
    </>
  );
}

function ListHarness() {
  const [items, setItems] = useState(["Ana", "Bruno"]);

  return (
    <>
      <button type="button" onClick={() => setItems((current) => [...current, "Carla"])}>
        Agregar
      </button>
      <button type="button" onClick={() => setItems((current) => current.slice(1))}>
        Quitar primero
      </button>
      <ul aria-label="Miembros">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <AnimatedListItem key={item}>{item}</AnimatedListItem>
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}

function SwapHarness() {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsSaved(true)}>
        Guardar
      </button>
      <PresenceSwap presenceKey={isSaved ? "saved" : "idle"}>
        {isSaved ? <p>Cambios guardados</p> : <p>Sin cambios</p>}
      </PresenceSwap>
    </>
  );
}

describe("motion primitives", () => {
  it("expands and collapses the region, removing it from the DOM when closed", async () => {
    const user = userEvent.setup();
    render(<CollapseHarness />);

    expect(screen.queryByText("Contenido expandido")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Detalles" }));
    await waitFor(() => expect(screen.getByText("Contenido expandido")).toBeVisible());
    expect(document.getElementById("details-region")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Detalles" }));
    await waitFor(() => expect(screen.queryByText("Contenido expandido")).not.toBeInTheDocument());
  });

  it("renders the initial region open without hiding it behind an entrance", () => {
    render(
      <AnimatedCollapse isOpen>
        <p>Visible desde el servidor</p>
      </AnimatedCollapse>
    );

    expect(screen.getByText("Visible desde el servidor").parentElement).not.toHaveStyle({ opacity: "0" });
  });

  it("settles on the latest value after increments and decrements", async () => {
    const user = userEvent.setup();
    render(<CounterHarness />);

    expect(screen.getByRole("status", { name: "Total" })).toHaveTextContent("3 me gusta");

    await user.click(screen.getByRole("button", { name: "Sumar" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Total" })).toHaveTextContent(/^4 me gusta$/));

    await user.click(screen.getByRole("button", { name: "Restar" }));
    await user.click(screen.getByRole("button", { name: "Restar" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Total" })).toHaveTextContent(/^2 me gusta$/));
  });

  it("adds new items and removes leaving ones from the list", async () => {
    const user = userEvent.setup();
    render(<ListHarness />);

    const list = screen.getByRole("list", { name: "Miembros" });
    expect(list.querySelectorAll("li")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(await screen.findByText("Carla")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar primero" }));
    const leavingItem = screen.queryByText("Ana")?.closest("li");
    if (leavingItem) {
      expect(leavingItem).toHaveAttribute("inert");
      expect(leavingItem).toHaveAttribute("aria-hidden", "true");
    }
    await waitFor(() => expect(screen.queryByText("Ana")).not.toBeInTheDocument());
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Bruno", "Carla"]);
  });

  it("swaps keyed content and leaves only the new state", async () => {
    const user = userEvent.setup();
    render(<SwapHarness />);

    expect(screen.getByText("Sin cambios")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Sin cambios")).not.toBeInTheDocument());
  });
});

describe("motion primitives with reduced motion", () => {
  afterEach(() => vi.restoreAllMocks());

  /** Emulates the browser preference without replacing React or the shared components. */
  function preferReducedMotion() {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    }));
  }

  it("replaces the counter value without keeping the previous one on screen", async () => {
    preferReducedMotion();
    const user = userEvent.setup();
    render(<CounterHarness />);

    await user.click(screen.getByRole("button", { name: "Sumar" }));

    expect(screen.getByRole("status", { name: "Total" })).toHaveTextContent(/^4 me gusta$/);
  });

  it("removes a collapsed region as soon as it closes", async () => {
    preferReducedMotion();
    const user = userEvent.setup();
    render(<CollapseHarness />);

    await user.click(screen.getByRole("button", { name: "Detalles" }));
    await waitFor(() => expect(screen.getByText("Contenido expandido")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Detalles" }));

    await waitFor(() => expect(screen.queryByText("Contenido expandido")).not.toBeInTheDocument());
  });
});
