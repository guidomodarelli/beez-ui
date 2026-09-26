/** Demonstrates InfoPopover through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoPopover } from "beez-ui";

const meta = {
  title: "Components/InfoPopover",
  args: { message: "Una deuda es plata que te prestaron y todavía tenés que devolver." },
  argTypes: { message: { control: "text" } },
  parameters: { controls: { include: ["message"] } },
  render: ({ message }) => (
    <p className="inline-flex items-center gap-1 text-sm" style={{ marginTop: "6rem" }}>
      Deuda o préstamo <InfoPopover message={message} />
    </p>
  ),
} satisfies Meta<{ message: string }>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
