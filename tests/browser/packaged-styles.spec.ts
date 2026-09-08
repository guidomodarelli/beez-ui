/** Exercises the actual tarball stylesheet in a browser with no Tailwind compiler or app sources. */
import { execFileSync, execSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "@playwright/test";
import { Avatar, AvatarFallback, Button, SidebarProvider, SidebarTrigger } from "beez-ui";
import { ownedPath } from "../../scripts/owned-path.js";

/** Static fixture resources belong exclusively to this test worker. */
const root = fileURLToPath(new URL("../../", import.meta.url));
let directory: string;
let server: Server;
let origin: string;

test.beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "beez-css-consumer-"));
  execSync(`pnpm --ignore-scripts pack --pack-destination "${directory}"`, { cwd: root, stdio: "pipe" });
  const archive = readdirSync(directory).find((entry) => entry.endsWith(".tgz"))!;
  execFileSync("tar", ["-xf", join(directory, archive), "-C", directory]);
  const content = renderToStaticMarkup(createElement("main", null,
    createElement(Button, null, "Guardar"),
    createElement(Avatar, null, createElement(AvatarFallback, null, "GH")),
    createElement(SidebarProvider, null, createElement(SidebarTrigger)),
  ));
  server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (pathname === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(`<!doctype html><html><head><link rel="stylesheet" href="/package/styles.css"></head><body>${content}</body></html>`);
      return;
    }
    try {
      const filename = ownedPath(directory, join(directory, pathname));
      const types: Record<string, string> = { ".css": "text/css", ".woff2": "font/woff2" };
      response.setHeader("Content-Type", types[extname(filename)] ?? "application/octet-stream");
      response.end(readFileSync(filename));
    } catch {
      response.statusCode = 404;
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("CSS consumer server did not receive a TCP address");
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  if (directory) rmSync(ownedPath(tmpdir(), directory), { recursive: true, force: true });
});

test("should style the installed package without consumer compilation", async ({ page }) => {
  await page.goto(origin);
  const button = page.getByRole("button", { name: "Guardar" });
  await expect(button).toHaveCSS("display", "inline-flex");
  await expect(button).toHaveCSS("height", "32px");
  await expect(button).toHaveCSS("border-radius", "10px");
  await expect(page.locator(".sr-only")).toHaveCSS("position", "absolute");
  await expect(page.locator(".sr-only")).toHaveCSS("width", "1px");
  await expect(page.locator('[data-slot="avatar"]')).toHaveCSS("width", "32px");
  expect(await page.evaluate(async () => {
    const loaded = await document.fonts.load('16px "Beez Geist"');
    return loaded.length > 0 && loaded.every((font) => font.status === "loaded");
  })).toBe(true);
});
