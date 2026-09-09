"use client";

/** Selects the configured routing adapter while keeping a native anchor fallback. */
import { MotionSlot } from "../motion/motion-slot.js";
import type { ComponentType } from "react";
import { useBeezUIComponents, type BeezLinkProps } from "../providers/beez-ui-provider.js";

/** Shares native link props and explicit per-link navigation overrides. */
export type LinkProps = BeezLinkProps & {
  component?: ComponentType<BeezLinkProps> | "a";
};

/** Uses the provider's adapter and excludes framework hints from native DOM attributes. */
export function Link({ component, prefetch, ...props }: LinkProps) {
  const adapters = useBeezUIComponents();
  const Component = component ?? adapters.Link;
  const link = !Component || Component === "a"
    ? <a data-slot="link" {...props} />
    : <Component data-slot="link" {...props} prefetch={prefetch} />;
  return "data-slot" in props ? link : <MotionSlot kind="link">{link}</MotionSlot>;
}
