/** Demonstrates Card through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  title: string;
  description: string;
  content: string;
  size: "default" | "sm";
  footer: boolean;
};

const meta = {
  title: "Components/Card",
  args: {
    title: "Resumen mensual",
    description: "Actividad del equipo",
    content: "Hay tres tareas pendientes de revisión.",
    size: "default",
    footer: true,
  },
  argTypes: {
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    content: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    footer: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["title", "description", "content", "size", "footer"],
    },
  },
  render: ({ title, description, content, size, footer }) => (
    <Card className="StoryCard" size={size}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
      {footer && (
        <CardFooter>
          <Button>Ver detalles</Button>
        </CardFooter>
      )}
    </Card>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
