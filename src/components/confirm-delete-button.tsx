"use client";

/** Row action menu whose destructive item asks for an inline confirmation before running. */
import { useId, useRef, useState, type ReactNode } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu.js";
import { Popover, PopoverAnchor, PopoverContent } from "./popover.js";

const CONFIRM_DELETE_DEFAULT_LABELS = {
  cancel: "Cancelar",
  confirm: "Confirmar",
  delete: "Eliminar",
  menu: "Abrir acciones",
} as const;

export interface ConfirmDeleteButtonLabels {
  /** Dismisses the confirmation. */
  cancel?: string;
  /** Runs `onConfirm`. */
  confirm?: string;
  /** Destructive menu item that opens the confirmation. */
  delete?: string;
  /** Accessible name of the icon-only menu trigger. */
  menu?: string;
}

export interface ConfirmDeleteButtonProps {
  /** Question shown in the confirmation, also used as its accessible name. */
  message: string;
  onConfirm: () => void;
  /** Extra menu items (for example Edit), rendered before the delete item. */
  extraMenuItems?: ReactNode;
  labels?: ConfirmDeleteButtonLabels;
  className?: string;
}

/**
 * Renders an icon menu with a destructive item. Choosing it opens a confirmation anchored to
 * the trigger; only its confirm button runs `onConfirm`. Escape, an outside click or Cancel
 * dismiss it without side effects.
 * @param props - Confirmation copy, callback, extra items and optional labels.
 * @returns The menu trigger with its confirmation.
 */
export function ConfirmDeleteButton({
  message,
  onConfirm,
  extraMenuItems = null,
  labels,
  className,
}: ConfirmDeleteButtonProps) {
  const resolvedLabels = { ...CONFIRM_DELETE_DEFAULT_LABELS, ...labels };
  const [isConfirming, setIsConfirming] = useState(false);
  /** Set while the menu closes into the confirmation, so the menu does not steal its focus. */
  const isOpeningConfirmationRef = useRef(false);
  const messageId = useId();

  return (
    <div data-slot="confirm-delete-button" className={cn("inline-flex justify-end", className)}>
      <Popover open={isConfirming} onOpenChange={setIsConfirming}>
        <DropdownMenu>
          <PopoverAnchor asChild>
            <DropdownMenuTrigger asChild>
              <Button aria-label={resolvedLabels.menu} size="icon-sm" type="button" variant="ghost">
                <MoreVertical aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </PopoverAnchor>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(event) => {
              if (!isOpeningConfirmationRef.current) return;
              isOpeningConfirmationRef.current = false;
              event.preventDefault();
            }}
          >
            {extraMenuItems}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                isOpeningConfirmationRef.current = true;
                setIsConfirming(true);
              }}
            >
              <Trash2 aria-hidden="true" />
              {resolvedLabels.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <PopoverContent align="end" aria-labelledby={messageId} className="w-[min(18rem,calc(100vw-2rem))] gap-3 p-3.5">
          <p id={messageId} className="m-0 text-sm text-foreground">
            {message}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" type="button" variant="outline" onClick={() => setIsConfirming(false)}>
              {resolvedLabels.cancel}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="destructive"
              onClick={() => {
                setIsConfirming(false);
                onConfirm();
              }}
            >
              {resolvedLabels.confirm}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
