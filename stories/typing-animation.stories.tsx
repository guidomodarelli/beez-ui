/** Demonstrates TypingAnimation through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TypingAnimation } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  children: string;
  duration: number;
  delay: number;
  showCursor: boolean;
  cursorStyle: "line" | "block" | "underscore";
  loop: boolean;
};

const meta = {
  title: "Components/TypingAnimation",
  args: {
    children: "Construí experiencias compartidas",
    duration: 70,
    delay: 0,
    showCursor: true,
    cursorStyle: "line",
    loop: false,
  },
  argTypes: {
    children: {
      control: "text",
    },
    duration: {
      control: {
        type: "range",
        min: 10,
        max: 200,
        step: 10,
      },
    },
    delay: {
      control: {
        type: "range",
        min: 0,
        max: 2000,
        step: 100,
      },
    },
    showCursor: {
      control: "boolean",
    },
    cursorStyle: {
      control: "select",
      options: ["line", "block", "underscore"],
    },
    loop: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: [
        "children",
        "duration",
        "delay",
        "showCursor",
        "cursorStyle",
        "loop",
      ],
    },
  },
  render: (args) => (
    <TypingAnimation key={JSON.stringify(args)} {...args} startOnView={false} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
