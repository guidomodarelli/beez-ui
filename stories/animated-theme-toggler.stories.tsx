/** Demonstrates AnimatedThemeToggler through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedThemeToggler, useTheme, type ThemeMode } from "beez-ui";
import { useGlobals } from "storybook/preview-api";

/** Editable inputs specific to this example. */
type Args = { disabled: boolean; duration: number };

/** Keeps React context subscriptions outside Storybook's hook-managed render function. */
function ThemeExample({ onThemeChange, ...args }: Args & { onThemeChange: (theme: ThemeMode) => void }) {
  const { setTheme } = useTheme();
  return <AnimatedThemeToggler {...args} onThemeChange={theme => { setTheme(theme); onThemeChange(theme); }} />;
}

const meta = {
  title: "Components/AnimatedThemeToggler",
  args: {
    disabled: false,
    duration: 400,
  },
  argTypes: {
    disabled: {
      control: "boolean",
    },
    duration: {
      control: {
        type: "range",
        min: 0,
        max: 1500,
        step: 100,
      },
    },
  },
  parameters: { controls: { include: ["disabled", "duration"] } },
  render: function Render(args) {
    const [, updateGlobals] = useGlobals();
    return <ThemeExample {...args} onThemeChange={theme => updateGlobals({ theme })} />;
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
