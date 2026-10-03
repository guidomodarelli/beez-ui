"use client";

/**
 * Internal: panel state shared by the sidebar parts and by components that adapt to the icon rail
 * (such as `AccountMenu`), kept apart so they can read it without importing the sidebar itself.
 */
import * as React from "react";

export type SidebarPanelState = {
  /** Whether the desktop sidebar is shrunk to its icon rail; always false in the mobile sheet. */
  collapsed: boolean;
  collapsible: "offcanvas" | "icon" | "none";
  side: "left" | "right";
};

export const SidebarPanelContext = React.createContext<SidebarPanelState | null>(null);

/**
 * Reads the panel state when rendered inside a `Sidebar`, and `null` anywhere else.
 * @returns The panel state, or `null` outside a sidebar.
 */
export function useOptionalSidebarPanel(): SidebarPanelState | null {
  return React.use(SidebarPanelContext);
}
