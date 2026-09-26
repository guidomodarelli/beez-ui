/** Demonstrates InputGroup as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
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
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => {
          return (
            <InputGroup>
              <InputGroupAddon>{args.prefix}</InputGroupAddon>
              <InputGroupInput
                aria-label="Dirección"
                value={value}
                placeholder={args.placeholder}
                disabled={args.disabled}
                onChange={(event) => setValue(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  disabled={args.disabled || !value}
                  onClick={() => setValue("")}
                >
                  Limpiar
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
