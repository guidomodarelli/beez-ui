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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
import { Activity, FolderKanban, Home, Settings } from "lucide-react";
/** Top-level sections with their icons and optional counters. */
const SECTIONS = [
  { label: "Resumen", icon: <Home /> },
  { label: "Actividad", icon: <Activity />, badge: "3" },
  { label: "Ajustes", icon: <Settings /> },
] as const;
const PROJECTS = ["Beez", "Agenda"] as const;
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  side: "left" | "right";
  variant: "sidebar" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
  title: string;
  active: string;
  projectsOpen: boolean;
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
    projectsOpen: true,
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
      options: ["Resumen", "Actividad", "Ajustes", ...PROJECTS],
    },
    projectsOpen: {
      control: "boolean",
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: {
      include: ["open", "side", "variant", "collapsible", "title", "active", "projectsOpen"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["open", "active", "projectsOpen"]} updateArgs={updateArgs}>
        {({ open, active, projectsOpen }, { open: setOpen, active: setActive, projectsOpen: setProjectsOpen }) => {
          return (
            <SidebarProvider
              open={open}
              onOpenChange={(open) => setOpen(open)}
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
                      {SECTIONS.map((section) => (
                        <SidebarMenuItem key={section.label}>
                          <SidebarMenuButton
                            icon={section.icon}
                            badge={"badge" in section ? section.badge : undefined}
                            isActive={active === section.label}
                            onSelect={() => setActive(section.label)}
                          >
                            {section.label}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          icon={<FolderKanban />}
                          ariaExpanded={projectsOpen}
                          onSelect={() => setProjectsOpen(!projectsOpen)}
                        >
                          Proyectos
                        </SidebarMenuButton>
                        <SidebarMenuSub open={projectsOpen}>
                          {PROJECTS.map((project) => (
                            <SidebarMenuSubItem key={project}>
                              <SidebarMenuSubButton
                                isActive={active === project}
                                onSelect={() => setActive(project)}
                              >
                                {project}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <span className="StorySidebarLabel">Cuenta de ejemplo</span>
                </SidebarFooter>
                <SidebarRail />
              </Sidebar>
              <SidebarInset>
                <div className="StorySidebarContent">
                  <SidebarTrigger />
                  <h2>{active}</h2>
                  <p>Probá el menú también con el viewport móvil.</p>
                </div>
              </SidebarInset>
            </SidebarProvider>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
