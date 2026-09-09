/** Demonstrates Dialog as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  title: string;
  description: string;
  content: string;
  showCloseButton: boolean;
};
const meta = {
  title: "Components/Dialog",
  args: {
    open: false,
    title: "Editar perfil",
    description: "Actualizá tus datos antes de guardar.",
    content: "El contenido del diálogo se adapta al espacio disponible.",
    showCloseButton: true,
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    content: {
      control: "text",
    },
    showCloseButton: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["open", "title", "description", "content", "showCloseButton"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <Dialog open={args.open} onOpenChange={(open) => updateArgs({ open })}>
        <DialogTrigger asChild>
          <Button>Abrir diálogo</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={args.showCloseButton}>
          <DialogHeader>
            <DialogTitle>{args.title}</DialogTitle>
            <DialogDescription>{args.description}</DialogDescription>
          </DialogHeader>
          <p>{args.content}</p>
          <DialogFooter showCloseButton>
            <Button onClick={() => updateArgs({ open: false })}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
