/** Demonstrates Sheet as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  side: "top" | "right" | "bottom" | "left";
  title: string;
  longContent: boolean;
  showCloseButton: boolean;
};
const meta = {
  title: "Components/Sheet",
  args: {
    open: false,
    side: "right",
    title: "Detalle del registro",
    longContent: false,
    showCloseButton: true,
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    title: {
      control: "text",
    },
    longContent: {
      control: "boolean",
    },
    showCloseButton: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["open", "side", "title", "longContent", "showCloseButton"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <Sheet open={args.open} onOpenChange={(open) => updateArgs({ open })}>
        <SheetTrigger asChild>
          <Button>Abrir panel</Button>
        </SheetTrigger>
        <SheetContent side={args.side} showCloseButton={args.showCloseButton}>
          <SheetHeader>
            <SheetTitle>{args.title}</SheetTitle>
            <SheetDescription>
              Explorá el panel desde cualquiera de sus bordes.
            </SheetDescription>
          </SheetHeader>
          <div
            className={`StorySheetBody ${args.longContent ? "StoryScrollContent" : "StoryStack"}`}
          >
            <p>Inicio del contenido.</p>
            <p>Fin del contenido.</p>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button>Cerrar panel</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
