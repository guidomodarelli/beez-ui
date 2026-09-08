"use client";

/** Isolates optional Next.js imports from the framework-neutral package entrypoint. */
import { useMemo, type ReactNode } from "react";
import NextImageModule from "next/image.js";
import NextLinkModule from "next/link.js";
import { BeezUIProvider as BaseBeezUIProvider, type BeezUIProviderProps as BaseBeezUIProviderProps, type BeezImageProps, type BeezLinkProps } from "./providers/beez-ui-provider.js";
import { imageDimension } from "./lib/image-dimensions.js";

/** Supports both native ESM loading of Next's CommonJS modules and bundler interop. */
const NextImage = NextImageModule.default ?? NextImageModule;
const NextLink = NextLinkModule.default ?? NextLinkModule;

/** Configures Next adapters without forcing image host configuration on existing apps. */
export interface BeezUIProviderProps {
  children: ReactNode;
  /** Enables the image optimizer; configure allowed image hosts in the application. */
  optimizeImages?: boolean;
  /** Keeps speculative navigation opt-in, matching LaTribu's existing behavior. */
  prefetch?: boolean;
  themeOptions?: BaseBeezUIProviderProps["themeOptions"];
}

/** Activates Next.js navigation and images for every descendant using shared primitives. */
export function BeezUIProvider({ children, optimizeImages = false, prefetch = false, themeOptions }: BeezUIProviderProps) {
  const components = useMemo(() => ({
    /** Delegates routing while retaining the consumer's native link props. */
    Link: function NextRoutingAdapter({ prefetch: linkPrefetch, ...props }: BeezLinkProps) {
      return <NextLink {...props} prefetch={linkPrefetch ?? prefetch} />;
    },
    /** Delegates loading to Next while the avatar primitive owns error/fallback state. */
    Image: function NextImageAdapter(props: BeezImageProps) {
      if (!props.src) return <img {...props} />;
      return <NextImage {...props} alt={props.alt ?? ""} src={props.src} width={imageDimension(props.width)} height={imageDimension(props.height)} unoptimized={!optimizeImages} />;
    },
  }), [optimizeImages, prefetch]);
  return <BaseBeezUIProvider components={components} themeOptions={themeOptions}>{children}</BaseBeezUIProvider>;
}
