"use client";

/** Expands and collapses a region by animating its height, then releases overflow. */
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { MOTION_EASE, MOTION_EASE_IN_OUT, MOTION_TIMING } from "../motion/tokens.js";

const COLLAPSE_TRANSITION = {
  height: { duration: MOTION_TIMING.collapse, ease: MOTION_EASE_IN_OUT },
  opacity: { duration: MOTION_TIMING.panel, ease: MOTION_EASE },
} as const;
/** Reduced motion applies the height at once but keeps the short fade, so exits always settle. */
const REDUCED_MOTION_COLLAPSE_TRANSITION = {
  height: { duration: 0 },
  opacity: { duration: MOTION_TIMING.panel, ease: MOTION_EASE },
} as const;

export interface AnimatedCollapseProps {
  /** Whether the region is rendered and expanded. */
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
  /** Animate the very first render too; off by default so SSR output stays visible. */
  animateOnMount?: boolean;
}

/**
 * Renders `children` only while `isOpen`, animating height and opacity.
 * Keep padding inside `children`: the animated wrapper collapses to zero height.
 * Overflow is clipped only while animating, so focus rings and popovers are not cut once settled.
 * @param props - Open state, content and optional wrapper attributes.
 * @returns The animated region, or nothing when closed.
 */
export function AnimatedCollapse({ isOpen, children, className, id, animateOnMount = false }: AnimatedCollapseProps) {
  const [isSettled, setIsSettled] = useState(!animateOnMount);
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence initial={animateOnMount}>
      {isOpen ? (
        <motion.div
          key="animated-collapse"
          data-slot="animated-collapse"
          id={id}
          className={cn(isSettled ? "overflow-visible" : "overflow-hidden", className)}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={shouldReduceMotion ? REDUCED_MOTION_COLLAPSE_TRANSITION : COLLAPSE_TRANSITION}
          onAnimationStart={() => setIsSettled(false)}
          onAnimationComplete={() => setIsSettled(true)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
