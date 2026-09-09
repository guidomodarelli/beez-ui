/** Demonstrates WhatsappIcon through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { WhatsappIcon } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { label: string; size: number };

const meta = {
  title: "Icons/WhatsappIcon",
  args: {
    label: "WhatsApp",
    size: 48,
  },
  argTypes: {
    label: {
      control: "text",
    },
    size: {
      control: {
        type: "range",
        min: 16,
        max: 128,
        step: 8,
      },
    },
  },
  parameters: { controls: { include: ["label", "size"] } },
  render: ({ label, size }) => (
    <WhatsappIcon role="img" aria-label={label} width={size} height={size} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
