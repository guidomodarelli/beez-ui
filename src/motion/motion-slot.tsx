"use client";

/** Animates the original primitive node with Motion, without adding DOM wrappers. */
import {
  useLayoutEffect,
  useRef,
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
  type AnimationOptions,
  type AnimationPlaybackControlsWithThen,
  type DOMKeyframesDefinition,
} from "motion/react";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { HOVER_CAPABLE_QUERY, MILLISECONDS_PER_SECOND } from "../constants/motion.js";
import {
  MOTION_EASE,
  MOTION_TIMING,
  MOTION_PRESS_SCALE,
  MOTION_SUBTLE_PRESS_SCALE,
  MOTION_TOGGLE_PRESS_SCALE,
  MOTION_HOVER_SCALE,
  MOTION_THUMB_SQUISH_SCALE,
  MOTION_CONTENT_DISTANCE,
  MOTION_INVALID_SHAKE_PX,
  MOTION_ITEM_CHECK_SCALE,
  MOTION_ICON_SWAP_SCALE,
  MOTION_CLOSE_BUTTON_SCALE,
  MOTION_LIST_ITEM_DISTANCE,
  MOTION_LIST_STAGGER_LIMIT,
  MOTION_EASE_IN_OUT,
  MOTION_REVEAL_BLUR_PX,
  MOTION_REVEAL_SCALE,
  MOTION_SHIMMER_TRANSLATE,
  MOTION_CARD_SHADOW_LIFT,
  MOTION_CARD_SHADOW_REST,
  SPRING_CHEVRON,
  SPRING_PANEL,
  SPRING_PRESS,
  SPRING_THUMB,
  type MotionKind,
} from "./tokens.js";
import { surfaceEnter, surfaceExit, type SurfaceKind } from "./surface-keyframes.js";
import { useAttachedElement } from "./use-attached-element.js";

const EASE_OUT: [number, number, number, number] = [...MOTION_EASE];
const SURFACE_KINDS: readonly MotionKind[] = ["tooltip", "surface", "dialog", "sheet", "overlay"];
const PRESS_SCALES: Partial<Record<MotionKind, number>> = {
  press: MOTION_PRESS_SCALE,
  "subtle-press": MOTION_SUBTLE_PRESS_SCALE,
  toggle: MOTION_TOGGLE_PRESS_SCALE,
};
const FIELD_KINDS: readonly MotionKind[] = ["field", "toggle"];
/** Inline style properties Motion playback may write; they are restored after playback. */
const ANIMATED_PROPERTIES = ["opacity", "transform", "boxShadow", "filter", "clipPath"] as const;
type AnimatedProperty = (typeof ANIMATED_PROPERTIES)[number];

/** Input groups draw the field frame; their controls are borderless. */
const INPUT_GROUP_SLOT = "input-group";

/** SVG attributes Motion writes to draw a stroke with `pathLength`. */
const STROKE_DRAW_ATTRIBUTES = ["pathLength", "stroke-dasharray", "stroke-dashoffset"];
/** Attributes whose changes re-announce a field's state with a subtle settle. */
const FIELD_STATE_ATTRIBUTES = [
  "data-state",
  "aria-invalid",
  "aria-selected",
  "aria-checked",
  "data-loading",
  "data-error",
];

/** Checks the actual DOM state rather than intercepting the component's event handlers. */
function isEnabled(element: Element): boolean {
  return (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-disabled") !== "true" &&
    !element.hasAttribute("data-disabled")
  );
}

/** Touch devices keep phantom hovers after a tap, so hover lifts need a real hover pointer. */
function canHover(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia(HOVER_CAPABLE_QUERY).matches
  );
}

/** Reads the currently rendered transform, including a running animation, as a start keyframe. */
function currentTransform(element: Element): string {
  const value = getComputedStyle(element).transform;
  return value && value !== "none" ? value : "scale(1)";
}

/** Reads a computed `matrix()` or `matrix3d()` transform as its 2D components. */
function matrixOf(transform: string): { a: number; b: number; translateX: number } {
  const values = /^matrix(3d)?\(([^)]+)\)$/.exec(transform);
  if (!values) return { a: 1, b: 0, translateX: 0 };
  const parts = values[2]!.split(",").map(parseFloat);
  return {
    a: parts[0] ?? 1,
    b: parts[1] ?? 0,
    translateX: (values[1] ? parts[12] : parts[4]) ?? 0,
  };
}

/** Extracts the horizontal translation of a computed transform. */
function translateXOf(transform: string): number {
  return matrixOf(transform).translateX;
}

/** Extracts the rotation, in degrees, of a computed transform. */
function rotationOf(transform: string): number {
  const { a, b } = matrixOf(transform);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

/** Position of an item among its siblings of the same slot inside the closest list or menu. */
function listIndexOf(element: Element): number {
  const slot = element.getAttribute("data-slot");
  const list = element.closest('[role="listbox"],[role="menu"],[role="list"]');
  if (!slot || !list) return 0;
  const items = Array.from(list.querySelectorAll(`[data-slot="${slot}"]`));
  return Math.max(items.indexOf(element), 0);
}

/** Checked and indeterminate indicators are visible; only unchecked ones are hidden. */
function isChecked(element: Element): boolean {
  const state = element.getAttribute("data-state");
  return state === "checked" || state === "indeterminate";
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
  const [element, attach] = useAttachedElement<HTMLElement>(ref);
  const reduceMotion = usePrefersReducedMotion();
  const [isPresent, safeToRemove] = usePresence();
  // AnimatePresence hands out a new `safeToRemove` on every render; reading it through a ref
  // keeps a re-render during an exit from restarting the exit playback.
  const safeToRemoveRef = useRef(safeToRemove);
  useLayoutEffect(() => {
    safeToRemoveRef.current = safeToRemove;
  });
  /** Values an interrupted entrance had reached, so an exit continues from them. */
  const interruptedRef = useRef<Partial<Record<AnimatedProperty, string>> | null>(null);

  useLayoutEffect(() => {
    let active = true;
    const safeToRemove = () => safeToRemoveRef.current?.();
    // Some primitives keep React children mounted in a detached portal while closed.
    // They must not hold an ancestor's exit open when there is no element to animate.
    if (!element || !element.isConnected) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemove();
        });
      return () => {
        active = false;
      };
    }
    /** Running animations with the style properties each one drives. */
    const animations = new Map<AnimationPlaybackControlsWithThen, readonly AnimatedProperty[]>();
    /** Properties deliberately left at their final value, such as a held press. */
    const held = new Set<AnimatedProperty>();
    const cleanups: Array<() => void> = [];
    const original: Record<AnimatedProperty, string> = {
      opacity: element.style.opacity,
      transform: element.style.transform,
      boxShadow: element.style.boxShadow,
      filter: element.style.filter,
      clipPath: element.style.clipPath,
    };

    /**
     * Restores caller-owned styles after playback so transforms do not leave compositing
     * layers behind. Only the given properties are restored, so concurrent playback of other
     * properties (a held press while a state change fades) keeps its current value.
     */
    function restore(properties: readonly AnimatedProperty[] = ANIMATED_PROPERTIES) {
      properties.forEach((property) => {
        element!.style[property] = original[property];
      });
    }

    /** Cancels running animations that drive any of the given properties. */
    function cancel(properties: readonly AnimatedProperty[] = ANIMATED_PROPERTIES) {
      animations.forEach((driven, animation) => {
        if (!driven.some((property) => properties.includes(property))) return;
        animation.cancel();
        animations.delete(animation);
      });
    }

    /** Releases only animations and listeners created for this primitive instance. */
    function dispose() {
      active = false;
      // Remembers where running playback was, in case this teardown is the start of an exit.
      if (animations.size) {
        const computed = getComputedStyle(element!);
        const snapshot: Partial<Record<AnimatedProperty, string>> = {};
        new Set([...animations.values()].flat()).forEach((property) => {
          const value = computed[property];
          // Motion cannot animate from "none", and needs opacity as a number like its target.
          if (value && value !== "none") snapshot[property] = value;
        });
        interruptedRef.current = snapshot;
      }
      cleanups.forEach((cleanup) => cleanup());
      cancel();
      restore();
    }

    if (
      reduceMotion ||
      (!isPresent && element.hasAttribute("data-beez-theme-menu"))
    ) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemove();
        });
      return dispose;
    }

    /**
     * Runs non-layout keyframes, retaining the node only for exit playback. It interrupts only
     * the animations that drive the same properties, so independent effects never cut each other.
     */
    function play(
      keyframes: DOMKeyframesDefinition,
      transition: AnimationOptions,
      { remove = false, restoreOnComplete = true } = {},
    ) {
      const properties = ANIMATED_PROPERTIES.filter((property) => property in keyframes);
      // Idle properties hold the caller's current inline value (React may have changed it
      // since mount), which is what playback must give back when it finishes.
      const busy = new Set([...animations.values()].flat());
      properties.forEach((property) => {
        if (!busy.has(property) && !held.has(property)) original[property] = element!.style[property];
      });
      cancel(properties);
      properties.forEach((property) => held.delete(property));
      // Motion starts playback on its next frame; painting the first keyframe now keeps that
      // frame from flashing the final state (a mounted dialog at full size, a thumb at its end).
      const frames = keyframes as Record<string, unknown>;
      properties.forEach((property) => {
        const values = frames[property];
        if (Array.isArray(values) && values.length > 1) {
          element!.style[property] = String(values[0]);
        }
      });
      const animation = animate(element!, keyframes, transition);
      animations.set(animation, properties);
      void animation.then(() => {
        if (!animations.delete(animation) || !active) return;
        if (remove) {
          safeToRemove();
          return;
        }
        if (!restoreOnComplete) properties.forEach((property) => held.add(property));
        // Motion re-renders every value it has stored when an animation commits, including
        // properties finished earlier, so every idle property is restored, not just this one's.
        frame.postRender(() => {
          if (!active) return;
          const busy = new Set([...animations.values()].flat());
          restore(
            ANIMATED_PROPERTIES.filter((property) => !busy.has(property) && !held.has(property)),
          );
        });
      });
    }

    const tween = (duration: number) => ({ duration, ease: EASE_OUT });

    const interrupted = interruptedRef.current;
    interruptedRef.current = null;
    if (SURFACE_KINDS.includes(kind)) {
      const step = isPresent
        ? surfaceEnter(element, kind as SurfaceKind)
        : surfaceExit(element, kind as SurfaceKind);
      const keyframes = { ...step.keyframes } as Record<string, unknown>;
      // Closing mid-entrance continues from the reached values instead of jumping to rest first.
      if (!isPresent && interrupted) {
        Object.entries(interrupted).forEach(([property, value]) => {
          const frames = keyframes[property];
          if (!Array.isArray(frames) || !value) return;
          const start = property === "opacity" ? Number.parseFloat(value) : value;
          keyframes[property] = [start, ...frames.slice(1)];
        });
      }
      play(keyframes as DOMKeyframesDefinition, step.transition, { remove: !isPresent });
      return dispose;
    }
    if (!isPresent) {
      queueMicrotask(() => {
        if (active) safeToRemove();
      });
      return dispose;
    }

    if (kind === "skeleton" && typeof element.animate === "function") {
      // A soft shine sweeps across the placeholder. It is the box's `::after`, translated with
      // native playback so the loop runs on the compositor; CSS parks it outside at rest.
      const shimmer = element.animate(
        { translate: [...MOTION_SHIMMER_TRANSLATE] },
        {
          duration: MOTION_TIMING.skeleton * MILLISECONDS_PER_SECOND,
          easing: `cubic-bezier(${MOTION_EASE_IN_OUT.join(", ")})`,
          iterations: Infinity,
          pseudoElement: "::after",
        },
      );
      cleanups.push(() => shimmer.cancel());
    } else if (kind === "icon-swap") {
      // Keyed icons remount on change; the newcomer grows out of a blur in place of the old one.
      play(
        {
          opacity: [0, 1],
          transform: [`scale(${MOTION_ICON_SWAP_SCALE})`, "scale(1)"],
          filter: ["blur(8px)", "blur(0px)"],
        },
        { duration: MOTION_TIMING.iconSwap, ease: [...MOTION_EASE_IN_OUT] },
      );
    } else if (kind === "item-check") {
      play(
        { opacity: [0, 1], transform: [`scale(${MOTION_ITEM_CHECK_SCALE})`, "scale(1)"] },
        { ...SPRING_PANEL, opacity: tween(MOTION_TIMING.fast) },
      );
    } else if (kind === "list-item") {
      const index = listIndexOf(element);
      const position = Math.min(index, MOTION_LIST_STAGGER_LIMIT);
      // Long lists only fade the remaining items: dozens of blurred layers at once cost frames.
      play(
        index < MOTION_LIST_STAGGER_LIMIT
          ? {
              opacity: [0, 1],
              transform: [`translateY(${-MOTION_LIST_ITEM_DISTANCE}px)`, "translateY(0px)"],
              filter: ["blur(3px)", "blur(0px)"],
            }
          : { opacity: [0, 1] },
        {
          ...tween(MOTION_TIMING.listItem),
          delay: MOTION_TIMING.listDelay + position * MOTION_TIMING.listStagger,
        },
      );
    } else if (kind === "delayed-pop" && typeof element.animate === "function") {
      // Runs on the independent `scale` property with native playback, so it composes with
      // the press feedback another slot applies to the same button through `transform`.
      const pop = element.animate(
        { opacity: [0, 1], scale: [String(MOTION_CLOSE_BUTTON_SCALE), "1"] },
        {
          duration: MOTION_TIMING.closeEnter * MILLISECONDS_PER_SECOND,
          delay: MOTION_TIMING.closeDelay * MILLISECONDS_PER_SECOND,
          easing: `cubic-bezier(${EASE_OUT.join(", ")})`,
          fill: "backwards",
        },
      );
      cleanups.push(() => pop.cancel());
    } else if (kind === "selection") {
      play(
        { opacity: [0, 1], transform: ["scale(0.5)", "scale(1)"] },
        { ...SPRING_PANEL, opacity: tween(MOTION_TIMING.fast) },
      );
    } else if (kind === "content") {
      play(
        {
          opacity: [0, 1],
          transform: [`translateY(${MOTION_CONTENT_DISTANCE}px)`, "translateY(0px)"],
        },
        tween(MOTION_TIMING.enter),
      );
    } else if (kind === "message") {
      play(
        {
          opacity: [0, 1],
          transform: [`translateY(${-MOTION_CONTENT_DISTANCE}px)`, "translateY(0px)"],
          filter: ["blur(4px)", "blur(0px)"],
        },
        tween(MOTION_TIMING.message),
      );
    } else if (kind === "fade" || kind === "card" || kind === "row") {
      play({ opacity: [0, 1] }, tween(MOTION_TIMING.enter));
    }

    const pressScale = PRESS_SCALES[kind];
    if (pressScale !== undefined) {
      const liftsOnHover =
        kind === "press" && element.getAttribute("data-variant") !== "link";
      let hovered = false;
      let pressed = false;
      /** Springs from wherever the element currently is to its resting or pressed scale. */
      const settle = () => {
        const target = pressed
          ? pressScale
          : hovered
            ? MOTION_HOVER_SCALE
            : 1;
        play(
          { transform: [currentTransform(element), `scale(${target})`] },
          SPRING_PRESS,
          { restoreOnComplete: target === 1 },
        );
      };
      cleanups.push(
        press(element, () => {
          if (!isEnabled(element)) return;
          pressed = true;
          settle();
          return () => {
            pressed = false;
            settle();
          };
        }),
      );
      if (liftsOnHover) {
        cleanups.push(
          hover(element, () => {
            if (!isEnabled(element) || !canHover()) return;
            hovered = true;
            settle();
            return () => {
              hovered = false;
              settle();
            };
          }),
        );
      }
    }
    /**
     * Tailwind rings are box-shadows, so the card outline lives in the resting shadow. The lift
     * is appended to it instead of replacing it, keeping the outline visible while hovered.
     * The resting value is read only while no playback writes the inline shadow.
     */
    let restingShadow = "none";
    const withRestingShadow = (shadow: string) => {
      if (!element.style.boxShadow) restingShadow = getComputedStyle(element).boxShadow;
      return restingShadow === "none" ? shadow : `${restingShadow}, ${shadow}`;
    };
    if (kind === "card" || kind === "link" || kind === "icon") {
      cleanups.push(
        hover(element, () => {
          if (
            !isEnabled(element) ||
            !canHover() ||
            (kind === "card" && !element.querySelector("a,button"))
          )
            return;
          const keep = { restoreOnComplete: false };
          if (kind === "card") {
            const rest = withRestingShadow(MOTION_CARD_SHADOW_REST);
            const from = element.style.boxShadow ? getComputedStyle(element).boxShadow : rest;
            play(
              { boxShadow: [from, withRestingShadow(MOTION_CARD_SHADOW_LIFT)] },
              tween(MOTION_TIMING.enter),
              keep,
            );
          }
          else if (kind === "icon")
            play(
              { transform: ["rotate(0deg) scale(1)", "rotate(-3deg) scale(1.025)"] },
              SPRING_PRESS,
              keep,
            );
          else play({ opacity: 0.75 }, tween(MOTION_TIMING.fast), keep);
          return () => {
            if (kind === "card")
              play(
                {
                  boxShadow: [
                    getComputedStyle(element).boxShadow,
                    withRestingShadow(MOTION_CARD_SHADOW_REST),
                  ],
                },
                tween(MOTION_TIMING.fast),
              );
            else if (kind === "icon")
              play(
                { transform: [currentTransform(element), "rotate(0deg) scale(1)"] },
                SPRING_PRESS,
              );
            else play({ opacity: 1 }, tween(MOTION_TIMING.fast));
          };
        }),
      );
    }
    if (FIELD_KINDS.includes(kind)) {
      const settleField = () => {
        if (isEnabled(element) && !element.hasAttribute("hidden"))
          play({ opacity: [0.94, 1] }, tween(MOTION_TIMING.fast));
      };
      element.addEventListener("focusin", settleField);
      cleanups.push(() => element.removeEventListener("focusin", settleField));
      // A control inside an input group lets the whole group shake, so frame and text move
      // together; the group watches its controls instead of its own attribute.
      const isGroup = element.getAttribute("data-slot") === INPUT_GROUP_SLOT;
      const isGroupControl =
        !isGroup && element.parentElement?.closest(`[data-slot="${INPUT_GROUP_SLOT}"]`) != null;
      const readInvalid = () =>
        isGroup
          ? element.querySelector('[data-slot][aria-invalid="true"]') !== null
          : element.getAttribute("aria-invalid") === "true";
      let wasInvalid = readInvalid();
      const observer = new MutationObserver((records) => {
        const isInvalid = readInvalid();
        const becameInvalid = isInvalid && !wasInvalid;
        wasInvalid = isInvalid;
        if (becameInvalid && !isGroupControl && !element.hasAttribute("hidden")) {
          // A field turning invalid shakes horizontally, like a refused entry.
          play(
            {
              transform: MOTION_INVALID_SHAKE_PX.map(
                (offset) => `translateX(${offset}px)`,
              ),
            },
            { duration: MOTION_TIMING.shake },
          );
        } else if (
          records.some(
            (record) => record.target === element && record.attributeName !== "aria-invalid",
          )
        ) {
          settleField();
        }
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: FIELD_STATE_ATTRIBUTES,
        subtree: isGroup,
      });
      cleanups.push(() => observer.disconnect());
    }
    if (kind === "check") {
      let wasChecked = isChecked(element);
      const strokeDraws = new Set<AnimationPlaybackControlsWithThen>();
      /**
       * Stops any stroke draw and removes the dash attributes it wrote, so the path is always
       * painted whole: an interrupted draw must never leave the mark partially invisible.
       */
      const settleStrokes = () => {
        strokeDraws.forEach((draw) => draw.cancel());
        strokeDraws.clear();
        element.querySelectorAll("path").forEach((path) => {
          STROKE_DRAW_ATTRIBUTES.forEach((attribute) => path.removeAttribute(attribute));
        });
      };
      cleanups.push(settleStrokes);
      const observer = new MutationObserver(() => {
        const checked = isChecked(element);
        if (checked === wasChecked) return;
        wasChecked = checked;
        settleStrokes();
        if (checked) {
          // Every property the exit touches is listed here too: Motion re-renders the last
          // value it knows for each property, and a leftover blur would hide the mark.
          play(
            {
              opacity: [0, 1],
              transform: ["scale(0.5)", "scale(1)"],
              filter: ["blur(0px)", "blur(0px)"],
            },
            tween(MOTION_TIMING.enter),
          );
          // Draws the check stroke once the mark has started to appear.
          element.querySelectorAll("path").forEach((path) => {
            // Hides the stroke right away, as the draw's own first frame would.
            path.setAttribute("pathLength", "1");
            path.setAttribute("stroke-dasharray", "0 1");
            path.setAttribute("stroke-dashoffset", "0");
            const draw = animate(
              path,
              { pathLength: [0, 1] },
              { ...tween(MOTION_TIMING.checkDraw), delay: MOTION_TIMING.checkDrawDelay },
            );
            strokeDraws.add(draw);
            void draw.then(() => {
              if (!strokeDraws.delete(draw)) return;
              frame.postRender(() => {
                if (active && !strokeDraws.size) settleStrokes();
              });
            });
          });
        } else {
          // The hidden state is owned by CSS, so the exit only has to reach it before restoring.
          play(
            {
              opacity: [1, 0],
              transform: ["scale(1)", "scale(0.5)"],
              filter: ["blur(0px)", "blur(4px)"],
            },
            tween(MOTION_TIMING.enter),
          );
        }
      });
      observer.observe(element, { attributes: true, attributeFilter: ["data-state"] });
      cleanups.push(() => observer.disconnect());
    }
    if (kind === "rotate") {
      // CSS owns the resting angle (for example `rotate-180` while open); Motion only animates
      // the turn between angles, so reduced motion and SSR keep the correct orientation.
      const restingAngle = () => parseFloat(getComputedStyle(element).rotate) || 0;
      let previousAngle = restingAngle();
      const turn = () => {
        const inFlight = rotationOf(getComputedStyle(element).transform);
        cancel(["transform"]);
        restore(["transform"]);
        const nextAngle = restingAngle();
        const delta = previousAngle + inFlight - nextAngle;
        previousAngle = nextAngle;
        if (Math.abs(delta) >= 1)
          play({ transform: [`rotate(${delta}deg)`, "rotate(0deg)"] }, SPRING_CHEVRON);
      };
      const observer = new MutationObserver(turn);
      observer.observe(element, { attributes: true, attributeFilter: ["class"] });
      if (element.parentElement) {
        observer.observe(element.parentElement, {
          attributes: true,
          attributeFilter: ["aria-expanded", "data-state", "class"],
        });
      }
      cleanups.push(() => observer.disconnect());
    }
    if (kind === "reveal") {
      // Images develop in place once loaded, instead of popping in over their fallback.
      // Already-loaded images (cached or server-rendered) are left untouched on mount.
      const isLoading = () => element.hasAttribute("data-loading");
      let wasLoading = isLoading();
      const observer = new MutationObserver(() => {
        const loading = isLoading();
        const loaded = wasLoading && !loading && !element.hasAttribute("data-error");
        wasLoading = loading;
        if (!loaded) return;
        play(
          {
            opacity: [0, 1],
            transform: [`scale(${MOTION_REVEAL_SCALE})`, "scale(1)"],
            filter: [`blur(${MOTION_REVEAL_BLUR_PX}px)`, "blur(0px)"],
          },
          tween(MOTION_TIMING.reveal),
        );
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["data-loading", "data-error"],
      });
      cleanups.push(() => observer.disconnect());
    }
    if (kind === "thumb") {
      /**
       * Laid-out horizontal position within the switch, including the state's CSS `translate`.
       * The squish scales around the center, so its effect on the box is compensated.
       */
      const restingOffset = (): number | null => {
        // Hidden switches (display: none) have no box to measure an offset from.
        if (!element.getClientRects().length) return null;
        const rect = element.getBoundingClientRect();
        const trackLeft = element.parentElement?.getBoundingClientRect().left ?? 0;
        return rect.left - trackLeft + (rect.width - element.offsetWidth) / 2;
      };
      let previousOffset = restingOffset();
      // A switch first measured while hidden learns its offset once it can be interacted with.
      const remeasure = () => {
        if (!animations.size) previousOffset = restingOffset();
      };
      element.parentElement?.addEventListener("pointerenter", remeasure);
      element.parentElement?.addEventListener("focusin", remeasure);
      cleanups.push(() => {
        element.parentElement?.removeEventListener("pointerenter", remeasure);
        element.parentElement?.removeEventListener("focusin", remeasure);
      });
      const observer = new MutationObserver(() => {
        // Styles already reflect the new state here, so the painted position is the previous
        // resting offset plus whatever an interrupted glide still adds on top of it.
        const glideOffset = translateXOf(getComputedStyle(element).transform);
        cancel(["transform"]);
        restore(["transform"]);
        const nextOffset = restingOffset();
        const delta =
          previousOffset === null || nextOffset === null
            ? 0
            : previousOffset + glideOffset - nextOffset;
        previousOffset = nextOffset;
        if (delta !== 0)
          play(
            { transform: [`translateX(${delta}px)`, "translateX(0px)"] },
            SPRING_THUMB,
          );
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
      cleanups.push(() => observer.disconnect());
      // The thumb squishes while its switch is held, hinting at the travel to come. It runs on
      // the independent `scale` property so it composes with the transform-based glide.
      const root = element.parentElement;
      if (root && typeof element.animate === "function") {
        const squishTiming = {
          duration: MOTION_TIMING.fast * MILLISECONDS_PER_SECOND,
          easing: `cubic-bezier(${EASE_OUT.join(", ")})`,
          fill: "forwards",
        } as const;
        let squish: Animation | null = null;
        cleanups.push(() => squish?.cancel());
        cleanups.push(
          press(root, () => {
            if (!isEnabled(root)) return;
            squish?.cancel();
            squish = element.animate(
              { scale: ["1", String(MOTION_THUMB_SQUISH_SCALE)] },
              squishTiming,
            );
            return () => {
              const from = getComputedStyle(element).scale;
              squish?.cancel();
              const release = element.animate(
                { scale: [from === "none" ? "1" : from, "1"] },
                squishTiming,
              );
              squish = release;
              void release.finished
                .then(() => {
                  if (squish === release) {
                    release.cancel();
                    squish = null;
                  }
                })
                .catch(() => {
                  // Cancelled by a newer press or by unmount; nothing to release.
                });
            };
          }),
        );
      }
    }
    return dispose;
  }, [element, kind, reduceMotion, isPresent]);

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
