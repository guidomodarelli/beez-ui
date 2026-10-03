"use client";

/** Follows the hovered item of a list with one shared background pill, as in beui.dev. */
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { MOTION_REVEAL_BLUR_PX, SPRING_LAYOUT } from "./tokens.js";

/** Horizontal distance, in pixels, the pill extends past each row by default. */
const DEFAULT_PILL_INSET_PX = 20;
const PILL_BLUR = `blur(${MOTION_REVEAL_BLUR_PX}px)`;

/** The pill fades in blurred, and only blurs out when the pointer leaves the whole list. */
const PILL_VARIANTS: Variants = {
  initial: { opacity: 0, filter: PILL_BLUR },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: (isHovering: boolean) => (isHovering ? {} : { opacity: 0, filter: PILL_BLUR }),
};

/** With reduced motion the pill appears and leaves at once, like other pointer highlights. */
const REDUCED_PILL_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: (isHovering: boolean) => (isHovering ? {} : { opacity: 0, transition: { duration: 0 } }),
};

type HoverableChildProps = {
  className?: string;
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
  children?: ReactNode;
};

export type SharedLayoutBgProps = ComponentProps<"ul"> & {
  /** Classes of the moving pill. */
  pillClassName?: string;
  /** Positioning override for the pill wrapper inside each item. */
  pillContainerClassName?: string;
  /** Horizontal distance, in pixels, the pill extends past each row. */
  inset?: number;
};

/**
 * Renders a list whose items share one hover pill that glides between them.
 * Each child element receives the pill behind its content, so children should be list items.
 * @param props - List attributes, pill styling and the items to decorate.
 * @returns The decorated list.
 */
export function SharedLayoutBg({
  children,
  className,
  onMouseLeave,
  pillClassName,
  pillContainerClassName,
  inset = DEFAULT_PILL_INSET_PX,
  ...props
}: SharedLayoutBgProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const layoutId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isHovering = hoveredKey !== null;

  const items = Children.toArray(children)
    .filter(isValidElement)
    .map((child, index) => {
      const item = child as ReactElement<HoverableChildProps>;
      const itemKey = item.key === null ? `item-${index}` : String(item.key);
      return cloneElement(
        item,
        {
          key: itemKey,
          className: cn("relative", item.props.className),
          onMouseEnter: (event: MouseEvent<HTMLElement>) => {
            item.props.onMouseEnter?.(event);
            setHoveredKey(itemKey);
          },
        },
        <>
          <AnimatePresence custom={isHovering}>
            {isHovering ? (
              <motion.div
                variants={shouldReduceMotion ? REDUCED_PILL_VARIANTS : PILL_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                custom={isHovering}
                className={cn("pointer-events-none absolute inset-y-0", pillContainerClassName)}
                style={{ left: -inset, right: -inset }}
              >
                {hoveredKey === itemKey ? (
                  <motion.div
                    data-slot="shared-layout-pill"
                    layoutId={`shared-layout-bg-${layoutId}`}
                    transition={shouldReduceMotion ? { duration: 0 } : SPRING_LAYOUT}
                    className={cn("pointer-events-none size-full rounded-2xl bg-muted/80", pillClassName)}
                  />
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="relative z-10">{item.props.children}</div>
        </>,
      );
    });

  // layoutRoot scopes the pill's layout projection to this list, so fixed or
  // scrolled ancestors cannot smear scroll offsets into its movement.
  return (
    <motion.ul
      {...(props as HTMLMotionProps<"ul">)}
      layoutRoot
      onMouseLeave={(event: MouseEvent<HTMLUListElement>) => {
        setHoveredKey(null);
        onMouseLeave?.(event);
      }}
      className={cn("flex w-full flex-col", className)}
    >
      {items}
    </motion.ul>
  );
}
