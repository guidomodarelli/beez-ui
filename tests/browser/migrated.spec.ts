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
});
