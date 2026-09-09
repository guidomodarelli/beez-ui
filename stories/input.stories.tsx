/** Demonstrates Input through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  type: "text" | "email" | "password" | "number";
};

const meta = {
  title: "Components/Input",
  args: {
    label: "Nombre",
    value: "",
    placeholder: "Ingresá tu nombre",
    disabled: false,
    invalid: false,
    type: "text",
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
    type: {
      control: "select",
      options: ["text", "email", "password", "number"],
    },
  },
  parameters: {
    controls: {
      include: ["label", "value", "placeholder", "disabled", "invalid", "type"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <div className="StoryStack">
        <Label htmlFor="story-input">{args.label}</Label>
        <Input
          id="story-input"
          value={args.value}
          placeholder={args.placeholder}
          disabled={args.disabled}
          aria-invalid={args.invalid}
          type={args.type}
          onChange={(event) => updateArgs({ value: event.target.value })}
        />
      </div>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
