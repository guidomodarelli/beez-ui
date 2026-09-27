/** Verifies the public motion primitives through real Motion rendering and user interaction. */
import { describe, expect, it, vi, afterEach } from "vitest";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionGlobalConfig } from "motion/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatedCollapse, AnimatedCount, AnimatedListItem, BeezUIProvider, Dialog, DialogContent, DialogDescription, DialogTitle, PresenceSwap } from "beez-ui";

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

  it("settles when a returning state changes again as the previous exit finishes", async () => {
    /** Instant animations finish the exit in the same batch as the follow-up change, deterministically. */
    MotionGlobalConfig.skipAnimations = true;
    function RetryHarness() {
      const [status, setStatus] = useState<"loading" | "error" | "loaded">("error");
      return (
        <>
          <button type="button" onClick={() => setStatus("loading")}>Cargar</button>
          <button type="button" onClick={() => setStatus("error")}>Fallar</button>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              queueMicrotask(() => setStatus("loaded"));
            }}
          >
            Reintentar
          </button>
          <PresenceSwap presenceKey={status}>
            <p>{status === "error" ? "No pudimos cargar" : status === "loading" ? "Cargando" : "Listo"}</p>
          </PresenceSwap>
        </>
      );
    }
    try {
      const user = userEvent.setup();
      render(<RetryHarness />);

      await user.click(screen.getByRole("button", { name: "Cargar" }));
      await waitFor(() => expect(screen.queryByText("No pudimos cargar")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Fallar" }));
      await waitFor(() => expect(screen.queryByText("Cargando")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Reintentar" }));

      expect(await screen.findByText("Listo")).toBeInTheDocument();
      expect(screen.queryByText("Cargando")).not.toBeInTheDocument();
    } finally {
      MotionGlobalConfig.skipAnimations = false;
    }
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

  it("settles on the latest state when a swapped region changes several times in a row", async () => {
    preferReducedMotion();
    /** Moves through error, loading and loaded like a retried request. */
    function RetryHarness() {
      const [status, setStatus] = useState("error");
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setTimeout(() => setStatus("loaded"), 0);
            }}
          >
            Reintentar
          </button>
          <PresenceSwap presenceKey={status}>
            <p>{status === "error" ? "No pudimos cargar" : status === "loading" ? "Cargando" : "Listo"}</p>
          </PresenceSwap>
        </>
      );
    }
    const user = userEvent.setup();
    render(<RetryHarness />);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Listo")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("No pudimos cargar")).not.toBeInTheDocument();
      expect(screen.queryByText("Cargando")).not.toBeInTheDocument();
    });
  });

  it("settles nested swaps inside a dialog after a retried load", async () => {
    preferReducedMotion();
    /** Loads, fails, retries and shows nested swapped regions, like a subscription dialog. */
    function DialogRetryHarness() {
      const [status, setStatus] = useState<"loading" | "error" | "loaded">("loading");
      useEffect(() => {
        if (status !== "loading") return;
        const timeoutId = setTimeout(() => setStatus((current) => (current === "loading" && !hasRetried.current ? "error" : "loaded")), 0);
        return () => clearTimeout(timeoutId);
      }, [status]);
      const hasRetried = useRef(false);
      return (
        <Dialog open>
          <DialogContent>
            <DialogTitle>Suscripción</DialogTitle>
            <DialogDescription>Estado del link</DialogDescription>
            <PresenceSwap presenceKey={status}>
              {status === "error" ? (
                <button type="button" onClick={() => { hasRetried.current = true; setStatus("loading"); }}>Reintentar</button>
              ) : status === "loading" ? (
                <p>Cargando</p>
              ) : (
                <>
                  <PresenceSwap presenceKey="status"><p>Sin link activo</p></PresenceSwap>
                  <PresenceSwap presenceKey="actions"><button type="button">Generar link</button></PresenceSwap>
                </>
              )}
            </PresenceSwap>
          </DialogContent>
        </Dialog>
      );
    }
    const user = userEvent.setup();
    render(<BeezUIProvider><DialogRetryHarness /></BeezUIProvider>);

    await user.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("button", { name: "Generar link" })).toBeInTheDocument();
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
