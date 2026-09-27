/** Verifies product helpers where jsdom lacks the browser APIs they rely on. */
import { expect, test } from "@playwright/test";

test.describe("migrated components", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/migrated.html");
  });

  test("copies text to the clipboard from a user gesture", async ({ page, browserName, context }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.getByRole("button", { name: "Copiar invitación" }).click();

    await expect(page.getByRole("status", { name: "Resultado de copia" })).toHaveText("Copiado");
    if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://example.com/invitacion");
  });

  test("keeps the file item outline above its progress fill", async ({ page }) => {
    const item = page.getByRole("listitem").filter({ hasText: "recibo.pdf" });

    // Hit testing skips the outline (pointer-events: none), so compare the painted stacking order.
    const layers = await item.evaluate((itemElement) => {
      const outline = itemElement.querySelector('[data-slot="file-upload-item-outline"]');
      const fill = itemElement.querySelector('[role="progressbar"]');
      const zIndexOf = (element: Element | null) => (element ? Number.parseInt(getComputedStyle(element).zIndex, 10) || 0 : null);
      return { outline: zIndexOf(outline), fill: zIndexOf(fill), outlineShadow: outline ? getComputedStyle(outline).boxShadow : "" };
    });

    expect(layers.fill).not.toBeNull();
    expect(layers.outline).toBeGreaterThan(layers.fill ?? 0);
    expect(layers.outlineShadow).toContain("inset");
  });
});
