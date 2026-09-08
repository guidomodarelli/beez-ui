/** Exercises the TanStack provider in a real browser router owned by the consumer. */
import { createRoot } from "react-dom/client";
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { AnimatedThemeToggler, Avatar, AvatarImage, Link } from "beez-ui";
import { BeezUIProvider } from "beez-ui/tanstack";
import "./styles.css";

const root = createRootRoute({ component: () => <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><Outlet /></BeezUIProvider> });
const index = createRoute({ getParentRoute: () => root, path: "/tanstack.html", component: () => <main><h1>TanStack</h1><Avatar><AvatarImage src="/avatar.svg" alt="Avatar TanStack" /></Avatar><AnimatedThemeToggler /><Link href="/tanstack-destination?tab=summary#details">Abrir destino TanStack</Link></main> });
const target = createRoute({ getParentRoute: () => root, path: "/tanstack-destination", component: () => <h1 id="details">Destino TanStack</h1> });
const router = createRouter({ routeTree: root.addChildren([index, target]) });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
