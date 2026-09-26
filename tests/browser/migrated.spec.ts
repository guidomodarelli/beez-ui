/** Verifies migrated components where jsdom lacks layout, media queries or browser APIs. */
import { expect, test } from "@playwright/test";

/** Phones use the compact month grid and the inbox sheet below this width (the `md` breakpoint). */
const PHONE_MAX_WIDTH_PX = 767;

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

  test("shows item pills on wide screens and day dots with a day summary on phones", async ({ page }) => {
    const isPhone = (page.viewportSize()?.width ?? 0) <= PHONE_MAX_WIDTH_PX;
    const calendar = page.getByRole("table", { name: "Calendario mensual" });
    const dayButton = page.getByRole("button", { name: "miércoles, 6 de mayo: 2 eventos" });
    const itemPill = calendar.getByRole("button", { name: /Clase abierta/ });

    if (!isPhone) {
      await expect(itemPill).toBeVisible();
      await expect(dayButton).toBeHidden();
      return;
    }

    await expect(itemPill).toBeHidden();
    await dayButton.click();
    const summary = page.getByRole("region", { name: "Eventos del día" });
    await expect(summary.getByRole("button", { name: /Encuentro/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("tints today with the primary hue instead of drifting towards pink", async ({ page }) => {
    // Mixing with achromatic tokens in oklch pulled the hue towards 0° (pink); oklab keeps it.
    const todayBackground = await page.locator('[aria-current="date"]').evaluate((cell) => {
      const canvasContext = document.createElement("canvas").getContext("2d")!;
      canvasContext.fillStyle = getComputedStyle(cell).backgroundColor;
      canvasContext.fillRect(0, 0, 1, 1);
      const [red, green, blue] = canvasContext.getImageData(0, 0, 1, 1).data;
      return { red, green, blue };
    });

    expect(todayBackground.blue).toBeGreaterThan(todayBackground.red);
  });

  test("opens the inbox as a popover on wide screens and as a bottom sheet on phones", async ({ page }) => {
    const isPhone = (page.viewportSize()?.width ?? 0) <= PHONE_MAX_WIDTH_PX;
    const bell = page.getByRole("button", { name: "Notificaciones, 1 sin leer" });

    await expect(bell).toHaveCount(1);
    await bell.click();
    const inbox = page.getByRole("dialog", { name: "Notificaciones" });
    await expect(inbox.getByRole("link", { name: /Taller de álgebra/ })).toBeVisible();
    await expect(inbox).toHaveAttribute("data-slot", isPhone ? "sheet-content" : "popover-content");
  });

  test("loads the emoji picker on demand and applies the chosen emoji", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Elegir emoji" });

    await trigger.click();
    const picker = page.getByRole("dialog", { name: "Selector de emojis" });
    await picker.getByPlaceholder("Buscar emoji").fill("grinning");
    await picker.getByRole("button", { name: /grinning/i }).first().click();

    await expect(picker).toBeHidden();
    await expect(trigger).toHaveText(/\p{Extended_Pictographic}/u);
  });

  test("copies text to the clipboard from a user gesture", async ({ page, browserName, context }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.getByRole("button", { name: "Copiar invitación" }).click();

    await expect(page.getByRole("status", { name: "Resultado de copia" })).toHaveText("Copiado");
    if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://example.com/invitacion");
  });
});

test("offers a waiting service worker update and reloads once it takes control", async ({ page }) => {
  await page.goto("/pwa.html?version=1");
  const supportsServiceWorkers = await page.evaluate(() => "serviceWorker" in navigator);
  test.skip(!supportsServiceWorkers, "This browser build has no Service Worker API.");

  await page.evaluate(() => navigator.serviceWorker.ready);
  // Only a reload puts the first worker in control; until then there is nothing to update.
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "")).toContain("version=1");
  await expect(page.getByRole("button", { name: "Actualizar app" })).toHaveCount(0);

  await page.goto("/pwa.html?version=2");
  const updateButton = page.getByRole("button", { name: "Actualizar app" });
  await expect(updateButton).toBeVisible();
  const reloaded = page.waitForEvent("load");
  await updateButton.click();
  await reloaded;

  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "")).toContain("version=2");
  await expect(page.getByRole("button", { name: "Actualizar app" })).toHaveCount(0);
});
