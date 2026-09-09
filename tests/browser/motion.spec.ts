/** Verifies motion and its accessible fallback in real browser layout and interactions. */
import { expect, test } from "@playwright/test";

test("should animate menus and dialogs while preserving keyboard dismissal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  expect(
    await page
      .getByRole("menu")
      .evaluate((element) =>
        element
          .getAnimations()
          .some((animation) => !(animation instanceof CSSAnimation)),
      ),
  ).toBe(true);
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await expect(page.getByLabel("Acción")).toHaveText("Edición seleccionada");
  await expect(page.getByRole("menu")).not.toBeVisible();
  await page.getByRole("button", { name: "Abrir diálogo" }).click();
  const dialog = page.getByRole("dialog");
  expect(
    await dialog.evaluate((element) =>
      element
        .getAnimations()
        .some((animation) => !(animation instanceof CSSAnimation)),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir diálogo" }),
  ).toBeFocused();
});

test("should give pressed buttons restrained feedback without animating disabled actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const button = page.getByRole("button", {
    name: "Acción principal",
    exact: true,
  });
  await button.hover();
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", "matrix(0.98, 0, 0, 0.98, 0, 0)");
  await page.mouse.up();
  await expect(button).toHaveCSS("transform", "none");
  expect((await button.boundingBox())!.width).toBeGreaterThan(100);
  const disabled = page.getByRole("button", {
    name: "Acción deshabilitada",
    exact: true,
  });
  const bounds = (await disabled.boundingBox())!;
  // Disabled buttons deliberately reject pointer events; move the real pointer over their bounds.
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await expect(disabled).toBeDisabled();
  await expect(disabled).not.toHaveCSS(
    "transform",
    "matrix(0.98, 0, 0, 0.98, 0, 0)",
  );
});

test("should honor reduced motion and show readable text immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motion.html");
  await expect(
    page.getByText("Lectura sin esperas", { exact: true }),
  ).toBeVisible({ timeout: 2000 });
  expect(
    await page
      .locator('[data-slot="skeleton"]')
      .evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  expect(
    await page
      .getByRole("menu")
      .evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await expect(page.getByLabel("Acción")).toHaveText("Edición seleccionada");
  await page.getByRole("button", { name: "Actualizar texto" }).click();
  await expect(
    page.getByText("Texto actualizado", { exact: true }),
  ).toBeVisible({ timeout: 2000 });
  await page.getByRole("checkbox", { name: "Recibir novedades" }).check();
  await expect(
    page.getByRole("checkbox", { name: "Recibir novedades" }),
  ).toBeChecked();
});

test("should respond when the system motion preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  await expect(
    page.getByRole("heading", { name: "Movimiento compartido" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByText("Lectura sin esperas", { exact: true }),
  ).toBeVisible({ timeout: 2000 });
});
