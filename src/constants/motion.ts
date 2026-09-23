/** Shares the operating-system preference across CSS-adjacent and JavaScript animations. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Only true hover pointers get hover lifts; touch devices keep phantom hovers after taps. */
export const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)";

/** Converts Motion's second-based timings to the millisecond timings of Web Animations. */
export const MILLISECONDS_PER_SECOND = 1000;
