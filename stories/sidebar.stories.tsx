/** Demonstrates Sidebar with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AccountMenu,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarBrandButton,
  SidebarLabel,
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
} from "@guidomodarelli/beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
import { Activity, ChevronsUpDown, FolderKanban, Home, Settings } from "lucide-react";
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarBrandButton icon={<Home />} trailing={<ChevronsUpDown />}>
                        {args.title}
                      </SidebarBrandButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>Otro espacio</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  <SidebarLabel className="StorySidebarHint">
                    Las secciones se guardan en este navegador.
                  </SidebarLabel>
                  <AccountMenu
                    name="Ana López"
                    email="ana@example.com"
                    status="authenticated"
                    triggerVariant="sidebar"
                    onSignOut={() => undefined}
                  />
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
