"use client";

/** Uses Unpic for responsive images without coupling the native adapter to a framework. */
import { Image } from "@unpic/react";
import type { BeezImageProps } from "../providers/beez-ui-provider.js";
import { imageDimension } from "../lib/image-dimensions.js";

/** Preserves browser events and consumer styles while deriving responsive image sources. */
export function UnpicImageAdapter({ src, width, height, style, ...props }: BeezImageProps) {
  if (!src) return <img {...props} width={width} height={height} style={style} />;
  // Unpic merges style overrides at runtime; its 1.x React declarations omit that field.
  const imageProps = {
    ...props,
    src,
    width: imageDimension(width),
    height: imageDimension(height),
    layout: "constrained" as const,
    style: { maxWidth: "100%", maxHeight: "100%", ...style },
  };
  return <Image {...imageProps} />;
}
