/**
 * Validates picked or dropped files against an `accept` list and a size limit, mirroring the
 * native `<input accept>` syntax. Files without a MIME type (common on some Android pickers and
 * drag sources) fall back to their extension.
 */

const MIME_TYPE_EXTENSION_FALLBACKS: Record<string, readonly string[]> = {
  "application/pdf": [".pdf"],
  "audio/mpeg": [".mp3"],
  "image/gif": [".gif"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "text/plain": [".txt"],
  "video/mp4": [".mp4"],
};

const WILDCARD_MIME_PREFIX_EXTENSION_FALLBACKS: Record<string, readonly string[]> = {
  audio: [".aac", ".flac", ".m4a", ".mp3", ".ogg", ".wav"],
  image: [".avif", ".bmp", ".gif", ".heic", ".heif", ".jpeg", ".jpg", ".png", ".svg", ".webp"],
  text: [".csv", ".md", ".txt"],
  video: [".avi", ".m4v", ".mov", ".mp4", ".mkv", ".webm"],
};

const ACCEPT_LIST_SEPARATOR = ",";
const EXTENSION_PREFIX = ".";
const MIME_WILDCARD_SUFFIX = "/*";
const MIME_TYPE_SEPARATOR = "/";

/** File metadata the checks need; a `File` satisfies it. */
export interface AcceptableFile {
  name: string;
  type: string;
  size: number;
}

/**
 * Extracts the lowercase extension from a file name.
 * @param fileName - The file name.
 * @returns The extension with its leading dot, or null when there is none.
 */
export function getFileExtension(fileName: string): string | null {
  const fileNameParts = fileName.split(EXTENSION_PREFIX);
  const extension = fileNameParts.length > 1 ? fileNameParts.pop() : null;
  return extension ? `${EXTENSION_PREFIX}${extension.toLowerCase()}` : null;
}

/**
 * Tells whether a file matches an `accept` list such as `"image/*,.pdf"`.
 * @param file - File to check.
 * @param accept - Comma-separated extensions, exact MIME types or `type/*` wildcards; empty accepts all.
 * @returns Whether the file is accepted.
 */
export function isFileTypeAccepted(file: AcceptableFile, accept?: string): boolean {
  if (!accept) return true;

  const fileExtension = getFileExtension(file.name);
  const normalizedFileType = file.type.toLowerCase();
  const hasMimeType = normalizedFileType.length > 0;
  const extensionMatches = (candidateExtensions: readonly string[] | undefined) =>
    Boolean(fileExtension && candidateExtensions?.includes(fileExtension));

  return accept
    .split(ACCEPT_LIST_SEPARATOR)
    .map((acceptedType) => acceptedType.trim().toLowerCase())
    .filter(Boolean)
    .some((acceptedType) => {
      if (acceptedType.startsWith(EXTENSION_PREFIX)) return fileExtension === acceptedType;

      if (acceptedType.endsWith(MIME_WILDCARD_SUFFIX)) {
        const typePrefix = acceptedType.split(MIME_TYPE_SEPARATOR)[0];
        return hasMimeType
          ? normalizedFileType.startsWith(`${typePrefix}${MIME_TYPE_SEPARATOR}`)
          : extensionMatches(WILDCARD_MIME_PREFIX_EXTENSION_FALLBACKS[typePrefix]);
      }

      return (hasMimeType && normalizedFileType === acceptedType) || extensionMatches(MIME_TYPE_EXTENSION_FALLBACKS[acceptedType]);
    });
}

export interface ClassifyFilesOptions {
  accept?: string;
  /** Maximum size in bytes; checked before the type. */
  maxSize?: number;
  /** When false, only the first file is considered. */
  allowsMultiple?: boolean;
}

export interface ClassifiedFiles<TFile extends AcceptableFile> {
  accepted: TFile[];
  unaccepted: TFile[];
  oversized: TFile[];
}

/**
 * Splits files into accepted, wrong-type and oversized groups.
 * @param files - Picked or dropped files.
 * @param options - Accept list, size limit and multiplicity.
 * @returns The three groups, preserving input order.
 */
export function classifyFiles<TFile extends AcceptableFile>(
  files: readonly TFile[],
  { accept, maxSize, allowsMultiple = true }: ClassifyFilesOptions = {},
): ClassifiedFiles<TFile> {
  const classifiedFiles: ClassifiedFiles<TFile> = { accepted: [], unaccepted: [], oversized: [] };
  const filesToProcess = allowsMultiple ? files : files.slice(0, 1);

  for (const file of filesToProcess) {
    if (maxSize !== undefined && file.size > maxSize) classifiedFiles.oversized.push(file);
    else if (isFileTypeAccepted(file, accept)) classifiedFiles.accepted.push(file);
    else classifiedFiles.unaccepted.push(file);
  }

  return classifiedFiles;
}
