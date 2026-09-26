/** Demonstrates DropdownMenu as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  checked: boolean;
  disabled: boolean;
  align: "start" | "center" | "end";
  destructive: boolean;
};
const meta = {
  title: "Components/DropdownMenu",
  args: {
    open: false,
    checked: true,
    disabled: false,
    align: "start",
    destructive: true,
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    destructive: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["open", "checked", "disabled", "align", "destructive"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["open", "checked"]} updateArgs={updateArgs}>
        {({ open, checked }, { open: setOpen, checked: setChecked }) => {
          return (
            <DropdownMenu
              open={open}
              onOpenChange={(open) => setOpen(open)}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Abrir acciones</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={args.align}>
                <DropdownMenuLabel>Registro</DropdownMenuLabel>
                <DropdownMenuItem disabled={args.disabled}>
                  Editar datos
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={checked}
                  onCheckedChange={(checked) => setChecked(checked)}
                >
                  Mostrar detalles
                </DropdownMenuCheckboxItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Carpetas</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Comprobantes</DropdownMenuItem>
                    <DropdownMenuItem>Archivo histórico</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={args.destructive ? "destructive" : "default"}
                >
                  Eliminar registro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
