"use client";

/**
 * Full-page handoff for in-app browsers: a primary action opens the page in the default browser
 * through a deep link, and a countdown falls back to an in-app URL when the deep link does not take.
 */
import { useEffect, useRef, useState } from "react";

import { cn } from "../lib/utils.js";
import { navigateToUrl } from "../lib/browser-navigation.js";
import { AnimatedCount } from "./animated-count.js";
import { Button } from "./button.js";

const DEFAULT_COUNTDOWN_SECONDS = 5;
const COUNTDOWN_INTERVAL_MS = 1000;
/** After tapping the deep link, the page must still be visible this long to count as a failure. */
const DEEP_LINK_FALLBACK_DELAY_MS = 2000;
const VISIBLE_DOCUMENT_STATE = "visible";

/** Staggered entrance; `backwards` releases the properties so press and disabled styles keep working. */
const ENTER_CLASS_NAME = "animate-in fade-in slide-in-from-bottom-1.5 fill-mode-backwards duration-300";

export interface ExternalBrowserHandoffCopy {
  eyebrow?: string;
  title: string;
  description: string;
  countdownDescription: string;
  primaryAction: string;
  fallbackLink: string;
}

const EXTERNAL_BROWSER_HANDOFF_DEFAULT_COPY: ExternalBrowserHandoffCopy = {
  title: "Abrí este sitio en tu navegador",
  description: "Para continuar, abrí este sitio en tu navegador habitual.",
  countdownDescription: "Cuando el contador llegue a 0, vas a continuar acá mismo.",
  primaryAction: "Continuar en tu navegador",
  fallbackLink: "O continuá acá",
};

export interface ExternalBrowserHandoffProps {
  /** Deep link that opens the page in the default browser (see `buildExternalBrowserUrl`). */
  externalBrowserUrl: string;
  /** In-app destination used when the deep link does not open another app. */
  fallbackUrl: string;
  countdownSeconds?: number;
  copy?: Partial<ExternalBrowserHandoffCopy>;
  /** Navigates to the fallback. Defaults to a full browser navigation. */
  onFallback?: (fallbackUrl: string) => void;
  className?: string;
}

/**
 * Counts down and then follows `fallbackUrl`, unless the page was hidden because the external
 * browser opened. Repeated taps on the primary action restart one fallback window instead of
 * stacking redirects.
 * @param props - Deep link, fallback, countdown and copy.
 * @returns The handoff section.
 */
export function ExternalBrowserHandoff({
  externalBrowserUrl,
  fallbackUrl,
  countdownSeconds = DEFAULT_COUNTDOWN_SECONDS,
  copy,
  onFallback = navigateToUrl,
  className,
}: ExternalBrowserHandoffProps) {
  const resolvedCopy = { ...EXTERNAL_BROWSER_HANDOFF_DEFAULT_COPY, ...copy };
  const automaticFallbackTimeoutIdRef = useRef<number | null>(null);
  const primaryActionFallbackTimeoutIdRef = useRef<number | null>(null);
  const onFallbackRef = useRef(onFallback);
  const [remainingSeconds, setRemainingSeconds] = useState(countdownSeconds);

  useEffect(() => {
    onFallbackRef.current = onFallback;
  }, [onFallback]);

  useEffect(() => {
    const followFallbackIfVisible = () => {
      if (document.visibilityState === VISIBLE_DOCUMENT_STATE) onFallbackRef.current(fallbackUrl);
    };
    const countdownIntervalId = window.setInterval(() => {
      setRemainingSeconds((currentRemainingSeconds) => Math.max(currentRemainingSeconds - 1, 0));
    }, COUNTDOWN_INTERVAL_MS);
    automaticFallbackTimeoutIdRef.current = window.setTimeout(() => {
      setRemainingSeconds(0);
      followFallbackIfVisible();
    }, countdownSeconds * COUNTDOWN_INTERVAL_MS);

    return () => {
      window.clearInterval(countdownIntervalId);
      window.clearTimeout(automaticFallbackTimeoutIdRef.current ?? undefined);
      automaticFallbackTimeoutIdRef.current = null;
      window.clearTimeout(primaryActionFallbackTimeoutIdRef.current ?? undefined);
      primaryActionFallbackTimeoutIdRef.current = null;
    };
  }, [countdownSeconds, fallbackUrl]);

  const handlePrimaryAction = () => {
    window.clearTimeout(automaticFallbackTimeoutIdRef.current ?? undefined);
    automaticFallbackTimeoutIdRef.current = null;
    window.clearTimeout(primaryActionFallbackTimeoutIdRef.current ?? undefined);
    primaryActionFallbackTimeoutIdRef.current = window.setTimeout(() => {
      primaryActionFallbackTimeoutIdRef.current = null;
      if (document.visibilityState === VISIBLE_DOCUMENT_STATE) onFallbackRef.current(fallbackUrl);
    }, DEEP_LINK_FALLBACK_DELAY_MS);
  };

  return (
    <section data-slot="external-browser-handoff" className={cn("grid w-full place-items-center px-5 py-6", className)}>
      <div className="grid w-full max-w-lg justify-items-center gap-3.5 text-center">
        {resolvedCopy.eyebrow ? (
          <p className={cn("m-0 text-[0.78rem] font-bold tracking-[0.05em] text-muted-foreground uppercase", ENTER_CLASS_NAME)}>
            {resolvedCopy.eyebrow}
          </p>
        ) : null}
        <h1 className={cn("m-0 text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.15] font-bold text-balance text-foreground", ENTER_CLASS_NAME, "delay-35")}>
          {resolvedCopy.title}
        </h1>
        <p className={cn("mx-auto my-0 max-w-md text-base leading-relaxed text-pretty text-muted-foreground", ENTER_CLASS_NAME, "delay-70")}>
          {resolvedCopy.description}
        </p>
        {/* `role="timer"` keeps the per-second countdown out of live announcements. */}
        <div role="timer" className={cn("mt-3 mb-2 grid max-w-md justify-items-center gap-2.5", ENTER_CLASS_NAME, "delay-105")}>
          <span className="inline-flex size-18 items-center justify-center rounded-full bg-foreground text-4xl leading-none font-bold text-background tabular-nums shadow-[0_0_0_0.375rem_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <AnimatedCount value={remainingSeconds} />
          </span>
          <p className="mx-auto my-0 text-[0.95rem] leading-normal text-pretty text-foreground">{resolvedCopy.countdownDescription}</p>
        </div>
        <Button asChild size="lg" className={cn("mt-2 w-full", ENTER_CLASS_NAME, "delay-140")}>
          <a href={externalBrowserUrl} onClick={handlePrimaryAction}>
            {resolvedCopy.primaryAction}
          </a>
        </Button>
        <a
          className={cn(
            "inline-flex min-h-11 items-center rounded-[calc(var(--radius)-2px)] px-3 py-2 text-[0.9rem] text-muted-foreground underline decoration-current/40 underline-offset-[0.2rem] transition-[color,text-decoration-color] hover:text-foreground hover:decoration-current focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            ENTER_CLASS_NAME,
            "delay-175",
          )}
          href={fallbackUrl}
        >
          {resolvedCopy.fallbackLink}
        </a>
      </div>
    </section>
  );
}
