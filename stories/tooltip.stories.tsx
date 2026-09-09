/** Demonstrates Tooltip as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  content: string;
  side: "top" | "right" | "bottom" | "left";
  sideOffset: number;
};
const meta = {
  title: "Components/Tooltip",
  args: {
    content: "Guardá los cambios pendientes",
    side: "top",
    sideOffset: 6,
  },
  argTypes: {
    content: {
      control: "text",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    sideOffset: {
      control: {
        type: "range",
        min: 0,
        max: 24,
        step: 1,
      },
    },
  },
  parameters: { controls: { include: ["content", "side", "sideOffset"] } },
  render: ({ content, side, sideOffset }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Pasá el cursor o enfocá</Button>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {content}
      </TooltipContent>
    </Tooltip>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
