/** Exercises newly shared primitives with their real runtime integrations. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { Alert, AlertTitle, AlertDescription, AnimatedThemeToggler, Calendar, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Highlighter, Input, InputGroup, InputGroupAddon, InputGroupInput, RadioGroup, RadioGroupItem, ThemedToaster, toast, TypingAnimation } from "beez-ui";

/** Composes the shared form primitives with their actual validation provider. */
function RequiredForm() {
  const form = useForm({ defaultValues: { name: "" } });
  return <Form {...form}><form onSubmit={form.handleSubmit(() => undefined)}><FormField control={form.control} name="name" rules={{ required: "Ingresá tu nombre" }} render={({ field }) => <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><button type="submit">Guardar</button></form></Form>;
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark", "light");
  act(() => { toast.dismiss(); });
  vi.restoreAllMocks();
});

describe("Agenda primitives", () => {
  it("should render an accessible alert with its actionable explanation", () => {
    render(<Alert><AlertTitle>Revisá los datos</AlertTitle><AlertDescription>Completá los campos requeridos.</AlertDescription></Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Completá los campos requeridos.");
  });

  it("should focus the input when its addon is activated", async () => {
    render(<InputGroup><InputGroupAddon>Buscar</InputGroupAddon><InputGroupInput aria-label="Búsqueda" /></InputGroup>);
    await userEvent.click(screen.getByText("Buscar"));
    expect(screen.getByRole("textbox", { name: "Búsqueda" })).toHaveFocus();
  });

  it("should select a radio choice through its accessible label", async () => {
    render(<RadioGroup><RadioGroupItem value="weekly" aria-label="Semanal" /><RadioGroupItem value="monthly" aria-label="Mensual" /></RadioGroup>);
    await userEvent.click(screen.getByRole("radio", { name: "Mensual" }));
    expect(screen.getByRole("radio", { name: "Mensual" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Semanal" })).not.toBeChecked();
  });

  it("should associate validation feedback with the real form field", async () => {
    render(<RequiredForm />);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Ingresá tu nombre")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveAttribute("aria-invalid", "true");
  });

  it("should select a calendar date while preserving the Spanish locale", async () => {
    const onSelect = vi.fn();
    render(<Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /jueves, 10 de septiembre/i }));
    expect(onSelect).toHaveBeenCalled();
    expect(onSelect.mock.calls[0][0]).toEqual(new Date(2026, 8, 10));
  });

  it("should apply the dark theme without requiring the View Transition API", async () => {
    const onThemeChange = vi.fn();
    render(<AnimatedThemeToggler theme="light" resolvedTheme="light" onThemeChange={onThemeChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Alternar tema" }));
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Oscuro" }));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("should render a real themed notification", async () => {
    const { container } = render(<ThemedToaster theme="dark" />);
    act(() => { toast.success("Cambios guardados"); });
    expect(await screen.findByText("Cambios guardados")).toBeInTheDocument();
    expect(container.querySelector("[data-sonner-toaster]")).toHaveAttribute("data-sonner-theme", "dark");
  });

  it("should complete typing and reset when the source text changes", async () => {
    const { rerender } = render(<TypingAnimation startOnView={false} duration={1} showCursor={false}>Hola</TypingAnimation>);
    expect(await screen.findByText("Hola")).toBeInTheDocument();
    rerender(<TypingAnimation startOnView={false} duration={1} showCursor={false}>Adiós</TypingAnimation>);
    expect(await screen.findByText("Adiós")).toBeInTheDocument();
    expect(screen.queryByText("Hola")).not.toBeInTheDocument();
  });

  it("should remove an annotation when its content unmounts", () => {
    const { unmount } = render(<Highlighter>Importante</Highlighter>);
    fireEvent(window, new Event("resize"));
    expect(document.querySelector("svg.rough-annotation")).not.toBeNull();
    unmount();
    expect(document.querySelector("svg.rough-annotation")).toBeNull();
  });
});
