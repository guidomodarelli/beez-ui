/**
 * Pure file-size formatting helper shared by attachment and upload UIs. Framework-safe:
 * no React, no platform APIs beyond `Intl`, so it runs on the server and the client alike.
 */

const BYTES_PER_UNIT_STEP = 1024;
const FILE_SIZE_UNIT_LABELS = ["B", "KB", "MB", "GB", "TB"] as const;
/** Spanish (Argentina) keeps the comma decimal separator of the original product copy. */
const DEFAULT_FILE_SIZE_LOCALE = "es-AR";
const SUB_UNIT_FRACTION_DIGITS = 0;
const SCALED_UNIT_FRACTION_DIGITS = 1;

export interface FormatFileSizeOptions {
  /** BCP 47 locale used for the decimal separator. Defaults to `es-AR`. */
  locale?: string;
}

/**
 * Formats a byte count as a short human-readable size, e.g. `12,3 MB`, `850 KB`, `25 MB`.
 *
 * @param bytes - Raw size in bytes. Non-finite or negative values render as `0 B`.
 * @param options - Optional locale for the number format.
 * @returns The formatted size with its unit, separated by a space.
 */
export function formatFileSize(bytes: number, { locale = DEFAULT_FILE_SIZE_LOCALE }: FormatFileSizeOptions = {}): string {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;

  let scaledValue = safeBytes;
  let unitIndex = 0;
  while (
    scaledValue >= BYTES_PER_UNIT_STEP &&
    unitIndex < FILE_SIZE_UNIT_LABELS.length - 1
  ) {
    scaledValue /= BYTES_PER_UNIT_STEP;
    unitIndex += 1;
  }

  const formattedValue = new Intl.NumberFormat(locale, {
    maximumFractionDigits:
      unitIndex === 0 ? SUB_UNIT_FRACTION_DIGITS : SCALED_UNIT_FRACTION_DIGITS,
  }).format(scaledValue);

  return `${formattedValue} ${FILE_SIZE_UNIT_LABELS[unitIndex]}`;
}
