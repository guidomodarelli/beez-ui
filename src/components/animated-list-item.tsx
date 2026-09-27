"use client";

/** List item that enters, leaves and reflows smoothly inside an `AnimatePresence`. */
import type { HTMLAttributes, ReactNode } from "react";
import { motion, useIsPresent } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import {
  MOTION_EASE,
  MOTION_ITEM_ENTER_SCALE,
  MOTION_LIST_ITEM_DISTANCE,
  MOTION_TIMING,
  SPRING_LAYOUT,
} from "../motion/tokens.js";

const ANIMATED_LIST_ITEM_ELEMENTS = {
  li: motion.li,
  div: motion.div,
  article: motion.article,
} as const;

const LIST_ITEM_TRANSITION = { duration: MOTION_TIMING.panel, ease: MOTION_EASE, layout: SPRING_LAYOUT } as const;
const LIST_ITEM_EXIT_TRANSITION = { duration: MOTION_TIMING.exit, ease: MOTION_EASE } as const;

/** Native handlers whose names collide with Motion's animation and drag callbacks. */
type MotionConflictingHandlers =
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd";

export type AnimatedListItemProps = Omit<HTMLAttributes<HTMLElement>, MotionConflictingHandlers> & {
  children: ReactNode;
  as?: keyof typeof ANIMATED_LIST_ITEM_ELEMENTS;
  /** Reflow siblings with a spring when items are added, removed or reordered. */
  layout?: boolean;
};

/**
 * Wrap the list in `<AnimatePresence initial={false}>` so only items added after the
 * first render animate in, and removed items animate out before leaving the DOM.
 * A leaving item turns inert and hidden from assistive technology, so it can no
 * longer be focused, clicked or announced during its exit.
 * @param props - Native attributes, element type and content.
 * @returns The animated item.
 */
export function AnimatedListItem({ children, as = "li", layout = true, className, ...elementProps }: AnimatedListItemProps) {
  const MotionElement = ANIMATED_LIST_ITEM_ELEMENTS[as];
  const isPresent = useIsPresent();
  const shouldReduceMotion = usePrefersReducedMotion();
  /** Reduced motion keeps a short fade but drops travel, scale and layout reflow. */
  const distance = shouldReduceMotion ? 0 : MOTION_LIST_ITEM_DISTANCE;
  const enterScale = shouldReduceMotion ? 1 : MOTION_ITEM_ENTER_SCALE;

  return (
    <MotionElement
      data-slot="animated-list-item"
      {...elementProps}
      aria-hidden={isPresent ? elementProps["aria-hidden"] : true}
      inert={!isPresent || undefined}
      className={cn("min-w-0", className)}
      layout={layout && !shouldReduceMotion ? "position" : false}
      initial={{ opacity: 0, y: distance, scale: enterScale }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: enterScale,
        transition: LIST_ITEM_EXIT_TRANSITION,
      }}
      transition={LIST_ITEM_TRANSITION}
    >
      {children}
    </MotionElement>
  );
}
