/** Compact circular progress indicator whose arc inherits the surrounding text color. */
import type { ComponentProps } from "react";

import { cn } from "../lib/utils.js";

const PROGRESS_RING_VIEWBOX_SIZE = 18;
const PROGRESS_RING_CENTER = PROGRESS_RING_VIEWBOX_SIZE / 2;
const PROGRESS_RING_RADIUS = 7;
const PROGRESS_RING_STROKE_WIDTH = 2.5;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;
const DEFAULT_PROGRESS_RING_SIZE_PX = 18;

export interface ProgressRingProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Completion ratio in the `[0, 1]` range; values outside are clamped. */
  fraction: number;
  /** Rendered width and height in pixels. */
  size?: number;
  /**
   * Accessible name. Without it the ring is decorative (`aria-hidden`), which fits when an
   * adjacent label such as `3 / 4` already conveys the value.
   */
  label?: string;
}

/**
 * Draws a ring whose arc covers `fraction` of the circle. The arc uses `currentColor`, so the
 * parent's text color (for example success or warning) styles it without extra props.
 * @param props - Fraction, size, optional accessible name and SVG attributes.
 * @returns The progress ring.
 */
export function ProgressRing({ fraction, size = DEFAULT_PROGRESS_RING_SIZE_PX, label, className, ...svgProps }: ProgressRingProps) {
  const clampedFraction = Math.min(Math.max(Number.isFinite(fraction) ? fraction : 0, 0), 1);
  const dashOffset = PROGRESS_RING_CIRCUMFERENCE * (1 - clampedFraction);
  const accessibilityProps = label
    ? {
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(clampedFraction * 100),
      }
    : { "aria-hidden": true };

  return (
    <svg
      data-slot="progress-ring"
      {...accessibilityProps}
      {...svgProps}
      className={cn("shrink-0 -rotate-90", className)}
      height={size}
      viewBox={`0 0 ${PROGRESS_RING_VIEWBOX_SIZE} ${PROGRESS_RING_VIEWBOX_SIZE}`}
      width={size}
    >
      <circle
        className="stroke-border/70"
        cx={PROGRESS_RING_CENTER}
        cy={PROGRESS_RING_CENTER}
        fill="none"
        r={PROGRESS_RING_RADIUS}
        strokeWidth={PROGRESS_RING_STROKE_WIDTH}
      />
      {clampedFraction > 0 ? (
        <circle
          data-slot="progress-ring-indicator"
          cx={PROGRESS_RING_CENTER}
          cy={PROGRESS_RING_CENTER}
          fill="none"
          r={PROGRESS_RING_RADIUS}
          stroke="currentColor"
          strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={PROGRESS_RING_STROKE_WIDTH}
        />
      ) : null}
    </svg>
  );
}
