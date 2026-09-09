/** Demonstrates Form with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Input,
  Button,
} from "beez-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
/** Exercises validation and submission with the actual form provider. */
function FormExample({
  defaultName,
  required,
  disabled,
}: {
  defaultName: string;
  required: boolean;
  disabled: boolean;
}) {
  const form = useForm({ defaultValues: { name: defaultName } });
  const [submitted, setSubmitted] = useState("");
  return (
    <Form {...form}>
      <form
        className="StoryStack"
        onSubmit={form.handleSubmit((values) =>
          setSubmitted(values.name || "Sin nombre"),
        )}
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: required ? "Ingresá tu nombre" : false }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormDescription>
                Completá el campo y enviá el formulario.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={disabled}>
          Guardar
        </Button>
        <output aria-label="Resultado">
          {submitted ? `Guardado: ${submitted}` : ""}
        </output>
      </form>
    </Form>
  );
}
/** Editable inputs specific to this example. */
type Args = { defaultName: string; required: boolean; disabled: boolean };
const meta = {
  title: "Components/Form",
  args: {
    defaultName: "",
    required: true,
    disabled: false,
  },
  argTypes: {
    defaultName: {
      control: "text",
    },
    required: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["defaultName", "required", "disabled"] },
  },
  render: (args) => <FormExample key={JSON.stringify(args)} {...args} />,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
