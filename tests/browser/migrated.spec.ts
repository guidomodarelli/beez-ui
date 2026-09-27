/** Verifies product components where jsdom lacks CSS animations or browser APIs. */
import { expect, test } from "@playwright/test";

test.describe("migrated components", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/migrated.html");
  });

  test("bounces the loader dots with staggered compositor animations", async ({ page }) => {
    const panelLoader = page.getByRole("status", { name: "Cargando panel" });
    const dots = panelLoader.locator("[aria-hidden=true] > span");

    await expect(panelLoader).toBeVisible();
    await expect(dots.nth(0)).toHaveCSS("animation-name", "beez-bouncing-dot-md");
    await expect(dots.nth(1)).toHaveCSS("animation-delay", "0.2s");
    await expect(dots.nth(2)).toHaveCSS("animation-delay", "0.3s");
    await expect(page.getByRole("status", { name: "Cargando fila" }).locator("[aria-hidden=true] > span").first()).toHaveCSS(
      "animation-name",
      "beez-bouncing-dot-sm",
    );
  });

  test("stops the loader bounce when the viewer prefers reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await expect(page.getByRole("status", { name: "Cargando panel" }).locator("[aria-hidden=true] > span").first()).toHaveCSS("animation-name", "none");
  });

  test("copies text to the clipboard from a user gesture", async ({ page, browserName, context }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.getByRole("button", { name: "Copiar invitación" }).click();

    await expect(page.getByRole("status", { name: "Resultado de copia" })).toHaveText("Copiado");
    if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://example.com/invitacion");
  });
});
