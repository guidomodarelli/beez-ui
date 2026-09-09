/** Demonstrates Checkbox through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  label: string;
  checked: boolean | "indeterminate";
  disabled: boolean;
};

const meta = {
  title: "Components/Checkbox",
  args: {
    label: "Aceptar condiciones",
    checked: false,
    disabled: false,
  },
  argTypes: {
    label: {
      control: "text",
    },
    checked: {
      control: "select",
      options: [false, true, "indeterminate"],
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["label", "checked", "disabled"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <div className="StoryRow">
        <Checkbox
          id="story-checkbox"
          checked={args.checked}
          disabled={args.disabled}
          onCheckedChange={(checked) => updateArgs({ checked })}
        />
        <Label htmlFor="story-checkbox">{args.label}</Label>
      </div>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
