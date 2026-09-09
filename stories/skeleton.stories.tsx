/** Demonstrates Skeleton through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { avatar: boolean; lines: number };

const meta = {
  title: "Components/Skeleton",
  args: {
    avatar: true,
    lines: 3,
  },
  argTypes: {
    avatar: {
      control: "boolean",
    },
    lines: {
      control: {
        type: "range",
        min: 1,
        max: 8,
        step: 1,
      },
    },
  },
  parameters: { controls: { include: ["avatar", "lines"] } },
  render: ({ avatar, lines }) => (
    <div className="StoryStack" role="status" aria-label="Cargando contenido">
      {avatar && <Skeleton className="StorySkeleton--avatar" />}
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="StorySkeleton" />
      ))}
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
