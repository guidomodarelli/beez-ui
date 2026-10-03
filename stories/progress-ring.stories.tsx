/** Demonstrates ProgressRing through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressRing } from "@guidomodarelli/beez-ui";

/** Editable inputs specific to this example. */
type Args = { fraction: number; size: number };

/** Installments shown next to the ring, like the payments column that introduced it. */
const TOTAL_INSTALLMENTS = 4;

const meta = {
  title: "Components/ProgressRing",
  args: { fraction: 0.5, size: 18 },
  argTypes: {
    fraction: { control: { type: "range", min: 0, max: 1, step: 0.25 } },
    size: { control: { type: "range", min: 12, max: 64, step: 2 } },
  },
  parameters: { controls: { include: ["fraction", "size"] } },
  render: ({ fraction, size }) => (
    <span className="inline-flex items-center gap-2 text-sm text-primary">
      <ProgressRing fraction={fraction} size={size} />
      {Math.round(fraction * TOTAL_INSTALLMENTS)} / {TOTAL_INSTALLMENTS} cuotas
    </span>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
