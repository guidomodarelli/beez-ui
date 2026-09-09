/** Demonstrates Popover as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  title: string;
  description: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};
const meta = {
  title: "Components/Popover",
  args: {
    open: false,
    title: "Información adicional",
    description: "Un detalle contextual sin abandonar la página.",
    side: "bottom",
    align: "center",
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  parameters: {
    controls: { include: ["open", "title", "description", "side", "align"] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <Popover open={args.open} onOpenChange={(open) => updateArgs({ open })}>
        <PopoverTrigger asChild>
          <Button variant="outline">Ver detalle</Button>
        </PopoverTrigger>
        <PopoverContent side={args.side} align={args.align}>
          <PopoverHeader>
            <PopoverTitle>{args.title}</PopoverTitle>
            <PopoverDescription>{args.description}</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
