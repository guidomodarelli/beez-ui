/** Demonstrates Sidebar with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { Home } from "lucide-react";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  side: "left" | "right";
  variant: "sidebar" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
  title: string;
  active: string;
};
const meta = {
  title: "Components/Sidebar",
  args: {
    open: true,
    side: "left",
    variant: "sidebar",
    collapsible: "icon",
    title: "Mi espacio",
    active: "Resumen",
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    side: {
      control: "select",
      options: ["left", "right"],
    },
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
    },
    title: {
      control: "text",
    },
    active: {
      control: "select",
      options: ["Resumen", "Actividad", "Ajustes"],
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: {
      include: ["open", "side", "variant", "collapsible", "title", "active"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <SidebarProvider
        open={args.open}
        onOpenChange={(open) => updateArgs({ open })}
      >
        <Sidebar
          side={args.side}
          variant={args.variant}
          collapsible={args.collapsible}
        >
          <SidebarHeader>
            <div className="StorySidebarBrand">
              <Home aria-hidden="true" />
              <span className="StorySidebarLabel">{args.title}</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Secciones</SidebarGroupLabel>
              <SidebarMenu>
                {["Resumen", "Actividad", "Ajustes"].map((label) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      isActive={args.active === label}
                      tooltip={label}
                      onClick={() => updateArgs({ active: label })}
                    >
                      <Home />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <span className="StorySidebarLabel">Cuenta de ejemplo</span>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="StorySidebarContent">
            <SidebarTrigger />
            <h2>{args.active}</h2>
            <p>Probá el menú también con el viewport móvil.</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
