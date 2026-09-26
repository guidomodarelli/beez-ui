/** Animated three-dot bouncing loader with synchronized floor shadows. */
import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils.js";

const DEFAULT_LOADING_LABEL = "Cargando...";

export type BouncingDotsLoaderSize = "sm" | "md";

/** Stage, dot and shadow geometry per size; the keyframes in `keyframes.css` match these values. */
const LOADER_SIZE_CLASS_NAMES: Record<BouncingDotsLoaderSize, { stage: string; dot: string; shadow: string }> = {
  md: {
    stage: "h-[3.75rem] w-[12.5rem]",
    dot: "size-5 animate-[beez-bouncing-dot-md_0.5s_ease_infinite_alternate]",
    shadow: "top-[3.875rem] h-1 w-5",
  },
  sm: {
    stage: "h-[1.875rem] w-[6.5rem]",
    dot: "size-2.5 animate-[beez-bouncing-dot-sm_0.5s_ease_infinite_alternate]",
    shadow: "top-[1.9375rem] h-[0.1875rem] w-2.5",
  },
};

/** Horizontal slot and phase of each dot: the middle and right dots trail the left one. */
const DOT_POSITION_CLASS_NAMES = ["left-[15%]", "left-[45%] delay-200", "right-[15%] delay-300"] as const;

export type BouncingDotsLoaderProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-label" | "role"> & {
  /**
   * Accessible label announced by assistive technologies. Also rendered as visually hidden text
   * so screen readers can read it independently of the `aria-label`.
   */
  label?: string;
  /** Use `"sm"` for inline or compact contexts and `"md"` (default) for standalone loading panels. */
  size?: BouncingDotsLoaderSize;
};

/**
 * Renders the loader as a `role="status"` region. It fades in after a short delay, so loads that
 * finish quickly never flash it. Reduced motion stops the bounce through the shared fallback.
 * @param props - Label, size and native attributes.
 * @returns The loader.
 */
export function BouncingDotsLoader({ label = DEFAULT_LOADING_LABEL, size = "md", className, ...rest }: BouncingDotsLoaderProps) {
  const sizeClassNames = LOADER_SIZE_CLASS_NAMES[size];

  return (
    <div
      data-slot="bouncing-dots-loader"
      data-size={size}
      {...rest}
      aria-label={label}
      role="status"
      className={cn(
        "flex w-full items-center justify-center animate-in fade-in fill-mode-both delay-120 duration-300",
        className,
      )}
    >
      <div aria-hidden="true" className={cn("relative z-[1]", sizeClassNames.stage)}>
        {DOT_POSITION_CLASS_NAMES.map((positionClassName) => (
          <span
            key={`dot-${positionClassName}`}
            className={cn("absolute top-0 origin-bottom rounded-full bg-foreground", sizeClassNames.dot, positionClassName)}
          />
        ))}
        {DOT_POSITION_CLASS_NAMES.map((positionClassName) => (
          <span
            key={`shadow-${positionClassName}`}
            className={cn(
              "absolute -z-[1] rounded-full bg-foreground/35 blur-[1px] animate-[beez-bouncing-dot-shadow_0.5s_ease_infinite_alternate]",
              sizeClassNames.shadow,
              positionClassName,
            )}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
