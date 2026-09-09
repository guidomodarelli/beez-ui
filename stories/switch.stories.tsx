/** Demonstrates Switch through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  label: string;
  checked: boolean;
  disabled: boolean;
  size: "default" | "sm";
};

const meta = {
  title: "Components/Switch",
  args: {
    label: "Recibir notificaciones",
    checked: false,
    disabled: false,
    size: "default",
  },
  argTypes: {
    label: {
      control: "text",
    },
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
  parameters: {
    controls: { include: ["label", "checked", "disabled", "size"] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <div className="StoryRow">
        <Switch
          id="story-switch"
          checked={args.checked}
          disabled={args.disabled}
          size={args.size}
          onCheckedChange={(checked) => updateArgs({ checked })}
        />
        <Label htmlFor="story-switch">{args.label}</Label>
      </div>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
