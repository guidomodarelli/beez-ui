/** Demonstrates BouncingDotsLoader through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BouncingDotsLoader } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { label: string; size: "sm" | "md" };

const meta = {
  title: "Components/BouncingDotsLoader",
  args: { label: "Cargando...", size: "md" },
  argTypes: { label: { control: "text" }, size: { control: "select", options: ["sm", "md"] } },
  parameters: { controls: { include: ["label", "size"] } },
  render: ({ label, size }) => <BouncingDotsLoader label={label} size={size} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
