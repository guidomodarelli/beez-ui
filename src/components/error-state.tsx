"use client";

/** Full-page recovery view for route and global error boundaries: explains the failure and offers a retry. */
import type { ReactNode } from "react";

import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { Link } from "./link.js";

/** Copy and actions settle in one after another; reduced motion drops it through the shared fallback. */
const ENTER_CLASS_NAME = "animate-in fade-in slide-in-from-bottom-1.5 fill-mode-both duration-300";

export interface ErrorStateProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  retryLabel: string;
  onRetry: () => void;
  /** Destination of the secondary action. Without it, only the retry action is shown. */
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}

/**
 * Renders a full-height section with the error copy, a retry button and an optional way home.
 * The home link uses the router adapter configured in `BeezUIProvider`.
 * @param props - Copy, retry callback and optional home destination.
 * @returns The error view.
 */
export function ErrorState({ eyebrow, title, description, retryLabel, onRetry, homeHref, homeLabel, className }: ErrorStateProps) {
  return (
    <section
      data-slot="error-state"
      className={cn(
        "relative isolate grid h-full min-h-svh w-full content-center justify-items-start gap-5 overflow-hidden bg-background p-[clamp(2rem,5vw,5rem)] text-foreground",
        className,
      )}
    >
      {eyebrow ? (
        <p className={cn("m-0 font-mono text-[0.8rem] tracking-[0.2em] text-foreground/60 uppercase", ENTER_CLASS_NAME)}>{eyebrow}</p>
      ) : null}
      <h1
        className={cn(
          "m-0 max-w-[14ch] font-display text-[clamp(2.8rem,8vw,5.5rem)] leading-[0.96] font-semibold text-balance sm:max-w-[12ch]",
          ENTER_CLASS_NAME,
          "delay-40",
        )}
      >
        {title}
      </h1>
      <p className={cn("m-0 max-w-[40rem] text-[clamp(1rem,2vw,1.15rem)] leading-[1.75] text-pretty text-muted-foreground", ENTER_CLASS_NAME, "delay-80")}>
        {description}
      </p>
      <div className={cn("flex w-full flex-wrap gap-3.5 pt-2 sm:w-auto", ENTER_CLASS_NAME, "delay-120")}>
        <Button size="lg" type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
        {homeHref && homeLabel ? (
          <Button asChild size="lg" variant="outline">
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
