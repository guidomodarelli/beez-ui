"use client";

/** Icon button that toggles a short explanatory message, for inline help next to labels. */
import { useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";

import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";

const INFO_POPOVER_DEFAULT_LABELS = {
  close: "Cerrar ayuda",
  trigger: "Más información",
} as const;

export interface InfoPopoverLabels {
  /** Accessible name of the close button inside the message. */
  close?: string;
  /** Accessible name of the icon-only trigger. */
  trigger?: string;
}

export interface InfoPopoverProps {
  /** Explanation shown inside the popover. */
  message: ReactNode;
  labels?: InfoPopoverLabels;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  contentClassName?: string;
}

/**
 * Renders an info icon that opens the message on click or tap, unlike a hover tooltip, so it
 * works on touch devices. Escape, an outside click or the close button dismiss it.
 * @param props - Message, optional labels, side and class names.
 * @returns The trigger with its popover.
 */
export function InfoPopover({ message, labels, side = "top", className, contentClassName }: InfoPopoverProps) {
  const resolvedLabels = { ...INFO_POPOVER_DEFAULT_LABELS, ...labels };
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          data-slot="info-popover-trigger"
          aria-label={resolvedLabels.trigger}
          className={cn("text-muted-foreground hover:text-foreground aria-expanded:text-foreground", className)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Info aria-hidden="true" className="size-[0.95rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-slot="info-popover-content"
        side={side}
        sideOffset={10}
        collisionPadding={16}
        className={cn("relative w-[min(20rem,calc(100vw-2rem))] py-3.5 pr-10 pl-3.5", contentClassName)}
      >
        <Button
          aria-label={resolvedLabels.close}
          className="absolute top-2 right-2"
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={() => setIsOpen(false)}
        >
          <X aria-hidden="true" className="size-[0.95rem]" />
        </Button>
        <div className="m-0 text-sm leading-normal text-foreground">{message}</div>
      </PopoverContent>
    </Popover>
  );
}
