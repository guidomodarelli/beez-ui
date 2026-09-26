/** Hydrates server-rendered markup, like an SSR framework would, without a framework dev server. */
import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  BeezUIProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  TooltipProvider,
} from "beez-ui";
import "./styles.css";

const SECTIONS = ["Inicio", "Reportes", "Ajustes"] as const;

/** Sidebar buttons with tooltips are remounted inside tooltip triggers once hydrated. */
function HydratedSidebar() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Inicio");
  return (
    <BeezUIProvider>
      <TooltipProvider>
        <SidebarProvider className="min-h-0">
          <Sidebar collapsible="none" className="h-auto rounded-lg border">
            <SidebarContent>
              <SidebarMenu>
                {SECTIONS.map((name) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton
                      isActive={section === name}
                      tooltip={name}
                      onClick={() => setSection(name)}
                    >
                      {name}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <output aria-label="Sección activa">{section}</output>
        </SidebarProvider>
      </TooltipProvider>
    </BeezUIProvider>
  );
}

const container = document.getElementById("root")!;
container.innerHTML = renderToString(<HydratedSidebar />);
hydrateRoot(container, <HydratedSidebar />);
