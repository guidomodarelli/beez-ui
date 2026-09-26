"use client";

/** `contentEditable` editor for plain text with markdown links, driven by `useRichLinkEditor`. */
import { useEffect, useRef, type KeyboardEvent } from "react";

import { cn } from "../lib/utils.js";
import {
  RICH_LINK_POPOVER_MODE,
  RICH_TEXT_EDITOR_KEY,
  RICH_TEXT_SEGMENT_TYPE,
} from "../lib/rich-text/link-markdown-constants.js";
import type { RichLinkEditorController } from "../hooks/use-rich-link-editor.js";
import { Button } from "./button.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";

const BUTTON_TYPE = "button";
const BUTTON_VARIANT = {
  ghost: "ghost",
  outline: "outline",
} as const;
const URL_INPUT_TYPE = "url";
const LINK_TARGET = "_blank";
const LINK_REL = "noreferrer";

/**
 * Presentation of each part. iOS Safari zooms the page when a focused editable region renders
 * text below 16px, so the editor and the inputs are pinned to 1rem on phones.
 */
const RICH_LINK_EDITOR_CLASS_NAMES = {
  editor:
    "min-h-28 w-full cursor-text border-0 bg-background p-0 leading-[1.65] whitespace-pre-wrap text-foreground [font:inherit] [overflow-wrap:anywhere] focus:outline-0 empty:before:pointer-events-none empty:before:text-muted-foreground/75 empty:before:content-[attr(data-placeholder)] max-md:text-base",
  editorInvalid: "rounded-[0.35rem] shadow-[inset_0_-2px_0_var(--destructive)] outline-0",
  editorLink:
    "cursor-pointer rounded-[0.2rem] font-bold text-primary underline decoration-[0.08em] underline-offset-[0.18em] transition-colors hover:text-[color-mix(in_oklab,var(--primary)_72%,var(--foreground))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  popover: "gap-3",
  editForm: "grid gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200",
  actions: "flex flex-wrap items-center gap-2",
  label: "grid gap-[0.35rem] text-[0.85rem] font-bold text-muted-foreground",
  input:
    "min-h-8 rounded-lg border border-border/80 bg-background px-[0.65rem] font-normal text-foreground outline-0 transition-[border-color,box-shadow] [font:inherit] focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_35%,transparent)] aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_25%,transparent)] max-md:text-base",
} as const;

/** Copy for the link popover. Every entry is optional and defaults to Spanish. */
export type RichLinkEditorCopy = {
  editAction: string;
  editCancel: string;
  editSave: string;
  popoverTextLabel: string;
  popoverUrlLabel: string;
  removeAction: string;
};

const RICH_LINK_EDITOR_DEFAULT_COPY: RichLinkEditorCopy = {
  editAction: "Editar",
  editCancel: "Cancelar",
  editSave: "Guardar",
  popoverTextLabel: "Texto",
  popoverUrlLabel: "Enlace",
  removeAction: "Quitar enlace",
};

export type RichLinkEditorProps = {
  ariaLabel: string;
  copy?: Partial<RichLinkEditorCopy>;
  editor: RichLinkEditorController;
  placeholder: string;
  ariaDescribedBy?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
};

/**
 * `contentEditable` rich link editor: renders the controller's preview segments,
 * turning each link into a popover that edits or removes it. All state lives in
 * the `useRichLinkEditor` controller; this component is presentation only.
 */
export function RichLinkEditor({
  ariaDescribedBy,
  ariaLabel,
  copy: copyOverrides,
  editor,
  isDisabled = false,
  isInvalid = false,
  placeholder,
}: RichLinkEditorProps) {
  const {
    activeLink,
    closeLinkPopover,
    handleBeforeInput,
    handleInput,
    handleKeyDown,
    handlePaste,
    hasContent,
    hasInvalidLinkUrl,
    isLinkEditValid,
    linkTextInput,
    linkUrlInput,
    openLinkPopover,
    popoverMode,
    removeLink,
    saveLinkEdit,
    segments,
    setEditorElement,
    setLinkTextInput,
    setLinkUrlInput,
    setPopoverMode,
  } = editor;
  const copy = { ...RICH_LINK_EDITOR_DEFAULT_COPY, ...copyOverrides };
  const linkTextInputRef = useRef<HTMLInputElement | null>(null);
  const isEditingLink = popoverMode === RICH_LINK_POPOVER_MODE.edit;
  const editorClassName = cn(
    RICH_LINK_EDITOR_CLASS_NAMES.editor,
    isInvalid && RICH_LINK_EDITOR_CLASS_NAMES.editorInvalid,
  );

  // Dismiss any open link popover the moment the editor locks, so a pending
  // submit/edit request can never leave editable controls active over a draft
  // the user can no longer change.
  useEffect(() => {
    if (isDisabled) {
      closeLinkPopover();
    }
  }, [closeLinkPopover, isDisabled]);

  // Switching from the actions to the edit form unmounts the focused "Editar"
  // button; move focus into the form so keyboard users land on the first field
  // instead of the document body.
  useEffect(() => {
    if (isEditingLink) {
      linkTextInputRef.current?.focus();
    }
  }, [isEditingLink, activeLink?.key]);

  /** Saves the link draft with Enter from either popover field, like a form. */
  const handleEditFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== RICH_TEXT_EDITOR_KEY.enter) {
      return;
    }

    event.preventDefault();

    if (activeLink && isLinkEditValid) {
      saveLinkEdit(activeLink);
    }
  };

  return (
    <div
      aria-describedby={ariaDescribedBy}
      aria-disabled={isDisabled}
      aria-invalid={isInvalid}
      aria-label={ariaLabel}
      aria-multiline
      className={editorClassName}
      data-slot="rich-link-editor"
      contentEditable={!isDisabled}
      data-placeholder={placeholder}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      ref={setEditorElement}
      role="textbox"
      suppressContentEditableWarning
    >
      {hasContent
        ? segments.map((segment) =>
            segment.type === RICH_TEXT_SEGMENT_TYPE.link ? (
              isDisabled ? (
                <a
                  aria-disabled
                  className={RICH_LINK_EDITOR_CLASS_NAMES.editorLink}
                  href={segment.url}
                  key={segment.key}
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                  rel={LINK_REL}
                  tabIndex={-1}
                  target={LINK_TARGET}
                >
                  {segment.text}
                </a>
              ) : (
              <Popover
                key={segment.key}
                onOpenChange={(isOpen) => {
                  if (isOpen) {
                    openLinkPopover(segment);
                  } else if (activeLink?.key === segment.key) {
                    closeLinkPopover();
                  }
                }}
                open={activeLink?.key === segment.key}
              >
                <PopoverTrigger asChild>
                  <a
                    className={RICH_LINK_EDITOR_CLASS_NAMES.editorLink}
                    href={segment.url}
                    onClick={(event) => {
                      event.preventDefault();
                      openLinkPopover(segment);
                    }}
                    rel={LINK_REL}
                    target={LINK_TARGET}
                  >
                    {segment.text}
                  </a>
                </PopoverTrigger>
                <PopoverContent
                  className={RICH_LINK_EDITOR_CLASS_NAMES.popover}
                  onBeforeInput={(event) => {
                    event.stopPropagation();
                  }}
                  onInput={(event) => {
                    event.stopPropagation();
                  }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                  }}
                  onPaste={(event) => {
                    event.stopPropagation();
                  }}
                >
                  {popoverMode === RICH_LINK_POPOVER_MODE.actions ? (
                    <div className={RICH_LINK_EDITOR_CLASS_NAMES.actions}>
                      <Button
                        onClick={() => {
                          setPopoverMode(RICH_LINK_POPOVER_MODE.edit);
                        }}
                        type={BUTTON_TYPE}
                        variant={BUTTON_VARIANT.ghost}
                      >
                        {copy.editAction}
                      </Button>
                      <Button
                        onClick={() => {
                          removeLink(segment);
                        }}
                        type={BUTTON_TYPE}
                        variant={BUTTON_VARIANT.ghost}
                      >
                        {copy.removeAction}
                      </Button>
                    </div>
                  ) : (
                    <div className={RICH_LINK_EDITOR_CLASS_NAMES.editForm}>
                      <label className={RICH_LINK_EDITOR_CLASS_NAMES.label}>
                        <span>{copy.popoverTextLabel}</span>
                        <input
                          className={RICH_LINK_EDITOR_CLASS_NAMES.input}
                          onChange={(event) => {
                            setLinkTextInput(event.currentTarget.value);
                          }}
                          onKeyDown={handleEditFieldKeyDown}
                          ref={linkTextInputRef}
                          value={linkTextInput}
                        />
                      </label>
                      <label className={RICH_LINK_EDITOR_CLASS_NAMES.label}>
                        <span>{copy.popoverUrlLabel}</span>
                        <input
                          aria-invalid={hasInvalidLinkUrl}
                          className={RICH_LINK_EDITOR_CLASS_NAMES.input}
                          onChange={(event) => {
                            setLinkUrlInput(event.currentTarget.value);
                          }}
                          onKeyDown={handleEditFieldKeyDown}
                          type={URL_INPUT_TYPE}
                          value={linkUrlInput}
                        />
                      </label>
                      <div className={RICH_LINK_EDITOR_CLASS_NAMES.actions}>
                        <Button
                          disabled={!isLinkEditValid}
                          onClick={() => {
                            if (activeLink) {
                              saveLinkEdit(activeLink);
                            }
                          }}
                          type={BUTTON_TYPE}
                        >
                          {copy.editSave}
                        </Button>
                        <Button
                          onClick={closeLinkPopover}
                          type={BUTTON_TYPE}
                          variant={BUTTON_VARIANT.outline}
                        >
                          {copy.editCancel}
                        </Button>
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              )
            ) : (
              segment.text
            )
          )
        : null}
    </div>
  );
}
