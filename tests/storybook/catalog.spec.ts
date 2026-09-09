/** Exercises the catalog as a developer would: browse examples and interact with controls. */
import { expect, test } from "@playwright/test";

test("should preserve filter focus while hovering and applying suggestions", async ({ page }) => {
  await page.goto("/iframe.html?id=components-filterquerybar--playground&viewMode=story");
  const input = page.getByRole("combobox");
  await input.click();
  await expect(input).toHaveAttribute("aria-expanded", "true");
  await input.click();
  const suggestion = page.getByRole("option").nth(1);
  await suggestion.hover();
  await expect(suggestion).toHaveAttribute("aria-selected", "true");
  await expect(input).toBeFocused();
  await input.press("Enter");
  await expect(input).toHaveValue("estado:");
  await expect(input).toBeFocused();
});

test("should render every catalog example without runtime errors", async ({
  page,
  request,
}) => {
  const response = await request.get("/index.json");
  expect(response.ok()).toBe(true);
  const index = (await response.json()) as {
    entries: Record<string, { id: string; type: string }>;
  };
  const stories = Object.values(index.entries).filter(
    (entry) => entry.type === "story",
  );
  expect(stories.length).toBeGreaterThanOrEqual(37);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const story of stories) {
    await test.step(story.id, async () => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
      await expect(page.locator("#storybook-root")).not.toBeEmpty();
      await expect(page.locator(".sb-errordisplay")).not.toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test("should apply args and keep form controls interactive", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-button--playground&viewMode=story&args=children:Eliminar;variant:destructive;disabled:true",
  );
  const button = page.getByRole("button", { name: "Eliminar", exact: true });
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("data-variant", "destructive");

  await page.goto(
    "/iframe.html?id=components-input--playground&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Nombre", exact: true });
  await input.fill("Nuevo nombre");
  await expect(input).toHaveValue("Nuevo nombre");

  await page.goto("/iframe.html?id=components-form--playground&viewMode=story");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByText("Ingresá tu nombre", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Nombre", exact: true })
    .fill("Guido");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByLabel("Resultado")).toHaveText("Guardado: Guido");
});

test("should update the canvas from the visible Controls panel", async ({
  page,
}) => {
  await page.goto("/?path=/story/components-button--playground");
  const canvas = page.frameLocator("#storybook-preview-iframe");
  await expect(
    canvas.getByRole("button", { name: "Guardar cambios", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "variant", exact: true })
    .selectOption("destructive");
  await expect(
    canvas.getByRole("button", { name: "Guardar cambios", exact: true }),
  ).toHaveAttribute("data-variant", "destructive");
  await page.getByText("True", { exact: true }).click();
  await expect(
    canvas.getByRole("button", { name: "Guardar cambios", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reset controls", exact: true })
    .click();
  await expect(
    canvas.getByRole("button", { name: "Guardar cambios", exact: true }),
  ).toBeEnabled();
});

test("should open composed controls and update their state", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-select--playground&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Frecuencia", exact: true }).click();
  await page.getByRole("option", { name: "Semanal", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Frecuencia", exact: true }),
  ).toHaveText("Semanal");

  await page.goto(
    "/iframe.html?id=components-dialog--playground&viewMode=story",
  );
  await page
    .getByRole("button", { name: "Abrir diálogo", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Editar perfil" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  await page.goto(
    "/iframe.html?id=components-themedtoaster--playground&viewMode=story",
  );
  await page
    .getByRole("button", { name: "Mostrar notificación", exact: true })
    .click();
  await expect(
    page.getByText("Cambios guardados", { exact: true }),
  ).toBeVisible();
});

test("should synchronize the theme story with the toolbar", async ({
  page,
}) => {
  await page.goto("/?path=/story/components-animatedthemetoggler--playground");
  const canvas = page.frameLocator("#storybook-preview-iframe");
  await canvas.getByRole("button", { name: "Alternar tema" }).click();
  await canvas
    .getByRole("menuitemradio", { name: "Oscuro", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tema compartido Oscuro" }),
  ).toBeVisible();
  await expect(canvas.locator("html")).toHaveClass(/dark/);
  await canvas.getByRole("button", { name: "Alternar tema" }).click();
  await expect(
    canvas.getByRole("menuitemradio", { name: "Oscuro", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await canvas
    .getByRole("menuitemradio", { name: "Claro", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tema compartido Claro" }),
  ).toBeVisible();
  await expect(canvas.locator("html")).toHaveClass(/light/);
});
