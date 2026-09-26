/** Verifies the form parts' accessible wiring and their misuse guard with real react-hook-form. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "beez-ui";

afterEach(() => vi.restoreAllMocks());

/** Requires a name, so submitting empty shows the validation message. */
function NameForm() {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)} noValidate>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "El nombre es obligatorio" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}

/** Uses a form label without the enclosing field that provides its name. */
function OrphanLabelForm() {
  const form = useForm();
  return (
    <Form {...form}>
      <FormItem>
        <FormLabel>Sin campo</FormLabel>
      </FormItem>
    </Form>
  );
}

describe("Form", () => {
  it("should label the control and announce its validation message", async () => {
    const user = userEvent.setup();
    render(<NameForm />);
    const input = screen.getByRole("textbox", { name: "Nombre" });
    expect(input).toHaveAttribute("aria-invalid", "false");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("El nombre es obligatorio");
  });

  it("should reject form parts used outside a FormField with an actionable error", () => {
    // React logs the thrown render error; silencing it keeps the report focused on the assertion.
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<OrphanLabelForm />)).toThrow(
      "useFormField: must be used within <FormField>",
    );
  });
});
