/** Demonstrates InputGroup as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  prefix: string;
  placeholder: string;
  disabled: boolean;
};
const meta = {
  title: "Components/InputGroup",
  args: {
    value: "",
    prefix: "https://",
    placeholder: "ejemplo.com",
    disabled: false,
  },
  argTypes: {
    value: {
      control: "text",
    },
    prefix: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["value", "prefix", "placeholder", "disabled"] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <InputGroup>
        <InputGroupAddon>{args.prefix}</InputGroupAddon>
        <InputGroupInput
          aria-label="Dirección"
          value={args.value}
          placeholder={args.placeholder}
          disabled={args.disabled}
          onChange={(event) => updateArgs({ value: event.target.value })}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            disabled={args.disabled || !args.value}
            onClick={() => updateArgs({ value: "" })}
          >
            Limpiar
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
