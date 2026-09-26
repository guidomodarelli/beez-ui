"use client";

/**
 * Isolates the optional `emoji-picker-react` peer from the package root: only apps importing
 * `beez-ui/emoji-picker` need it installed.
 */
import { lazy, Suspense, useState, type ComponentType } from "react";
import type {
  EmojiClickData,
  PickerProps,
  EmojiStyle,
  SkinTonePickerLocation,
  SkinTones,
  SuggestionMode,
  Theme,
} from "emoji-picker-react";
import { SmilePlusIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "./lib/utils.js";
import { Button } from "./components/button.js";
import { Popover, PopoverContent, PopoverTrigger } from "./components/popover.js";
import { PresenceSwap } from "./components/presence-swap.js";
import { BouncingDotsLoader } from "./components/bouncing-dots-loader.js";

/** Loads the picker bundle (and its emoji data) only when the popover opens for the first time. */
const LazyEmojiPickerReact = lazy(async () => {
  const emojiPickerModule = await import("emoji-picker-react");
  /** Bundlers expose the ESM build's default export; native ESM wraps the CommonJS build once more. */
  const moduleDefault = emojiPickerModule.default as unknown as ComponentType<PickerProps> | { default: ComponentType<PickerProps> };
  return { default: "default" in moduleDefault ? moduleDefault.default : moduleDefault };
});

const EMOJI_PICKER_HEIGHT_PX = 360;
/** Fills the popover, which already caps its width to the viewport on phones. */
const EMOJI_PICKER_WIDTH = "100%";
/** Presence key of the placeholder icon shown before an emoji is chosen. */
const EMPTY_SELECTION_KEY = "empty";
const DARK_THEME = "dark";

/**
 * Picker options as the string values of the library enums. Only types are imported, so the
 * library is not evaluated until the lazy import runs (never during server rendering).
 */
const EMOJI_PICKER_OPTIONS = {
  emojiStyle: "apple" as EmojiStyle,
  defaultSkinTone: "neutral" as SkinTones,
  skinTonePickerLocation: "SEARCH" as SkinTonePickerLocation,
  suggestedEmojisMode: "recent" as SuggestionMode,
  darkTheme: "dark" as Theme,
  lightTheme: "light" as Theme,
} as const;

export interface EmojiPickerLabels {
  /** Accessible name of the trigger. */
  chooseEmoji: string;
  /** Accessible name of the popover. */
  picker: string;
  searchPlaceholder: string;
  loading: string;
}

const EMOJI_PICKER_DEFAULT_LABELS: EmojiPickerLabels = {
  chooseEmoji: "Elegir emoji",
  picker: "Selector de emojis",
  searchPlaceholder: "Buscar emoji",
  loading: "Cargando emojis...",
};

export interface EmojiPickerProps {
  /** Currently selected emoji; empty shows a placeholder icon. */
  value: string;
  onChange: (emoji: string) => void;
  /** Visible label of the field. */
  label: string;
  /** Keeps the label for assistive technology but hides it visually. */
  isLabelVisuallyHidden?: boolean;
  disabled?: boolean;
  labels?: Partial<EmojiPickerLabels>;
  className?: string;
}

/**
 * Renders an outline trigger showing the current emoji that opens a searchable emoji popover. The
 * chosen emoji swaps in with a short cross-fade; the picker follows the resolved color theme.
 * @param props - Current value, change handler, label and optional copy.
 * @returns The labelled emoji picker.
 */
export function EmojiPicker({
  value,
  onChange,
  label,
  isLabelVisuallyHidden = false,
  disabled = false,
  labels,
  className,
}: EmojiPickerProps) {
  const resolvedLabels = { ...EMOJI_PICKER_DEFAULT_LABELS, ...labels };
  const [isOpen, setIsOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const selectedEmoji = value.trim();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div data-slot="emoji-picker" className={cn("grid w-fit min-w-0 gap-[0.4rem]", className)}>
      <span className={cn("text-[0.82rem] leading-tight font-semibold text-muted-foreground", isLabelVisuallyHidden && "sr-only")}>{label}</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-label={resolvedLabels.chooseEmoji}
            className="min-h-[2.7rem] w-fit min-w-[3.25rem] justify-center gap-[0.55rem] border-border bg-background text-[0.95rem] text-foreground data-[state=open]:border-ring data-[state=open]:shadow-[0_0_0_2px_color-mix(in_srgb,var(--ring)_18%,transparent)]"
            disabled={disabled}
            type="button"
            variant="outline"
          >
            <PresenceSwap
              as="span"
              className="inline-grid min-h-5 min-w-5 place-items-center text-[1.15rem] leading-none"
              mode="popLayout"
              presenceKey={selectedEmoji || EMPTY_SELECTION_KEY}
            >
              <span aria-hidden>{selectedEmoji || <SmilePlusIcon />}</span>
            </PresenceSwap>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          data-slot="emoji-picker-content"
          align="start"
          aria-label={resolvedLabels.picker}
          className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden p-0"
        >
          <Suspense fallback={<BouncingDotsLoader className="py-10" label={resolvedLabels.loading} size="sm" />}>
            <LazyEmojiPickerReact
              autoFocusSearch
              customEmojis={[]}
              defaultSkinTone={EMOJI_PICKER_OPTIONS.defaultSkinTone}
              emojiStyle={EMOJI_PICKER_OPTIONS.emojiStyle}
              height={EMOJI_PICKER_HEIGHT_PX}
              lazyLoadEmojis
              onEmojiClick={handleEmojiClick}
              previewConfig={{ showPreview: false }}
              searchPlaceholder={resolvedLabels.searchPlaceholder}
              skinTonePickerLocation={EMOJI_PICKER_OPTIONS.skinTonePickerLocation}
              suggestedEmojisMode={EMOJI_PICKER_OPTIONS.suggestedEmojisMode}
              theme={resolvedTheme === DARK_THEME ? EMOJI_PICKER_OPTIONS.darkTheme : EMOJI_PICKER_OPTIONS.lightTheme}
              width={EMOJI_PICKER_WIDTH}
            />
          </Suspense>
        </PopoverContent>
      </Popover>
    </div>
  );
}
