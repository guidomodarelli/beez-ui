/** Records animation effects and glide indicators as a page creates them, without altering them. */
import type { Page } from "@playwright/test";

type MotionRecord = {
  slot: string | null;
  role: string | null;
  parentSlot: string | null;
  /** Accessible text of the closest button, to identify decorative icons inside it. */
  buttonText: string | null;
  properties: string[];
};
type MotionTarget = { slot?: string; role?: string; parentSlot?: string; buttonText?: string };
type MotionWindow = Window & { __motionRecords: MotionRecord[]; __glides: string[] };

/** Records animation effects and glide indicators as the page creates them, without altering them. */
export async function recordMotion(page: Page) {
  await page.addInitScript(() => {
    const records: MotionRecord[] = [];
    const glides: string[] = [];
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const [keyframes] = args;
      const frames = Array.isArray(keyframes) ? keyframes : keyframes ? [keyframes] : [];
      records.push({
        slot: this.getAttribute("data-slot"),
        parentSlot: this.parentElement?.getAttribute("data-slot") ?? null,
        buttonText: this.closest("button")?.textContent?.trim() ?? null,
        role: this.getAttribute("role"),
        properties: frames.flatMap((keyframe) => Object.keys(keyframe ?? {})),
      });
      return nativeAnimate.apply(this, args);
    };
    new MutationObserver((mutations) => {
      for (const mutation of mutations)
        for (const node of mutation.addedNodes)
          if (node instanceof HTMLElement && node.hasAttribute("data-glide-indicator"))
            glides.push(node.parentElement?.getAttribute("data-slot") ?? "");
    }).observe(document, { childList: true, subtree: true });
    Object.assign(window, { __motionRecords: records, __glides: glides });
  });
  return {
    /** Returns the animated CSS properties recorded for elements matching a slot or role. */
    properties: (target: MotionTarget) =>
      page.evaluate(
        ({ slot, role, parentSlot, buttonText }) =>
          (window as unknown as MotionWindow).__motionRecords
            .filter(
              (record) =>
                (slot === undefined || record.slot === slot) &&
                (parentSlot === undefined || record.parentSlot === parentSlot) &&
                (buttonText === undefined || record.buttonText === buttonText) &&
                (role === undefined || record.role === role),
            )
            .flatMap((record) => record.properties),
        target,
      ),
    /** Returns the containers in which a glide indicator travelled. */
    glides: () =>
      page.evaluate(() => [...(window as unknown as MotionWindow).__glides]),
  };
}
