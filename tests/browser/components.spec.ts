/** Verifies real interactions and generated styles without Next.js or next-themes. */
import { expect, test } from "@playwright/test";

test("preserves the default theme and shared interactions", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Componentes compartidos" })).toBeVisible();
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
