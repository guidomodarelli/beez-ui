/** Demonstrates AlertDialog as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  title: string;
  description: string;
  size: "default" | "sm";
  destructive: boolean;
};
const meta = {
  title: "Components/AlertDialog",
  args: {
    open: false,
    title: "Confirmar acción",
    description: "Esta acción requiere tu confirmación.",
    size: "default",
    destructive: true,
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
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    destructive: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["open", "title", "description", "size", "destructive"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["open"]} updateArgs={updateArgs}>
        {({ open }, { open: setOpen }) => {
          return (
            <AlertDialog
              open={open}
              onOpenChange={(open) => setOpen(open)}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline">Abrir confirmación</Button>
              </AlertDialogTrigger>
              <AlertDialogContent size={args.size}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{args.title}</AlertDialogTitle>
                  <AlertDialogDescription>{args.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant={args.destructive ? "destructive" : "default"}
                  >
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
