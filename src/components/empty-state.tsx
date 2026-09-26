/** Placeholder for regions without content yet: empty lists, sections in construction or first steps. */
import type { ReactNode } from "react";

import { cn } from "../lib/utils.js";

/** Copy settles in one line after another; reduced motion drops it through the shared fallback. */
const ENTER_CLASS_NAME = "animate-in fade-in slide-in-from-bottom-1.5 fill-mode-both duration-300";

export type EmptyStateTitleElement = "h1" | "h2" | "h3" | "p";

export interface EmptyStateProps {
  title: ReactNode;
  /** Heading level that fits the surrounding outline; a paragraph for minor regions. */
  titleAs?: EmptyStateTitleElement;
  /** Short uppercase label above the title, such as "Próximamente". */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Actions or extra content, such as buttons or a template list. */
  children?: ReactNode;
  align?: "start" | "center";
  /** `page` uses display typography for full sections; `inline` stays compact inside panels. */
  size?: "page" | "inline";
  className?: string;
}

/**
 * Renders the empty region as a labelled section. It does not add a landmark besides the
 * section, so it composes inside an existing `main`.
 * @param props - Title, optional eyebrow, description, actions and layout.
 * @returns The empty state.
 */
export function EmptyState({
  title,
  titleAs: TitleElement = "h2",
  eyebrow,
  description,
  children,
  align = "start",
  size = "inline",
  className,
}: EmptyStateProps) {
  const isCentered = align === "center";
  const isPage = size === "page";

  return (
    <section
      data-slot="empty-state"
      data-size={size}
      className={cn(
        "grid gap-2",
        isCentered ? "justify-items-center text-center" : "justify-items-start",
        isPage ? "max-w-2xl gap-2.5 py-6" : "py-6",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "m-0 text-[0.78rem] font-bold tracking-[0.08em] text-[color-mix(in_oklab,var(--primary)_76%,var(--foreground))] uppercase",
            ENTER_CLASS_NAME,
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <TitleElement
        className={cn(
          "m-0 text-balance [overflow-wrap:anywhere]",
          isPage ? "font-display text-[clamp(2rem,6vw,4rem)] leading-[1.05] font-semibold" : "font-semibold",
          ENTER_CLASS_NAME,
          "delay-40",
        )}
      >
        {title}
      </TitleElement>
      {description ? (
        <p
          className={cn(
            "m-0 max-w-xl text-pretty text-muted-foreground",
            isPage && "text-[clamp(1rem,2vw,1.15rem)] leading-relaxed",
            ENTER_CLASS_NAME,
            "delay-80",
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? (
        <div className={cn("mt-2 flex w-full flex-wrap gap-2", isCentered && "justify-center", ENTER_CLASS_NAME, "delay-120")}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
