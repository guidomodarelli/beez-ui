/** Demonstrates Label through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label, Input } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { children: string; disabled: boolean };

const meta = {
  title: "Components/Label",
  args: {
    children: "Correo electrónico",
    disabled: false,
  },
  argTypes: {
    children: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["children", "disabled"] } },
  render: ({ children, disabled }) => (
    <div className="StoryStack">
      <Label htmlFor="story-label">{children}</Label>
      <Input
        id="story-label"
        type="email"
        placeholder="nombre@ejemplo.com"
        disabled={disabled}
      />
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
