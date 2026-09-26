/** Demonstrates Checkbox through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
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
      <LiveArgs args={args} names={["checked"]} updateArgs={updateArgs}>
        {({ checked }, { checked: setChecked }) => {
          return (
            <div className="StoryRow">
              <Checkbox
                id="story-checkbox"
                checked={checked}
                disabled={args.disabled}
                onCheckedChange={(checked) => setChecked(checked)}
              />
              <Label htmlFor="story-checkbox">{args.label}</Label>
            </div>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
