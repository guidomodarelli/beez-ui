"use client";

/** Selects the configured routing adapter while keeping a native anchor fallback. */
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
  if (!Component || Component === "a") return <a {...props} />;
  return <Component {...props} prefetch={prefetch} />;
}
