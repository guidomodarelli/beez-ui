/** Demonstrates Calendar with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  selected: string;
  numberOfMonths: number;
  disabled: boolean;
  showOutsideDays: boolean;
  captionLayout: "label" | "dropdown";
  weekStartsOn: 0 | 1;
};
const meta = {
  title: "Components/Calendar",
  args: {
    selected: "2026-09-10",
    numberOfMonths: 1,
    disabled: false,
    showOutsideDays: true,
    captionLayout: "label",
    weekStartsOn: 1,
  },
  argTypes: {
    selected: {
      control: "text",
    },
    numberOfMonths: {
      control: {
        type: "range",
        min: 1,
        max: 2,
        step: 1,
      },
    },
    disabled: {
      control: "boolean",
    },
    showOutsideDays: {
      control: "boolean",
    },
    captionLayout: {
      control: "select",
      options: ["label", "dropdown"],
    },
    weekStartsOn: {
      control: "select",
      options: [0, 1],
    },
  },
  parameters: {
    controls: {
      include: [
        "selected",
        "numberOfMonths",
        "disabled",
        "showOutsideDays",
        "captionLayout",
        "weekStartsOn",
      ],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    const parsed = new Date(`${args.selected}T12:00:00`);
    const selected = Number.isNaN(parsed.getTime()) ? undefined : parsed;
    return (
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 8, 1)}
        selected={selected}
        onSelect={(date) =>
          updateArgs({
            selected: date
              ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
              : "",
          })
        }
        numberOfMonths={args.numberOfMonths}
        disabled={args.disabled}
        showOutsideDays={args.showOutsideDays}
        captionLayout={args.captionLayout}
        weekStartsOn={args.weekStartsOn}
      />
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
