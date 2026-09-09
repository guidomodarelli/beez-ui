/** Protects readable action menus opened from compact icon buttons. */
import { expect, test } from "@playwright/test";

test("should size icon-triggered menus to their action labels", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Acciones de envío" }).click();
  const menu = page.getByRole("menu", { name: "Acciones de envío" });
  await expect(menu).toBeVisible();
  await menu.screenshot({ path: testInfo.outputPath("dropdown-menu.png") });

  const bounds = await menu.boundingBox();
  expect(bounds!.width).toBeGreaterThanOrEqual(192);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  for (const label of ["Editar datos de envío", "Eliminar datos de envío"]) {
    const lineCount = await menu.getByText(label, { exact: true }).evaluate(element =>
      element.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(element).lineHeight));
    expect(lineCount).toBeLessThanOrEqual(1);
  }

  await menu.getByRole("menuitem", { name: "Editar datos de envío" }).click();
  await expect(page.getByLabel("Acción seleccionada")).toHaveText("Editar datos de envío");
  await expect(menu).not.toBeVisible();
});
