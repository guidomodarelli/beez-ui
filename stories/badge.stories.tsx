/** Demonstrates Badge through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  children: string;
  variant:
    "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
};

const meta = {
  title: "Components/Badge",
  args: {
    children: "Publicado",
    variant: "default",
  },
  argTypes: {
    children: {
      control: "text",
    },
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
  },
  parameters: { controls: { include: ["children", "variant"] } },
  render: (args) => <Badge {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
