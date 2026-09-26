/** Demonstrates EmptyState through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, EmptyState } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { eyebrow: string; title: string; description: string; align: "start" | "center"; size: "page" | "inline" };

const meta = {
  title: "Components/EmptyState",
  args: { eyebrow: "Próximamente", title: "Cursos", description: "Esta sección está en construcción.", align: "start", size: "page" },
  argTypes: {
    eyebrow: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
    align: { control: "select", options: ["start", "center"] },
    size: { control: "select", options: ["page", "inline"] },
  },
  parameters: { controls: { include: ["eyebrow", "title", "description", "align", "size"] } },
  render: (args) => (
    <EmptyState {...args}>
      <Button>Crear el primero</Button>
    </EmptyState>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
