"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { MotionSlot } from "../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../motion/presence.js"
import { cn } from "../lib/utils.js"

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="hover-card" open={motionOpen}><HoverCardPrimitive.Root data-slot="hover-card" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal" forceMount><MotionPresence scope="hover-card" forceMount={props.forceMount}>
      <MotionSlot kind="surface"><HoverCardPrimitive.Content forceMount
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-lg bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden ",
          className
        )}
        {...props}
      /></MotionSlot>
    </MotionPresence></HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
