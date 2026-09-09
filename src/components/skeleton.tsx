import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <MotionSlot kind="skeleton"><div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted", className)}
      {...props}
    /></MotionSlot>
  )
}

export { Skeleton }
