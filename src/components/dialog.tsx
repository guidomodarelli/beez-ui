"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { MotionSlot } from "../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../motion/presence.js"
import { cn } from "../lib/utils.js"
import { Button } from "./button.js"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="dialog" open={motionOpen}><DialogPrimitive.Root data-slot="dialog" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-md ",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders compact dialog content with viewport-safe scrolling.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal forceMount><MotionPresence scope="dialog" forceMount={props.forceMount}><React.Fragment>
      <MotionSlot kind="overlay"><DialogOverlay forceMount /></MotionSlot>
      <MotionSlot kind="dialog"><DialogPrimitive.Content forceMount
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100svh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm ",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content></MotionSlot>
    </React.Fragment></MotionPresence></DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * Separates dialog actions with a bordered footer matching the content padding.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

/**
 * Renders dialog headings with the shared font at the compact default size.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
