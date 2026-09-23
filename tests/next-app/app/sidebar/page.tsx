"use client";

/** Server-renders a sidebar whose buttons gain tooltip wrappers after hydration. */
import { useState } from "react";
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, TooltipProvider } from "beez-ui";
import { BeezUIProvider } from "beez-ui/next";

const SECTIONS = ["Inicio", "Reportes", "Ajustes"] as const;

export default function SidebarPage() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Inicio");
  return <BeezUIProvider><TooltipProvider><SidebarProvider><Sidebar collapsible="none"><SidebarContent><SidebarMenu>
    {SECTIONS.map((name) => <SidebarMenuItem key={name}><SidebarMenuButton isActive={section === name} tooltip={name} onClick={() => setSection(name)}>{name}</SidebarMenuButton></SidebarMenuItem>)}
  </SidebarMenu></SidebarContent></Sidebar><output aria-label="Sección activa">{section}</output></SidebarProvider></TooltipProvider></BeezUIProvider>;
}
