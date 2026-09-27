"use client";

/**
 * Saved queries for `FilterQueryBar`: a button that stores the current query under a name and a
 * row of chips to apply, edit or delete them. Persistence stays with the application.
 */
import { useId, useState } from "react";
import { Bookmark, Pencil, X } from "lucide-react";

import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { FilterQueryBar } from "./filter-query-bar.js";
import type { FilterQualifierConfig } from "./filter-query-grammar.js";
import { Input } from "./input.js";
import { Label } from "./label.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

/** A named, reusable query of the filter bar. */
export interface FilterPreset {
  name: string;
  query: string;
}

const ENTER_KEY = "Enter";
/** Suggestions of the query editor render in their own popover, outside the edit popover. */
const NESTED_POPOVER_SELECTOR = '[data-slot="popover-content"]';

/**
 * Tells whether a value is a non-null object.
 * @param value - Untrusted value.
 * @returns Whether its properties can be read.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validates presets restored from untrusted storage, trimming names and queries and dropping
 * malformed or empty entries.
 * @param value - Parsed stored value, such as the result of `JSON.parse`.
 * @returns The valid presets, or an empty list when the value is not a list.
 */
export function parseFilterPresets(value: unknown): FilterPreset[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.query !== "string") return [];
    const name = entry.name.trim();
    const query = entry.query.trim();
    return name && query ? [{ name, query }] : [];
  });
}

export interface FilterPresetLabels {
  saveAction: string;
  saveConfirm: string;
  saveConfirmAriaLabel: string;
  presetName: string;
  presetNamePlaceholder: string;
  presetQuery: string;
  presetQueryPlaceholder: string;
  savedPresets: string;
  editConfirmAriaLabel: string;
  cancel: string;
  delete: string;
  emptyNameError: string;
  emptyCurrentQueryError: string;
  emptyPresetQueryError: string;
  duplicateNameError: string;
  applyPresetAriaLabel: (presetName: string) => string;
  editPresetAriaLabel: (presetName: string) => string;
  deletePresetAriaLabel: (presetName: string) => string;
  deleteConfirmation: (presetName: string) => string;
}

export const FILTER_PRESET_DEFAULT_LABELS: FilterPresetLabels = {
  saveAction: "Guardar filtro",
  saveConfirm: "Guardar",
  saveConfirmAriaLabel: "Guardar filtro con nombre",
  presetName: "Nombre del filtro",
  presetNamePlaceholder: "Mi filtro",
  presetQuery: "Búsqueda del filtro",
  presetQueryPlaceholder: "",
  savedPresets: "Filtros guardados:",
  editConfirmAriaLabel: "Guardar cambios del filtro",
  cancel: "Cancelar",
  delete: "Eliminar",
  emptyNameError: "Ingresá un nombre para el filtro.",
  emptyCurrentQueryError: "Escribí una búsqueda en la barra antes de guardarla.",
  emptyPresetQueryError: "Ingresá una búsqueda para el filtro.",
  duplicateNameError: "Ya existe un filtro con ese nombre.",
  applyPresetAriaLabel: (presetName) => `Aplicar filtro guardado ${presetName}`,
  editPresetAriaLabel: (presetName) => `Editar filtro guardado ${presetName}`,
  deletePresetAriaLabel: (presetName) => `Eliminar filtro guardado ${presetName}`,
  deleteConfirmation: (presetName) => `¿Querés eliminar el filtro guardado "${presetName}"?`,
};

const FORM_POPOVER_CLASS_NAME = "grid w-64 gap-2";
const ERROR_CLASS_NAME = "m-0 text-xs text-destructive";
const CHIP_ICON_BUTTON_CLASS_NAME =
  "inline-flex cursor-pointer items-center border-0 bg-transparent py-[0.35rem] text-muted-foreground [&_svg]:size-3";

export interface FilterPresetSaveButtonProps {
  /** Whether the filter bar currently has a query worth saving. */
  canSaveCurrentQuery: boolean;
  /** Saves the current query under the given name. Returns `false` when there is no query to save. */
  onSaveCurrentQuery: (presetName: string) => boolean;
  labels?: Partial<FilterPresetLabels>;
}

/**
 * Compact icon button that saves the current query as a named preset. Fits the action slot of
 * the filter bar input.
 * @param props - Save availability, save callback and optional labels.
 * @returns The button and its naming popover.
 */
export function FilterPresetSaveButton({ canSaveCurrentQuery, onSaveCurrentQuery, labels }: FilterPresetSaveButtonProps) {
  const resolvedLabels = { ...FILTER_PRESET_DEFAULT_LABELS, ...labels };
  const nameInputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (!nextOpen) {
      setNameDraft("");
      setError(null);
    }
  };

  const handleConfirmSave = () => {
    const presetName = nameDraft.trim();
    if (!presetName) {
      setError(resolvedLabels.emptyNameError);
      return;
    }
    if (!onSaveCurrentQuery(presetName)) {
      setError(resolvedLabels.emptyCurrentQueryError);
      return;
    }
    handleOpenChange(false);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              data-slot="filter-preset-save-button"
              aria-label={resolvedLabels.saveAction}
              disabled={!canSaveCurrentQuery}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Bookmark aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{resolvedLabels.saveAction}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className={FORM_POPOVER_CLASS_NAME}>
        <Label htmlFor={nameInputId}>{resolvedLabels.presetName}</Label>
        <Input
          id={nameInputId}
          onChange={(event) => {
            setNameDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== ENTER_KEY) return;
            event.preventDefault();
            handleConfirmSave();
          }}
          placeholder={resolvedLabels.presetNamePlaceholder}
          type="text"
          value={nameDraft}
        />
        {error ? (
          <p className={ERROR_CLASS_NAME} role="alert">
            {error}
          </p>
        ) : null}
        <Button aria-label={resolvedLabels.saveConfirmAriaLabel} onClick={handleConfirmSave} size="sm" type="button">
          {resolvedLabels.saveConfirm}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export interface FilterPresetsBarProps {
  presets: readonly FilterPreset[];
  /** Qualifiers of the filter bar, offered as suggestions while editing a preset query. */
  queryFilterConfigs: FilterQualifierConfig[];
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetName: string) => void;
  /** Replaces the preset named `originalName` with the given name and query. */
  onUpdatePreset: (update: { name: string; originalName: string; query: string }) => void;
  labels?: Partial<FilterPresetLabels>;
  className?: string;
}

/**
 * Renders one chip per saved preset: its name applies it, the pencil edits its name and query,
 * and the cross deletes it after a confirmation. Renders nothing without presets.
 * @param props - Presets, filter configs, callbacks and optional labels.
 * @returns The presets row, or nothing.
 */
export function FilterPresetsBar({
  presets,
  queryFilterConfigs,
  onApplyPreset,
  onDeletePreset,
  onUpdatePreset,
  labels,
  className,
}: FilterPresetsBarProps) {
  const resolvedLabels = { ...FILTER_PRESET_DEFAULT_LABELS, ...labels };
  const nameInputId = useId();
  const [editingPresetName, setEditingPresetName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  /** Preset whose delete confirmation is open: the cross never deletes directly. */
  const [deletingPresetName, setDeletingPresetName] = useState<string | null>(null);

  const handleEditOpenChange = (preset: FilterPreset, nextOpen: boolean) => {
    setEditError(null);
    if (!nextOpen) {
      setEditingPresetName(null);
      return;
    }
    setEditingPresetName(preset.name);
    setNameDraft(preset.name);
    setQueryDraft(preset.query);
  };

  const handleConfirmEdit = () => {
    if (editingPresetName === null) return;
    const name = nameDraft.trim();
    const query = queryDraft.trim();
    if (!name) {
      setEditError(resolvedLabels.emptyNameError);
      return;
    }
    if (!query) {
      setEditError(resolvedLabels.emptyPresetQueryError);
      return;
    }
    if (presets.some((preset) => preset.name === name && preset.name !== editingPresetName)) {
      setEditError(resolvedLabels.duplicateNameError);
      return;
    }
    onUpdatePreset({ name, originalName: editingPresetName, query });
    setEditingPresetName(null);
  };

  if (presets.length === 0) return null;

  return (
    <div data-slot="filter-presets-bar" className={cn("flex flex-wrap items-center gap-[0.4rem]", className)}>
      <span className="inline-flex items-center gap-[0.3rem] text-xs font-medium text-muted-foreground [&_svg]:size-[0.8rem]">
        <Bookmark aria-hidden="true" />
        {resolvedLabels.savedPresets}
      </span>
      {presets.map((preset) => (
        <span
          data-slot="filter-preset-chip"
          className="inline-flex items-center overflow-hidden rounded-full border border-border bg-muted text-xs leading-none"
          key={preset.name}
        >
          <button
            aria-label={resolvedLabels.applyPresetAriaLabel(preset.name)}
            className="max-w-48 cursor-pointer truncate border-0 bg-transparent py-[0.35rem] pr-1 pl-[0.65rem] text-inherit hover:text-primary focus-visible:text-primary"
            onClick={() => onApplyPreset(preset)}
            title={preset.query}
            type="button"
          >
            {preset.name}
          </button>
          <Popover onOpenChange={(nextOpen) => handleEditOpenChange(preset, nextOpen)} open={editingPresetName === preset.name}>
            <PopoverTrigger asChild>
              <button
                aria-label={resolvedLabels.editPresetAriaLabel(preset.name)}
                className={cn(CHIP_ICON_BUTTON_CLASS_NAME, "px-[0.15rem] hover:text-primary focus-visible:text-primary")}
                type="button"
              >
                <Pencil aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className={FORM_POPOVER_CLASS_NAME}
              onInteractOutside={(event) => {
                // Interacting with the query suggestions must not close the edit popover.
                const interactionTarget = event.target;
                if (interactionTarget instanceof Element && interactionTarget.closest(NESTED_POPOVER_SELECTOR)) {
                  event.preventDefault();
                }
              }}
            >
              <Label htmlFor={nameInputId}>{resolvedLabels.presetName}</Label>
              <Input
                id={nameInputId}
                onChange={(event) => {
                  setNameDraft(event.target.value);
                  if (editError) setEditError(null);
                }}
                type="text"
                value={nameDraft}
              />
              <span className="text-sm leading-none font-medium">{resolvedLabels.presetQuery}</span>
              <FilterQueryBar
                ariaLabel={resolvedLabels.presetQuery}
                configs={queryFilterConfigs}
                onValueChange={(nextQuery) => {
                  setQueryDraft(nextQuery);
                  if (editError) setEditError(null);
                }}
                placeholder={resolvedLabels.presetQueryPlaceholder}
                value={queryDraft}
              />
              {editError ? (
                <p className={ERROR_CLASS_NAME} role="alert">
                  {editError}
                </p>
              ) : null}
              <Button aria-label={resolvedLabels.editConfirmAriaLabel} onClick={handleConfirmEdit} size="sm" type="button">
                {resolvedLabels.saveConfirm}
              </Button>
            </PopoverContent>
          </Popover>
          <Popover
            onOpenChange={(nextOpen) => setDeletingPresetName(nextOpen ? preset.name : null)}
            open={deletingPresetName === preset.name}
          >
            <PopoverTrigger asChild>
              <button
                aria-label={resolvedLabels.deletePresetAriaLabel(preset.name)}
                className={cn(CHIP_ICON_BUTTON_CLASS_NAME, "pr-2 pl-[0.15rem] hover:text-destructive focus-visible:text-destructive")}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="grid w-68 gap-3">
              <p className="m-0 text-sm">{resolvedLabels.deleteConfirmation(preset.name)}</p>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setDeletingPresetName(null)} size="sm" type="button" variant="outline">
                  {resolvedLabels.cancel}
                </Button>
                <Button
                  onClick={() => {
                    setDeletingPresetName(null);
                    onDeletePreset(preset.name);
                  }}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  {resolvedLabels.delete}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </span>
      ))}
    </div>
  );
}
