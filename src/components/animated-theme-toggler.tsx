"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import type { ThemeMode, ResolvedTheme } from "../theme.js";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";
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

/** Restricts transition styling to theme changes initiated by this component. */
const THEME_TRANSITION_CLASS = "BeezThemeTransition";
/** Respects user preferences when deciding whether to animate a theme change. */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const applyTheme = () => {
      onThemeChange(nextTheme);
    };

    if (
      typeof document.startViewTransition !== "function" ||
      typeof document.documentElement.animate !== "function" ||
      window.matchMedia?.(REDUCED_MOTION_QUERY).matches
    ) {
      applyTheme();
      return;
    }

    document.documentElement.classList.add(THEME_TRANSITION_CLASS);
    const transition = document.startViewTransition(() => {
      flushSync(applyTheme);
    });

      void transition.ready.then(() => {
        return document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        ).finished;
      }).catch(() => {
        // Skipped transitions retain the applied theme without an unhandled rejection.
      }).finally(() => {
        document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
      });
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
