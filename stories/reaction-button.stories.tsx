/** Demonstrates ReactionButton through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactionButton } from "beez-ui";

/** Owns the optimistic reaction state like a consumer would. */
function ReactionExample({ initialCount }: { initialCount: number }) {
  const [isActive, setIsActive] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <ReactionButton
      ariaLabel={`Me gusta ${count}`}
      isActive={isActive}
      count={count}
      onClick={() => {
        setCount(isActive ? count - 1 : count + 1);
        setIsActive(!isActive);
      }}
    />
  );
}

const meta = {
  title: "Components/ReactionButton",
  args: { initialCount: 2 },
  argTypes: { initialCount: { control: { type: "number", min: 0 } } },
  parameters: { controls: { include: ["initialCount"] } },
  render: ({ initialCount }) => <ReactionExample key={initialCount} initialCount={initialCount} />,
} satisfies Meta<{ initialCount: number }>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
