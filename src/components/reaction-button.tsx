"use client";

/**
 * Toggle for likes and similar reactions: the icon pops when the viewer reacts and the counter
 * rolls in the direction of the change. The (optimistic) reaction state is owned by the caller.
 */
import type { ComponentType, CSSProperties, MouseEvent, SVGProps } from "react";
import { HeartIcon } from "lucide-react";
import { motion, type Variants } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { MOTION_EASE, MOTION_TIMING } from "../motion/tokens.js";
import { AnimatedCount } from "./animated-count.js";
import { Button } from "./button.js";

/** Peak scale the icon reaches while popping into the active state. */
const REACTION_ICON_POP_SCALE = 1.28;

const REACTION_ICON_VARIANTS: Variants = {
  idle: { scale: 1 },
  active: {
    scale: [1, REACTION_ICON_POP_SCALE, 1],
    transition: { duration: MOTION_TIMING.pop, ease: MOTION_EASE },
  },
};

/** Exposes the active color to the icon classes. */
type ReactionButtonStyle = CSSProperties & { "--beez-reaction-active-color"?: string };

export interface ReactionButtonProps {
  /** Accessible name, including the current count (for example "Me gusta 3"). */
  ariaLabel: string;
  isActive: boolean;
  count: number;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  isDisabled?: boolean;
  /** Icon of the reaction; it is filled with `activeColor` while active. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * CSS color of the active icon, such as `var(--primary)` or `currentColor` to follow the
   * button text. Defaults to the destructive color, the usual tone of a like.
   */
  activeColor?: string;
  /** Formats the visible count, for example with a locale-aware compact format. */
  formatCount?: (count: number) => string;
  className?: string;
}

/**
 * Renders an outline toggle button exposing its state with `aria-pressed`. The icon starts at
 * rest (`initial={false}`), so server-rendered and already-active reactions never pop on load;
 * only a change to active does, and not at all with reduced motion.
 * @param props - Accessible name, state, count, click handler and optional icon.
 * @returns The reaction button.
 */
export function ReactionButton({
  ariaLabel,
  isActive,
  count,
  onClick,
  isDisabled = false,
  icon: Icon = HeartIcon,
  formatCount,
  activeColor,
  className,
}: ReactionButtonProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const activeColorStyle: ReactionButtonStyle | undefined = activeColor ? { "--beez-reaction-active-color": activeColor } : undefined;

  return (
    <Button
      data-slot="reaction-button"
      data-active={isActive || undefined}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={cn("group/reaction", className)}
      disabled={isDisabled}
      onClick={onClick}
      style={activeColorStyle}
      type="button"
      variant="outline"
    >
      <motion.span
        animate={isActive && !shouldReduceMotion ? "active" : "idle"}
        aria-hidden
        className="inline-flex origin-center items-center justify-center"
        initial={false}
        variants={REACTION_ICON_VARIANTS}
      >
        <Icon className="size-4 transition-[fill,color] group-data-active/reaction:fill-current group-data-active/reaction:text-[var(--beez-reaction-active-color,var(--destructive))]" />
      </motion.span>
      <AnimatedCount className="min-w-[1ch]" value={count} format={formatCount} />
    </Button>
  );
}
