import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"

/**
 * Placeholder with a soft shine that sweeps across it while content loads.
 * The shine rests outside the box, so reduced motion shows a plain muted block.
 * @param props - Native div properties and optional consumer overrides.
 * @returns The placeholder element with its loading animation.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <MotionSlot kind="skeleton"><div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted after:pointer-events-none after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-foreground/6 after:to-transparent",
        className
      )}
      {...props}
    /></MotionSlot>
  )
}

export { Skeleton }
