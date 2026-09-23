"use client";

/** Adds a gliding active-item indicator to the original container, without DOM wrappers. */
import { useLayoutEffect, type ComponentProps, type ReactElement } from "react";
import { Slot } from "radix-ui";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { attachGlideIndicator, GLIDE_PRESETS, type GlidePresetName } from "./glide-indicator.js";
import { useAttachedElement } from "./use-attached-element.js";

/** Composes refs through Radix Slot and glides the preset's highlight between its items. */
export function GlideSlot({
  children,
  preset,
  ref,
  ...props
}: Omit<ComponentProps<typeof Slot.Root>, "children"> & {
  children: ReactElement;
  preset: GlidePresetName;
}) {
  const [element, attach] = useAttachedElement<HTMLElement>(ref);
  const reduceMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!element || reduceMotion) return;
    return attachGlideIndicator(element, GLIDE_PRESETS[preset]);
  }, [element, preset, reduceMotion]);

  return (
    <Slot.Root {...props} ref={attach}>
      {children}
    </Slot.Root>
  );
}
