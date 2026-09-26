/** Demonstrates ErrorState through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorState } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { eyebrow: string; title: string; description: string };

const meta = {
  title: "Components/ErrorState",
  args: {
    eyebrow: "Error inesperado",
    title: "Algo salió mal",
    description: "No pudimos cargar esta página. Probá de nuevo en unos segundos.",
  },
  argTypes: { eyebrow: { control: "text" }, title: { control: "text" }, description: { control: "text" } },
  parameters: { layout: "fullscreen", controls: { include: ["eyebrow", "title", "description"] } },
  render: (args) => <ErrorState {...args} retryLabel="Reintentar" onRetry={() => {}} homeHref="#" homeLabel="Volver al inicio" />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
