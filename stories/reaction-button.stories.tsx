/** Demonstrates ReactionButton through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactionButton } from "beez-ui";

/** Owns the optimistic reaction state like a consumer would. */
function ReactionExample({ initialCount, activeColor }: { initialCount: number; activeColor: string }) {
  const [isActive, setIsActive] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <ReactionButton
      ariaLabel={`Me gusta ${count}`}
      isActive={isActive}
      count={count}
      activeColor={activeColor}
      onClick={() => {
        setCount(isActive ? count - 1 : count + 1);
        setIsActive(!isActive);
      }}
    />
  );
}

const meta = {
  title: "Components/ReactionButton",
  args: { initialCount: 2, activeColor: "var(--destructive)" },
  argTypes: {
    initialCount: { control: { type: "number", min: 0 } },
    activeColor: { control: "select", options: ["var(--destructive)", "var(--primary)", "currentColor"] },
  },
  parameters: { controls: { include: ["initialCount", "activeColor"] } },
  render: ({ initialCount, activeColor }) => <ReactionExample key={initialCount} initialCount={initialCount} activeColor={activeColor} />,
} satisfies Meta<{ initialCount: number; activeColor: string }>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
