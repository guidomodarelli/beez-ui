/** Verifies the animated sidebar state, accessibility in the icon rail, routing and persistence. */
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sidebar,
  SidebarBrandButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebarPanel,
  BeezUIProvider,
  SIDEBAR_COOKIE_COLLAPSED_VALUE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_OPEN_VALUE,
} from "@guidomodarelli/beez-ui";

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

/** Reports the panel state the way product content reads it. */
function PanelState() {
  return <output aria-label="Panel">{useSidebarPanel().collapsed ? "riel" : "panel"}</output>;
}

/** Header with a workspace switcher, product-only text and a panel state probe. */
function WorkspaceSidebar({ defaultOpen = true }: { defaultOpen?: boolean }) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarBrandButton icon={<span>AC</span>} trailing={<svg data-testid="brand-chevron" />}>
              Acme
            </SidebarBrandButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Otro espacio</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarLabel asChild>
          <p>Todavía no hay espacios</p>
        </SidebarLabel>
        <PanelState />
      </Sidebar>
      <SidebarTrigger />
    </SidebarProvider>
  );
}

describe("Sidebar consumer parts", () => {
  it("should open a workspace switcher from the brand button", async () => {
    render(<WorkspaceSidebar />);
    await userEvent.click(screen.getByRole("button", { name: "Acme" }));
    expect(await screen.findByRole("menuitem", { name: "Otro espacio" })).toBeInTheDocument();
  });

  it("should keep only the brand tile, named after its label, in the icon rail", async () => {
    render(<WorkspaceSidebar />);
    expect(screen.getByTestId("brand-chevron")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    const brand = screen.getByRole("button", { name: "Acme" });
    expect(brand).toHaveAttribute("title", "Acme");
    expect(brand).not.toHaveTextContent("Acme");
    expect(screen.queryByTestId("brand-chevron")).not.toBeInTheDocument();
  });

  it("should remove product-only text from the icon rail and keep the child element", async () => {
    render(<WorkspaceSidebar />);
    expect(screen.getByText("Todavía no hay espacios").tagName).toBe("P");
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(screen.queryByText("Todavía no hay espacios")).not.toBeInTheDocument();
  });

  it("should expose the collapsed state of the panel to product content", async () => {
    render(<WorkspaceSidebar defaultOpen={false} />);
    expect(screen.getByLabelText("Panel")).toHaveTextContent("riel");
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(screen.getByLabelText("Panel")).toHaveTextContent("panel");
  });
});

describe("SidebarProvider custom cookie", () => {
  it("should write the desktop state to the cookie the application reads on the server", async () => {
    render(
      <SidebarProvider cookieName="app.sidebar.open" cookieMaxAge={60}>
        <SidebarTrigger />
      </SidebarProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    expect(document.cookie).toContain(`app.sidebar.open=${SIDEBAR_COOKIE_COLLAPSED_VALUE}`);
    expect(document.cookie).not.toContain(`${SIDEBAR_COOKIE_NAME}=`);
    document.cookie = "app.sidebar.open=; max-age=0; path=/";
  });
});
