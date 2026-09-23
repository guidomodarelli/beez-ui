/** Verifies every remaining motion-enabled component animates, settles cleanly and stays usable. */
import { expect, test, type Locator } from "@playwright/test";
import { recordMotion } from "./motion-recorder.js";

/** Asserts that playback left no visual residue: no transform, blur, clip or partial opacity. */
async function expectSettled(target: Locator) {
  await expect(target).toHaveCSS("opacity", "1");
  await expect(target).toHaveCSS("transform", "none");
  await expect(target).toHaveCSS("filter", "none");
  await expect(target).toHaveCSS("clip-path", "none");
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("should glide the sidebar active item and hand the highlight back", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  const reports = page.getByRole("button", { name: "Reportes" });
  const activeBackground = await page
    .getByRole("button", { name: "Inicio" })
    .evaluate((button) => getComputedStyle(button).backgroundColor);
  await reports.click();
  await expect(page.getByLabel("Sección activa")).toHaveText("Reportes");
  await expect.poll(motion.glides).toContain("sidebar-menu");
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(reports).not.toHaveAttribute("data-glide-target");
  await expect(reports).not.toHaveAttribute("data-glide-freeze");
  await expect(reports).toHaveCSS("background-color", activeBackground);
  await expect(page.getByRole("button", { name: "Inicio" })).not.toHaveCSS(
    "background-color",
    activeBackground,
  );
  await expectSettled(reports);
});

test("should slide the sheet in and out from its edge", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Abrir panel" }).click();
  const sheet = page.getByRole("dialog", { name: "Panel lateral" });
  await expect(sheet).toBeVisible();
  await expect
    .poll(() => motion.properties({ slot: "sheet-content" }))
    .toContain("transform");
  await expectSettled(sheet);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir panel" })).toBeFocused();
});

test("should spring the alert dialog and keep its actions working", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Eliminar cuenta" }).click();
  const alert = page.getByRole("alertdialog", { name: "¿Eliminar la cuenta?" });
  await expect(alert).toBeVisible();
  await expect
    .poll(() => motion.properties({ role: "alertdialog" }))
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
  await expectSettled(alert);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(page.getByLabel("Última acción")).toHaveText("Cuenta eliminada");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("should reveal popovers and hover cards from their trigger", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Ver filtros" }).click();
  const popover = page.getByRole("dialog").filter({ hasText: "Filtros disponibles" });
  await expect(popover).toBeVisible();
  await expect
    .poll(() => motion.properties({ slot: "popover-content" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "clipPath"]));
  await expectSettled(popover);
  await page.keyboard.press("Escape");
  await expect(page.getByText("Filtros disponibles")).toHaveCount(0);

  await page.getByRole("link", { name: "Perfil público" }).hover();
  const card = page.getByText("Tarjeta de perfil");
  await expect(card).toBeVisible();
  await expect
    .poll(() => motion.properties({ slot: "hover-card-content" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "clipPath"]));
  await expectSettled(page.locator("[data-slot=hover-card-content]"));
});

test("should open a submenu with motion and glide inside it", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: "Mover a" }).hover();
  await page.keyboard.press("ArrowRight");
  // The submenu renders inside its parent menu, so it is located by its slot.
  const submenu = page.locator("[data-slot=dropdown-menu-sub-content]");
  await expect(submenu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Archivo" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Papelera" })).toBeFocused();
  await expect.poll(motion.glides).toContain("dropdown-menu-sub-content");
  await expectSettled(submenu);
  // Only the submenu glides its items; the parent menu must not hide their highlight too.
  const trash = page.getByRole("menuitem", { name: "Papelera" });
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(trash).not.toHaveAttribute("data-glide-target");
  await expect(trash).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  // Suspended transitions come back two painted frames after the glide lands.
  await expect.poll(async () => (await trash.getAttribute("style")) ?? "").toBe("");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Última acción")).toHaveText("Movido a papelera");
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("should press radios and pop their dot on selection", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  const yearly = page.getByRole("radio", { name: "Anual" });
  await yearly.click();
  await expect(yearly).toBeChecked();
  await expect
    .poll(() => motion.properties({ slot: "radio-group-indicator" }))
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
  await expectSettled(yearly);
  await expectSettled(page.locator("[data-slot=radio-group-indicator]"));
});

test("should shake the whole input group and textarea when they turn invalid", async ({
  page,
}) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Validar código" }).click();
  await expect(page.getByRole("textbox", { name: "Código" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect
    .poll(() => motion.properties({ slot: "input-group" }))
    .toContain("transform");
  expect(await motion.properties({ slot: "input-group-control" })).not.toContain(
    "transform",
  );
  await expectSettled(page.locator("[data-slot=input-group]"));

  await page.getByRole("button", { name: "Validar nota" }).click();
  await expect
    .poll(() => motion.properties({ slot: "textarea" }))
    .toContain("transform");
  await expectSettled(page.getByRole("textbox", { name: "Nota" }));
});

test("should blur in the form message and shake the invalid control", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  const message = page.getByText("El nombre es obligatorio");
  await expect(message).toBeVisible();
  await expect
    .poll(() => motion.properties({ slot: "form-message" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "filter"]));
  await expect
    .poll(() => motion.properties({ slot: "form-control" }))
    .toContain("transform");
  await expectSettled(message);
  await expectSettled(page.getByRole("textbox", { name: "Nombre" }));
});

test("should keep long selects responsive and blur only the first options", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("combobox", { name: "País" }).click();
  await expect(page.getByRole("option", { name: "País 1", exact: true })).toBeVisible();
  await expect
    .poll(async () => (await motion.properties({ slot: "select-item" })).length)
    .toBeGreaterThan(0);
  const filters = (await motion.properties({ slot: "select-item" })).filter(
    (property) => property === "filter",
  );
  expect(filters.length).toBeLessThanOrEqual(10);
  const firstOption = page.getByRole("option", { name: "País 1", exact: true });
  await expectSettled(firstOption);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-slot=select-trigger]")).toContainText("País");
});

test("should not jump a switch thumb that was hidden when the page loaded", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Mostrar preferencia" }).click();
  const toggle = page.getByRole("switch", { name: "Avisos por correo" });
  await expect(toggle).toBeVisible();
  const thumb = page.locator("#catalog-switch [data-slot=switch-thumb]");
  const uncheckedLeft = (await thumb.boundingBox())!.x;
  await toggle.click();
  await expect(toggle).toBeChecked();
  // The glide starts where the thumb was, never from the track's left edge beyond it.
  await expect
    .poll(() => motion.properties({ slot: "switch-thumb" }))
    .toContain("transform");
  await expect(thumb).toHaveCSS("transform", "none");
  expect((await thumb.boundingBox())!.x).toBeGreaterThan(uncheckedLeft);
});

test("should glide the underline of line tabs and restore it", async ({ page }) => {
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  const paused = page.getByRole("tab", { name: "Pausados" });
  await paused.click();
  await expect(paused).toHaveAttribute("aria-selected", "true");
  await expect.poll(motion.glides).toContain("tabs-list");
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(paused).not.toHaveAttribute("data-glide-target");
  await expect
    .poll(() => paused.evaluate((tab) => getComputedStyle(tab, "::after").opacity))
    .toBe("1");
  await expect(page.getByText("Elementos pausados")).toBeVisible();
});

test("should run every catalog interaction without motion when it is reduced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await recordMotion(page);
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Reportes" }).click();
  await expect(page.getByLabel("Sección activa")).toHaveText("Reportes");
  await page.getByRole("button", { name: "Validar código" }).click();
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByText("El nombre es obligatorio")).toBeVisible();
  await page.getByRole("button", { name: "Abrir panel" }).click();
  await expect(page.getByRole("dialog", { name: "Panel lateral" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await motion.glides()).toEqual([]);
  expect(await motion.properties({})).toEqual([]);
});

test("should continue an interrupted thumb glide from where it is", async ({ page }) => {
  await page.goto("/motion-catalog.html");
  await page.getByRole("button", { name: "Mostrar preferencia" }).click();
  const toggle = page.getByRole("switch", { name: "Avisos por correo" });
  await toggle.hover();
  // Samples positions inside the page so test latency cannot skip the frames that matter.
  const positions = await toggle.evaluate(async (element) => {
    const button = element as HTMLButtonElement;
    const thumb = button.querySelector<HTMLElement>("[data-slot=switch-thumb]")!;
    const left = () => thumb.getBoundingClientRect().left;
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const start = left();
    button.click();
    // Reverses once the glide is visibly under way, however long the engine takes to start it.
    for (let frame = 0; frame < 60 && left() - start < 4; frame += 1) await nextFrame();
    const beforeReverse = left();
    button.click();
    await nextFrame();
    await nextFrame();
    return { start, beforeReverse, afterReverse: left() };
  });
  expect(positions.beforeReverse).toBeGreaterThan(positions.start);
  // A reversed glide starts where the thumb was painted, never from the far end of the track.
  expect(Math.abs(positions.afterReverse - positions.beforeReverse)).toBeLessThan(4);
  await expect(toggle).not.toBeChecked();
  await expect(page.locator("#catalog-switch [data-slot=switch-thumb]")).toHaveCSS(
    "transform",
    "none",
  );
});

test("should close overlays mid-entrance from where they are without Motion warnings", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (/not an animatable value/i.test(message.text())) warnings.push(message.text());
  });
  await page.goto("/motion-catalog.html");
  for (const name of ["Ver filtros", "Más opciones"]) {
    const trigger = page.getByRole("button", { name });
    await trigger.click();
    // Closes while the entrance is still playing.
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-slot=popover-content],[data-slot=dropdown-menu-content]")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await page.getByRole("button", { name: "Eliminar cuenta" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(warnings).toEqual([]);
});

test("should finish closing a surface whose parent keeps re-rendering", async ({ page }) => {
  await page.goto("/motion-catalog.html");
  const trigger = page.getByRole("button", { name: "Ver en vivo" });
  await trigger.click();
  await expect(page.getByText("Datos en vivo")).toBeVisible();
  await page.keyboard.press("Escape");
  // Each re-render hands out a new presence callback; the exit must still complete once.
  await expect(page.getByText("Datos en vivo")).toHaveCount(0, { timeout: 2000 });
  await expect(trigger).toBeFocused();
});

test("should glide the first sidebar change after hydration remounts its buttons", async ({
  page,
}) => {
  const motion = await recordMotion(page);
  await page.goto("http://127.0.0.1:3109/sidebar");
  const reports = page.getByRole("button", { name: "Reportes" });
  // Tooltip wrappers are added after hydration, which remounts every menu button.
  await expect(reports).toHaveAttribute("data-state", "closed");
  await reports.click();
  await expect(page.getByLabel("Sección activa")).toHaveText("Reportes");
  await expect.poll(motion.glides).toContain("sidebar-menu");
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(reports).not.toHaveAttribute("data-glide-target");
});
