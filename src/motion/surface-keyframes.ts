/** Resolves entry and exit playback for floating and modal surfaces from their rendered placement. */
import type { AnimationOptions, DOMKeyframesDefinition } from "motion/react";
import {
  MOTION_DIALOG_DISTANCE,
  MOTION_EASE,
  MOTION_EASE_DRAWER,
  MOTION_SURFACE_CLIP_BLEED_PX,
  MOTION_SURFACE_CLIP_PERCENT,
  MOTION_SURFACE_SCALE,
  MOTION_TIMING,
  MOTION_TOOLTIP_DISTANCE,
  SPRING_PANEL,
  SPRING_TOOLTIP,
} from "./tokens.js";

/** Surface kinds whose presence is animated on mount and before removal. */
export type SurfaceKind = "tooltip" | "surface" | "dialog" | "sheet" | "overlay";

/** Keyframes plus the transition that plays them. */
export interface MotionStep {
  keyframes: DOMKeyframesDefinition;
  transition: AnimationOptions;
}

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

const EASE_OUT: [number, number, number, number] = [...MOTION_EASE];
const EASE_DRAWER: [number, number, number, number] = [...MOTION_EASE_DRAWER];
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];
const ALIGNS: readonly Align[] = ["start", "center", "end"];

/** Reads Radix placement attributes, tolerating primitives that do not position with a popper. */
function readPlacement(element: Element): { side?: Side; align: Align } {
  const side = element.getAttribute("data-side");
  const align = element.getAttribute("data-align");
  return {
    side: SIDES.includes(side as Side) ? (side as Side) : undefined,
    align: ALIGNS.includes(align as Align) ? (align as Align) : "center",
  };
}

/** Builds a transform with explicit identity parts, so Motion never reads a missing scale as zero. */
function transform(x: number | string, y: number | string, scale = 1): string {
  const unit = (value: number | string) =>
    typeof value === "number" ? `${value}px` : value;
  return `translate(${unit(x)}, ${unit(y)}) scale(${scale})`;
}

/** Offset pointing away from the trigger, so content appears to emerge from it. */
function offsetAwayFromTrigger(side: Side | undefined, distance: number) {
  if (side === "top") return { x: 0, y: distance };
  if (side === "left") return { x: distance, y: 0 };
  if (side === "right") return { x: -distance, y: 0 };
  if (side === "bottom") return { x: 0, y: -distance };
  return { x: 0, y: 0 };
}

/**
 * Open edges extend the clip past the box, so the ring and drop shadow drawn outside it
 * (Tailwind rings are box-shadows) are never cut while the surface reveals or settles.
 */
const OPEN_EDGE = `-${MOTION_SURFACE_CLIP_BLEED_PX}px`;
/** Fully revealed clip: nothing of the surface, its outline or its shadow is hidden. */
const REVEALED_CLIP = `inset(${OPEN_EDGE} ${OPEN_EDGE} ${OPEN_EDGE} ${OPEN_EDGE})`;

/** Collapsed clip anchored at the corner or edge closest to the trigger. */
function collapsedClip(side: Side | undefined, align: Align): string {
  const hidden = `${MOTION_SURFACE_CLIP_PERCENT}%`;
  const half = `${MOTION_SURFACE_CLIP_PERCENT / 2}%`;
  /** Maps an alignment to the inset kept on the leading and trailing edges of the cross axis. */
  const crossAxis = (value: Align): [string, string] =>
    value === "start" ? [OPEN_EDGE, hidden] : value === "end" ? [hidden, OPEN_EDGE] : [half, half];
  if (side === "bottom" || side === "top") {
    const [left, right] = crossAxis(align);
    return side === "bottom"
      ? `inset(${OPEN_EDGE} ${right} ${hidden} ${left})`
      : `inset(${hidden} ${right} ${OPEN_EDGE} ${left})`;
  }
  const [top, bottom] = crossAxis(align);
  return side === "right"
    ? `inset(${top} ${hidden} ${bottom} ${OPEN_EDGE})`
    : `inset(${top} ${OPEN_EDGE} ${bottom} ${hidden})`;
}

/** Edge-panel travel: fully off-screen on the side the sheet is attached to. */
function sheetOffset(element: Element) {
  const side = readPlacement(element).side ?? "right";
  if (side === "left") return { x: "-100%", y: "0%" };
  if (side === "top") return { x: "0%", y: "-100%" };
  if (side === "bottom") return { x: "0%", y: "100%" };
  return { x: "100%", y: "0%" };
}

/** Entrance playback matching the beui surface family for each kind. */
export function surfaceEnter(element: Element, kind: SurfaceKind): MotionStep {
  const { side, align } = readPlacement(element);
  if (kind === "overlay") {
    return {
      keyframes: { opacity: [0, 1] },
      transition: { duration: MOTION_TIMING.overlay, ease: EASE_OUT },
    };
  }
  if (kind === "tooltip") {
    const offset = offsetAwayFromTrigger(side, MOTION_TOOLTIP_DISTANCE);
    return {
      keyframes: {
        opacity: [0, 1],
        transform: [transform(offset.x, offset.y, 0.9), transform(0, 0)],
        filter: ["blur(5px)", "blur(0px)"],
      },
      transition: {
        ...SPRING_TOOLTIP,
        opacity: { duration: MOTION_TIMING.fast, ease: EASE_OUT },
        filter: { duration: MOTION_TIMING.enter, ease: EASE_OUT },
      },
    };
  }
  if (kind === "dialog") {
    return {
      keyframes: {
        opacity: [0, 1],
        transform: [transform(0, MOTION_DIALOG_DISTANCE, 0.97), transform(0, 0)],
      },
      transition: SPRING_PANEL,
    };
  }
  if (kind === "sheet") {
    const offset = sheetOffset(element);
    return {
      keyframes: { transform: [transform(offset.x, offset.y), transform("0%", "0%")] },
      transition: SPRING_PANEL,
    };
  }
  const keyframes: DOMKeyframesDefinition = {
    opacity: [0, 1],
    transform: [transform(0, 0, MOTION_SURFACE_SCALE), transform(0, 0)],
  };
  // Primitives aligned over their trigger (Select item-aligned) have no side to reveal from.
  if (side) {
    keyframes.clipPath = [collapsedClip(side, align), REVEALED_CLIP];
  }
  return {
    keyframes,
    transition: {
      ...SPRING_PANEL,
      opacity: { duration: MOTION_TIMING.enter, ease: EASE_OUT },
      clipPath: { duration: MOTION_TIMING.surfaceClip, ease: EASE_OUT },
    },
  };
}

/** Exit playback: brief and eased so dismissal never blocks the next interaction. */
export function surfaceExit(element: Element, kind: SurfaceKind): MotionStep {
  const exitTween = { duration: MOTION_TIMING.exit, ease: EASE_OUT };
  if (kind === "overlay") {
    return { keyframes: { opacity: [1, 0] }, transition: exitTween };
  }
  if (kind === "tooltip") {
    const offset = offsetAwayFromTrigger(
      readPlacement(element).side,
      MOTION_TOOLTIP_DISTANCE * 0.6,
    );
    return {
      keyframes: {
        opacity: [1, 0],
        transform: [transform(0, 0), transform(offset.x, offset.y, 0.94)],
        filter: ["blur(0px)", "blur(3px)"],
      },
      transition: exitTween,
    };
  }
  if (kind === "dialog") {
    return {
      keyframes: {
        opacity: [1, 0],
        transform: [transform(0, 0), transform(0, MOTION_DIALOG_DISTANCE, 0.98)],
      },
      transition: { duration: MOTION_TIMING.enter, ease: EASE_OUT },
    };
  }
  if (kind === "sheet") {
    const offset = sheetOffset(element);
    // A spring would linger at the edge; the drawer curve accelerates the panel away.
    return {
      keyframes: { transform: [transform("0%", "0%"), transform(offset.x, offset.y)] },
      transition: { duration: MOTION_TIMING.sheetExit, ease: EASE_DRAWER },
    };
  }
  return {
    keyframes: {
      opacity: [1, 0],
      transform: [transform(0, 0), transform(0, 0, MOTION_SURFACE_SCALE)],
    },
    transition: exitTween,
  };
}
