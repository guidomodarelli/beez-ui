/** Demonstrates Select as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  disabled: boolean;
  size: "default" | "sm";
  placeholder: string;
};
const meta = {
  title: "Components/Select",
  args: {
    value: "monthly",
    disabled: false,
    size: "default",
    placeholder: "Seleccioná una frecuencia",
  },
  argTypes: {
    value: {
      control: "select",
      options: ["", "weekly", "monthly", "yearly"],
    },
    disabled: {
      control: "boolean",
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    placeholder: {
      control: "text",
    },
  },
  parameters: {
    controls: { include: ["value", "disabled", "size", "placeholder"] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <Select
        value={args.value}
        disabled={args.disabled}
        onValueChange={(value) => updateArgs({ value })}
      >
        <SelectTrigger aria-label="Frecuencia" size={args.size}>
          <SelectValue placeholder={args.placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            <SelectLabel>Frecuencia</SelectLabel>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
