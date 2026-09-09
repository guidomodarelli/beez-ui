/** Demonstrates Link through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { children: string; href: string; newTab: boolean };

const meta = {
  title: "Components/Link",
  args: {
    children: "Ir al contenido",
    href: "#destination",
    newTab: false,
  },
  argTypes: {
    children: {
      control: "text",
    },
    href: {
      control: "text",
    },
    newTab: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["children", "href", "newTab"] } },
  render: ({ children, href, newTab }) => (
    <div className="StoryStack">
      <Link
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noreferrer" : undefined}
      >
        {children}
      </Link>
      <p id="destination">
        Destino del enlace. El provider nativo usa un ancla HTML.
      </p>
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
