/** Defines the timing, curves and physics shared by Motion animations, aligned with beui.dev/components/motion. */
export const MOTION_TIMING = {
  fast: 0.14,
  enter: 0.18,
  message: 0.2,
  panel: 0.22,
  overlay: 0.2,
  exit: 0.12,
  surfaceClip: 0.32,
  shake: 0.45,
  checkDraw: 0.3,
  checkDrawDelay: 0.04,
  iconSwap: 0.2,
  listItem: 0.18,
  listDelay: 0.05,
  listStagger: 0.035,
  closeEnter: 0.2,
  closeDelay: 0.16,
  sheetExit: 0.24,
  reveal: 0.4,
  monthSwap: 0.24,
  cursorBlink: 1,
  skeleton: 1.8,
} as const;

/** Items beyond this position share the last stagger delay, so long lists never lag behind. */
export const MOTION_LIST_STAGGER_LIMIT = 10;

/** Strong ease-out used for entrances; weak defaults such as `ease-out` feel sluggish. */
export const MOTION_EASE = [0.16, 1, 0.3, 1] as const;
/** Symmetric curve for looping or reversible effects. */
export const MOTION_EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
/** Drawer curve for edge panels leaving the viewport. */
export const MOTION_EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** Press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

/** Overlay panel entrances — dialogs, sheets and floating surfaces. */
export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

/** Shared-layout glides — indicators and highlights moving between items. */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

/** Keyboard highlight in menus and lists: quick enough to keep up with a held arrow key. */
export const SPRING_HIGHLIGHT = {
  type: "spring",
  stiffness: 700,
  damping: 45,
  mass: 0.5,
} as const;

/** Tab indicator glide, tuned to settle without overshooting the list edges. */
export const SPRING_TABS = {
  type: "spring",
  stiffness: 245,
  damping: 36,
  mass: 1.2,
} as const;

/** Lighter spawn for small tooltip surfaces. */
export const SPRING_TOOLTIP = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.7,
} as const;

/** Disclosure chevrons rotate with a little bounce, as if flicked. */
export const SPRING_CHEVRON = {
  type: "spring",
  duration: 0.4,
  bounce: 0.3,
} as const;

/** Heavy, deliberate switch thumb — high mass keeps the travel weighty without wobble. */
export const SPRING_THUMB = {
  type: "spring",
  stiffness: 800,
  damping: 80,
  mass: 4,
} as const;

/** Primary actions compress noticeably; dense navigation items stay subtle. */
export const MOTION_PRESS_SCALE = 0.93;
export const MOTION_SUBTLE_PRESS_SCALE = 0.98;
export const MOTION_TOGGLE_PRESS_SCALE = 0.92;
export const MOTION_HOVER_SCALE = 1.02;
export const MOTION_THUMB_SQUISH_SCALE = 0.9;
export const MOTION_ITEM_CHECK_SCALE = 0.75;
export const MOTION_ICON_SWAP_SCALE = 0.25;
export const MOTION_CLOSE_BUTTON_SCALE = 0.8;
export const MOTION_LIST_ITEM_DISTANCE = 6;
/** Loaded images settle from a slight zoom, so they develop in place instead of popping in. */
export const MOTION_REVEAL_SCALE = 1.06;
export const MOTION_REVEAL_BLUR_PX = 6;
/** Calendar months slide just enough to show the direction of navigation. */
export const MOTION_MONTH_DISTANCE = 12;
/** Skeleton shine travels from fully before the box to fully past it, as a `translate` value. */
export const MOTION_SHIMMER_TRANSLATE = ["-100% 0", "100% 0"] as const;

/** Hovered interactive cards gain a soft drop shadow; the rest value has the same shape, invisible. */
export const MOTION_CARD_SHADOW_LIFT = "0px 4px 16px 0px rgba(0, 0, 0, 0.08)";
export const MOTION_CARD_SHADOW_REST = "0px 0px 0px 0px rgba(0, 0, 0, 0)";

export const MOTION_SURFACE_SCALE = 0.96;
/** Fraction of the surface kept hidden by the clip at the start of its reveal, in percent. */
export const MOTION_SURFACE_CLIP_PERCENT = 92;
/** Room left outside a revealing surface for its ring and drop shadow (`shadow-lg` spans ~22px). */
export const MOTION_SURFACE_CLIP_BLEED_PX = 24;
export const MOTION_TOOLTIP_DISTANCE = 8;
export const MOTION_DIALOG_DISTANCE = 20;
export const MOTION_CONTENT_DISTANCE = 4;
export const MOTION_INVALID_SHAKE_PX = [0, -6, 6, -4, 4, -2, 0] as const;

/** Time after an item loses its active state during which a new active item still glides from it. */
export const GLIDE_CONTINUITY_MS = 300;

export type MotionKind =
  | "press"
  | "subtle-press"
  | "toggle"
  | "fade"
  | "content"
  | "message"
  | "card"
  | "row"
  | "field"
  | "thumb"
  | "check"
  | "selection"
  | "item-check"
  | "rotate"
  | "list-item"
  | "icon-swap"
  | "delayed-pop"
  | "skeleton"
  | "reveal"
  | "link"
  | "icon"
  | "tooltip"
  | "surface"
  | "dialog"
  | "sheet"
  | "overlay";
