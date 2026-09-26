"use client";

/** Rolls a numeric value vertically when it changes, in the direction of the change. */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { SPRING_POP } from "../motion/tokens.js";

/** Fraction of the line height the digits travel while rolling. */
const COUNT_ROLL_DISTANCE = "60%";
const COUNT_ROLL_DISTANCE_INVERTED = "-60%";
const INCREMENT_DIRECTION = 1;
const DECREMENT_DIRECTION = -1;

const COUNT_ROLL_VARIANTS = {
  enter: (direction: number) => ({ y: direction > 0 ? COUNT_ROLL_DISTANCE : COUNT_ROLL_DISTANCE_INVERTED, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? COUNT_ROLL_DISTANCE_INVERTED : COUNT_ROLL_DISTANCE, opacity: 0 }),
};

export interface AnimatedCountProps {
  value: number;
  /** Optional formatter, for example a locale-aware number format. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * Renders `value` and animates each change: increments roll up, decrements roll down.
 * With reduced motion the new value replaces the previous one without travel.
 * @param props - Current value, optional formatter and class name.
 * @returns The animated number.
 */
export function AnimatedCount({ value, format, className }: AnimatedCountProps) {
  const [previousValue, setPreviousValue] = useState(value);
  const [direction, setDirection] = useState(INCREMENT_DIRECTION);
  const shouldReduceMotion = usePrefersReducedMotion();

  if (previousValue !== value) {
    setDirection(value > previousValue ? INCREMENT_DIRECTION : DECREMENT_DIRECTION);
    setPreviousValue(value);
  }

  const formattedValue = format ? format(value) : value;

  return (
    <span
      data-slot="animated-count"
      className={cn("relative inline-flex overflow-hidden align-bottom tabular-nums", className)}
    >
      {shouldReduceMotion ? (
        <span className="inline-block">{formattedValue}</span>
      ) : (
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.span
            key={value}
            className="inline-block"
            custom={direction}
            variants={COUNT_ROLL_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING_POP}
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}
