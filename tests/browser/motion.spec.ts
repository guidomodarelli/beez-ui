/** Verifies motion and its accessible fallback in real browser layout and interactions. */
import { expect, test } from "@playwright/test";
import { recordMotion } from "./motion-recorder.js";

test("should animate menus and dialogs while preserving keyboard dismissal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  // Record native animations when created: sampling frames can miss short playback
  // entirely when WebKit is busy. Delegate unchanged to the real browser API.
  const animatedRoles = await page.evaluateHandle(() => {
    const observed = new Set<string>();
    const nativeAnimate = Element.prototype.animate;

    /** Observes real animations without replacing their effects, timing or controls. */
    Element.prototype.animate = function (...args) {
      const animation = nativeAnimate.apply(this, args);
      const role = this.getAttribute("role");
      if ((role === "menu" || role === "dialog") && animation.effect) {
        observed.add(role);
      }
      return animation;
    };
    return {
      observed,
      stop: () => {
        Element.prototype.animate = nativeAnimate;
      },
    };
  });
  try {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect
      .poll(() => animatedRoles.evaluate(({ observed }) => observed.has("menu")))
      .toBe(true);
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await expect(page.getByLabel("Acción")).toHaveText("Edición seleccionada");
    await expect(page.getByRole("menu")).not.toBeVisible();
    // Exit presence must release the menu's focus scope before opening another modal.
    await expect(page.getByRole("menu", { includeHidden: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir diálogo" }).click();
    const dialog = page.getByRole("dialog");
    await expect
      .poll(() => animatedRoles.evaluate(({ observed }) => observed.has("dialog")))
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Abrir diálogo" }),
    ).toBeFocused();
  } finally {
    await animatedRoles.evaluate(({ stop }) => stop());
    await animatedRoles.dispose();
  }
});

test("should spring pressed buttons, lift them on real hover and not animate disabled actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const button = page.getByRole("button", {
    name: "Acción principal",
    exact: true,
  });
  const canHover = await page.evaluate(
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  await button.hover();
  if (canHover) {
    await expect(button).toHaveCSS(
      "transform",
      "matrix(1.02, 0, 0, 1.02, 0, 0)",
    );
  }
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", "matrix(0.93, 0, 0, 0.93, 0, 0)");
  await page.mouse.up();
  await page.mouse.move(0, 0);
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
  await page.mouse.down();
  await expect(disabled).toHaveCSS("transform", "none");
  await page.mouse.up();
});
test("should glide the tab indicator and hand the highlight back to the active tab", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const detail = page.getByRole("tab", { name: "Detalle" });
  const activeBackground = await page
    .getByRole("tab", { name: "Resumen" })
    .evaluate((tab) => getComputedStyle(tab).backgroundColor);
  await detail.click();
  await expect.poll(motion.glides).toContain("tabs-list");
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(detail).toHaveAttribute("aria-selected", "true");
  await expect(detail).not.toHaveAttribute("data-glide-target");
  await expect(detail).toHaveCSS("background-color", activeBackground);
  await expect(page.getByText("Contenido del detalle")).toBeVisible();
  await expect
    .poll(() => motion.properties({ role: "tabpanel" }))
    .toContain("transform");
});

test("should glide the menu highlight between items with the keyboard", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Duplicar" })).toBeFocused();
  await expect.poll(motion.glides).toContain("dropdown-menu-content");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Acción")).toHaveText("Copia seleccionada");
  await expect
    .poll(() => motion.properties({ role: "menu" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "clipPath"]));
});

test("should pop and draw the checkbox mark and blur it out when unchecked", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const checkbox = page.getByRole("checkbox", { name: "Recibir novedades" });
  const indicator = page.locator("[data-slot=checkbox-indicator]");
  await expect(indicator).toHaveCSS("opacity", "0");
  await checkbox.check();
  await expect(indicator).toHaveCSS("opacity", "1");
  await expect
    .poll(() => motion.properties({ slot: "checkbox-indicator" }))
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await expect(indicator).toHaveCSS("opacity", "0");
  await expect
    .poll(() => motion.properties({ slot: "checkbox-indicator" }))
    .toContain("filter");
  await expect(indicator).toHaveCSS("opacity", "0");

  // Re-checking after the blurred exit, and toggling faster than the stroke draws, must still
  // settle on a sharp, fully drawn mark.
  await checkbox.check();
  await checkbox.click();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(indicator).toHaveCSS("opacity", "1");
  await expect(indicator).toHaveCSS("filter", "none");
  await expect(indicator).toHaveCSS("transform", "none");
  await expect(indicator.locator("path")).toHaveCSS("stroke-dasharray", "none");
});

test("should spring the switch thumb, blur in tooltips and shake invalid fields", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const toggle = page.getByRole("switch", { name: "Modo compacto" });
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect
    .poll(() => motion.properties({ slot: "switch-thumb" }))
    .toContain("transform");
  await expect(page.locator("[data-slot=switch-thumb]")).toHaveCSS("transform", "none");

  await page.getByRole("button", { name: "Ayuda" }).focus();
  await expect(page.getByRole("tooltip")).toHaveText("Explicación breve");
  await expect
    .poll(() => motion.properties({ slot: "tooltip-content" }))
    .toEqual(expect.arrayContaining(["filter", "transform", "opacity"]));

  await page.getByRole("button", { name: "Validar correo" }).click();
  const email = page.getByRole("textbox", { name: "Correo" });
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() => motion.properties({ slot: "input" }))
    .toContain("transform");
  await expect(email).toHaveCSS("transform", "none");
});

test("should switch tabs and toggle marks without gliding when motion is reduced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("tab", { name: "Detalle" }).click();
  await expect(page.getByText("Contenido del detalle")).toBeVisible();
  await page.getByRole("checkbox", { name: "Recibir novedades" }).check();
  await expect(page.locator("[data-slot=checkbox-indicator]")).toHaveCSS("opacity", "1");
  expect(await motion.glides()).toEqual([]);
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

test("should turn the select chevron and stagger its options in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const trigger = page.getByRole("combobox", { name: "Moneda" });
  // An open Select hides everything outside its listbox from the accessibility tree.
  const chevron = page.locator("[data-slot=select-icon]");
  await expect(chevron).toHaveCSS("rotate", "none");
  await trigger.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(chevron).toHaveCSS("rotate", "180deg");
  await expect
    .poll(() => motion.properties({ slot: "select-icon" }))
    .toContain("transform");
  await expect
    .poll(() => motion.properties({ slot: "select-item" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "filter"]));
  await page.getByRole("option", { name: "Dólares" }).click();
  await expect(page.locator("[data-slot=select-trigger]")).toHaveText("Dólares");
  await expect(chevron).toHaveCSS("rotate", "none");
  await expect(chevron).toHaveCSS("transform", "none");
});

test("should pop the check of a menu checkbox item", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const archived = page.getByRole("menuitemcheckbox", { name: "Mostrar archivados" });
  await archived.click();
  await expect(archived).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() =>
      motion.properties({ parentSlot: "dropdown-menu-checkbox-item-indicator" }),
    )
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
});

test("should rotate the group chevron of the data table instead of swapping icons", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const group = page.getByRole("button", { name: "ARS (2)" });
  const chevron = group.locator("svg");
  await expect(group).toHaveAttribute("aria-expanded", "true");
  await expect(chevron).toHaveCSS("rotate", "90deg");
  await group.click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("cell", { name: "Luz" })).toHaveCount(0);
  await expect(chevron).toHaveCSS("rotate", "none");
  await expect
    .poll(() => motion.properties({ buttonText: "ARS (2)" }))
    .toContain("transform");
  await expect(chevron).toHaveCSS("transform", "none");
});

test("should blur-swap the theme icon and pop in the dialog close button", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() => motion.properties({ buttonText: "Alternar tema" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "filter"]));
  await expect(
    page.getByRole("button", { name: "Alternar tema" }).locator("svg"),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Abrir diálogo" }).click();
  const close = page.locator("[data-slot=dialog-close]");
  await expect
    .poll(() => motion.properties({ buttonText: "Cerrar" }))
    .toEqual(expect.arrayContaining(["opacity", "scale"]));
  await expect(close).toHaveCSS("opacity", "1");
  await expect(close).toHaveCSS("transform", "none");
  await close.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("should keep chevrons in their final orientation without animating when motion is reduced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const trigger = page.getByRole("combobox", { name: "Moneda" });
  await trigger.click();
  await expect(page.locator("[data-slot=select-icon]")).toHaveCSS("rotate", "180deg");
  await expect(page.getByRole("option", { name: "Pesos" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "ARS (2)" }).click();
  await expect(
    page.getByRole("button", { name: "ARS (2)" }).locator("svg"),
  ).toHaveCSS("rotate", "none");
  expect(await motion.properties({ slot: "select-icon" })).toEqual([]);
  expect(await motion.properties({ slot: "select-item" })).toEqual([]);
  expect(await motion.properties({ buttonText: "ARS (2)" })).toEqual([]);
});
