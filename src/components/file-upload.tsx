"use client";

/**
 * File upload building blocks: a drop zone that validates picked or dropped files, and a list of
 * files with upload progress, failure and retry. Uploading itself stays with the application.
 */
import { useId, useRef, useState, type ChangeEvent, type ComponentProps, type DragEvent } from "react";
import { AnimatePresence } from "motion/react";
import { CheckCircle2Icon, FileIcon, Trash2Icon, UploadCloudIcon, XCircleIcon } from "lucide-react";

import { cn } from "../lib/utils.js";
import { classifyFiles } from "../lib/file-acceptance.js";
import { formatFileSize } from "../lib/format-file-size.js";
import { AnimatedListItem } from "./animated-list-item.js";
import { Button } from "./button.js";

const COMPLETE_PROGRESS = 100;

export interface FileUploadDropZoneLabels {
  uploadAction: string;
  /** Shown next to the action on wide screens. */
  dragAndDrop: string;
  /** Accessible name of the hidden file input. */
  input: string;
}

const FILE_UPLOAD_DROP_ZONE_DEFAULT_LABELS: FileUploadDropZoneLabels = {
  uploadAction: "Elegí un archivo",
  dragAndDrop: "o arrastralo acá",
  input: "Subir archivos",
};

export interface FileUploadDropZoneProps {
  /** Explains which files are allowed; turns destructive after a rejected file. */
  hint?: string;
  isDisabled?: boolean;
  /** Same syntax as `<input accept>`, such as `"image/*,.pdf"`. */
  accept?: string;
  allowsMultiple?: boolean;
  /** Maximum file size in bytes. */
  maxSize?: number;
  onDropFiles?: (files: File[]) => void;
  onDropUnacceptedFiles?: (files: File[]) => void;
  onSizeLimitExceed?: (files: File[]) => void;
  inputId?: string;
  labels?: Partial<FileUploadDropZoneLabels>;
  className?: string;
}

/**
 * Renders the drop zone. The action button and a click anywhere on the zone open the native file
 * picker; the same file can be picked again after a failure.
 * @param props - Constraints, callbacks and optional copy.
 * @returns The drop zone.
 */
export function FileUploadDropZone({
  hint,
  isDisabled = false,
  accept,
  allowsMultiple = true,
  maxSize,
  onDropFiles,
  onDropUnacceptedFiles,
  onSizeLimitExceed,
  inputId,
  labels,
  className,
}: FileUploadDropZoneProps) {
  const resolvedLabels = { ...FILE_UPLOAD_DROP_ZONE_DEFAULT_LABELS, ...labels };
  const generatedInputId = useId();
  const hintId = useId();
  const resolvedInputId = inputId ?? generatedInputId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFiles = (files: File[]) => {
    const { accepted, unaccepted, oversized } = classifyFiles(files, { accept, maxSize, allowsMultiple });
    setIsInvalid(unaccepted.length > 0 || oversized.length > 0);
    if (oversized.length > 0) onSizeLimitExceed?.(oversized);
    if (accepted.length > 0) onDropFiles?.(accepted);
    if (unaccepted.length > 0) onDropUnacceptedFiles?.(unaccepted);
    // Clearing the value lets the same file be selected again.
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDisabled) setIsDraggingOver(true);
  };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (!isDisabled) processFiles(Array.from(event.dataTransfer.files));
  };
  const openFilePicker = () => {
    if (!isDisabled) inputRef.current?.click();
  };

  return (
    <div
      data-slot="file-upload-drop-zone"
      data-dragging={isDraggingOver || undefined}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      className={cn(
        "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl bg-background px-6 py-4 text-muted-foreground ring-1 ring-border transition-[box-shadow,background-color] ring-inset data-dragging:ring-2 data-dragging:ring-primary data-disabled:cursor-not-allowed data-disabled:bg-muted",
        className,
      )}
      onClick={openFilePicker}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className={cn("inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background shadow-xs", isDisabled && "opacity-50")}>
        <UploadCloudIcon aria-hidden className="size-5 text-foreground" />
      </span>
      <div className="flex flex-col gap-1 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1">
          <input
            ref={inputRef}
            id={resolvedInputId}
            type="file"
            className="sr-only"
            disabled={isDisabled}
            aria-label={resolvedLabels.input}
            aria-describedby={hint ? hintId : undefined}
            accept={accept}
            multiple={allowsMultiple}
            onChange={(event: ChangeEvent<HTMLInputElement>) => processFiles(Array.from(event.target.files ?? []))}
            onClick={(event) => event.stopPropagation()}
          />
          <Button
            className="h-auto p-0 font-semibold"
            disabled={isDisabled}
            type="button"
            variant="link"
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
          >
            {resolvedLabels.uploadAction}
          </Button>
          <span className="text-sm max-md:hidden">{resolvedLabels.dragAndDrop}</span>
        </div>
        {hint ? (
          <p id={hintId} className={cn("m-0 text-xs transition-colors", isInvalid && "text-destructive")}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export interface FileUploadItemLabels {
  complete: string;
  uploading: string;
  failed: string;
  retry: string;
  /** Accessible name of the delete button. */
  delete: string;
  /** Accessible name of the progress bar. */
  progress: string;
}

const FILE_UPLOAD_ITEM_DEFAULT_LABELS: FileUploadItemLabels = {
  complete: "Completado",
  uploading: "Subiendo...",
  failed: "Falló",
  retry: "Reintentar",
  delete: "Eliminar",
  progress: "Progreso de subida",
};

export interface FileUploadItemProps {
  name: string;
  /** Size in bytes. */
  size: number;
  /** Upload progress from 0 to 100. */
  progress: number;
  failed?: boolean;
  onDelete?: () => void;
  isDeleteDisabled?: boolean;
  onRetry?: () => void;
  locale?: string;
  labels?: Partial<FileUploadItemLabels>;
  className?: string;
}

/**
 * Renders one file with its size, status, progress bar, delete action and, after a failure, a
 * retry action. Place it inside `FileUploadList` so additions and removals animate.
 * @param props - File metadata, progress, callbacks and optional copy.
 * @returns The list item.
 */
export function FileUploadItem({
  name,
  size,
  progress,
  failed = false,
  onDelete,
  isDeleteDisabled,
  onRetry,
  locale,
  labels,
  className,
}: FileUploadItemProps) {
  const resolvedLabels = { ...FILE_UPLOAD_ITEM_DEFAULT_LABELS, ...labels };
  const clampedProgress = Math.min(Math.max(progress, 0), COMPLETE_PROGRESS);
  const isComplete = clampedProgress === COMPLETE_PROGRESS && !failed;

  return (
    <AnimatedListItem
      data-slot="file-upload-item"
      data-failed={failed || undefined}
      className={cn("relative flex w-full min-w-0 gap-3 rounded-xl bg-background p-4 ring-1 ring-border ring-inset data-failed:ring-2 data-failed:ring-destructive", className)}
    >
      <FileIcon aria-hidden className="size-10 shrink-0 stroke-[1.25] text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="m-0 max-w-full text-sm font-medium break-words text-foreground">{name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-sm">
              <span className="truncate whitespace-nowrap text-muted-foreground">{formatFileSize(size, { locale })}</span>
              <span aria-hidden className="h-3 w-px rounded-full bg-border" />
              <span className="flex items-center gap-1 font-medium" role="status">
                {failed ? (
                  <>
                    <XCircleIcon aria-hidden className="size-4 text-destructive" />
                    <span className="text-destructive">{resolvedLabels.failed}</span>
                  </>
                ) : isComplete ? (
                  <>
                    <CheckCircle2Icon aria-hidden className="size-4 text-green-600 dark:text-green-500" />
                    <span className="text-green-700 dark:text-green-400">{resolvedLabels.complete}</span>
                  </>
                ) : (
                  <>
                    <UploadCloudIcon aria-hidden className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{resolvedLabels.uploading}</span>
                  </>
                )}
              </span>
            </div>
          </div>
          {onDelete ? (
            <Button
              aria-label={`${resolvedLabels.delete} ${name}`}
              className="-mt-2 -mr-2 self-start text-muted-foreground"
              disabled={isDeleteDisabled}
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash2Icon aria-hidden />
            </Button>
          ) : null}
        </div>
        {failed ? (
          onRetry ? (
            <Button className="mt-1.5 h-auto p-0 text-destructive" size="sm" type="button" variant="link" onClick={onRetry}>
              {resolvedLabels.retry}
            </Button>
          ) : null
        ) : (
          <div className="mt-1 flex w-full items-center gap-3">
            <div
              aria-label={resolvedLabels.progress}
              aria-valuemax={COMPLETE_PROGRESS}
              aria-valuemin={0}
              aria-valuenow={clampedProgress}
              className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${clampedProgress}%` }} />
            </div>
            <span className="text-sm font-medium text-foreground tabular-nums">{clampedProgress}%</span>
          </div>
        )}
      </div>
    </AnimatedListItem>
  );
}

/**
 * Lays out a drop zone and its file list.
 * @param props - Native `div` attributes.
 * @returns The container.
 */
export function FileUpload({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="file-upload" className={cn("flex w-full min-w-0 flex-col gap-4", className)} {...props} />;
}

/**
 * Lists `FileUploadItem`s; only files added after the first render animate in.
 * @param props - Native `ul` attributes and the items.
 * @returns The list.
 */
export function FileUploadList({ className, children, ...props }: ComponentProps<"ul">) {
  return (
    <ul data-slot="file-upload-list" className={cn("m-0 flex w-full min-w-0 list-none flex-col gap-3 p-0", className)} {...props}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </ul>
  );
}
