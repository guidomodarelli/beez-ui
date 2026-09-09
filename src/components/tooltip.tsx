"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { MotionSlot } from "../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../motion/presence.js"
import { cn } from "../lib/utils.js"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="tooltip" open={motionOpen}><TooltipPrimitive.Root data-slot="tooltip" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal forceMount><MotionPresence scope="tooltip" forceMount={props.forceMount}>
      <MotionSlot kind="surface"><TooltipPrimitive.Content forceMount
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm ",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content></MotionSlot>
    </MotionPresence></TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
