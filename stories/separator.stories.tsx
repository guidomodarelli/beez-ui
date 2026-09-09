/** Demonstrates Separator through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { orientation: "horizontal" | "vertical" };

const meta = {
  title: "Components/Separator",
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  parameters: { controls: { include: ["orientation"] } },
  render: ({ orientation }) => (
    <div
      className={
        orientation === "vertical"
          ? "StoryRow StoryVerticalSeparator"
          : "StoryStack"
      }
    >
      <span>Primera sección</span>
      <Separator orientation={orientation} />
      <span>Segunda sección</span>
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
