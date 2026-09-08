/** Verifies compiled library interactions, styles and framework boundaries in actual consumers. */
import { expect, test } from "@playwright/test";

test("preserves the default theme and shared interactions", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Componentes compartidos" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Avatar nativo" })).toBeVisible();
  const button = page.getByRole("button", { name: "Notificar" });
  await expect(button).toHaveCSS("border-radius", "10px");
  const lightBackground = await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor);
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(() => page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);
  await page.getByRole("combobox", { name: "Filtrar filas" }).fill("Luz");
  await expect(page.getByRole("cell", { name: "Luz", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Internet", exact: true })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Filtrar filas" }).press("Escape");
  await page.getByText("Buscar", { exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Búsqueda adicional" })).toBeFocused();
  await page.getByRole("radio", { name: "Mensual" }).click();
  await expect(page.getByRole("radio", { name: "Mensual" })).toBeChecked();
  await page.getByRole("button", { name: /jueves, 10 de septiembre/i }).click();
  await expect(page.getByLabel("Día seleccionado")).toHaveText("10");
  await button.click();
  await expect(page.getByText("Cambios guardados")).toBeVisible();
  await expect(page.getByText("Texto animado")).toBeVisible();
  await expect(page.getByAltText("Perfil de prueba")).not.toBeVisible();
  await page.getByRole("button", { name: "Abrir panel largo" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Última acción" }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole("button", { name: "Última acción" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(runtimeErrors).toEqual([]);
});

test("activates Next adapters only through their optional entrypoint", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:3109/");
  await expect(page.getByLabel("Carga del servidor")).toBeVisible();
  await expect(page.getByLabel("Carga del servidor")).toHaveAttribute("data-slot", "skeleton");
  const image = page.getByRole("img", { name: "Avatar Next" });
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("data-nimg", "1");
  await expect(page.getByText("GH", { exact: true })).toHaveCount(0);
  await page.evaluate(() => { document.documentElement.dataset.navigationProbe = "preserved"; });
  await page.getByRole("link", { name: "Abrir destino" }).click();
  await expect(page.getByRole("heading", { name: "Destino del enlace" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-navigation-probe", "preserved");
  expect(errors).toEqual([]);
});

test("restores the provider theme without hydration mismatches", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", message => {
    if (/hydrated|hydration/i.test(message.text())) hydrationErrors.push(message.text());
  });
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("http://127.0.0.1:3109/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Notificar" }).click();
  await expect(page.getByText("Tema aplicado")).toBeVisible();
  await expect(page.locator("[data-sonner-toaster]")).toHaveAttribute("data-sonner-theme", "dark");
  expect(hydrationErrors).toEqual([]);
});

test("uses TanStack navigation, Unpic images and the shared theme", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/tanstack.html");
  await expect(page.getByRole("img", { name: "Avatar TanStack" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Avatar TanStack" })).not.toHaveAttribute("data-nimg");
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.evaluate(() => { document.documentElement.dataset.navigationProbe = "preserved"; });
  await page.getByRole("link", { name: "Abrir destino TanStack" }).click();
  await expect(page.getByRole("heading", { name: "Destino TanStack" })).toBeVisible();
  await expect(page).toHaveURL(/\/tanstack-destination\?tab=summary#details$/);
  await expect(page.locator("html")).toHaveAttribute("data-navigation-probe", "preserved");
  expect(errors).toEqual([]);
});
