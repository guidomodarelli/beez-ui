/** Verifies the polished motion and the fixed behaviors in real browser layout and input. */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { recordMotion } from "./motion-recorder.js";

type TimingRecord = { slot: string | null; duration: unknown; easing: unknown };
type TimingWindow = Window & { __timings: TimingRecord[] };

/** Asserts that playback left no visual residue on the element. */
async function expectSettled(target: Locator) {
  await expect(target).toHaveCSS("opacity", "1");
  await expect(target).toHaveCSS("transform", "none");
  await expect(target).toHaveCSS("filter", "none");
}

/** Records the timing options each native animation is created with, delegating unchanged. */
async function recordTimings(page: Page) {
  await page.addInitScript(() => {
    const timings: TimingRecord[] = [];
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const [, options] = args;
      if (options && typeof options === "object") {
        timings.push({
          slot: this.getAttribute("data-slot"),
          duration: options.duration,
          easing: options.easing,
        });
      }
      return nativeAnimate.apply(this, args);
    };
    Object.assign(window, { __timings: timings });
  });
  return (slot: string) =>
    page.evaluate(
      (target) => (window as unknown as TimingWindow).__timings.filter((record) => record.slot === target),
      slot,
    );
}

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("should glide the current page highlight and hand it back to the selected page", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    const firstPage = page.getByRole("link", { name: "1", exact: true });
    const thirdPage = page.getByRole("link", { name: "3", exact: true });
    const activeBackground = await firstPage.evaluate((link) => getComputedStyle(link).backgroundColor);
    await expect(firstPage).toHaveAttribute("aria-current", "page");
    await thirdPage.click();
    await expect(thirdPage).toHaveAttribute("aria-current", "page");
    await expect(firstPage).not.toHaveAttribute("aria-current");
    await expect.poll(motion.glides).toContain("pagination-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
    await expect(thirdPage).not.toHaveAttribute("data-glide-target");
    // The pointer still rests on the link after the click; hover paints its own background.
    await page.mouse.move(0, 0);
    await thirdPage.blur();
    await expect(thirdPage).toHaveCSS("background-color", activeBackground);
    expect(page.url()).not.toContain("#pagina-3");
  });

  test("should glide the filter suggestion highlight as the keyboard moves through it", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    const input = page.getByRole("combobox", { name: "Filtrar movimientos" });
    await input.click();
    const options = page.getByRole("option");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await input.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect.poll(motion.glides).toContain("filter-query-bar-suggestions");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
    await expect(options.nth(1)).not.toHaveAttribute("data-glide-target");
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-activedescendant", (await options.nth(1).getAttribute("id"))!);
    await input.press("Enter");
    await expect(input).toHaveValue("tiene:");
  });

  test("should slide the next calendar month in from the navigation side and settle", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    const month = page.locator('[data-slot="calendar-month"]');
    await expect(month).toContainText("enero 2026");
    expect(await motion.properties({ slot: "calendar-month" })).toEqual([]);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(month).toContainText("febrero 2026");
    await expect.poll(() => motion.properties({ slot: "calendar-month" })).toContain("transform");
    await expectSettled(month);
    await page.getByRole("button", { name: /anterior/i }).click();
    await expect(month).toContainText("enero 2026");
    await expectSettled(month);
  });

  test("should develop a freshly loaded avatar image in place", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await expect(page.getByText("AN", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cargar foto" }).click();
    const image = page.getByRole("img", { name: "Foto de Ana" });
    await expect(image).toBeVisible();
    await expect.poll(() => motion.properties({ slot: "avatar-image" })).toEqual(
      expect.arrayContaining(["opacity", "transform", "filter"]),
    );
    await expectSettled(image);
  });

  test("should sweep a shine across the skeleton", async ({ page }) => {
    await page.goto("/polish.html");
    const skeleton = page.getByLabel("Cargando resumen");
    // The shine is a pseudo-element translated on the compositor, never the box itself.
    await expect
      .poll(() =>
        skeleton.evaluate((element) =>
          element
            .getAnimations({ subtree: true })
            .map((animation) => (animation.effect as KeyframeEffect).pseudoElement),
        ),
      )
      .toContain("::after");
    const positions = new Set<string>();
    await expect
      .poll(async () => {
        positions.add(await skeleton.evaluate((element) => getComputedStyle(element, "::after").translate));
        return positions.size;
      })
      .toBeGreaterThan(1);
    await expectSettled(skeleton);
  });

  test("should blink an idle typing cursor that assistive technology ignores", async ({ page }) => {
    await page.goto("/polish.html");
    const typing = page.locator('[data-slot="typing-animation"]');
    await expect(typing).toContainText("Hola");
    const cursor = page.locator('[data-slot="typing-animation-cursor"]');
    await expect(cursor).toHaveAttribute("aria-hidden", "true");
    // Paused after the first word, the caret blinks. Sampling every frame for a cycle and a half
    // (not with a backing-off poll, whose interval can match the blink period) must see it both
    // shown and hidden.
    const { lowest, highest } = await cursor.evaluate(
      (element) =>
        new Promise<{ lowest: number; highest: number }>((resolve) => {
          const startedAt = performance.now();
          let lowest = 1;
          let highest = 0;
          const sample = () => {
            const opacity = Number.parseFloat(getComputedStyle(element).opacity);
            lowest = Math.min(lowest, opacity);
            highest = Math.max(highest, opacity);
            if (performance.now() - startedAt < 1500) requestAnimationFrame(sample);
            else resolve({ lowest, highest });
          };
          requestAnimationFrame(sample);
        }),
    );
    expect(highest).toBeGreaterThan(0.9);
    expect(lowest).toBeLessThan(0.1);
  });

  test("should close the sheet with the drawer curve and pop its close button in", async ({ page }) => {
    const timings = await recordTimings(page);
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await page.getByRole("button", { name: "Abrir ajustes" }).click();
    const sheet = page.getByRole("dialog", { name: "Ajustes" });
    await expect(sheet).toBeVisible();
    await expect.poll(() => motion.properties({ buttonText: "Close" })).toContain("scale");
    await expectSettled(sheet);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Motion creates the exit on its next frame; the entrance is the first record.
    await expect.poll(async () => (await timings("sheet-content")).length).toBeGreaterThan(1);
    const exit = (await timings("sheet-content")).at(-1);
    expect(exit).toMatchObject({ duration: 240 });
    expect(String(exit?.easing).replaceAll(" ", "")).toBe("cubic-bezier(0.32,0.72,0,1)");
    await expect(page.getByRole("button", { name: "Abrir ajustes" })).toBeFocused();
  });

  test("should never clip the menu outline or shadow while it opens", async ({ page }) => {
    await page.goto("/polish.html");
    await page.evaluate(() => {
      const clips: string[] = [];
      const sample = () => {
        const menu = document.querySelector('[role="menu"]');
        if (menu) clips.push(getComputedStyle(menu).clipPath);
        if (clips.length < 60) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      Object.assign(window, { __clips: clips });
    });
    await page.getByRole("button", { name: "Más acciones" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __clips: string[] }).__clips.length)).toBeGreaterThanOrEqual(60);
    const clips = await page.evaluate(() => (window as unknown as { __clips: string[] }).__clips);
    const insetClips = clips.filter((clip) => clip.startsWith("inset("));
    expect(insetClips.length).toBeGreaterThan(0);
    // Every clip frame leaves room past the box: the ring and shadow are box-shadows outside it.
    for (const clip of insetClips) expect(clip).toContain("-24px");
    expect(clips.at(-1)).not.toBe("inset(0%)");
  });

  test("should move the menu highlight straight to the pointer and glide it with the keyboard", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await page.getByRole("button", { name: "Más acciones" }).click();
    const rename = page.getByRole("menuitem", { name: "Renombrar" });
    const duplicate = page.getByRole("menuitem", { name: "Duplicar" });
    const archive = page.getByRole("menuitem", { name: "Archivar" });
    await rename.hover();
    await duplicate.hover();
    await archive.hover();
    await expect(archive).toHaveAttribute("data-highlighted", "");
    expect(await motion.glides()).not.toContain("dropdown-menu-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
    await page.keyboard.press("ArrowUp");
    await expect(duplicate).toHaveAttribute("data-highlighted", "");
    await expect.poll(motion.glides).toContain("dropdown-menu-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  });

  test("should nudge the submenu chevron toward its open submenu", async ({ page }) => {
    await page.goto("/polish.html");
    await page.getByRole("button", { name: "Más acciones" }).click();
    const trigger = page.getByRole("menuitem", { name: "Compartir" });
    const chevron = trigger.locator('[data-slot="dropdown-menu-sub-trigger-icon"]');
    await expect(chevron).toHaveCSS("translate", "none");
    await trigger.press("ArrowRight");
    await expect(page.getByRole("menuitem", { name: "Por enlace" })).toBeVisible();
    await expect(chevron).toHaveCSS("translate", "2px");
  });

  test("should keep the interactive card outline while its hover shadow lifts it", async ({ page }) => {
    await page.goto("/polish.html");
    const canHover = await page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    test.skip(!canHover, "Touch viewports have no hover lift by design.");
    const card = page.getByLabel("Resumen del mes");
    const restingShadow = await card.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(restingShadow).toContain("0px 0px 0px 1px");
    await card.hover();
    await expect
      .poll(() => card.evaluate((element) => getComputedStyle(element).boxShadow))
      .toMatch(/0px 0px 0px 1px.*0px 4px 16px 0px/);
    await page.mouse.move(0, 0);
    await expect.poll(() => card.evaluate((element) => element.style.boxShadow)).toBe("");
    expect(await card.evaluate((element) => getComputedStyle(element).boxShadow)).toBe(restingShadow);
  });

  test("should lift the hovered avatar of a group on real hover pointers", async ({ page }) => {
    await page.goto("/polish.html");
    const canHover = await page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    test.skip(!canHover, "Touch viewports have no hover lift by design.");
    const avatar = page.getByLabel("Equipo").locator('[data-slot="avatar"]').first();
    await avatar.hover();
    await expect(avatar).toHaveCSS("translate", "0px -2px");
  });
});

test("should draw unstyled borders with the theme border token instead of the text color", async ({ page }) => {
  await page.goto("/polish.html");
  const footer = page.getByLabel("Resumen del mes").locator('[data-slot="card-footer"]');
  const [borderColor, tokenColor, textColor] = await footer.evaluate((element) => {
    const probe = document.createElement("div");
    probe.style.borderColor = "var(--border)";
    document.body.append(probe);
    const token = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return [getComputedStyle(element).borderTopColor, token, getComputedStyle(element).color];
  });
  expect(borderColor).toBe(tokenColor);
  expect(borderColor).not.toBe(textColor);
});

test("should paint the outline sidebar button border from the oklch theme token", async ({ page }) => {
  await page.goto("/polish.html");
  const button = page.getByRole("button", { name: "Accesos rápidos" });
  const shadow = await button.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(shadow).not.toBe("none");
  expect(shadow).toContain("1px");
});

test("should move a vertical carousel with the up and down arrow keys", async ({ page }) => {
  await page.goto("/polish.html");
  const carousel = page.getByRole("region", { name: "Novedades" });
  const previous = carousel.getByRole("button", { name: "Previous slide" });
  const next = carousel.getByRole("button", { name: "Next slide" });
  await expect(previous).toBeDisabled();
  await next.focus();
  await page.keyboard.press("ArrowDown");
  await expect(previous).toBeEnabled();
  await page.keyboard.press("ArrowDown");
  await expect(next).toBeDisabled();
  await previous.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(previous).toBeDisabled();
});

test.describe("with reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("should change months, reveal avatars and page without animating", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator('[data-slot="calendar-month"]')).toContainText("febrero 2026");
    await page.getByRole("button", { name: "Cargar foto" }).click();
    await expect(page.getByRole("img", { name: "Foto de Ana" })).toBeVisible();
    await page.getByRole("link", { name: "2", exact: true }).click();
    await expect(page.getByRole("link", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await motion.properties({ slot: "calendar-month" })).toEqual([]);
    expect(await motion.properties({ slot: "avatar-image" })).toEqual([]);
    expect(await motion.glides()).toEqual([]);
    expect(
      await page
        .getByLabel("Cargando resumen")
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    ).toBe(0);
    await expect(page.locator('[data-slot="typing-animation"]')).toHaveText("Hola · Chau");
  });
});
