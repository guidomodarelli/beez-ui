"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import type { ThemeMode, ResolvedTheme } from "../theme.js";
import { animate, frame, type AnimationPlaybackControlsWithThen } from "motion/react";
import { MOTION_EASE } from "../motion/tokens.js";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";
import { REDUCED_MOTION_QUERY } from "../constants/motion.js";
import { cn } from "../lib/utils.js";

const THEME_OPTIONS = [
  {
    icon: Sun,
    label: "Claro",
    value: "light",
  },
  {
    icon: Moon,
    label: "Oscuro",
    value: "dark",
  },
  {
    icon: Monitor,
    label: "Sistema",
    value: "system",
  },
] as const;

/** Converts the public duration (milliseconds) to Motion seconds. */
const MILLISECONDS_PER_SECOND = 1000;


type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];

export interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  theme?: ThemeMode;
  resolvedTheme?: ResolvedTheme;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  disabled,
  theme: controlledTheme,
  resolvedTheme: controlledResolvedTheme,
  onThemeChange: controlledOnThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const providerTheme = useTheme();
  const theme = controlledTheme ?? providerTheme.theme;
  const resolvedTheme = controlledResolvedTheme ?? providerTheme.resolvedTheme;
  const onThemeChange = controlledOnThemeChange ?? providerTheme.setTheme;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animationRef = useRef<AnimationPlaybackControlsWithThen | null>(null);
  useEffect(() => () => { animationRef.current?.cancel(); animationRef.current = null; }, []);
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const isThemeReady =
    isHydrated &&
    (resolvedTheme === "light" || resolvedTheme === "dark");
  const isDark = resolvedTheme === "dark";
  const selectedTheme: ThemeOption =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  const isDisabled = !isThemeReady || disabled;

  const selectTheme = useCallback((nextTheme: ThemeOption) => {
    const button = buttonRef.current;
    if (!button || typeof document === "undefined" || isDisabled) {
      return;
    }

    onThemeChange(nextTheme);
    animationRef.current?.cancel();
    if (window.matchMedia?.(REDUCED_MOTION_QUERY).matches || !Number.isFinite(duration) || duration <= 0) return;
    const original = { transform: button.style.transform, opacity: button.style.opacity };
    const animation = animate(button, { transform: ["rotate(-8deg)", "rotate(0deg)"], opacity: [0.65, 1] }, { duration: duration / MILLISECONDS_PER_SECOND, ease: [...MOTION_EASE] });
    animationRef.current = animation;
    void animation.then(() => frame.postRender(() => {
      if (animationRef.current !== animation) return;
      button.style.transform = original.transform;
      button.style.opacity = original.opacity;
      animationRef.current = null;
    }));
  }, [duration, isDisabled, onThemeChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          ref={buttonRef}
          disabled={isDisabled}
          className={cn(className)}
          {...props}
        >
          {!isThemeReady ? <SunMoon aria-hidden="true" /> : isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          <span className="sr-only">Alternar tema</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-beez-theme-menu
        align="end"
        className="w-44 rounded-xl p-2"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuRadioGroup
          onValueChange={(nextTheme) => {
            selectTheme(nextTheme as ThemeOption);
          }}
          value={selectedTheme}
        >
          {THEME_OPTIONS.map(({ icon: Icon, label, value }) => (
            <DropdownMenuRadioItem
              key={value}
              className="h-11 gap-3 px-3 pr-9 text-base"
              value={value}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
