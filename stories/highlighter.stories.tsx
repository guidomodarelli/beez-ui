/** Demonstrates Highlighter through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Highlighter } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  children: string;
  action:
    | "highlight"
    | "underline"
    | "box"
    | "circle"
    | "strike-through"
    | "crossed-off"
    | "bracket";
  color: string;
  strokeWidth: number;
  animationDuration: number;
};

const meta = {
  title: "Components/Highlighter",
  args: {
    children: "Una idea para destacar",
    action: "underline",
    color: "#6366f1",
    strokeWidth: 2,
    animationDuration: 600,
  },
  argTypes: {
    children: {
      control: "text",
    },
    action: {
      control: "select",
      options: [
        "highlight",
        "underline",
        "box",
        "circle",
        "strike-through",
        "crossed-off",
        "bracket",
      ],
    },
    color: {
      control: "color",
    },
    strokeWidth: {
      control: {
        type: "range",
        min: 1,
        max: 8,
        step: 1,
      },
    },
    animationDuration: {
      control: {
        type: "range",
        min: 0,
        max: 2000,
        step: 100,
      },
    },
  },
  parameters: {
    controls: {
      include: [
        "children",
        "action",
        "color",
        "strokeWidth",
        "animationDuration",
      ],
    },
  },
  render: (args) => <Highlighter {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
