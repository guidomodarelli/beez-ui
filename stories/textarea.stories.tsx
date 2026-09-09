/** Demonstrates Textarea through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
};

const meta = {
  title: "Components/Textarea",
  args: {
    label: "Mensaje",
    value: "",
    placeholder: "Escribí un mensaje",
    disabled: false,
    invalid: false,
  },
  argTypes: {
    label: {
      control: "text",
    },
    value: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    invalid: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["label", "value", "placeholder", "disabled", "invalid"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <div className="StoryStack">
        <Label htmlFor="story-textarea">{args.label}</Label>
        <Textarea
          id="story-textarea"
          value={args.value}
          placeholder={args.placeholder}
          disabled={args.disabled}
          aria-invalid={args.invalid}
          onChange={(event) => updateArgs({ value: event.target.value })}
        />
      </div>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
