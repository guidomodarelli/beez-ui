"use client";

/** Animates the original primitive node with Motion, without adding DOM wrappers. */
import {
  useCallback,
  useLayoutEffect,
  useState,
  type ReactElement,
  type ComponentProps,
} from "react";
import { Slot } from "radix-ui";
import {
  animate,
  hover,
  press,
  usePresence,
  frame,
  type AnimationPlaybackControlsWithThen,
} from "motion/react";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import {
  MOTION_EASE,
  MOTION_TIMING,
  MOTION_PRESS_SCALE,
  MOTION_SURFACE_DISTANCE,
  MOTION_PANEL_DISTANCE,
  type MotionKind,
} from "./tokens.js";

/** Checks the actual DOM state rather than intercepting the component's event handlers. */
function isEnabled(element: Element): boolean {
  return (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-disabled") !== "true" &&
    !element.hasAttribute("data-disabled")
  );
}

/** Computes a small offset toward the surface's originating edge. */
function entryTransform(element: Element, kind: MotionKind): string {
  if (kind === "dialog") return "scale(0.985)";
  const distance =
    kind === "sheet" ? MOTION_PANEL_DISTANCE : MOTION_SURFACE_DISTANCE;
  const direction = element.getAttribute("data-side");
  const offset = kind === "sheet" ? distance : -distance;
  if (direction === "left") return `translateX(${-offset}px)`;
  if (direction === "right") return `translateX(${offset}px)`;
  if (direction === "top") return `translateY(${-offset}px)`;
  return `translateY(${offset}px)`;
}

/** Uses explicit identity transforms so Motion never interprets a missing scale as zero. */
function restingTransform(element: Element, kind: MotionKind): string {
  if (kind === "dialog") return "scale(1)";
  const direction = element.getAttribute("data-side");
  return direction === "left" || direction === "right"
    ? "translateX(0px)"
    : "translateY(0px)";
}

/** Composes refs through Radix Slot and delegates gesture, entry and exit playback to Motion. */
export function MotionSlot({
  children,
  kind = "fade",
  ref,
  ...props
}: Omit<ComponentProps<typeof Slot.Root>, "children"> & {
  children: ReactElement;
  kind?: MotionKind;
}) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const attach = useCallback(
    (node: HTMLElement | null) => {
      setElement(node);
      const cleanup = typeof ref === "function" ? ref(node) : undefined;
      if (ref && typeof ref !== "function") ref.current = node;
      return () => {
        setElement(null);
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
  const reduceMotion = usePrefersReducedMotion();
  const [isPresent, safeToRemove] = usePresence();

  useLayoutEffect(() => {
    let active = true;
    // Some primitives keep React children mounted in a detached portal while closed.
    // They must not hold an ancestor's exit open when there is no element to animate.
    if (!element) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemove?.();
        });
      return () => {
        active = false;
      };
    }
    const animations = new Set<AnimationPlaybackControlsWithThen>();
    const cleanups: Array<() => void> = [];
    const original = {
      opacity: element.style.opacity,
      transform: element.style.transform,
      translate: element.style.translate,
      boxShadow: element.style.boxShadow,
    };

    /** Restores caller-owned styles after playback so transforms do not leave compositing layers behind. */
    function restore() {
      element!.style.opacity = original.opacity;
      element!.style.transform = original.transform;
      element!.style.translate = original.translate;
      element!.style.boxShadow = original.boxShadow;
    }

    /** Releases only animations and listeners created for this primitive instance. */
    function dispose() {
      active = false;
      cleanups.forEach((cleanup) => cleanup());
      animations.forEach((animation) => animation.cancel());
      restore();
    }

    if (
      reduceMotion ||
      (!isPresent && element.hasAttribute("data-beez-theme-menu"))
    ) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemove?.();
        });
      return dispose;
    }

    /** Runs non-layout keyframes, retaining the node only for exit playback. */
    function play(
      keyframes: Parameters<typeof animate>[1],
      duration: number,
      remove = false,
      restoreOnComplete = true,
    ) {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      const animation = animate(element!, keyframes, {
        duration,
        ease: [...MOTION_EASE],
      });
      animations.add(animation);
      void animation.then(() => {
        animations.delete(animation);
        if (!active) return;
        if (remove) safeToRemove?.();
        else if (restoreOnComplete)
          frame.postRender(() => {
            if (active && !animations.size) restore();
          });
      });
    }

    const isSurface = ["surface", "dialog", "sheet", "overlay"].includes(kind);
    if (!isPresent) {
      if (!isSurface) {
        queueMicrotask(() => {
          if (active) safeToRemove?.();
        });
        return dispose;
      }
      const keyframes =
        kind === "overlay"
          ? { opacity: [1, 0] }
          : {
              opacity: [1, 0],
              transform: [
                restingTransform(element, kind),
                entryTransform(element, kind),
              ],
            };
      play(keyframes, MOTION_TIMING.exit, true);
      return dispose;
    }

    if (isSurface) {
      const keyframes =
        kind === "overlay"
          ? { opacity: [0, 1] }
          : {
              opacity: [0, 1],
              transform: [
                entryTransform(element, kind),
                restingTransform(element, kind),
              ],
            };
      play(
        keyframes,
        kind === "dialog" || kind === "sheet"
          ? MOTION_TIMING.panel
          : MOTION_TIMING.enter,
      );
    } else if (kind === "skeleton") {
      animations.add(
        animate(
          element,
          { opacity: [1, 0.6, 1] },
          {
            duration: MOTION_TIMING.skeleton,
            repeat: Infinity,
            ease: "easeInOut",
          },
        ),
      );
    } else if (kind === "selection") {
      play(
        { opacity: [0, 1], transform: ["scale(0.85)", "scale(1)"] },
        MOTION_TIMING.fast,
      );
    } else if (kind === "fade" || kind === "card" || kind === "row") {
      play({ opacity: [0, 1] }, MOTION_TIMING.enter);
    }

    if (kind === "press") {
      cleanups.push(
        press(element, () => {
          if (!isEnabled(element)) return;
          play(
            { transform: ["scale(1)", `scale(${MOTION_PRESS_SCALE})`] },
            MOTION_TIMING.fast,
            false,
            false,
          );
          return () =>
            play(
              { transform: [`scale(${MOTION_PRESS_SCALE})`, "scale(1)"] },
              MOTION_TIMING.fast,
            );
        }),
      );
    }
    if (kind === "card" || kind === "link" || kind === "icon") {
      cleanups.push(
        hover(element, () => {
          if (
            !isEnabled(element) ||
            (kind === "card" && !element.querySelector("a,button"))
          )
            return;
          if (kind === "card")
            play(
              { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
              MOTION_TIMING.enter,
              false,
              false,
            );
          else if (kind === "icon")
            play(
              {
                transform: [
                  "rotate(0deg) scale(1)",
                  "rotate(-3deg) scale(1.025)",
                ],
              },
              MOTION_TIMING.enter,
              false,
              false,
            );
          else play({ opacity: 0.75 }, MOTION_TIMING.fast, false, false);
          return () => {
            if (kind === "card")
              play(
                { boxShadow: original.boxShadow || "0 0px 0px rgba(0,0,0,0)" },
                MOTION_TIMING.fast,
              );
            else if (kind === "icon")
              play(
                {
                  transform: [
                    "rotate(-3deg) scale(1.025)",
                    "rotate(0deg) scale(1)",
                  ],
                },
                MOTION_TIMING.fast,
              );
            else play({ opacity: 1 }, MOTION_TIMING.fast);
          };
        }),
      );
    }
    if (kind === "field") {
      const focus = () => {
        if (isEnabled(element))
          play({ opacity: [0.94, 1] }, MOTION_TIMING.fast);
      };
      element.addEventListener("focusin", focus);
      cleanups.push(() => element.removeEventListener("focusin", focus));
      const observer = new MutationObserver(() => {
        if (isEnabled(element) && !element.hasAttribute("hidden"))
          play({ opacity: [0.94, 1] }, MOTION_TIMING.fast);
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: [
          "data-state",
          "aria-invalid",
          "aria-selected",
          "aria-checked",
          "data-loading",
          "data-error",
        ],
      });
      cleanups.push(() => observer.disconnect());
    }
    if (kind === "thumb") {
      let previousTranslate = getComputedStyle(element).translate;
      const observer = new MutationObserver(() => {
        const from = animations.size
          ? getComputedStyle(element).translate
          : previousTranslate;
        animations.forEach((animation) => animation.cancel());
        animations.clear();
        element.style.translate = original.translate;
        const to = getComputedStyle(element).translate;
        previousTranslate = to;
        if (from !== to) play({ translate: [from, to] }, MOTION_TIMING.enter);
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
      cleanups.push(() => observer.disconnect());
    }
    return dispose;
  }, [element, kind, reduceMotion, isPresent, safeToRemove]);

  return (
    <Slot.Root
      {...props}
      ref={attach}
      {...(isPresent ? {} : { inert: true, "aria-hidden": true })}
    >
      {children}
    </Slot.Root>
  );
}
