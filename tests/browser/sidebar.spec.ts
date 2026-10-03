/** Verifies the animated sidebar layout and motion that jsdom cannot reproduce. */
import { expect, test } from "@playwright/test";

/** Desktop rail width in pixels: `16rem` expanded and `4.25rem` collapsed at a 16px root size. */
const EXPANDED_WIDTH_PX = 256;
const COLLAPSED_WIDTH_PX = 68;
/** Mobile sheet width in pixels: `18rem`, declared by the provider although the sheet is portaled. */
const MOBILE_SHEET_WIDTH_PX = 288;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test.describe("desktop", () => {
  test.skip(({ isMobile, viewport }) => isMobile || (viewport?.width ?? 0) < 768, "desktop-only layout");

  test("should morph the rail between its expanded and icon widths", async ({ page }) => {
    await page.goto("/sidebar.html");
    const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(EXPANDED_WIDTH_PX);
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect.poll(async () => Math.round((await sidebar.boundingBox())?.width ?? 0)).toBe(COLLAPSED_WIDTH_PX);
    await expect(page.getByRole("button", { name: "Ajustes" })).toHaveAttribute("title", "Ajustes");
  });

  test("should toggle the sidebar from its edge rail", async ({ page }) => {
    await page.goto("/sidebar.html");
    const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
    await page.getByRole("button", { name: "Borde de la navegación" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await page.getByRole("button", { name: "Borde de la navegación" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  test("should glide the active indicator to the selected entry", async ({ page }) => {
    await page.goto("/sidebar.html");
    const settings = page.getByRole("button", { name: "Ajustes" });
    await settings.click();
    await expect(page.getByLabel("Sección activa")).toHaveText("Ajustes");
    await expect(page.locator('[data-slot="sidebar-menu-active-indicator"]')).toHaveCount(1);
    await expect(settings.locator('[data-slot="sidebar-menu-active-indicator"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  test("should open the rail when a group is selected from the icon rail", async ({ page }) => {
    await page.goto("/sidebar.html");
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    await page.getByRole("button", { name: "Proyectos" }).click();
    await expect(page.getByRole("complementary", { name: "Navegación principal" })).toHaveAttribute("data-state", "expanded");
    await page.getByRole("button", { name: "Agenda" }).click();
    await expect(page.getByLabel("Sección activa")).toHaveText("Agenda");
  });
});

test.describe("mobile", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "small-screen sheet only");

  test("should open a focus-trapped sheet, lock scrolling and return focus on Escape", async ({ page }) => {
    await page.goto("/sidebar.html");
    const trigger = page.getByRole("button", { name: "Alternar navegación" });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Navegación principal" });
    await expect(sheet).toBeVisible();
    await expect.poll(async () => Math.round((await sheet.boundingBox())?.width ?? 0)).toBe(MOBILE_SHEET_WIDTH_PX);
    await expect(page.getByRole("button", { name: "Inicio" })).toBeFocused();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("should close the sheet after choosing a section", async ({ page }) => {
    await page.goto("/sidebar.html");
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    await page.getByRole("button", { name: "Ajustes" }).click();
    await expect(page.getByLabel("Sección activa")).toHaveText("Ajustes");
    await expect(page.getByRole("dialog", { name: "Navegación principal" })).toBeHidden();
  });
});
