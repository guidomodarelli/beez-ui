"use client";

/** Keeps the default image integration separate from optional framework entrypoints. */
import { useMemo } from "react";
import { BeezUIProvider as BaseBeezUIProvider, type BeezUIProviderProps } from "./beez-ui-provider.js";
import { UnpicImageAdapter } from "../adapters/unpic-image.js";

export type { BeezUIProviderProps } from "./beez-ui-provider.js";

/** Combines native navigation, responsive Unpic images and the shared theme provider. */
export function BeezUIProvider({ components, ...props }: BeezUIProviderProps) {
  const nativeComponents = useMemo(() => ({ Image: UnpicImageAdapter, ...components }), [components]);
  return <BaseBeezUIProvider {...props} components={nativeComponents} />;
}
