/** Demonstrates RadioGroup as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  disabled: boolean;
  orientation: "horizontal" | "vertical";
};
const meta = {
  title: "Components/RadioGroup",
  args: {
    value: "monthly",
    disabled: false,
    orientation: "vertical",
  },
  argTypes: {
    value: {
      control: "select",
      options: ["weekly", "monthly"],
    },
    disabled: {
      control: "boolean",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  parameters: { controls: { include: ["value", "disabled", "orientation"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <RadioGroup
        value={args.value}
        disabled={args.disabled}
        orientation={args.orientation}
        className={
          args.orientation === "horizontal" ? "StoryRow" : "StoryStack"
        }
        onValueChange={(value) => updateArgs({ value })}
      >
        {[
          { value: "weekly", label: "Semanal" },
          { value: "monthly", label: "Mensual" },
        ].map((option) => (
          <div className="StoryRow" key={option.value}>
            <RadioGroupItem value={option.value} id={`radio-${option.value}`} />
            <Label htmlFor={`radio-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
