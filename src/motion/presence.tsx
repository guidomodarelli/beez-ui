"use client";

/** Shares visibility with portaled content while leaving interaction ownership with Radix. */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AnimatePresence } from "motion/react";

/** Separate contexts preserve correctly nested combinations such as menus inside tooltips. */
const OPEN_CONTEXTS = {
  dialog: createContext(true),
  "alert-dialog": createContext(true),
  sheet: createContext(true),
  "dropdown-menu": createContext(true),
  "dropdown-sub": createContext(true),
  popover: createContext(true),
  "hover-card": createContext(true),
  tooltip: createContext(true),
};
type MotionScope = keyof typeof OPEN_CONTEXTS;

/** Provides only the owning primitive's visibility, independently of other nested primitives. */
export function MotionOpenProvider({
  scope,
  open,
  children,
}: {
  scope: MotionScope;
  open: boolean;
  children: ReactNode;
}) {
  const Context = OPEN_CONTEXTS[scope];
  return <Context.Provider value={open}>{children}</Context.Provider>;
}

/** Preserves the primitive's controlled/uncontrolled open contract. */
export function useMotionOpenState({
  open,
  defaultOpen = false,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}): readonly [boolean, (open: boolean) => void] {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [open, onOpenChange],
  );
  return [open ?? internalOpen, setOpen];
}

/** Retains closing content until its Motion exit finishes; explicit forceMount remains caller-owned. */
export function MotionPresence({
  scope,
  children,
  forceMount,
}: {
  scope: MotionScope;
  children: ReactNode;
  forceMount?: boolean;
}) {
  const open = useContext(OPEN_CONTEXTS[scope]);
  if (forceMount) return children;
  return (
    <AnimatePresence initial={false}>{open ? children : null}</AnimatePresence>
  );
}
