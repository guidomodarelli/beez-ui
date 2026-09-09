/** Defines the restrained timing and movement shared by Motion animations. */
export const MOTION_TIMING = {
  fast: 0.14,
  enter: 0.18,
  panel: 0.22,
  exit: 0.12,
  skeleton: 1.8,
} as const;

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
export const MOTION_PRESS_SCALE = 0.98;
export const MOTION_SURFACE_DISTANCE = 4;
export const MOTION_PANEL_DISTANCE = 12;

export type MotionKind =
  | "press"
  | "fade"
  | "card"
  | "row"
  | "field"
  | "thumb"
  | "selection"
  | "skeleton"
  | "link"
  | "icon"
  | "surface"
  | "dialog"
  | "sheet"
  | "overlay";
