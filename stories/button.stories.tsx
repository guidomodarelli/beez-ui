/** Demonstrates Button through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "beez-ui";
import { Save } from "lucide-react";
import { fn } from "storybook/test";
/** Editable inputs specific to this example. */
type Args = {
  children: string;
  variant:
    "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size:
    "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  disabled: boolean;
};

const meta = {
  title: "Components/Button",
  args: {
    children: "Guardar cambios",
    variant: "default",
    size: "default",
    disabled: false,
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
    size: {
      control: "select",
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["children", "variant", "size", "disabled"] },
  },
  render: ({ children, ...args }) => (
    <Button {...args} aria-label={children} onClick={fn()}>
      {args.size.startsWith("icon") ? <Save aria-hidden="true" /> : children}
    </Button>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
