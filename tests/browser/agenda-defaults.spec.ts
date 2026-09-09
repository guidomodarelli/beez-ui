/** Protects compact defaults and reachable actions across browser engines. */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/agenda-defaults.html"); });

test("should retain compact controls and disabled textarea feedback", async ({ page }) => {
  await expect(page.getByRole("combobox", { name: "Frecuencia" })).toHaveCSS("height", "32px");
  await page.getByRole("combobox", { name: "Frecuencia" }).click();
  await expect(page.getByRole("listbox")).toHaveCSS("min-width", "192px");
  await page.getByRole("option", { name: "Semanal" }).click();
  await expect(page.getByRole("combobox", { name: "Frecuencia" })).toHaveText("Semanal");
  await expect(page.getByRole("tablist")).toHaveCSS("height", "32px");
  await page.getByRole("tab", { name: "Segunda" }).click();
  await expect(page.getByRole("tabpanel")).toHaveText("Segundo contenido");
  const disabled = page.getByRole("textbox", { name: "Mensaje deshabilitado" });
  await expect(disabled).toBeDisabled();
  const editableBackground = await page.getByRole("textbox", { name: "Mensaje editable" }).evaluate(element => getComputedStyle(element).backgroundColor);
  await expect(disabled).not.toHaveCSS("background-color", editableBackground);
  await page.getByRole("button", { name: "Abrir detalle" }).click();
  await expect(page.getByRole("dialog", { name: "Detalle" })).toHaveCSS("padding", "10px");
});

test("should render compact action menus and readable submenus", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir acciones" }).click();
  await expect(page.getByRole("menuitem", { name: "Editar", exact: true })).toHaveCSS("padding-top", "4px");
  await page.getByRole("menuitem", { name: "Carpetas" }).click();
  await expect(page.getByRole("menuitem", { name: "Archivo" })).toBeVisible();
  await expect(page.locator('[data-slot="dropdown-menu-sub-content"]')).toHaveCSS("min-width", "192px");
});

for (const kind of ["dialog", "alert-dialog"] as const) {
  test(`should separate the ${kind} footer from compact content`, async ({ page }) => {
    await page.getByRole("button", { name: kind === "dialog" ? "Abrir diálogo" : "Abrir confirmación" }).click();
    const content = page.locator(`[data-slot="${kind}-content"]`);
    const footer = page.locator(`[data-slot="${kind}-footer"]`);
    await expect(content).toHaveCSS("padding", "16px");
    await expect(footer).toHaveCSS("border-top-width", "1px");
    await expect(footer).toHaveCSS("margin-bottom", "-16px");
    await expect(footer).toHaveCSS("padding", "16px");
    await footer.getByRole("button", { name: kind === "dialog" ? "Cerrar" : "Cancelar", exact: true }).click();
    await expect(content).not.toBeVisible();
  });
}

for (const side of ["top", "bottom"] as const) {
  test(`should keep long ${side} sheets inside the viewport`, async ({ page }) => {
    await page.getByRole("button", { name: `Abrir panel ${side}` }).click();
    const panel = page.getByRole("dialog", { name: `Panel ${side}`, exact: true });
    await expect(panel).toBeVisible();
    // Measure layout height independently of fractional opening-animation transforms.
    expect(await panel.evaluate(element => (element as HTMLElement).offsetHeight))
      .toBeLessThanOrEqual(page.viewportSize()!.height);
    await panel.getByRole("button", { name: "Inicio del panel" }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole("button", { name: "Inicio del panel" })).toBeInViewport();
    await panel.getByRole("button", { name: "Fin del panel" }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole("button", { name: "Fin del panel" })).toBeInViewport();
  });
}
