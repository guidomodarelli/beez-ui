/** Supplies intrinsic dimensions required by responsive and optimized image adapters. */
const DEFAULT_IMAGE_DIMENSION_PX = 40;

/** Converts native image dimensions into a positive numeric value. */
export function imageDimension(value: string | number | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IMAGE_DIMENSION_PX;
}
