/** Demonstrates Alert through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, AlertTitle, AlertDescription } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  title: string;
  description: string;
  variant: "default" | "destructive";
};

const meta = {
  title: "Components/Alert",
  args: {
    title: "Cambios guardados",
    description: "La información está actualizada.",
    variant: "default",
  },
  argTypes: {
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
  parameters: { controls: { include: ["title", "description", "variant"] } },
  render: ({ title, description, variant }) => (
    <Alert variant={variant}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
