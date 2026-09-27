/**
 * General-purpose React hooks, published at `beez-ui/hooks` so the component barrel stays focused
 * on UI. `useIsMobile` is also exported from the package root for existing consumers.
 */
export { useIsMobile } from "./hooks/use-mobile.js";
export { useIsHydrated } from "./hooks/use-is-hydrated.js";
export { usePrefersReducedMotion } from "./hooks/use-prefers-reduced-motion.js";
export { useViewerTimeZone } from "./hooks/use-viewer-time-zone.js";
export { useHorizontalSwipe, type HorizontalSwipeHandlers } from "./hooks/use-horizontal-swipe.js";
export {
  HORIZONTAL_SWIPE_DIRECTION,
  resolveHorizontalSwipe,
  type HorizontalSwipeDirection,
  type HorizontalSwipeGesture,
} from "./lib/horizontal-swipe.js";
