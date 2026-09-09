/** Demonstrates ThemedToaster with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemedToaster, Button, toast } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  message: string;
  kind: "message" | "success" | "error" | "warning" | "info";
  position:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};
const meta = {
  title: "Components/ThemedToaster",
  args: {
    message: "Cambios guardados",
    kind: "success",
    position: "bottom-right",
    richColors: true,
    closeButton: true,
    duration: 4000,
  },
  argTypes: {
    message: {
      control: "text",
    },
    kind: {
      control: "select",
      options: ["message", "success", "error", "warning", "info"],
    },
    position: {
      control: "select",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
    },
    richColors: {
      control: "boolean",
    },
    closeButton: {
      control: "boolean",
    },
    duration: {
      control: {
        type: "range",
        min: 1000,
        max: 10000,
        step: 500,
      },
    },
  },
  parameters: {
    controls: {
      include: [
        "message",
        "kind",
        "position",
        "richColors",
        "closeButton",
        "duration",
      ],
    },
  },
  render: ({ message, kind, ...options }) => (
    <>
      <Button onClick={() => toast[kind](message)}>Mostrar notificación</Button>
      <ThemedToaster {...options} />
    </>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
