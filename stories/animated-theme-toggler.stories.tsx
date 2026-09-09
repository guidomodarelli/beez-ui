/** Demonstrates AnimatedThemeToggler through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedThemeToggler } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { disabled: boolean; duration: number };

const meta = {
  title: "Components/AnimatedThemeToggler",
  args: {
    disabled: false,
    duration: 400,
  },
  argTypes: {
    disabled: {
      control: "boolean",
    },
    duration: {
      control: {
        type: "range",
        min: 0,
        max: 1500,
        step: 100,
      },
    },
  },
  parameters: { controls: { include: ["disabled", "duration"] } },
  render: (args) => <AnimatedThemeToggler {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
