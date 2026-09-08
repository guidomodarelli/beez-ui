/** Hosts the integration fixture in a real App Router application. */
import type { ReactNode } from "react";
import { Skeleton } from "beez-ui";
import "./globals.css";

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="es" suppressHydrationWarning><body><Skeleton aria-label="Carga del servidor" className="server-skeleton" />{children}</body></html>;
}
