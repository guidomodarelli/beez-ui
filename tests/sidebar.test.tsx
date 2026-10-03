/** Verifies the animated sidebar state, accessibility in the icon rail, routing and persistence. */
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  BeezUIProvider,
  SIDEBAR_COOKIE_COLLAPSED_VALUE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_OPEN_VALUE,
} from "beez-ui";

/** Represents an application routing adapter that marks the links it renders. */
function ConsumerLink(props: ComponentProps<"a">) {
  return <a data-router-link="true" {...props} />;
}

/** Navigation with a plain entry, a routed entry and a group that owns a submenu. */
function Navigation({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Secciones</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive icon={<svg />}>
                  Inicio
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/reportes" badge="3">
                  Reportes
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  ariaExpanded={isProjectsOpen}
                  onSelect={() => setIsProjectsOpen((isOpen) => !isOpen)}
                >
                  Proyectos
                </SidebarMenuButton>
                <SidebarMenuSub open={isProjectsOpen}>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/proyectos/beez">Beez</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarTrigger />
    </SidebarProvider>
  );
}

afterEach(() => {
  document.cookie = `${SIDEBAR_COOKIE_NAME}=; max-age=0; path=/`;
});

describe("Sidebar", () => {
  it("should expose an expanded labelled navigation with the active entry marked as the current page", () => {
    render(<Navigation />);
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toHaveAttribute("data-state", "expanded");
    expect(screen.getByRole("button", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /^Reportes/ })).toHaveAttribute("href", "/reportes");
    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toHaveAttribute("aria-expanded", "true");
  });

  it("should collapse to the icon rail keeping string labels as accessible names and native tooltips", async () => {
    render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toHaveAttribute("data-state", "collapsed");
    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toHaveAttribute("aria-expanded", "false");
    const reports = screen.getByRole("link", { name: "Reportes" });
    expect(reports).toHaveAttribute("title", "Reportes");
    expect(screen.getByText("Secciones")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("should toggle the sidebar with the Ctrl+B shortcut", async () => {
    render(<Navigation />);
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toHaveAttribute("data-state", "collapsed");
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toHaveAttribute("data-state", "expanded");
  });

  it("should unfold a submenu from its group button and fold it again", async () => {
    render(<Navigation />);
    const projects = screen.getByRole("button", { name: "Proyectos" });
    expect(projects).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Beez" })).not.toBeInTheDocument();
    await userEvent.click(projects);
    expect(projects).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Beez" })).toHaveAttribute("href", "/proyectos/beez");
  });

  it("should expand the icon rail when a group is selected so its submenu can be reached", async () => {
    render(<Navigation defaultOpen={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Proyectos" }));
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toHaveAttribute("data-state", "expanded");
    expect(await screen.findByRole("link", { name: "Beez" })).toBeInTheDocument();
  });

  it("should render linked entries through the configured routing adapter", () => {
    render(<BeezUIProvider components={{ Link: ConsumerLink }}><Navigation /></BeezUIProvider>);
    expect(screen.getByRole("link", { name: /^Reportes/ })).toHaveAttribute("data-router-link", "true");
  });

  it("should not select a disabled entry", async () => {
    const selections: string[] = [];
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton disabled onSelect={() => selections.push("Archivo")}>
                Archivo
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Archivo" }));
    expect(selections).toEqual([]);
  });
});

describe("SidebarProvider persistence", () => {
  it("should serialize the desktop state using the server consumer cookie contract", async () => {
    render(<SidebarProvider defaultOpen={false}><SidebarTrigger aria-label="Abrir navegación" /></SidebarProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Abrir navegación" }));
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=${SIDEBAR_COOKIE_OPEN_VALUE}`);
    await userEvent.click(screen.getByRole("button", { name: "Abrir navegación" }));
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=${SIDEBAR_COOKIE_COLLAPSED_VALUE}`);
  });

  it("should report changes without moving a controlled sidebar", async () => {
    const changes: boolean[] = [];
    render(
      <SidebarProvider open onOpenChange={(open) => changes.push(open)}>
        <Sidebar />
        <SidebarTrigger />
      </SidebarProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(changes).toEqual([false]);
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toHaveAttribute("data-state", "expanded");
  });
});
