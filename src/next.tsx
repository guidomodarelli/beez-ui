"use client";

/** Isolates optional Next.js imports from the framework-neutral package entrypoint. */
import { useMemo, type ReactNode } from "react";
import NextImageModule from "next/image.js";
import NextLinkModule from "next/link.js";
import { BeezUIProvider, type BeezImageProps, type BeezLinkProps } from "./providers/beez-ui-provider.js";

/** Supplies an intrinsic size when a consumer relies on avatar CSS dimensions. */
const DEFAULT_IMAGE_DIMENSION_PX = 40;

/** Supports both native ESM loading of Next's CommonJS modules and bundler interop. */
const NextImage = NextImageModule.default ?? NextImageModule;
const NextLink = NextLinkModule.default ?? NextLinkModule;

/** Configures Next adapters without forcing image host configuration on existing apps. */
export interface NextBeezUIProviderProps {
  children: ReactNode;
  /** Enables the image optimizer; configure allowed image hosts in the application. */
  optimizeImages?: boolean;
  /** Keeps speculative navigation opt-in, matching LaTribu's existing behavior. */
  prefetch?: boolean;
}

/** Converts native image dimensions into the positive numeric values Next accepts. */
function imageDimension(value: string | number | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IMAGE_DIMENSION_PX;
}

/** Activates Next.js navigation and images for every descendant using shared primitives. */
export function NextBeezUIProvider({ children, optimizeImages = false, prefetch = false }: NextBeezUIProviderProps) {
  const components = useMemo(() => ({
    /** Delegates routing while retaining the consumer's native link props. */
    Link: function NextRoutingAdapter(props: BeezLinkProps) {
      return <NextLink {...props} prefetch={prefetch} />;
    },
    /** Delegates loading to Next while the avatar primitive owns error/fallback state. */
    Image: function NextImageAdapter(props: BeezImageProps) {
      if (!props.src) return <img {...props} />;
      return <NextImage {...props} alt={props.alt ?? ""} src={props.src} width={imageDimension(props.width)} height={imageDimension(props.height)} unoptimized={!optimizeImages} />;
    },
  }), [optimizeImages, prefetch]);
  return <BeezUIProvider components={components}>{children}</BeezUIProvider>;
}
